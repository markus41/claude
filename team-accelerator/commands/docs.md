---
description: Generate and manage documentation including OpenAPI specs, Mermaid diagrams, README files, changelogs, and ADRs
arguments:
  - name: type
    description: "Documentation type: api, diagram, readme, changelog, adr, or all"
    required: true
  - name: output
    description: "Output format or path (default: auto-detect)"
    required: false
---

# Docs Command

Generate and manage comprehensive documentation including API specifications, diagrams, README files, changelogs, and Architecture Decision Records.

## Usage

```bash
/docs <type> [output]
```

## Examples

```bash
# Generate OpenAPI documentation
/docs api

# Create Mermaid diagrams
/docs diagram

# Update README
/docs readme

# Generate changelog
/docs changelog

# Create ADR
/docs adr

# Generate all documentation
/docs all
```

## Execution Flow

### 1. OpenAPI Documentation

#### Generate from Code

```bash
# TypeScript/Express with tsoa
npx tsoa spec-and-routes

# NestJS
# Uses @nestjs/swagger decorators automatically

# Python/FastAPI
# Auto-generated at /docs endpoint

# Generate from annotations
npx swagger-jsdoc -d swagger.config.js -o ./docs/openapi.yaml
```

#### OpenAPI Specification Template

```yaml
# docs/openapi.yaml
openapi: 3.0.3
info:
  title: ${PROJECT_NAME} API
  description: |
    ${PROJECT_DESCRIPTION}

    ## Authentication
    This API uses Bearer token authentication.

    ## Rate Limiting
    - 100 requests per minute for authenticated users
    - 20 requests per minute for unauthenticated users
  version: ${VERSION}
  contact:
    name: API Support
    email: api-support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Development

tags:
  - name: Users
    description: User management operations
  - name: Authentication
    description: Authentication and authorization

paths:
  /users:
    get:
      summary: List all users
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
```

#### Generate API Docs Site

```bash
# Swagger UI
npx swagger-ui-express

# Redoc
npx redoc-cli bundle docs/openapi.yaml -o docs/api.html

# Stoplight Elements
# Add to HTML: <elements-api apiDescriptionUrl="openapi.yaml" />
```

### 2. Mermaid Diagrams

#### Architecture Diagram

```bash
# Create architecture diagram
cat > docs/diagrams/architecture.mmd << 'EOF'
graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOB[Mobile App]
        CLI[CLI Tool]
    end

    subgraph "API Gateway"
        GW[API Gateway]
        AUTH[Auth Service]
    end

    subgraph "Microservices"
        US[User Service]
        PS[Product Service]
        OS[Order Service]
        NS[Notification Service]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        RD[(Redis)]
        MQ[Message Queue]
    end

    WEB --> GW
    MOB --> GW
    CLI --> GW

    GW --> AUTH
    GW --> US
    GW --> PS
    GW --> OS

    US --> PG
    PS --> PG
    OS --> PG

    US --> RD
    AUTH --> RD

    OS --> MQ
    MQ --> NS
EOF
```

#### Sequence Diagram

```bash
cat > docs/diagrams/auth-flow.mmd << 'EOF'
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as Auth Service
    participant D as Database
    participant R as Redis

    U->>C: Login Request
    C->>A: POST /auth/login
    A->>D: Validate Credentials
    D-->>A: User Data
    A->>A: Generate JWT
    A->>R: Store Session
    A-->>C: Access Token + Refresh Token
    C-->>U: Login Success

    Note over U,R: Token Refresh Flow

    U->>C: API Request (expired token)
    C->>A: POST /auth/refresh
    A->>R: Validate Refresh Token
    R-->>A: Session Valid
    A->>A: Generate New JWT
    A-->>C: New Access Token
    C->>C: Retry Original Request
EOF
```

#### Entity Relationship Diagram

```bash
cat > docs/diagrams/database.mmd << 'EOF'
erDiagram
    USERS ||--o{ ORDERS : places
    USERS {
        uuid id PK
        string email UK
        string name
        string password_hash
        timestamp created_at
        timestamp updated_at
    }

    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS {
        uuid id PK
        uuid user_id FK
        decimal total
        string status
        timestamp created_at
    }

    PRODUCTS ||--o{ ORDER_ITEMS : "included in"
    PRODUCTS {
        uuid id PK
        string name
        text description
        decimal price
        int stock
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }
EOF
```

#### Render Diagrams

```bash
# Using Mermaid CLI
npx @mermaid-js/mermaid-cli mmdc -i docs/diagrams/architecture.mmd -o docs/diagrams/architecture.svg

# Batch render all diagrams
for f in docs/diagrams/*.mmd; do
    npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg"
done
```

