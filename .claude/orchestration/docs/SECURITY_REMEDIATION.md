# Security Remediation Roadmap
## Claude Orchestration Enhancement Suite

**Document Version:** 1.0
**Date:** 2025-12-13
**Status:** CRITICAL - IMMEDIATE ACTION REQUIRED
**Owner:** Security & Engineering Leadership
**Next Review:** 2025-12-20 (Week 1 checkpoint)

---

## Executive Summary

### Current Security Posture: **HIGH RISK - NOT PRODUCTION READY**

The Claude Orchestration Enhancement Suite security audit identified **critical vulnerabilities** that pose significant risk to confidentiality, integrity, and availability. This roadmap provides a prioritized, time-bound remediation plan to achieve production-ready security posture.

### Risk Summary

| Severity | Count | Immediate Impact |
|----------|-------|------------------|
| **CRITICAL** | 3 | Authentication bypass, SQL injection, data leakage |
| **HIGH** | 12 | DoS attacks, data exposure, integrity violations |
| **MEDIUM** | 18 | Compliance violations, security monitoring gaps |
| **LOW** | 9 | Best practice deviations, documentation gaps |

### Business Impact

**Current State:**
- ❌ **Cannot deploy to production** - Critical security controls missing
- ❌ **SOC2 audit would fail** - 3 critical controls not met (CC6.1, CC6.3, CC6.6)
- ❌ **GDPR non-compliant** - 4 critical requirements not met (Art 17, 25, 32, 33)
- ❌ **OWASP Top 10 failures** - 5 of 10 categories failing

**Target State (Post-Remediation):**
- ✅ Production deployment enabled with enterprise security
- ✅ SOC2 Type II audit ready
- ✅ GDPR compliant with documented controls
- ✅ OWASP Top 10 fully addressed
- ✅ Industry-standard security posture

### Timeline Overview

| Phase | Duration | Focus | Security Lift |
|-------|----------|-------|--------------|
| **Phase 1** | Week 1 (7 days) | Critical vulnerabilities | 60% improvement |
| **Phase 2** | Weeks 2-4 (30 days) | High severity issues | 85% improvement |
| **Phase 3** | Weeks 5-12 (90 days) | Compliance & hardening | 95% improvement |
| **Phase 4** | Ongoing | Continuous security | 99%+ maintained |

### Resource Requirements

**Personnel:**
- 2x Senior Security Engineers (full-time, 12 weeks)
- 1x Compliance Specialist (part-time, 8 weeks)
- 1x Security Architect (consulting, 4 weeks)
- 2x Development Engineers (full-time, 6 weeks)

**Budget Estimate:**
- Labor: $180,000 - $240,000
- Tools/Services: $15,000 - $25,000
- Security Testing: $30,000 - $50,000
- **Total: $225,000 - $315,000**

---

## Phase 1: Critical Security Fixes (Days 1-7)

**Objective:** Eliminate critical vulnerabilities that enable unauthorized access, data injection, and cross-tenant data leakage.

**Success Criteria:**
- ✅ All 3 critical vulnerabilities remediated
- ✅ Security test suite passing (100% critical tests)
- ✅ No authentication bypass possible
- ✅ SQL injection vectors eliminated
- ✅ Namespace isolation enforced

### Priority 1A: Authentication & Authorization (Days 1-3)

#### Critical Vulnerability #1: Missing Authentication in Federation Protocol

**Current Risk:** CVSS 9.1 - Any agent can inject malicious knowledge packets

**Remediation Tasks:**

**Task 1.1: Implement HMAC-SHA256 Packet Signing** (8 hours)

**Secure Implementation:**
```typescript
// .claude/orchestration/knowledge/federation.ts

import * as crypto from 'crypto';

interface SecureKnowledgePacket extends KnowledgePacket {
  signature: string;
  nonce: string;
  timestamp: number;
}

class SecureKnowledgeFederation extends KnowledgeFederation {
  private readonly sharedSecret: Buffer;
  private readonly nonceCache: Set<string>;
  private readonly NONCE_EXPIRY_MS = 300000; // 5 minutes

  constructor(config: FederationConfig, sharedSecret: string) {
    super(config);
    this.sharedSecret = Buffer.from(sharedSecret, 'hex');
    this.nonceCache = new Set();

    // Periodic nonce cleanup
    setInterval(() => this.cleanExpiredNonces(), 60000);
  }

  /**
   * Sign outgoing packet with HMAC-SHA256
   */
  private signPacket(packet: KnowledgePacket): SecureKnowledgePacket {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    const payload = JSON.stringify({
      ...packet,
      nonce,
      timestamp
    });

    const signature = crypto
      .createHmac('sha256', this.sharedSecret)
      .update(payload)
      .digest('hex');

    return {
      ...packet,
      signature,
      nonce,
      timestamp
    };
  }

  /**
   * Verify incoming packet signature and authenticity
   */
  private verifyPacketSignature(packet: SecureKnowledgePacket): boolean {
    // 1. Check timestamp freshness (prevent replay attacks)
    const age = Date.now() - packet.timestamp;
    if (age > this.NONCE_EXPIRY_MS || age < -60000) {
      console.error(`Packet from ${packet.sourceAgentId} has invalid timestamp`);
      return false;
    }

    // 2. Check nonce uniqueness (prevent replay attacks)
    if (this.nonceCache.has(packet.nonce)) {
      console.error(`Duplicate nonce detected from ${packet.sourceAgentId}`);
      return false;
    }

    // 3. Verify HMAC signature
    const { signature, ...packetWithoutSig } = packet;
    const expectedPayload = JSON.stringify(packetWithoutSig);
    const expectedSignature = crypto
      .createHmac('sha256', this.sharedSecret)
      .update(expectedPayload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      console.error(`Invalid signature from ${packet.sourceAgentId}`);
      return false;
    }

    // 4. Cache nonce
    this.nonceCache.add(packet.nonce);
    return true;
  }

  /**
   * SECURE: Process received packet with full authentication
   */
  processReceivedPacket(packet: SecureKnowledgePacket): void {
    // STEP 1: Verify packet signature
    if (!this.verifyPacketSignature(packet)) {
      throw new SecurityError(
        `Authentication failed for packet from ${packet.sourceAgentId}`,
        'INVALID_SIGNATURE'
      );
    }

    // STEP 2: Check peer allowlist
    if (!this.config.peers.includes(packet.sourceAgentId)) {
      throw new SecurityError(
        `Unauthorized peer: ${packet.sourceAgentId}`,
        'UNAUTHORIZED_PEER'
      );
    }

    // STEP 3: Validate namespace authorization
    if (!this.validateNamespaceAccess(packet)) {
      throw new SecurityError(
        `Namespace access denied for ${packet.sourceAgentId}`,
        'NAMESPACE_VIOLATION'
      );
    }

    // STEP 4: Check vector clock validity (Byzantine fault tolerance)
    if (!this.isVectorClockValid(packet.vectorClock)) {
      throw new SecurityError(
        `Invalid vector clock from ${packet.sourceAgentId}`,
        'CLOCK_MANIPULATION'
      );
    }

    // STEP 5: Audit log the packet receipt
    this.auditLog({
      event: 'packet_received',
      source: packet.sourceAgentId,
      timestamp: packet.timestamp,
      nodeCount: packet.nodes.length,
      edgeCount: packet.edges.length
    });

    // Continue processing (existing logic)
    if (!this.canApplyPacket(packet)) {
      console.warn(`Packet from ${packet.sourceAgentId} is from the future, queueing...`);
      return;
    }

    // Apply packet
    this.applyPacket(packet);
  }

  /**
   * Validate namespace access rules
   */
  private validateNamespaceAccess(packet: SecureKnowledgePacket): boolean {
    // Check that source agent is authorized for the packet's namespace
    const packetNamespace = packet.nodes[0]?.namespace || packet.edges[0]?.namespace;

    if (!packetNamespace) {
      return false; // Reject packets without namespace
    }

    // Verify agent owns or has access to namespace
    const allowedNamespaces = this.config.namespaceACL[packet.sourceAgentId] || [];
    return allowedNamespaces.includes(packetNamespace);
  }

  /**
   * Validate vector clock for Byzantine fault tolerance
   */
  private isVectorClockValid(otherClock: Map<string, number>): boolean {
    const MAX_CLOCK_JUMP = 1000; // Maximum reasonable increment

    for (const [agentId, timestamp] of otherClock) {
      const current = this.vectorClock.get(agentId) || 0;

      // Reject suspicious clock jumps
      if (timestamp > current + MAX_CLOCK_JUMP) {
        console.error(
          `Suspicious clock jump from ${agentId}: ${current} -> ${timestamp}`
        );
        return false;
      }

      // Reject negative timestamps
      if (timestamp < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clean expired nonces to prevent memory leak
   */
  private cleanExpiredNonces(): void {
    // Nonces are self-expiring via timestamp validation
    // Clear entire cache periodically
    if (this.nonceCache.size > 10000) {
      this.nonceCache.clear();
    }
  }

  /**
   * Audit logging for security events
   */
  private auditLog(event: any): void {
    // TODO: Integrate with centralized audit log
    console.log('[AUDIT]', JSON.stringify(event));
  }
}

/**
 * Custom security error class
 */
class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SecurityError';
  }
}
```

