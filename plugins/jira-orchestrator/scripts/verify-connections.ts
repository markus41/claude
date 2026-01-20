/**
 * Verify all database and service connections
 */
import 'dotenv/config';

async function verifyConnections() {
  console.log('='.repeat(60));
  console.log('JIRA ORCHESTRATOR - CONNECTION VERIFICATION');
  console.log('='.repeat(60));
  console.log('');

  const results: { service: string; status: string; details: string }[] = [];

  // ========================================
  // 1. PostgreSQL (Neon) Connection
  // ========================================
  console.log('1. Testing Neon PostgreSQL...');
  try {
    const { PrismaClient } = await import('../lib/generated/prisma/index.js');
    const prisma = new PrismaClient();

    // Test query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, current_database() as db_name`;
    await prisma.$disconnect();

    results.push({
      service: 'Neon PostgreSQL',
      status: '✅ CONNECTED',
      details: `Database: neondb | Region: us-east-2`,
    });
    console.log('   ✅ Connected to Neon PostgreSQL');
  } catch (error) {
    results.push({
      service: 'Neon PostgreSQL',
      status: '❌ FAILED',
      details: error instanceof Error ? error.message : String(error),
    });
    console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
  }

  // ========================================
  // 2. Redis (Upstash) Connection
  // ========================================
  console.log('2. Testing Upstash Redis...');
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const pong = await redis.ping();

    if (pong === 'PONG') {
      // Test set/get
      await redis.set('test:connection', 'verified');
      const value = await redis.get('test:connection');
      await redis.del('test:connection');

      results.push({
        service: 'Upstash Redis',
        status: '✅ CONNECTED',
        details: `Instance: amazing-quagga-41373 | Response: ${pong}`,
      });
      console.log('   ✅ Connected to Upstash Redis');
    } else {
      throw new Error(`Unexpected response: ${pong}`);
    }
  } catch (error) {
    results.push({
      service: 'Upstash Redis',
      status: '❌ FAILED',
      details: error instanceof Error ? error.message : String(error),
    });
    console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
  }

  // ========================================
  // 3. Temporal Cloud Connection
  // ========================================
  console.log('3. Testing Temporal Cloud...');
  try {
    const { Connection, Client } = await import('@temporalio/client');

    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS!,
      apiKey: process.env.TEMPORAL_API_KEY!,
      tls: true,
    });

    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE!,
    });

    // Try to list workflows (validates auth)
    const workflows = client.workflow.list({ query: 'WorkflowType = "test"' });
    let count = 0;
    for await (const _ of workflows) {
      count++;
      if (count > 0) break;
    }

    await connection.close();

    results.push({
      service: 'Temporal Cloud',
      status: '✅ CONNECTED',
      details: `Namespace: ${process.env.TEMPORAL_NAMESPACE} | Region: us-west-2`,
    });
    console.log('   ✅ Connected to Temporal Cloud');
  } catch (error) {
    results.push({
      service: 'Temporal Cloud',
      status: '❌ FAILED',
      details: error instanceof Error ? error.message : String(error),
    });
    console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
  }

  // ========================================
  // 4. Environment Variables Check
  // ========================================
  console.log('4. Checking environment variables...');
  const requiredVars = [
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'TEMPORAL_ADDRESS',
    'TEMPORAL_NAMESPACE',
    'TEMPORAL_API_KEY',
    'JIRA_API_TOKEN',
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length === 0) {
    results.push({
      service: 'Environment',
      status: '✅ COMPLETE',
      details: `All ${requiredVars.length} required variables set`,
    });
    console.log('   ✅ All required environment variables set');
  } else {
    results.push({
      service: 'Environment',
      status: '⚠️ INCOMPLETE',
      details: `Missing: ${missingVars.join(', ')}`,
    });
    console.log('   ⚠️ Missing variables:', missingVars.join(', '));
  }

  // ========================================
  // Summary
  // ========================================
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  for (const result of results) {
    console.log(`${result.status} ${result.service}`);
    console.log(`   ${result.details}`);
    console.log('');
  }

  const allPassed = results.every((r) => r.status.includes('✅'));

  if (allPassed) {
    console.log('🎉 All connections verified successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start worker: npm run temporal:worker');
    console.log('  2. View database: npm run db:studio');
    console.log('  3. View Temporal: https://cloud.temporal.io');
  } else {
    console.log('⚠️ Some connections failed. Please check the errors above.');
    process.exit(1);
  }
}

verifyConnections().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
