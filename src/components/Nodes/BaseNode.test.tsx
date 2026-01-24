/**
 * BaseNode Component Tests
 *
 * Comprehensive test suite for BaseNode component covering:
 * - Rendering with different categories
 * - Execution status visualization
 * - Error and warning badge display
 * - Handle configuration
 * - Accessibility compliance
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory } from '../../types/nodes';

// Wrapper component for React Flow context
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe('BaseNode', () => {
  it('renders with basic props', () => {
    const data = {
      label: 'Test Node',
      description: 'Test description',
    };

    render(
      <Wrapper>
        <BaseNode
          id="test-node-1"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays correct category styling', () => {
    const data = { label: 'Trigger Node' };

    const { container } = render(
      <Wrapper>
        <BaseNode
          id="trigger-1"
          type="trigger.manual"
          data={data}
          category={NodeCategory.TRIGGER}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    // Check for trigger category class
    const nodeElement = container.querySelector('.bg-blue-50');
    expect(nodeElement).toBeInTheDocument();
  });

  it('displays error badge when errors present', () => {
    const data = {
      label: 'Node with errors',
      errors: ['Error 1', 'Error 2'],
    };

    render(
      <Wrapper>
        <BaseNode
          id="error-node"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByLabelText('2 errors')).toBeInTheDocument();
  });

  it('displays warning badge when warnings present', () => {
    const data = {
      label: 'Node with warnings',
      warnings: ['Warning 1'],
    };

    render(
      <Wrapper>
        <BaseNode
          id="warning-node"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    expect(screen.getByLabelText('1 warning')).toBeInTheDocument();
  });

  it('displays execution status indicator', () => {
    const data = {
      label: 'Running Node',
      status: 'running' as const,
    };

    render(
      <Wrapper>
        <BaseNode
          id="running-node"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    expect(screen.getByLabelText('Running')).toBeInTheDocument();
  });

  it('renders multiple input handles when supportsMultipleInputs is true', () => {
    const data = { label: 'Multi-input Node' };

    const { container } = render(
      <Wrapper>
        <BaseNode
          id="multi-input"
          type="control.merge"
          data={data}
          category={NodeCategory.CONTROL}
          supportsMultipleInputs={true}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    const inputHandles = container.querySelectorAll('[aria-label*="Input connection handle"]');
    expect(inputHandles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders multiple output handles when supportsMultipleOutputs is true', () => {
    const data = { label: 'Multi-output Node' };

    const { container } = render(
      <Wrapper>
        <BaseNode
          id="multi-output"
          type="control.parallel"
          data={data}
          category={NodeCategory.CONTROL}
          supportsMultipleOutputs={true}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    const outputHandles = container.querySelectorAll('[aria-label*="Output connection handle"]');
    expect(outputHandles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders custom children content', () => {
    const data = { label: 'Node with content' };

    render(
      <Wrapper>
        <BaseNode
          id="content-node"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        >
          <div>Custom Content</div>
        </BaseNode>
      </Wrapper>
    );

    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('applies selected styling when selected', () => {
    const data = { label: 'Selected Node' };

    const { container } = render(
      <Wrapper>
        <BaseNode
          id="selected-node"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={true}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    // Check for selected ring styling
    const nodeWithRing = container.querySelector('[aria-selected="true"]');
    expect(nodeWithRing).toBeInTheDocument();
  });

  it('meets accessibility requirements', () => {
    const data = {
      label: 'Accessible Node',
      description: 'This is an accessible node',
    };

    render(
      <Wrapper>
        <BaseNode
          id="accessible-node"
          type="phase.code"
          data={data}
          category={NodeCategory.PHASE}
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          zIndex={0}
          dragging={false}
        />
      </Wrapper>
    );

    // Check for article role
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Accessible Node node');

    // Check for description
    const description = screen.getByText('This is an accessible node');
    expect(description).toHaveAttribute('id', 'node-accessible-node-description');
  });
});
