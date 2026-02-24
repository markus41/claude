---
name: lobbi-platform-manager:keycloak-setup
intent: Initialize Keycloak realm, client, and base configuration for multi-tenant setup
tags:
  - lobbi-platform-manager
  - command
  - keycloak-setup
inputs: []
risk: medium
cost: medium
description: Initialize Keycloak realm, client, and base configuration for multi-tenant setup
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - mcp__MCP_DOCKER__brave_web_search
---

Initialize Keycloak realm and client configuration for the-lobbi/keycloak-alpha platform with proper OAuth settings, multi-tenant claims, and environment variable updates.

## Your Task

You are configuring a Keycloak instance for a multi-tenant MERN application. Create a realm, client configuration, and update the .env file with the necessary credentials.

## Arguments

- `realm` (optional): Keycloak realm name (default: "master")
- `client-id` (optional): OAuth client ID (default: "lobbi-web")

## Steps to Execute

1. **Verify Keycloak is Running**
   - Check if Keycloak is accessible at http://localhost:8080
   - Use: `curl -I http://localhost:8080`
   - If not running, start with: `docker-compose up -d keycloak`

2. **Get Admin Access Token**
   - Read KEYCLOAK_ADMIN_USERNAME and KEYCLOAK_ADMIN_PASSWORD from .env
   - Obtain admin token from Keycloak Admin API:
     ```bash
     curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "username=${ADMIN_USER}" \
       -d "password=${ADMIN_PASS}" \
       -d "grant_type=password" \
       -d "client_id=admin-cli"
     ```

3. **Create or Verify Realm**
   - If realm doesn't exist, create it:
     ```bash
     curl -X POST "http://localhost:8080/admin/realms" \
       -H "Authorization: Bearer ${TOKEN}" \
       -H "Content-Type: application/json" \
       -d '{
         "realm": "{{realm}}",
         "enabled": true,
         "displayName": "Lobbi Platform",
         "accessTokenLifespan": 3600,
         "ssoSessionIdleTimeout": 1800,
         "ssoSessionMaxLifespan": 36000
       }'
     ```

4. **Create OAuth Client**
   - Create client with proper redirect URIs:
     ```json
     {
       "clientId": "{{client-id}}",
       "enabled": true,
       "protocol": "openid-connect",
       "publicClient": false,
       "standardFlowEnabled": true,
       "directAccessGrantsEnabled": true,
       "serviceAccountsEnabled": false,
       "authorizationServicesEnabled": false,
       "redirectUris": [
         "http://localhost:3000/*",
         "http://localhost:5000/*"
       ],
       "webOrigins": [
         "http://localhost:3000",
         "http://localhost:5000"
       ],
       "attributes": {
         "access.token.lifespan": "3600"
       }
     }
     ```

5. **Configure Client Scopes**
   - Add custom mapper for `org_id` claim:
     ```json
     {
       "name": "org-id-mapper",
       "protocol": "openid-connect",
       "protocolMapper": "oidc-usermodel-attribute-mapper",
       "config": {
         "user.attribute": "org_id",
         "claim.name": "org_id",
         "jsonType.label": "String",
         "id.token.claim": "true",
         "access.token.claim": "true",
         "userinfo.token.claim": "true"
       }
     }
     ```

6. **Retrieve Client Secret**
   - Get the generated client secret:
     ```bash
     curl -X GET "http://localhost:8080/admin/realms/{{realm}}/clients/{{client-uuid}}/client-secret" \
       -H "Authorization: Bearer ${TOKEN}"
     ```

7. **Update .env File**
   - Read existing .env file
   - Update or add these variables:
     ```
     KEYCLOAK_REALM={{realm}}
     KEYCLOAK_CLIENT_ID={{client-id}}
     KEYCLOAK_CLIENT_SECRET={{retrieved-secret}}
     KEYCLOAK_URL=http://localhost:8080
     ```
   - Preserve all other existing variables

8. **Verify Configuration**
   - Test token endpoint:
     ```bash
     curl -X GET "http://localhost:8080/realms/{{realm}}/.well-known/openid-configuration"
     ```
   - Confirm the response includes proper endpoints

## Usage Examples

### Basic setup with defaults
```
/lobbi:keycloak-setup
```

### Custom realm
```
/lobbi:keycloak-setup production
```

### Custom realm and client
```
/lobbi:keycloak-setup staging lobbi-staging-web
```

## Expected Outputs

1. **Realm created/verified** with proper token lifespans
2. **OAuth client created** with:
   - Client ID: `{{client-id}}`
   - Client secret (generated)
   - Redirect URIs configured for local development
   - Custom `org_id` mapper added
3. **.env file updated** with:
   - KEYCLOAK_REALM
   - KEYCLOAK_CLIENT_ID
   - KEYCLOAK_CLIENT_SECRET
4. **Verification report** showing:
   - Realm status
   - Client configuration
   - Token endpoint availability
   - Updated .env variables

## Success Criteria

- Keycloak is running and accessible
- Realm exists and is enabled
- OAuth client is created with correct settings
- Client secret is retrieved
- .env file contains all Keycloak variables
- Token endpoint responds with valid configuration
- Custom org_id mapper is configured

## Notes

- The admin token expires after a short time; refresh if needed
- Client UUID is different from client ID; must retrieve it first
- Always backup .env before modification
- Redirect URIs should match your actual application URLs in production
- The org_id claim is essential for multi-tenant data isolation
- Use HTTPS in production environments
