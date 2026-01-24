/**
 * ACCOS Frontend Entry Point
 *
 * Initializes React application with providers and routing.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import './index.css';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Main App component with Full Visual Flow Builder
function App() {
  return <WorkflowBuilder />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