### 3. README Generation

```bash
# Generate README template
cat > README.md << 'EOF'
# ${PROJECT_NAME}

${PROJECT_DESCRIPTION}

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone ${REPO_URL}
cd ${PROJECT_NAME}

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 📖 Documentation

- [API Documentation](./docs/api.html)
- [Architecture Overview](./docs/architecture.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🏗️ Architecture

![Architecture Diagram](./docs/diagrams/architecture.svg)

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /auth/login | User login |
| GET | /users | List users |
| POST | /users | Create user |

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | Database connection | - |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
EOF
```

### 4. Changelog Generation

```bash
# Using conventional-changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Or with standard-version
npx standard-version

# Generate from git history
git log --oneline --no-merges v1.0.0..HEAD | while read line; do
    hash=$(echo $line | cut -d' ' -f1)
    msg=$(echo $line | cut -d' ' -f2-)
    echo "- $msg ($hash)"
done
```

#### Changelog Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X

### Changed
- Updated dependency Y

### Fixed
- Bug fix Z

## [2.3.1] - 2024-01-15

### Fixed
- Fixed authentication token refresh (#123)
- Resolved memory leak in event handler (#124)

### Security
- Updated lodash to address CVE-2024-XXXX

## [2.3.0] - 2024-01-10

### Added
- User profile management
- OAuth2 integration with Google
- API rate limiting

### Changed
- Improved error messages
- Updated to Node.js 20

[Unreleased]: https://github.com/org/repo/compare/v2.3.1...HEAD
[2.3.1]: https://github.com/org/repo/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/org/repo/releases/tag/v2.3.0
```

### 5. Architecture Decision Records (ADRs)

```bash
# Create ADR directory
mkdir -p docs/decisions

# Generate ADR template
cat > docs/decisions/0001-use-postgresql.md << 'EOF'
# ADR 0001: Use PostgreSQL as Primary Database

## Status
Accepted

## Date
2024-01-15

## Context
We need to select a primary database for our application that can handle:
- Complex relational data with foreign key constraints
- ACID transactions
- JSON document storage for flexible schemas
- High read/write throughput

## Decision
We will use PostgreSQL as our primary database.

## Consequences

### Positive
- Strong ACID compliance ensures data integrity
- Native JSON/JSONB support for flexible schemas
- Excellent performance with proper indexing
- Rich ecosystem of tools and extensions
- Strong community support

### Negative
- Requires more operational expertise than managed NoSQL solutions
- Horizontal scaling requires additional tooling (e.g., Citus)
- Schema migrations require careful planning

### Neutral
- Team will need to maintain database expertise
- Regular backup and maintenance procedures required

## Alternatives Considered

### MongoDB
- Rejected due to eventual consistency concerns for financial transactions
- Would require additional work for relational data modeling

### MySQL
- Viable alternative but PostgreSQL offers better JSON support
- PostgreSQL has more advanced features (CTEs, window functions)

## References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Company Database Standards](./standards/databases.md)
EOF
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/docs.yml
name: Generate Documentation

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate API docs
        run: npx redoc-cli bundle docs/openapi.yaml -o docs/api.html

      - name: Generate diagrams
        run: npx @mermaid-js/mermaid-cli mmdc -i docs/diagrams/*.mmd

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                 DOCUMENTATION GENERATED                       ║
╠══════════════════════════════════════════════════════════════╣
║ Type: API Documentation                                       ║
║ Output: docs/api.html                                         ║
╠══════════════════════════════════════════════════════════════╣
║ Generated Files:                                              ║
║   ✅ docs/openapi.yaml (OpenAPI 3.0 spec)                    ║
║   ✅ docs/api.html (Redoc static site)                       ║
║   ✅ docs/api/index.html (Swagger UI)                        ║
╠══════════════════════════════════════════════════════════════╣
║ Statistics:                                                   ║
║   Endpoints: 24                                               ║
║   Schemas: 18                                                 ║
║   Tags: 6                                                     ║
╠══════════════════════════════════════════════════════════════╣
║ Next Steps:                                                   ║
║   1. Review generated docs at docs/api.html                  ║
║   2. Add missing descriptions to endpoints                   ║
║   3. Publish to documentation site                           ║
╚══════════════════════════════════════════════════════════════╝
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_NAME` | Project name for docs | Yes |
| `PROJECT_DESCRIPTION` | Project description | Yes |
| `REPO_URL` | Repository URL | For README |
| `VERSION` | Current version | For API docs |

## Related Commands

- `/integrate` - Generate API clients
- `/status` - View project status
- `/workflow` - CI/CD for docs