**Task 1.2: Implement Mutual TLS for Federation** (12 hours)

**Configuration:**
```typescript
// .claude/orchestration/knowledge/federation-tls.ts

import * as tls from 'tls';
import * as fs from 'fs';

interface TLSConfig {
  ca: string;           // CA certificate path
  cert: string;         // Client certificate path
  key: string;          // Client private key path
  rejectUnauthorized: boolean;
}

class SecureFederationTransport {
  private tlsConfig: TLSConfig;

  constructor(config: TLSConfig) {
    this.tlsConfig = {
      ...config,
      rejectUnauthorized: true // Always enforce certificate validation
    };
  }

  /**
   * Create secure TLS connection to peer
   */
  async connectToPeer(peerHost: string, peerPort: number): Promise<tls.TLSSocket> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect(peerPort, peerHost, {
        ca: fs.readFileSync(this.tlsConfig.ca),
        cert: fs.readFileSync(this.tlsConfig.cert),
        key: fs.readFileSync(this.tlsConfig.key),
        rejectUnauthorized: this.tlsConfig.rejectUnauthorized,

        // TLS 1.3 only
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',

        // Strong cipher suites only
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256'
        ].join(':'),

        // Verify peer certificate
        checkServerIdentity: (hostname, cert) => {
          return this.verifyCertificate(hostname, cert);
        }
      });

      socket.on('secureConnect', () => {
        console.log(`Secure connection established to ${peerHost}:${peerPort}`);
        console.log(`Protocol: ${socket.getProtocol()}`);
        console.log(`Cipher: ${socket.getCipher().name}`);
        resolve(socket);
      });

      socket.on('error', (err) => {
        console.error(`TLS connection error: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Verify peer certificate against allowlist
   */
  private verifyCertificate(hostname: string, cert: any): Error | undefined {
    // Additional certificate validation logic
    // e.g., check cert fingerprint against allowlist

    const allowedFingerprints = this.getAllowedFingerprints();
    const certFingerprint = cert.fingerprint256;

    if (!allowedFingerprints.includes(certFingerprint)) {
      return new Error(`Certificate fingerprint not in allowlist: ${certFingerprint}`);
    }

    return undefined; // Valid
  }

  private getAllowedFingerprints(): string[] {
    // Load from secure configuration
    return process.env.FEDERATION_ALLOWED_CERTS?.split(',') || [];
  }
}
```

**Task 1.3: Database Namespace Isolation Trigger** (4 hours)

**SQL Implementation:**
```sql
-- .claude/orchestration/db/knowledge.sql

-- Trigger: Enforce namespace isolation on edge creation
CREATE TRIGGER IF NOT EXISTS enforce_namespace_isolation
BEFORE INSERT ON knowledge_edges
FOR EACH ROW
BEGIN
  -- Check if source and target nodes have matching namespaces
  SELECT RAISE(ABORT, 'SECURITY: Cross-namespace edge creation denied')
  WHERE EXISTS (
    SELECT 1
    FROM knowledge_nodes source, knowledge_nodes target
    WHERE source.id = NEW.source_id
      AND target.id = NEW.target_id
      AND source.namespace != target.namespace
  );

  -- Check if namespace exists and is active
  SELECT RAISE(ABORT, 'SECURITY: Invalid namespace')
  WHERE NOT EXISTS (
    SELECT 1
    FROM namespaces
    WHERE namespace = (
      SELECT namespace FROM knowledge_nodes WHERE id = NEW.source_id
    )
    AND is_active = 1
  );
END;

-- Trigger: Prevent namespace modification on existing nodes
CREATE TRIGGER IF NOT EXISTS prevent_namespace_modification
BEFORE UPDATE OF namespace ON knowledge_nodes
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'SECURITY: Namespace modification not allowed')
  WHERE OLD.namespace != NEW.namespace;
END;

-- Table: Namespace access control list
CREATE TABLE IF NOT EXISTS namespace_acl (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  namespace TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK(permission IN ('read', 'write', 'admin')),
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT,
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (namespace) REFERENCES namespaces(namespace),
  UNIQUE(namespace, agent_id, permission)
);

-- Index for fast ACL lookups
CREATE INDEX IF NOT EXISTS idx_namespace_acl_lookup
ON namespace_acl(namespace, agent_id, is_active)
WHERE is_active = 1;

-- Function: Check namespace access
CREATE TRIGGER IF NOT EXISTS check_namespace_access
BEFORE INSERT ON knowledge_nodes
FOR EACH ROW
BEGIN
  -- Verify agent has write permission to namespace
  SELECT RAISE(ABORT, 'SECURITY: No write permission for namespace')
  WHERE NOT EXISTS (
    SELECT 1 FROM namespace_acl
    WHERE namespace = NEW.namespace
      AND agent_id = NEW.agent_id
      AND permission IN ('write', 'admin')
      AND is_active = 1
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  );
END;

-- Audit log for namespace access violations
CREATE TABLE IF NOT EXISTS namespace_violations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  namespace TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  attempted_action TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  details TEXT
);

-- Trigger: Log namespace violations
CREATE TRIGGER IF NOT EXISTS log_namespace_violation
BEFORE INSERT ON knowledge_edges
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM knowledge_nodes s, knowledge_nodes t
  WHERE s.id = NEW.source_id
    AND t.id = NEW.target_id
    AND s.namespace != t.namespace
)
BEGIN
  INSERT INTO namespace_violations (
    namespace,
    agent_id,
    attempted_action,
    violation_type,
    details
  )
  SELECT
    s.namespace,
    s.agent_id,
    'CREATE_CROSS_NAMESPACE_EDGE',
    'NAMESPACE_ISOLATION_VIOLATION',
    json_object(
      'source_namespace', s.namespace,
      'target_namespace', t.namespace,
      'source_id', NEW.source_id,
      'target_id', NEW.target_id
    )
  FROM knowledge_nodes s, knowledge_nodes t
  WHERE s.id = NEW.source_id AND t.id = NEW.target_id;
END;
```

**Validation Tests (Phase 1A):**

```typescript
// .claude/orchestration/tests/security/auth-tests.ts

import { describe, it, expect } from 'vitest';
import { SecureKnowledgeFederation } from '../knowledge/federation';

