# Visual Flow Builder - Pilot Project Deployment Guide

## Overview

This guide will help you integrate the ACCOS Visual Flow Builder into your alpha-0.1 pilot project. The Visual Flow Builder is a production-ready React-based visual workflow designer with real-time execution monitoring.

## ✅ What's Already Complete

The Visual Flow Builder includes:
- **Visual Canvas**: React Flow-based drag-and-drop workflow designer
- **Node Library**: 27 pre-built node types across 6 categories
- **Properties Panel**: Dynamic form generation with validation
- **Real-time Monitoring**: WebSocket-based execution tracking
- **API Integration**: Full CRUD operations for workflows and templates
- **191/191 tests passing** with comprehensive coverage

## Quick Start (5 minutes)

### 1. Copy Visual Flow Builder Files

Copy the complete frontend implementation:

```bash
# From your development location
cp -r "C:\Users\MarkusAhling\claude system\frontend\src" "C:\Users\MarkusAhling\pro\alpha-0.1\claude\src"
cp "C:\Users\MarkusAhling\claude system\frontend\package.json" "C:\Users\MarkusAhling\pro\alpha-0.1\claude\package.json"
cp "C:\Users\MarkusAhling\claude system\frontend\tsconfig.json" "C:\Users\MarkusAhling\pro\alpha-0.1\claude\tsconfig.json"
cp "C:\Users\MarkusAhling\claude system\frontend\vite.config.ts" "C:\Users\MarkusAhling\pro\alpha-0.1\claude\vite.config.ts"
cp "C:\Users\MarkusAhling\claude system\frontend\tailwind.config.js" "C:\Users\MarkusAhling\pro\alpha-0.1\claude\tailwind.config.js"
```

### 2. Install Dependencies

```bash
cd "C:\Users\MarkusAhling\pro\alpha-0.1\claude"
npm install
# or if using pnpm in your workspace:
# pnpm install
```

### 3. Start the Visual Flow Builder

```bash
npm run dev
# or
pnpm dev
```

The Visual Flow Builder will be available at: `http://localhost:5173`

## Integration with Your Existing Project

### Option 1: Standalone Application (Recommended for Pilot)

Run the Visual Flow Builder as a separate application alongside your main project:

1. **Frontend**: Visual Flow Builder on port 5173
2. **Your Backend**: Your existing server infrastructure
3. **Integration**: Connect via API calls and shared authentication

### Option 2: Workspace Integration

Add to your `pnpm-workspace.yaml`:

```yaml
packages:
  - client
  - server
  - claude  # Add this line
  # ... other packages
```

### Option 3: Component Integration

Import Visual Flow Builder components directly into your existing client:

```typescript
// In your existing client app
import { WorkflowCanvas, NodePalette, PropertiesPanel } from '../claude/src/components';

function WorkflowBuilder() {
  return (
    <div className="h-screen flex">
      <NodePalette />
      <WorkflowCanvas />
      <PropertiesPanel />
    </div>
  );
}
```

## Backend Integration

### Required API Endpoints

Your backend needs these endpoints (or proxy to ACCOS backend):

```typescript
// Visual Workflows
GET    /api/v1/workflows/visual
POST   /api/v1/workflows/visual
GET    /api/v1/workflows/visual/:id
PUT    /api/v1/workflows/visual/:id
DELETE /api/v1/workflows/visual/:id

// Node Types
GET    /api/v1/node-types

// Templates
GET    /api/v1/templates/workflows
POST   /api/v1/templates/workflows/:id/instantiate

// WebSocket
WS     /ws/workflows
```

### Environment Variables

Create `.env` file in the claude directory:

```bash
# Claude Visual Flow Builder Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_BASE_URL=ws://localhost:3000/ws
VITE_ENABLE_DEBUG=true

# Integration with your existing auth
VITE_AUTH_ENDPOINT=/auth
VITE_TENANT_ID=your-tenant-id
```

