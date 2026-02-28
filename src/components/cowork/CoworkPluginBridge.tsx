/**
 * Cowork Plugin Bridge Component
 *
 * Shows the underlying plugin capabilities that power a cowork item.
 * Displays bound agents, skills, commands, and MCP servers from the
 * real installed plugin ecosystem.
 */

import React, { useState } from 'react';
import type { CoworkItem, PluginBinding } from '../../types/cowork';

interface CoworkPluginBridgeProps {
  item: CoworkItem;
  compact?: boolean;
  onPluginClick?: (pluginName: string) => void;
}

const SECTION_ICONS: Record<string, string> = {
  agents: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  skills: 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z',
  commands: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z',
  mcpServers: 'M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm2.25 0h.008v.008H15v-.008Zm0 6h.008v.008H15v-.008Z',
};

function BindingSection({
  label,
  items,
  icon,
  color,
}: {
  label: string;
  items: string[];
  icon: string;
  color: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <svg
          className={`w-4 h-4 text-${color}-500`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label} ({items.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((name) => (
          <span
            key={name}
            className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-${color}-50 text-${color}-700 rounded border border-${color}-200`}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function PluginBindingCard({
  binding,
  compact = false,
  onPluginClick,
}: {
  binding: PluginBinding;
  compact?: boolean;
  onPluginClick?: (pluginName: string) => void;
}) {
  const [expanded, setExpanded] = useState(!compact);
  const totalCapabilities =
    binding.agents.length +
    binding.skills.length +
    binding.commands.length +
    (binding.mcpServers?.length ?? 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => {
          if (compact) setExpanded(!expanded);
          else onPluginClick?.(binding.pluginName);
        }}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 text-sm">
              {binding.pluginName}
            </div>
            <div className="text-xs text-gray-500">
              v{binding.pluginVersion} &middot; {totalCapabilities} capabilities
            </div>
          </div>
        </div>
        {compact && (
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <BindingSection
            label="Agents"
            items={binding.agents}
            icon={SECTION_ICONS.agents}
            color="indigo"
          />
          <BindingSection
            label="Skills"
            items={binding.skills}
            icon={SECTION_ICONS.skills}
            color="emerald"
          />
          <BindingSection
            label="Commands"
            items={binding.commands}
            icon={SECTION_ICONS.commands}
            color="amber"
          />
          {binding.mcpServers && binding.mcpServers.length > 0 && (
            <BindingSection
              label="MCP Servers"
              items={binding.mcpServers}
              icon={SECTION_ICONS.mcpServers}
              color="cyan"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function CoworkPluginBridge({
  item,
  compact = false,
  onPluginClick,
}: CoworkPluginBridgeProps) {
  if (item.pluginBindings.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No plugin bindings configured for this item.
      </div>
    );
  }

  const totalAgents = item.pluginBindings.reduce(
    (sum, b) => sum + b.agents.length,
    0
  );
  const totalSkills = item.pluginBindings.reduce(
    (sum, b) => sum + b.skills.length,
    0
  );
  const totalCommands = item.pluginBindings.reduce(
    (sum, b) => sum + b.commands.length,
    0
  );
  const totalMcp = item.pluginBindings.reduce(
    (sum, b) => sum + (b.mcpServers?.length ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <svg
          className="w-5 h-5 text-purple-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
        <div className="flex-1">
          <div className="text-sm font-medium text-purple-900">
            Powered by {item.pluginBindings.length} plugin
            {item.pluginBindings.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-purple-700">
            {totalAgents} agents &middot; {totalSkills} skills &middot;{' '}
            {totalCommands} commands
            {totalMcp > 0 ? ` \u00B7 ${totalMcp} MCP servers` : ''}
          </div>
        </div>
      </div>

      {/* Plugin Bindings */}
      <div className="space-y-2">
        {item.pluginBindings.map((binding) => (
          <PluginBindingCard
            key={binding.pluginName}
            binding={binding}
            compact={compact}
            onPluginClick={onPluginClick}
          />
        ))}
      </div>
    </div>
  );
}

export default CoworkPluginBridge;