describe('Phase 1A: Authentication & Authorization', () => {
  describe('Packet Signature Verification', () => {
    it('should reject packet with invalid signature', () => {
      const federation = new SecureKnowledgeFederation(config, sharedSecret);
      const packet = createMaliciousPacket();

      expect(() => federation.processReceivedPacket(packet))
        .toThrow('Authentication failed');
    });

    it('should reject replayed packet (duplicate nonce)', () => {
      const federation = new SecureKnowledgeFederation(config, sharedSecret);
      const packet = createValidPacket();

      federation.processReceivedPacket(packet); // First time succeeds

      expect(() => federation.processReceivedPacket(packet))
        .toThrow('Duplicate nonce');
    });

    it('should reject packet with expired timestamp', () => {
      const federation = new SecureKnowledgeFederation(config, sharedSecret);
      const packet = createExpiredPacket();

      expect(() => federation.processReceivedPacket(packet))
        .toThrow('invalid timestamp');
    });

    it('should accept valid signed packet from authorized peer', () => {
      const federation = new SecureKnowledgeFederation(config, sharedSecret);
      const packet = createValidPacket();

      expect(() => federation.processReceivedPacket(packet))
        .not.toThrow();
    });
  });

  describe('Namespace Isolation', () => {
    it('should prevent cross-namespace edge creation', async () => {
      const db = await openTestDatabase();

      await db.run(`
        INSERT INTO knowledge_nodes (id, namespace, type, agent_id)
        VALUES ('node1', 'tenant-a', 'concept', 'agent1'),
               ('node2', 'tenant-b', 'concept', 'agent2')
      `);

      await expect(
        db.run(`
          INSERT INTO knowledge_edges (source_id, target_id, relationship_type)
          VALUES ('node1', 'node2', 'related_to')
        `)
      ).rejects.toThrow('Cross-namespace edge creation denied');
    });

    it('should allow same-namespace edge creation', async () => {
      const db = await openTestDatabase();

      await db.run(`
        INSERT INTO knowledge_nodes (id, namespace, type, agent_id)
        VALUES ('node1', 'tenant-a', 'concept', 'agent1'),
               ('node2', 'tenant-a', 'concept', 'agent1')
      `);

      await expect(
        db.run(`
          INSERT INTO knowledge_edges (source_id, target_id, relationship_type)
          VALUES ('node1', 'node2', 'related_to')
        `)
      ).resolves.not.toThrow();
    });

    it('should log namespace violation attempts', async () => {
      const db = await openTestDatabase();

      // Attempt cross-namespace edge (will fail but log)
      try {
        await db.run(`INSERT INTO knowledge_edges ...`); // cross-namespace
      } catch (e) {}

      const violations = await db.all(`
        SELECT * FROM namespace_violations
        WHERE violation_type = 'NAMESPACE_ISOLATION_VIOLATION'
      `);

      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe('Peer Authorization', () => {
    it('should reject packet from unauthorized peer', () => {
      const federation = new SecureKnowledgeFederation(config, sharedSecret);
      const packet = createPacketFromUnauthorizedPeer();

      expect(() => federation.processReceivedPacket(packet))
        .toThrow('Unauthorized peer');
    });

    it('should accept packet from allowlisted peer', () => {
      const config = {
        peers: ['agent1', 'agent2', 'agent3']
      };
      const federation = new SecureKnowledgeFederation(config, sharedSecret);
      const packet = createPacketFromPeer('agent2');

      expect(() => federation.processReceivedPacket(packet))
        .not.toThrow('Unauthorized peer');
    });
  });
});
```

**Deliverables (Phase 1A):**
- [ ] HMAC-SHA256 packet signing implemented
- [ ] Mutual TLS configuration documented
- [ ] Namespace isolation triggers deployed
- [ ] 15 authentication tests passing
- [ ] Security audit log functional
- [ ] Peer allowlist configured

---

### Priority 1B: SQL Injection Prevention (Days 4-5)

#### Critical Vulnerability #2: SQL Injection via Dynamic ORDER BY

**Current Risk:** CVSS 8.7 - Database compromise via malicious input

**Remediation Tasks:**

**Task 1.4: Implement Column Whitelist Validation** (6 hours)

**Secure Implementation:**
```typescript
// .claude/orchestration/db/query-builder.ts

/**
 * Secure query builder with SQL injection prevention
 */
class SecureQueryBuilder {
  private static readonly ALLOWED_COLUMNS = {
    knowledge_nodes: ['id', 'name', 'type', 'namespace', 'confidence', 'created_at', 'updated_at'],
    knowledge_edges: ['id', 'relationship_type', 'strength', 'created_at'],
    conversation_sessions: ['id', 'status', 'created_at', 'updated_at'],
    task_queue: ['id', 'status', 'priority', 'created_at', 'scheduled_for'],
    analytics_queries: ['id', 'query_name', 'executed_at'],
  };

  private static readonly ALLOWED_DIRECTIONS = ['ASC', 'DESC'];

  /**
   * SECURE: Validate and sanitize ORDER BY clause
   */
  static buildOrderBy(
    table: string,
    orderBy?: string,
    direction?: string
  ): string {
    // Default safe ordering
    if (!orderBy) {
      return 'ORDER BY created_at DESC';
    }

    // Validate table exists in allowlist
    const allowedColumns = this.ALLOWED_COLUMNS[table];
    if (!allowedColumns) {
      throw new SecurityError(
        `Invalid table for ordering: ${table}`,
        'INVALID_TABLE'
      );
    }

    // Validate column is in allowlist
    if (!allowedColumns.includes(orderBy)) {
      console.warn(`Rejected ORDER BY column: ${orderBy} for table ${table}`);
      throw new SecurityError(
        `Invalid ORDER BY column: ${orderBy}. Allowed: ${allowedColumns.join(', ')}`,
        'INVALID_COLUMN'
      );
    }

    // Validate direction
    const safeDirection = this.ALLOWED_DIRECTIONS.includes(direction?.toUpperCase())
      ? direction.toUpperCase()
      : 'ASC';

    // Build safe ORDER BY clause (no user input interpolation)
    return `ORDER BY ${orderBy} ${safeDirection}`;
  }

  /**
   * SECURE: Build parameterized query with safe ORDER BY
   */
  static buildQuery(
    table: string,
    filters: Record<string, any>,
    orderBy?: string,
    direction?: string,
    limit?: number
  ): { sql: string; params: any[] } {
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Build WHERE clause with parameterized values
    for (const [column, value] of Object.entries(filters)) {
      // Validate column exists (prevent injection)
      if (!this.ALLOWED_COLUMNS[table]?.includes(column)) {
        throw new SecurityError(
          `Invalid filter column: ${column}`,
          'INVALID_FILTER'
        );
      }

      whereClauses.push(`${column} = ?`);
      params.push(value);
    }

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // Safe ORDER BY (validated, not parameterized)
    const orderByClause = this.buildOrderBy(table, orderBy, direction);

    // Safe LIMIT
    const limitClause = limit && Number.isInteger(limit) && limit > 0
      ? `LIMIT ${Math.min(limit, 1000)}` // Cap at 1000
      : '';

    const sql = `
      SELECT * FROM ${table}
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    `.trim();

    return { sql, params };
  }

  /**
   * SECURE: Execute query with validation
   */
  static async executeQuery(
    db: Database,
    table: string,
    options: {
      filters?: Record<string, any>;
      orderBy?: string;
      direction?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    try {
      const { sql, params } = this.buildQuery(
        table,
        options.filters || {},
        options.orderBy,
        options.direction,
        options.limit
      );

      // Audit log the query
      this.auditQuery(table, sql, params);

      // Execute with parameters
      const stmt = db.prepare(sql);
      return stmt.all(...params);

    } catch (error) {
      if (error instanceof SecurityError) {
        // Log security violation
        this.logSecurityViolation({
          type: 'SQL_INJECTION_ATTEMPT',
          table,
          attempted_input: options,
          error: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Audit log for query execution
   */
  private static auditQuery(table: string, sql: string, params: any[]): void {
    console.log('[QUERY_AUDIT]', {
      timestamp: new Date().toISOString(),
      table,
      sql,
      paramCount: params.length
    });
  }

  /**
   * Log security violations
   */
  private static logSecurityViolation(violation: any): void {
    console.error('[SECURITY_VIOLATION]', violation);
    // TODO: Send to SIEM
  }
}

/**
 * Usage examples (SECURE)
 */
class KnowledgeGraphService {
  async queryNodes(
    namespace: string,
    orderBy?: string,
    direction?: string
  ): Promise<KnowledgeNode[]> {
    // SECURE: Uses parameterized query + validated ORDER BY
    return SecureQueryBuilder.executeQuery(
      this.db,
      'knowledge_nodes',
      {
        filters: { namespace }, // Parameterized
        orderBy,                // Validated against whitelist
        direction,              // Validated against whitelist
        limit: 100
      }
    );
  }
}
```

**Task 1.5: Code Audit for Dynamic SQL** (8 hours)

**Audit Script:**
```bash
#!/bin/bash
# .claude/orchestration/scripts/audit-sql-injection.sh

echo "=== SQL Injection Vulnerability Audit ==="

# Find dangerous patterns
echo "Searching for dynamic SQL construction..."

# Pattern 1: String interpolation in SQL
grep -rn "\`SELECT.*\${" .claude/orchestration/ --include="*.ts" --color=always

# Pattern 2: Concatenation in queries
grep -rn "\"SELECT.*\" +" .claude/orchestration/ --include="*.ts" --color=always

# Pattern 3: ORDER BY with user input
grep -rn "ORDER BY.*\${" .claude/orchestration/ --include="*.ts" --color=always

# Pattern 4: Unsafe db.prepare with interpolation
grep -rn "db\.prepare(\`.*\${" .claude/orchestration/ --include="*.ts" --color=always

echo ""
echo "Review all matches above for SQL injection vulnerabilities"
echo "Expected: 0 matches after remediation"
```

**Task 1.6: Input Validation Layer** (6 hours)

**Implementation:**
```typescript
// .claude/orchestration/middleware/input-validator.ts

import { z } from 'zod';

/**
 * Input validation schemas for all endpoints
 */
export const ValidationSchemas = {
  // Knowledge graph queries
  queryNodes: z.object({
    namespace: z.string().regex(/^[a-z0-9-]+$/),
    orderBy: z.enum(['id', 'name', 'type', 'confidence', 'created_at', 'updated_at']).optional(),
    direction: z.enum(['ASC', 'DESC']).optional(),
    limit: z.number().int().min(1).max(1000).optional()
  }),

  // Task queue submissions
  submitTask: z.object({
    type: z.string().regex(/^[a-z_]+$/),
    priority: z.number().int().min(0).max(10),
    payload: z.object({}).passthrough().refine(
      (val) => JSON.stringify(val).length < 10000,
      'Payload too large'
    )
  }),

  // Conversation inputs
  conversationTurn: z.object({
    session_id: z.string().uuid(),
    user_message: z.string().min(1).max(5000),
    context: z.record(z.unknown()).optional()
  })
};

/**
 * Validation middleware
 */
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (input: unknown): T => {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Log validation failure
        console.error('[INPUT_VALIDATION_FAILED]', {
          errors: error.errors,
          input
        });

        throw new ValidationError(
          `Input validation failed: ${error.errors.map(e => e.message).join(', ')}`,
          error.errors
        );
      }
      throw error;
    }
  };
}

class ValidationError extends Error {
  constructor(message: string, public errors: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Validation Tests (Phase 1B):**

```typescript
// .claude/orchestration/tests/security/injection-tests.ts

describe('Phase 1B: SQL Injection Prevention', () => {
  describe('ORDER BY Validation', () => {
    it('should reject malicious ORDER BY input', () => {
      const maliciousInput = "name; DROP TABLE knowledge_nodes; --";

      expect(() =>
        SecureQueryBuilder.buildOrderBy('knowledge_nodes', maliciousInput)
      ).toThrow('Invalid ORDER BY column');
    });

    it('should reject column not in whitelist', () => {
      expect(() =>
        SecureQueryBuilder.buildOrderBy('knowledge_nodes', 'malicious_column')
      ).toThrow('Invalid ORDER BY column');
    });

    it('should accept valid column from whitelist', () => {
      const result = SecureQueryBuilder.buildOrderBy('knowledge_nodes', 'name', 'ASC');
      expect(result).toBe('ORDER BY name ASC');
    });

    it('should sanitize direction parameter', () => {
      const result = SecureQueryBuilder.buildOrderBy('knowledge_nodes', 'name', 'INVALID');
      expect(result).toBe('ORDER BY name ASC'); // Defaults to ASC
    });
  });

  describe('Parameterized Queries', () => {
    it('should use parameterized values for filters', () => {
      const { sql, params } = SecureQueryBuilder.buildQuery(
        'knowledge_nodes',
        { namespace: 'test', type: 'concept' }
      );

      expect(sql).toContain('namespace = ?');
      expect(sql).toContain('type = ?');
      expect(params).toEqual(['test', 'concept']);
    });

    it('should prevent filter column injection', () => {
      expect(() =>
        SecureQueryBuilder.buildQuery(
          'knowledge_nodes',
          { 'malicious; DROP TABLE': 'value' }
        )
      ).toThrow('Invalid filter column');
    });
  });

  describe('JSON Injection', () => {
    it('should validate JSON payload size', () => {
      const largePayload = { data: 'x'.repeat(20000) };

      expect(() =>
        validateInput(ValidationSchemas.submitTask)({
          type: 'test',
          priority: 5,
          payload: largePayload
        })
      ).toThrow('Payload too large');
    });

    it('should sanitize JSON string values', () => {
      const maliciousJson = {
        key: '\\"); DROP TABLE tasks; --'
      };

      const validated = validateInput(ValidationSchemas.submitTask)({
        type: 'test',
        priority: 5,
        payload: maliciousJson
      });

      // JSON is stored as-is but executed via parameterized query
      expect(validated.payload.key).toBe('\\"); DROP TABLE tasks; --');
    });
  });
});
```

**Deliverables (Phase 1B):**
- [ ] Column whitelist implemented for all tables
- [ ] Dynamic SQL patterns eliminated (0 matches in audit)
- [ ] Input validation layer deployed
- [ ] 20+ injection tests passing
- [ ] Code review completed

---

### Priority 1C: Data Encryption (Days 6-7)

#### Critical Gap: No Encryption for Sensitive Data

**Current Risk:** CVSS 8.0 - Plaintext storage of sensitive data

**Remediation Tasks:**

**Task 1.7: Implement Field-Level Encryption** (10 hours)

**Implementation:**
```typescript
// .claude/orchestration/security/encryption.ts

import * as crypto from 'crypto';

interface EncryptionConfig {
  masterKey: Buffer;
  algorithm: string;
  ivLength: number;
  authTagLength: number;
}

/**
 * Field-level encryption using AES-256-GCM
 */
export class FieldEncryption {
  private config: EncryptionConfig;
  private keyCache: Map<string, Buffer>;

  constructor(masterKeyHex: string) {
    this.config = {
      masterKey: Buffer.from(masterKeyHex, 'hex'),
      algorithm: 'aes-256-gcm',
      ivLength: 16,
      authTagLength: 16
    };
    this.keyCache = new Map();
  }

  /**
   * Derive field-specific encryption key from master key
   */
  private deriveFieldKey(fieldName: string): Buffer {
    if (this.keyCache.has(fieldName)) {
      return this.keyCache.get(fieldName)!;
    }

    const fieldKey = crypto.pbkdf2Sync(
      this.config.masterKey,
      fieldName, // Field name as salt
      100000,    // Iterations
      32,        // Key length (256 bits)
      'sha256'
    );

    this.keyCache.set(fieldName, fieldKey);
    return fieldKey;
  }

  /**
   * Encrypt field value
   */
  encrypt(fieldName: string, plaintext: string): string {
    const key = this.deriveFieldKey(fieldName);
    const iv = crypto.randomBytes(this.config.ivLength);

    const cipher = crypto.createCipheriv(
      this.config.algorithm,
      key,
      iv,
      { authTagLength: this.config.authTagLength }
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt field value
   */
  decrypt(fieldName: string, encryptedValue: string): string {
    const key = this.deriveFieldKey(fieldName);
    const parts = encryptedValue.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      this.config.algorithm,
      key,
      iv,
      { authTagLength: this.config.authTagLength }
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Check if value is encrypted
   */
  isEncrypted(value: string): boolean {
    return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/.test(value);
  }
}

/**
 * Database wrapper with transparent encryption
 */
export class EncryptedDatabase {
  private db: Database;
  private encryption: FieldEncryption;
  private encryptedFields: Map<string, string[]>; // table -> fields

  constructor(db: Database, masterKey: string) {
    this.db = db;
    this.encryption = new FieldEncryption(masterKey);
    this.encryptedFields = new Map([
      ['conversation_sessions', ['context_json']],
      ['task_queue', ['payload']],
      ['knowledge_nodes', ['properties']],
      ['workers', ['metadata']]
    ]);
  }

  /**
   * Insert with automatic encryption
   */
  async insert(table: string, data: Record<string, any>): Promise<void> {
    const encryptedData = this.encryptFields(table, data);

    const columns = Object.keys(encryptedData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(encryptedData);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.db.run(sql, ...values);
  }

  /**
   * Query with automatic decryption
   */
  async query(sql: string, ...params: any[]): Promise<any[]> {
    const rows = await this.db.all(sql, ...params);

    // Determine table from SQL (simple heuristic)
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : null;

    return rows.map(row =>
      table ? this.decryptFields(table, row) : row
    );
  }

  /**
   * Encrypt sensitive fields before storage
   */
  private encryptFields(table: string, data: Record<string, any>): Record<string, any> {
    const fieldsToEncrypt = this.encryptedFields.get(table) || [];
    const result = { ...data };

    for (const field of fieldsToEncrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        const plaintext = typeof result[field] === 'string'
          ? result[field]
          : JSON.stringify(result[field]);

        result[field] = this.encryption.encrypt(`${table}.${field}`, plaintext);
      }
    }

    return result;
  }

  /**
   * Decrypt sensitive fields after retrieval
   */
  private decryptFields(table: string, data: Record<string, any>): Record<string, any> {
    const fieldsToDecrypt = this.encryptedFields.get(table) || [];
    const result = { ...data };

    for (const field of fieldsToDecrypt) {
      if (result[field] && this.encryption.isEncrypted(result[field])) {
        const decrypted = this.encryption.decrypt(`${table}.${field}`, result[field]);

        // Try to parse as JSON
        try {
          result[field] = JSON.parse(decrypted);
        } catch {
          result[field] = decrypted;
        }
      }
    }

    return result;
  }
}
```

**Task 1.8: Key Management Configuration** (6 hours)

**Key Management Setup:**
```typescript
// .claude/orchestration/security/key-management.ts

import * as fs from 'fs';
import * as path from 'path';

/**
 * Secure key management with rotation support
 */
export class KeyManager {
  private keyVersions: Map<number, Buffer>;
  private currentVersion: number;
  private keyStoragePath: string;

  constructor(keyStoragePath: string) {
    this.keyStoragePath = keyStoragePath;
    this.keyVersions = new Map();
    this.currentVersion = 0;
    this.loadKeys();
  }

  /**
   * Load encryption keys from secure storage
   */
  private loadKeys(): void {
    // In production: Use AWS KMS, Azure Key Vault, or HashiCorp Vault
    // For now: Load from encrypted file with restricted permissions

    const keyFile = path.join(this.keyStoragePath, 'encryption-keys.json');

    if (!fs.existsSync(keyFile)) {
      throw new Error('Encryption keys not found. Run key initialization.');
    }

    // Check file permissions (must be 0600)
    const stats = fs.statSync(keyFile);
    const mode = stats.mode & parseInt('777', 8);
    if (mode !== parseInt('600', 8)) {
      throw new Error(`Insecure key file permissions: ${mode.toString(8)}. Expected: 600`);
    }

    const keysData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

    for (const [version, keyHex] of Object.entries(keysData.keys)) {
      this.keyVersions.set(Number(version), Buffer.from(keyHex as string, 'hex'));
    }

    this.currentVersion = keysData.currentVersion;
  }

  /**
   * Get current encryption key
   */
  getCurrentKey(): Buffer {
    const key = this.keyVersions.get(this.currentVersion);
    if (!key) {
      throw new Error('Current encryption key not found');
    }
    return key;
  }

  /**
   * Get encryption key by version (for decryption)
   */
  getKey(version: number): Buffer {
    const key = this.keyVersions.get(version);
    if (!key) {
      throw new Error(`Encryption key version ${version} not found`);
    }
    return key;
  }

  /**
   * Rotate encryption key (manual process)
   */
  async rotateKey(): Promise<void> {
    console.log('Starting key rotation...');

    // Generate new key
    const newKey = crypto.randomBytes(32);
    const newVersion = this.currentVersion + 1;

    // Save new key
    this.keyVersions.set(newVersion, newKey);
    this.currentVersion = newVersion;

    // Persist to storage
    this.saveKeys();

    console.log(`Key rotated to version ${newVersion}`);
    console.log('IMPORTANT: Re-encrypt existing data with new key');
  }

  /**
   * Save keys to secure storage
   */
  private saveKeys(): void {
    const keysData = {
      currentVersion: this.currentVersion,
      keys: Object.fromEntries(
        Array.from(this.keyVersions.entries()).map(([v, k]) => [v, k.toString('hex')])
      )
    };

    const keyFile = path.join(this.keyStoragePath, 'encryption-keys.json');
    fs.writeFileSync(keyFile, JSON.stringify(keysData, null, 2), { mode: 0o600 });
  }

  /**
   * Initialize new key storage (first-time setup)
   */
  static async initialize(keyStoragePath: string): Promise<void> {
    if (!fs.existsSync(keyStoragePath)) {
      fs.mkdirSync(keyStoragePath, { recursive: true, mode: 0o700 });
    }

    const masterKey = crypto.randomBytes(32);
    const keysData = {
      currentVersion: 1,
      keys: {
        '1': masterKey.toString('hex')
      }
    };

    const keyFile = path.join(keyStoragePath, 'encryption-keys.json');
    fs.writeFileSync(keyFile, JSON.stringify(keysData, null, 2), { mode: 0o600 });

    console.log('Encryption keys initialized');
    console.log('IMPORTANT: Backup keys securely and configure key rotation');
  }
}
```

**Environment Configuration:**
```bash
# .env.security (NEVER commit to git)

# Master encryption key (32 bytes hex = 64 characters)
ENCRYPTION_MASTER_KEY=<generate-with-crypto.randomBytes(32).toString('hex')>

# Key storage path (restricted permissions)
KEY_STORAGE_PATH=/secure/path/to/keys

# Key rotation schedule (days)
KEY_ROTATION_DAYS=90

# Federation shared secret (for HMAC)
FEDERATION_SHARED_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
```

**Deliverables (Phase 1C):**
- [ ] AES-256-GCM encryption implemented
- [ ] Key management system configured
- [ ] Sensitive fields encrypted (conversation context, task payloads, properties, metadata)
- [ ] Key rotation procedure documented
- [ ] Encryption tests passing

---

### Phase 1 Success Criteria

**Must-Have for Phase 1 Completion:**
- ✅ All 3 critical vulnerabilities remediated
- ✅ Authentication enforced for federation protocol
- ✅ SQL injection vectors eliminated (0 vulnerable patterns)
- ✅ Namespace isolation enforced at database layer
- ✅ Field-level encryption deployed
- ✅ 50+ security tests passing
- ✅ Security audit log functional
- ✅ Code review completed by security team

**Metrics:**
- Critical vulnerabilities: 3 → 0 ✅
- Security test coverage: 0% → 80% ✅
- Encryption coverage: 0% → 100% (sensitive fields) ✅

**Sign-off Required:**
- [ ] Security Engineer
- [ ] Engineering Lead
- [ ] CISO (if applicable)

---

## Phase 2: High Severity Remediation (Days 8-30)

**Objective:** Address high-severity vulnerabilities affecting access control, monitoring, and availability.

**Success Criteria:**
- ✅ All 12 high-severity vulnerabilities remediated
- ✅ RBAC framework operational
- ✅ Security event logging at 100%
- ✅ Rate limiting deployed
- ✅ Worker authentication implemented

### Priority 2A: Access Control & RBAC (Days 8-14)

#### Task 2.1: Implement RBAC Framework (16 hours)

**RBAC Schema:**
```sql
-- .claude/orchestration/db/rbac.sql

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT NOT NULL, -- JSON array of permissions
  is_system_role INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User-role assignments
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  namespace TEXT,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT,
  expires_at TEXT,

  FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE(user_id, role_id, namespace)
);

-- Permission definitions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,

  UNIQUE(resource_type, action)
);

-- Seed system roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('admin', 'Full system access', '["*:*"]', 1),
('namespace_admin', 'Namespace administrator', '["namespace:*", "knowledge:*"]', 1),
('knowledge_editor', 'Knowledge graph editor', '["knowledge:read", "knowledge:write", "knowledge:create"]', 1),
('knowledge_reader', 'Knowledge graph reader', '["knowledge:read"]', 1),
('task_executor', 'Task execution', '["task:read", "task:execute", "task:complete"]', 1),
('observer', 'Read-only observability access', '["metrics:read", "logs:read", "alerts:read"]', 1);

-- Seed permissions
INSERT INTO permissions (id, resource_type, action, description) VALUES
('namespace:create', 'namespace', 'create', 'Create new namespace'),
('namespace:delete', 'namespace', 'delete', 'Delete namespace'),
('namespace:admin', 'namespace', 'admin', 'Administer namespace'),
('knowledge:read', 'knowledge', 'read', 'Read knowledge nodes/edges'),
('knowledge:write', 'knowledge', 'write', 'Update knowledge nodes/edges'),
('knowledge:create', 'knowledge', 'create', 'Create knowledge nodes/edges'),
('knowledge:delete', 'knowledge', 'delete', 'Delete knowledge nodes/edges'),
('task:read', 'task', 'read', 'View tasks'),
('task:create', 'task', 'create', 'Create tasks'),
('task:execute', 'task', 'execute', 'Execute tasks'),
('task:cancel', 'task', 'cancel', 'Cancel tasks'),
('metrics:read', 'metrics', 'read', 'View metrics'),
('alerts:read', 'alerts', 'read', 'View alerts'),
('alerts:manage', 'alerts', 'manage', 'Manage alerts');
```

**RBAC Implementation:**
```typescript
// .claude/orchestration/security/rbac.ts

export class RBACManager {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    namespace?: string
  ): Promise<boolean> {
    const permissionId = `${resource}:${action}`;

    // Get user's roles
    const roles = await this.db.all(`
      SELECT r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
        AND (ur.namespace IS NULL OR ur.namespace = ?)
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    `, userId, namespace || null);

    // Check permissions
    for (const role of roles) {
      const permissions = JSON.parse(role.permissions);

      // Check for wildcard permissions
      if (permissions.includes('*:*')) return true;
      if (permissions.includes(`${resource}:*`)) return true;
      if (permissions.includes(permissionId)) return true;
    }

    // Log denied access
    this.auditAccessDenied(userId, resource, action, namespace);
    return false;
  }

  /**
   * Enforce permission (throw if denied)
   */
  async requirePermission(
    userId: string,
    resource: string,
    action: string,
    namespace?: string
  ): Promise<void> {
    const hasAccess = await this.hasPermission(userId, resource, action, namespace);

    if (!hasAccess) {
      throw new AccessDeniedError(
        `Access denied: ${userId} lacks ${resource}:${action} in ${namespace || 'global'}`
      );
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleName: string,
    namespace?: string,
    grantedBy?: string,
    expiresAt?: string
  ): Promise<void> {
    const role = await this.db.get(`SELECT id FROM roles WHERE name = ?`, roleName);

    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    await this.db.run(`
      INSERT INTO user_roles (user_id, role_id, namespace, granted_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, userId, role.id, namespace, grantedBy, expiresAt);

    this.auditRoleAssignment(userId, roleName, namespace, grantedBy);
  }

  /**
   * Audit access denied event
   */
  private auditAccessDenied(
    userId: string,
    resource: string,
    action: string,
    namespace?: string
  ): void {
    console.warn('[ACCESS_DENIED]', {
      timestamp: new Date().toISOString(),
      userId,
      resource,
      action,
      namespace
    });
  }

  /**
   * Audit role assignment
   */
  private auditRoleAssignment(
    userId: string,
    roleName: string,
    namespace?: string,
    grantedBy?: string
  ): void {
    console.log('[ROLE_ASSIGNED]', {
      timestamp: new Date().toISOString(),
      userId,
      roleName,
      namespace,
      grantedBy
    });
  }
}

class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessDeniedError';
  }
}
```

#### Task 2.2: Worker Authentication (12 hours)

**Worker Certificate-Based Auth:**
```typescript
// .claude/orchestration/distributed/worker-auth.ts

import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

interface WorkerCredentials {
  workerId: string;
  certificateFingerprint: string;
  publicKey: string;
}

export class WorkerAuthManager {
  private registeredWorkers: Map<string, WorkerCredentials>;
  private jwtSecret: Buffer;

  constructor(jwtSecret: string) {
    this.registeredWorkers = new Map();
    this.jwtSecret = Buffer.from(jwtSecret, 'hex');
  }

  /**
   * Register worker with certificate
   */
  async registerWorker(
    workerId: string,
    certificatePEM: string
  ): Promise<string> {
    // Extract fingerprint
    const cert = crypto.createHash('sha256')
      .update(certificatePEM)
      .digest('hex');

    // Extract public key
    const publicKey = this.extractPublicKey(certificatePEM);

    this.registeredWorkers.set(workerId, {
      workerId,
      certificateFingerprint: cert,
      publicKey
    });

    // Issue JWT token for worker
    const token = this.issueWorkerToken(workerId);

    console.log(`Worker registered: ${workerId}`);
    return token;
  }

  /**
   * Issue JWT token for worker
   */
  private issueWorkerToken(workerId: string): string {
    return jwt.sign(
      {
        sub: workerId,
        type: 'worker',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 3600) // 24 hours
      },
      this.jwtSecret,
      { algorithm: 'HS256' }
    );
  }

  /**
   * Verify worker authentication
   */
  async verifyWorker(workerId: string, token: string): Promise<boolean> {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (decoded.sub !== workerId || decoded.type !== 'worker') {
        return false;
      }

      // Check worker is registered
      return this.registeredWorkers.has(workerId);

    } catch (error) {
      console.error(`Worker auth failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate heartbeat request
   */
  async validateHeartbeat(
    workerId: string,
    token: string,
    signature: string,
    timestamp: number
  ): Promise<boolean> {
    // 1. Verify worker token
    if (!await this.verifyWorker(workerId, token)) {
      return false;
    }

    // 2. Check timestamp freshness
    const age = Date.now() - timestamp;
    if (age > 60000 || age < -60000) { // 1 minute tolerance
      return false;
    }

    // 3. Verify signature
    const credentials = this.registeredWorkers.get(workerId)!;
    const message = `${workerId}:${timestamp}`;

    const verify = crypto.createVerify('SHA256');
    verify.update(message);

    return verify.verify(credentials.publicKey, signature, 'hex');
  }

  private extractPublicKey(certificatePEM: string): string {
    // Extract public key from certificate
    // Implementation depends on certificate format
    return certificatePEM; // Simplified
  }
}
```

#### Task 2.3: Security Event Logging (14 hours)

**Comprehensive Audit Logging:**
```typescript
// .claude/orchestration/security/audit-log.ts

export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'auth.success',
  AUTHENTICATION_FAILURE = 'auth.failure',
  AUTHORIZATION_DENIED = 'authz.denied',
  NAMESPACE_VIOLATION = 'namespace.violation',
  SQL_INJECTION_ATTEMPT = 'injection.sql',
  RATE_LIMIT_EXCEEDED = 'ratelimit.exceeded',
  ENCRYPTION_FAILURE = 'encryption.failure',
  WORKER_REGISTRATION = 'worker.registered',
  WORKER_HEARTBEAT_FAIL = 'worker.heartbeat.fail',
  CIRCUIT_BREAKER_OPEN = 'circuit.open',
  CHAOS_EXPERIMENT = 'chaos.experiment',
  DATA_EXPORT = 'data.export',
  GDPR_ERASURE = 'gdpr.erasure'
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  workerId?: string;
  sourceIp?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'denied';
  details: Record<string, any>;
}

export class SecurityAuditLog {
  private db: Database;
  private siemEndpoint?: string;

  constructor(db: Database, siemEndpoint?: string) {
    this.db = db;
    this.siemEndpoint = siemEndpoint;
  }

  /**
   * Log security event
   */
  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      ...event
    };

    // Store in database
    await this.db.run(`
      INSERT INTO security_audit_log (
        id, timestamp, event_type, severity, user_id, worker_id,
        source_ip, resource, action, outcome, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      fullEvent.id,
      fullEvent.timestamp,
      fullEvent.eventType,
      fullEvent.severity,
      fullEvent.userId,
      fullEvent.workerId,
      fullEvent.sourceIp,
      fullEvent.resource,
      fullEvent.action,
      fullEvent.outcome,
      JSON.stringify(fullEvent.details)
    );

    // Send to SIEM if configured
    if (this.siemEndpoint && event.severity === 'critical') {
      await this.sendToSIEM(fullEvent);
    }

    // Console log for development
    console.log(`[SECURITY_AUDIT]`, fullEvent);
  }

  /**
   * Send critical events to SIEM
   */
  private async sendToSIEM(event: SecurityEvent): Promise<void> {
    try {
      await fetch(this.siemEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send to SIEM:', error);
    }
  }

  /**
   * Query security events
   */
  async queryEvents(filters: {
    startDate?: string;
    endDate?: string;
    eventType?: SecurityEventType;
    severity?: string;
    userId?: string;
  }): Promise<SecurityEvent[]> {
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filters.startDate) {
      whereClauses.push('timestamp >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClauses.push('timestamp <= ?');
      params.push(filters.endDate);
    }
    if (filters.eventType) {
      whereClauses.push('event_type = ?');
      params.push(filters.eventType);
    }
    if (filters.severity) {
      whereClauses.push('severity = ?');
      params.push(filters.severity);
    }
    if (filters.userId) {
      whereClauses.push('user_id = ?');
      params.push(filters.userId);
    }

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    const rows = await this.db.all(`
      SELECT * FROM security_audit_log
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT 1000
    `, ...params);

    return rows.map(row => ({
      ...row,
      details: JSON.parse(row.details)
    }));
  }
}

// Schema for audit log table
const AUDIT_LOG_SCHEMA = `
CREATE TABLE IF NOT EXISTS security_audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  user_id TEXT,
  worker_id TEXT,
  source_ip TEXT,
  resource TEXT,
  action TEXT,
  outcome TEXT NOT NULL CHECK(outcome IN ('success', 'failure', 'denied')),
  details TEXT NOT NULL,

  CHECK(json_valid(details))
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON security_audit_log(event_type);
`;
```

#### Task 2.4: Rate Limiting (10 hours)

**Implementation:**
```typescript
// .claude/orchestration/middleware/rate-limiter.ts

export class RateLimiter {
  private requestCounts: Map<string, { count: number; resetAt: number }>;
  private readonly limits = {
    taskSubmission: { requests: 10, windowMs: 1000 },      // 10/sec
    conversationTurn: { requests: 5, windowMs: 1000 },     // 5/sec
    queryKnowledge: { requests: 100, windowMs: 60000 },    // 100/min
    workerHeartbeat: { requests: 1, windowMs: 5000 }       // 1/5sec
  };

  constructor() {
    this.requestCounts = new Map();

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check and enforce rate limit
   */
  async checkLimit(
    userId: string,
    endpoint: keyof typeof this.limits
  ): Promise<void> {
    const limit = this.limits[endpoint];
    const key = `${userId}:${endpoint}`;
    const now = Date.now();

    let entry = this.requestCounts.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      entry = {
        count: 1,
        resetAt: now + limit.windowMs
      };
      this.requestCounts.set(key, entry);
      return;
    }

    entry.count++;

    if (entry.count > limit.requests) {
      // Rate limit exceeded
      const resetIn = Math.ceil((entry.resetAt - now) / 1000);

      throw new RateLimitError(
        `Rate limit exceeded for ${endpoint}. Try again in ${resetIn}s`,
        resetIn
      );
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requestCounts.entries()) {
      if (now >= entry.resetAt) {
        this.requestCounts.delete(key);
      }
    }
  }
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

**Deliverables (Phase 2A):**
- [ ] RBAC framework operational
- [ ] 6 system roles defined
- [ ] Worker certificate authentication
- [ ] Security audit log at 100% coverage
- [ ] Rate limiting on all critical endpoints
- [ ] SIEM integration configured

---

### Priority 2B: Compliance & Data Protection (Days 15-23)

#### Task 2.5: GDPR Right to Erasure (12 hours)

**Implementation:**
```sql
-- .claude/orchestration/db/gdpr.sql

-- Procedure: Complete data erasure
CREATE PROCEDURE gdpr_erase_user(user_id TEXT) AS
BEGIN
  -- Log erasure request
  INSERT INTO security_audit_log (
    event_type, severity, user_id, outcome, details
  ) VALUES (
    'gdpr.erasure.start',
    'high',
    user_id,
    'success',
    json_object('requested_at', CURRENT_TIMESTAMP)
  );

  -- Delete conversation data
  DELETE FROM conversation_turns WHERE session_id IN (
    SELECT id FROM conversation_sessions WHERE user_id = user_id
  );
  DELETE FROM conversation_sessions WHERE user_id = user_id;

  -- Delete knowledge contributions
  DELETE FROM knowledge_edges WHERE source_id IN (
    SELECT id FROM knowledge_nodes WHERE agent_id = user_id
  );
  DELETE FROM knowledge_nodes WHERE agent_id = user_id;

  -- Delete task submissions
  DELETE FROM task_queue WHERE submitted_by = user_id;

  -- Remove from analytics (anonymize)
  UPDATE analytics_queries
  SET created_by = 'anonymized_' || substr(hex(randomblob(8)), 1, 16)
  WHERE created_by = user_id;

  -- Log completion
  INSERT INTO security_audit_log (
    event_type, severity, user_id, outcome, details
  ) VALUES (
    'gdpr.erasure.complete',
    'high',
    user_id,
    'success',
    json_object('completed_at', CURRENT_TIMESTAMP)
  );
END;
```

#### Task 2.6: Data Retention Policies (8 hours)

**Automated Retention:**
```sql
-- Enable automatic cleanup triggers

-- Cleanup: Old completed sessions (90 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_sessions
AFTER INSERT ON conversation_sessions
BEGIN
  DELETE FROM conversation_sessions
  WHERE status IN ('completed', 'abandoned')
    AND updated_at < datetime('now', '-90 days');
END;

-- Cleanup: Old health checks (7 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_health_checks
AFTER INSERT ON health_checks
BEGIN
  DELETE FROM health_checks
  WHERE timestamp < datetime('now', '-7 days');
END;

-- Cleanup: Old telemetry (30 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_telemetry
AFTER INSERT ON telemetry_events
BEGIN
  DELETE FROM telemetry_events
  WHERE timestamp < datetime('now', '-30 days');
END;

-- Preserve audit logs (7 years for compliance)
-- No cleanup trigger for security_audit_log
```

**Deliverables (Phase 2B):**
- [ ] GDPR erasure procedure functional
- [ ] Data retention policies automated
- [ ] Privacy impact assessment completed
- [ ] Processing activity register created
- [ ] GDPR compliance: 40% → 85%

---

### Phase 2 Success Criteria

**Must-Have for Phase 2 Completion:**
- ✅ All 12 high-severity vulnerabilities remediated
- ✅ RBAC operational with 6+ roles
- ✅ Security logging at 100%
- ✅ Rate limiting deployed
- ✅ GDPR compliance at 85%+

**Metrics:**
- High vulnerabilities: 12 → 0 ✅
- Access control coverage: 0% → 100% ✅
- Audit log coverage: 40% → 100% ✅
- GDPR compliance: 40% → 85% ✅

---

## Phase 3: Medium Severity & Compliance (Days 31-90)

**Objective:** Achieve full compliance and security hardening.

### Priority 3A: Security Headers & CSRF (Days 31-38)

#### Task 3.1: Security Headers

**Implementation:**
```typescript
// .claude/orchestration/middleware/security-headers.ts

export function securityHeadersMiddleware(req: Request, res: Response, next: Function) {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.trusted.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.trusted.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}
```

#### Task 3.2: CSRF Protection

**Implementation:**
```typescript
// .claude/orchestration/middleware/csrf.ts

import * as crypto from 'crypto';

export class CSRFProtection {
  private tokens: Map<string, { token: string; expiresAt: number }>;

  constructor() {
    this.tokens = new Map();
  }

  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (3600 * 1000); // 1 hour

    this.tokens.set(sessionId, { token, expiresAt });
    return token;
  }

  validateToken(sessionId: string, token: string): boolean {
    const entry = this.tokens.get(sessionId);

    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(entry.token),
      Buffer.from(token)
    );
  }
}
```

### Priority 3B: Penetration Testing (Days 39-52)

**Testing Checklist:**
- [ ] OWASP ZAP automated scan
- [ ] SQLMap injection testing
- [ ] Burp Suite authentication testing
- [ ] Manual federation protocol testing
- [ ] Namespace isolation penetration test
- [ ] Rate limit bypass attempts
- [ ] CSRF attack simulation

### Priority 3C: Documentation & Training (Days 53-90)

**Documentation:**
- [ ] Security architecture document
- [ ] Incident response playbook
- [ ] Key rotation procedures
- [ ] Compliance audit guide
- [ ] Developer security guidelines

**Training:**
- [ ] Secure coding training
- [ ] OWASP Top 10 workshop
- [ ] Incident response drill
- [ ] Compliance awareness session

---

## Phase 4: Continuous Security (Ongoing)

**Monthly Activities:**
- [ ] Dependency vulnerability scan
- [ ] Security patch updates
- [ ] Access review
- [ ] Failed authentication analysis
- [ ] Penetration test retesting

**Quarterly Activities:**
- [ ] Security audit
- [ ] Compliance assessment
- [ ] Incident response drill
- [ ] Key rotation

**Annual Activities:**
- [ ] SOC2 audit
- [ ] GDPR compliance review
- [ ] Penetration testing (full scope)
- [ ] Security roadmap update

---

## Validation Testing Requirements

### Critical Vulnerability Tests

**Authentication Tests (30 tests):**
- Packet signature verification
- Replay attack prevention
- Peer authorization
- TLS certificate validation
- Worker authentication
- Session management

**Injection Prevention Tests (25 tests):**
- SQL injection (ORDER BY, WHERE, filters)
- JSON injection
- FTS injection
- Input validation bypass attempts
- Column whitelist enforcement

**Namespace Isolation Tests (20 tests):**
- Cross-namespace edge prevention
- Namespace ACL enforcement
- Cross-tenant data access attempts
- Violation logging

**Encryption Tests (15 tests):**
- Field-level encryption/decryption
- Key rotation
- Key management security
- Encryption performance

### Compliance Validation Tests

**SOC2 Tests:**
- CC6.1: Access control checks
- CC6.3: Encryption validation
- CC6.6: Security event logging
- CC7.1: Incident detection

**GDPR Tests:**
- Right to erasure procedure
- Data retention policies
- Breach notification simulation
- Processing activity accuracy

**OWASP Tests:**
- A01: Access control (vertical/horizontal escalation)
- A02: Cryptographic validation
- A03: Injection prevention
- A07: Authentication mechanisms
- A09: Logging completeness

---

## Compliance Impact Analysis

### SOC2 Type II

**Pre-Remediation:**
- ❌ CC6.1 (Access Control): FAIL
- ❌ CC6.3 (Encryption): FAIL
- ❌ CC6.6 (Audit Logging): FAIL
- ⚠️ CC7.1 (Detection): PARTIAL
- ✅ CC7.2 (Monitoring): PASS
- ✅ CC8.1 (Change Management): PASS

**Post-Phase 1:**
- ✅ CC6.3 (Encryption): PASS
- ⚠️ CC6.1 (Access Control): PARTIAL (namespace isolation only)
- ⚠️ CC6.6 (Audit Logging): PARTIAL (critical events only)

**Post-Phase 2:**
- ✅ CC6.1 (Access Control): PASS (RBAC operational)
- ✅ CC6.6 (Audit Logging): PASS (100% coverage)
- ✅ CC7.1 (Detection): PASS (security monitoring)
- **Overall SOC2 Status: PASS** ✅

**Post-Phase 3:**
- ✅ All controls: PASS
- ✅ Documentation complete
- ✅ Audit-ready

---

### GDPR Compliance

**Pre-Remediation:**
- ❌ Article 17 (Right to Erasure): NON-COMPLIANT
- ❌ Article 25 (Data Protection by Design): NON-COMPLIANT
- ❌ Article 32 (Security): NON-COMPLIANT
- ❌ Article 33 (Breach Notification): NON-COMPLIANT

**Post-Phase 1:**
- ✅ Article 32 (Security): COMPLIANT (encryption implemented)
- ⚠️ Article 25 (Data Protection by Design): PARTIAL

**Post-Phase 2:**
- ✅ Article 17 (Right to Erasure): COMPLIANT
- ✅ Article 30 (Records of Processing): COMPLIANT
- ⚠️ Article 33 (Breach Notification): PARTIAL

**Post-Phase 3:**
- ✅ Article 25 (Data Protection by Design): COMPLIANT
- ✅ Article 33 (Breach Notification): COMPLIANT
- ✅ Article 35 (DPIA): COMPLIANT
- **Overall GDPR Status: COMPLIANT** ✅

---

### OWASP Top 10

**Pre-Remediation:** 5/10 FAIL

**Post-Phase 1:**
- ✅ A01 (Broken Access Control): Namespace isolation ✅
- ✅ A02 (Cryptographic Failures): Encryption ✅
- ✅ A03 (Injection): SQL injection prevention ✅
- ⚠️ A07 (Auth Failures): Partial (federation only)

**Post-Phase 2:**
- ✅ A07 (Identification and Authentication Failures): PASS ✅
- ✅ A09 (Security Logging Failures): PASS ✅
- **Overall OWASP Coverage: 8/10 PASS** ✅

**Post-Phase 3:**
- ✅ A04 (Insecure Design): PASS ✅
- ✅ A05 (Security Misconfiguration): PASS ✅
- **Overall OWASP Coverage: 10/10 PASS** ✅

---

## Security Metrics Dashboard

### Key Performance Indicators

| Metric | Baseline | Phase 1 | Phase 2 | Phase 3 | Target |
|--------|----------|---------|---------|---------|--------|
| **Critical Vulnerabilities** | 3 | 0 | 0 | 0 | 0 |
| **High Vulnerabilities** | 12 | 12 | 0 | 0 | 0 |
| **Medium Vulnerabilities** | 18 | 18 | 18 | 0 | 0 |
| **Security Test Coverage** | 0% | 80% | 90% | 95% | >95% |
| **Encryption Coverage** | 0% | 100% | 100% | 100% | 100% |
| **Audit Log Coverage** | 40% | 70% | 100% | 100% | 100% |
| **SOC2 Controls Passing** | 30% | 50% | 100% | 100% | 100% |
| **GDPR Compliance** | 40% | 60% | 85% | 100% | 100% |
| **OWASP Coverage** | 50% | 60% | 80% | 100% | 100% |
| **Mean Time to Remediate** | N/A | 3 days | 5 days | 7 days | <7 days |

---

## Risk Acceptance (If Partial Deployment Required)

**If deploying before full remediation (NOT RECOMMENDED):**

### Mandatory Mitigations

1. **Network Isolation**
   - No internet exposure
   - Internal network only
   - Firewall whitelist: specific IPs only

2. **Monitoring**
   - 24/7 security monitoring
   - Real-time alerting on security events
   - Daily security report review

3. **Incident Response**
   - Incident response team on-call
   - Breach notification procedures ready
   - Rollback plan documented

4. **Access Control**
   - Minimum viable RBAC
   - All access logged
   - Weekly access reviews

### Residual Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data breach via federation | Medium | Critical | Network isolation, monitoring |
| SQL injection attack | Low | Critical | Input validation, WAF rules |
| Cross-tenant data leakage | Low | High | Namespace ACL enforced |
| Unauthorized access | Medium | High | RBAC, audit logging |

**Sign-off Required for Risk Acceptance:**
- [ ] CISO
- [ ] CTO
- [ ] Legal/Compliance
- [ ] Product Owner

---

## Timeline & Milestones

| Milestone | Target Date | Deliverables | Sign-off |
|-----------|-------------|--------------|----------|
| **Phase 1 Complete** | Day 7 | Critical fixes, encryption | Security Engineer, Engineering Lead |
| **Phase 2 Complete** | Day 30 | RBAC, audit logging | Security Engineer, Compliance |
| **Phase 3 Complete** | Day 90 | Full compliance, hardening | CISO, Compliance Officer |
| **Production Ready** | Day 90 | All tests passing, documentation | Executive Team |
| **SOC2 Audit** | Day 120 | Audit preparation complete | Compliance Officer |

---

## Budget & Resources

### Personnel Costs

| Role | Duration | Rate | Cost |
|------|----------|------|------|
| Senior Security Engineer #1 | 12 weeks | $10,000/week | $120,000 |
| Senior Security Engineer #2 | 12 weeks | $10,000/week | $120,000 |
| Compliance Specialist | 8 weeks | $8,000/week | $64,000 |
| Security Architect (Consulting) | 4 weeks | $12,000/week | $48,000 |
| **Total Personnel** | | | **$352,000** |

### Tools & Services

| Item | Cost |
|------|------|
| SIEM platform (90 days) | $5,000 |
| Penetration testing | $30,000 |
| Security scanning tools | $10,000 |
| Key management service | $3,000 |
| Training materials | $2,000 |
| **Total Tools** | **$50,000** |

### **Total Project Budget: $402,000**

### Cost-Benefit Analysis

**Cost of Remediation:** $402,000

**Cost of Data Breach (estimated):**
- Average breach cost: $4.45M (IBM 2023)
- Regulatory fines (GDPR): up to €20M or 4% revenue
- Reputational damage: incalculable

**ROI:** Remediation cost is <10% of potential breach cost

---

## Communication Plan

### Stakeholder Updates

**Weekly (During Phase 1-2):**
- Security status report
- Vulnerability remediation progress
- Blocker escalation

**Bi-Weekly (Phase 3):**
- Compliance status
- Test results
- Timeline updates

**Monthly (All Phases):**
- Executive dashboard
- Budget vs. actual
- Risk register update

### Escalation Path

1. **Security Engineer** → **Engineering Lead** (same day)
2. **Engineering Lead** → **CTO** (within 24 hours)
3. **CTO** → **CEO/Board** (critical issues immediately)

---

## Conclusion

This security remediation roadmap provides a comprehensive, phased approach to addressing critical vulnerabilities and achieving production-ready security posture.

### Key Takeaways

**Immediate Priorities:**
1. **Authentication** - Implement mutual TLS and HMAC signing
2. **SQL Injection** - Column whitelisting and parameterized queries
3. **Namespace Isolation** - Database triggers and ACL enforcement
4. **Encryption** - AES-256-GCM for sensitive fields

**Success Factors:**
- ✅ Dedicated security team (2 engineers full-time)
- ✅ Clear timeline and milestones
- ✅ Comprehensive testing (150+ security tests)
- ✅ Compliance alignment (SOC2, GDPR, OWASP)
- ✅ Executive buy-in and budget approval

**Timeline:**
- **7 days:** Critical vulnerabilities eliminated
- **30 days:** High-severity issues resolved, RBAC operational
- **90 days:** Full compliance, audit-ready
- **120 days:** SOC2 audit complete

### Recommendation

**DO NOT deploy to production until Phase 1 is complete.**

**Timeline to production readiness: 90 days** with dedicated resources.

---

**Document Owner:** Security Team
**Approved By:** [Pending]
**Date:** 2025-12-13
**Next Review:** 2025-12-20 (Phase 1 checkpoint)

---

**Related Documents:**
- Security Audit Report (`.claude/orchestration/docs/security-audit-report.md`)
- Compliance Checklist (`.claude/orchestration/docs/compliance-checklist.md`)
- Test Suite (`.claude/orchestration/tests/security/`)
- RBAC Schema (`.claude/orchestration/db/rbac.sql`)