## Configuration for Your Project

### 1. Update API Base URLs

Edit `src/lib/api/client.ts`:

```typescript
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
```

### 2. Authentication Integration

If you're using Keycloak (I see keycloak-alpha in your structure):

```typescript
// src/lib/auth/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080/auth',
  realm: 'your-realm',
  clientId: 'visual-flow-builder'
});

// Add token to API requests
export const getAuthHeader = () => ({
  Authorization: `Bearer ${keycloak.token}`
});
```

### 3. Multi-tenant Setup

Configure tenant isolation for workflows:

```typescript
// src/stores/workflowStore.ts
const useWorkflowStore = create<WorkflowStore>((set) => ({
  // ... existing state
  tenantId: process.env.VITE_TENANT_ID,
  // Automatically filter workflows by tenant
}));
```

## Demo Scenarios

### Scenario 1: Member Management Workflow

Based on your member-management files, create a workflow that:

1. **Trigger**: New member registration
2. **Phase**: Validation and verification
3. **Agent**: AI-powered document review
4. **Action**: Send welcome email
5. **Terminator**: Complete onboarding

### Scenario 2: Theme Application Workflow

From your THEME-DEMO-GUIDE.md, create:

1. **Trigger**: Theme selection request
2. **Control**: Conditional theme validation
3. **Parallel**: Apply styles to multiple components
4. **Action**: Deploy theme updates
5. **Terminator**: Notify completion

## Testing Your Integration

### 1. Start All Services

```bash
# Terminal 1: Your existing backend
cd C:\Users\MarkusAhling\pro\alpha-0.1\alpha-0.1
npm run dev

# Terminal 2: Visual Flow Builder
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude
npm run dev

# Terminal 3: Any additional services (Keycloak, etc.)
```

### 2. Verify Integration

1. Open Visual Flow Builder: `http://localhost:5173`
2. Check API connectivity: Network tab should show successful calls
3. Test workflow creation: Drag nodes, configure properties
4. Test real-time monitoring: WebSocket connection status

### 3. Run Tests

```bash
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude
npm test
# Should show 191/191 tests passing
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: If 5173 is used, Vite will auto-increment to 5174
2. **CORS Issues**: Add your frontend URL to backend CORS configuration
3. **WebSocket Connection**: Ensure your backend supports WebSocket upgrades
4. **Missing Dependencies**: Run `npm install` in the claude directory

### Debug Mode

Enable detailed logging:

```bash
# Set in .env
VITE_ENABLE_DEBUG=true
```

## Production Deployment

### Docker Setup

Add to your existing `docker-compose.yml`:

```yaml
services:
  visual-flow-builder:
    build:
      context: ./claude
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://api:3000/api/v1
      - VITE_WS_BASE_URL=ws://api:3000/ws
    depends_on:
      - api
```

### Build for Production

```bash
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude
npm run build
# Outputs to dist/ folder
```

## Next Steps

1. **Start with Option 1** (Standalone) for quickest pilot validation
2. **Test with your member management data** using the API integration
3. **Create custom node types** specific to your business logic
4. **Monitor performance** with the real-time execution features
5. **Scale integration** based on pilot results

## Support & Documentation

- **Component Documentation**: See `src/components/README.md`
- **API Documentation**: Available at your backend `/api/docs`
- **Architecture Guide**: Generated by documentation agent
- **Test Coverage**: 191/191 tests with detailed coverage reports

## Success Criteria for Pilot

- [ ] Visual Flow Builder starts successfully
- [ ] Can create and save workflows
- [ ] Backend API integration works
- [ ] Real-time monitoring displays status
- [ ] Performance acceptable for your workflow size
- [ ] Authentication/authorization integrated
- [ ] Ready for user acceptance testing

---

**Getting stuck?** Check the comprehensive logs and test outputs - this system has extensive error handling and debugging built in.

**Ready to extend?** All components are modular and documented for easy customization to your specific use cases.