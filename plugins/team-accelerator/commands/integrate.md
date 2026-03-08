---
name: team-accelerator:integrate
intent: Generate and manage API integrations including REST clients, GraphQL schemas, database connections, and webhook handlers
tags:
  - team-accelerator
  - command
  - integrate
inputs: []
risk: medium
cost: medium
description: Generate and manage API integrations including REST clients, GraphQL schemas, database connections, and webhook handlers
---

# Integrate Command

Generate and manage API integrations with support for REST, GraphQL, databases, webhooks, and OAuth flows.

## Usage

```bash
/integrate <type> [action]
```

## Examples

```bash
# Generate REST API client
/integrate rest generate

# Create GraphQL schema
/integrate graphql generate

# Set up database connection
/integrate database

# Configure webhook handlers
/integrate webhook generate

# Set up OAuth integration
/integrate oauth
```

## Execution Flow

### 1. REST API Integration

#### Generate API Client

```bash
# From OpenAPI specification
npx openapi-generator-cli generate \
  -i ./api/openapi.yaml \
  -g typescript-axios \
  -o ./src/api/generated \
  --additional-properties=supportsES6=true,npmVersion=9.0.0

# Or using swagger-typescript-api
npx swagger-typescript-api \
  -p ./api/openapi.yaml \
  -o ./src/api \
  -n api.ts \
  --axios
```

#### REST Client Template

```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          return this.instance.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  // ... other methods
}
```

#### Test REST Integration

```bash
# Run API tests
npm run test:api

# Test with HTTPie
http GET ${API_URL}/health
http POST ${API_URL}/users name=test email=test@example.com

# Load test with k6
k6 run tests/load/api.k6.js
```

### 2. GraphQL Integration

#### Generate GraphQL Client

```bash
# Generate types and hooks from schema
npx graphql-codegen --config codegen.yml

# Or generate from introspection
npx graphql-codegen \
  --schema ${GRAPHQL_URL} \
  --documents "src/**/*.graphql" \
  --generates src/generated/graphql.ts
```

#### GraphQL Codegen Configuration

```yaml
# codegen.yml
schema: "./schema.graphql"
documents: "src/**/*.graphql"
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      withComponent: false
      withHOC: false
```

#### GraphQL Client Setup

```typescript
// src/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### 3. Database Integration

#### PostgreSQL Connection

```typescript
// src/db/postgres.ts
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool(poolConfig);

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
```

#### Prisma Setup

```bash
# Initialize Prisma
npx prisma init

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### MongoDB Connection

```typescript
// src/db/mongodb.ts
import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!, {
    maxPoolSize: 10,
  });

  const db = client.db(process.env.MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
```

### 4. Webhook Integration

#### Webhook Handler Template

```typescript
// src/webhooks/handler.ts
import crypto from 'crypto';
import { Request, Response } from 'express';

interface WebhookConfig {
  secret: string;
  signatureHeader: string;
  algorithm: string;
}

export function createWebhookHandler(config: WebhookConfig) {
  return async (req: Request, res: Response) => {
    // Verify signature
    const signature = req.headers[config.signatureHeader] as string;
    const payload = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac(config.algorithm, config.secret)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    )) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    try {
      const event = req.body;
      await processWebhookEvent(event);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };
}

async function processWebhookEvent(event: unknown): Promise<void> {
  // Event processing logic
  console.log('Processing webhook event:', event);
}
```

#### GitHub Webhook Example

```typescript
// src/webhooks/github.ts
import { Webhooks } from '@octokit/webhooks';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

webhooks.on('push', ({ payload }) => {
  console.log(`Push to ${payload.repository.full_name}`);
  // Trigger CI/CD pipeline
});

webhooks.on('pull_request.opened', ({ payload }) => {
  console.log(`PR opened: ${payload.pull_request.title}`);
  // Run automated checks
});

webhooks.on('issues.opened', ({ payload }) => {
  console.log(`Issue opened: ${payload.issue.title}`);
  // Auto-label or assign
});

export { webhooks };
```

### 5. OAuth Integration

#### OAuth2 Client Setup

```typescript
// src/auth/oauth.ts
import { OAuth2Client } from 'google-auth-library';
import { AuthorizationCode } from 'simple-oauth2';

// Google OAuth
export const googleOAuth = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generic OAuth2
export const oauth2Client = new AuthorizationCode({
  client: {
    id: process.env.OAUTH_CLIENT_ID!,
    secret: process.env.OAUTH_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: process.env.OAUTH_TOKEN_HOST!,
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize',
  },
});

export function getAuthorizationUrl(state: string): string {
  return oauth2Client.authorizeURL({
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    scope: 'read write',
    state,
  });
}

export async function getAccessToken(code: string): Promise<string> {
  const tokenParams = {
    code,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    scope: 'read write',
  };

  const result = await oauth2Client.getToken(tokenParams);
  return result.token.access_token as string;
}
```

## Integration Testing

```bash
# Test all integrations
npm run test:integration

# Test specific integration
npm run test:integration:rest
npm run test:integration:graphql
npm run test:integration:database

# Validate configurations
/integrate rest validate
/integrate graphql validate
/integrate database validate
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                  INTEGRATION STATUS                           ║
╠══════════════════════════════════════════════════════════════╣
║ Type: REST API                                                ║
║ Action: Generate                                              ║
╠══════════════════════════════════════════════════════════════╣
║ Generated Files:                                              ║
║   ✅ src/api/generated/api.ts                                ║
║   ✅ src/api/generated/types.ts                              ║
║   ✅ src/api/client.ts                                       ║
╠══════════════════════════════════════════════════════════════╣
║ Endpoints Discovered: 24                                      ║
║ Models Generated: 18                                          ║
║ Type Coverage: 100%                                           ║
╠══════════════════════════════════════════════════════════════╣
║ Next Steps:                                                   ║
║   1. Review generated types in src/api/generated/types.ts    ║
║   2. Configure authentication in src/api/client.ts           ║
║   3. Run integration tests: npm run test:integration         ║
╚══════════════════════════════════════════════════════════════╝
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_URL` | REST API base URL | For REST |
| `GRAPHQL_URL` | GraphQL endpoint | For GraphQL |
| `DATABASE_URL` | Database connection string | For DB |
| `OAUTH_*` | OAuth configuration | For OAuth |
| `WEBHOOK_SECRET` | Webhook signing secret | For webhooks |

## Related Commands

- `/deploy` - Deploy integrated services
- `/test` - Run integration tests
- `/docs` - Generate API documentation
