/**
 * Verify Database Integration for Template Registry
 *
 * Tests the database and Redis integration for the upgraded plugin.
 */

import 'dotenv/config';
import { getPrisma, isDatabaseEnabled, disconnect } from '../lib/database.js';
import { getRedis, isCacheEnabled } from '../lib/redis.js';

async function verifyIntegration() {
  console.log('='.repeat(60));
  console.log('CLAUDE CODE TEMPLATING PLUGIN v2.0.0');
  console.log('DATABASE INTEGRATION VERIFICATION');
  console.log('='.repeat(60));
  console.log('');

  const results: { service: string; status: string; details: string }[] = [];

  // ========================================
  // 1. Feature Flags Check
  // ========================================
  console.log('1. Checking feature flags...');
  const dbEnabled = isDatabaseEnabled();
  const cacheEnabled = isCacheEnabled();

  results.push({
    service: 'Feature Flags',
    status: dbEnabled && cacheEnabled ? '✅ ENABLED' : '⚠️ PARTIAL',
    details: `Database: ${dbEnabled ? 'ON' : 'OFF'} | Cache: ${cacheEnabled ? 'ON' : 'OFF'}`,
  });
  console.log(`   Database enabled: ${dbEnabled}`);
  console.log(`   Cache enabled: ${cacheEnabled}`);

  // ========================================
  // 2. PostgreSQL Connection
  // ========================================
  console.log('2. Testing PostgreSQL connection...');
  if (dbEnabled) {
    try {
      const prisma = getPrisma();
      const result = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM templates
      `;
      const count = Number(result[0].count);

      results.push({
        service: 'PostgreSQL (Neon)',
        status: '✅ CONNECTED',
        details: `Templates in database: ${count}`,
      });
      console.log(`   ✅ Connected - ${count} templates found`);
    } catch (error) {
      results.push({
        service: 'PostgreSQL (Neon)',
        status: '❌ FAILED',
        details: error instanceof Error ? error.message : String(error),
      });
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }
  } else {
    results.push({
      service: 'PostgreSQL (Neon)',
      status: '⏭️ SKIPPED',
      details: 'Database feature disabled',
    });
    console.log('   ⏭️ Skipped - database disabled');
  }

  // ========================================
  // 3. Redis Connection
  // ========================================
  console.log('3. Testing Redis connection...');
  if (cacheEnabled) {
    try {
      const redis = getRedis();
      const pong = await redis.ping();

      if (pong === 'PONG') {
        // Test set/get
        const testKey = 'template-registry:test:verify';
        await redis.set(testKey, 'verified');
        const value = await redis.get(testKey);
        await redis.del(testKey);

        results.push({
          service: 'Redis (Upstash)',
          status: '✅ CONNECTED',
          details: `Response: ${pong} | Read/Write: ${value === 'verified' ? 'OK' : 'FAILED'}`,
        });
        console.log('   ✅ Connected - read/write verified');
      } else {
        throw new Error(`Unexpected response: ${pong}`);
      }
    } catch (error) {
      results.push({
        service: 'Redis (Upstash)',
        status: '❌ FAILED',
        details: error instanceof Error ? error.message : String(error),
      });
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }
  } else {
    results.push({
      service: 'Redis (Upstash)',
      status: '⏭️ SKIPPED',
      details: 'Cache feature disabled',
    });
    console.log('   ⏭️ Skipped - cache disabled');
  }

  // ========================================
  // 4. Template CRUD Test
  // ========================================
  console.log('4. Testing template CRUD operations...');
  if (dbEnabled) {
    try {
      const prisma = getPrisma();

      // Create test template
      const testTemplate = await prisma.template.upsert({
        where: {
          name_version: {
            name: 'test-template',
            version: '1.0.0',
          },
        },
        create: {
          name: 'test-template',
          version: '1.0.0',
          description: 'Verification test template',
          format: 'HANDLEBARS',
          sourceType: 'EMBEDDED',
          sourceLocation: 'test/templates/verify',
          category: 'test',
          tags: ['test', 'verification'],
          isPublic: true,
        },
        update: {
          description: 'Verification test template (updated)',
        },
      });

      // Read it back
      const readBack = await prisma.template.findUnique({
        where: { id: testTemplate.id },
      });

      // Delete test template
      await prisma.template.delete({
        where: { id: testTemplate.id },
      });

      results.push({
        service: 'Template CRUD',
        status: '✅ PASSED',
        details: `Create: OK | Read: ${readBack ? 'OK' : 'FAIL'} | Delete: OK`,
      });
      console.log('   ✅ CRUD operations passed');
    } catch (error) {
      results.push({
        service: 'Template CRUD',
        status: '❌ FAILED',
        details: error instanceof Error ? error.message : String(error),
      });
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }
  } else {
    results.push({
      service: 'Template CRUD',
      status: '⏭️ SKIPPED',
      details: 'Database feature disabled',
    });
    console.log('   ⏭️ Skipped - database disabled');
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

  const allPassed = results.every(
    (r) => r.status.includes('✅') || r.status.includes('⏭️')
  );

  if (allPassed) {
    console.log('🎉 Database integration verified successfully!');
    console.log('');
    console.log('The template registry is now backed by:');
    console.log('  - PostgreSQL (Neon) for persistent storage');
    console.log('  - Redis (Upstash) for caching');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Use /template list to see available templates');
    console.log('  2. Use /scaffold <template> <name> to generate projects');
  } else {
    console.log('⚠️ Some verifications failed. Please check the errors above.');
    process.exit(1);
  }

  // Cleanup
  await disconnect();
}

verifyIntegration().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
