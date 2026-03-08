/**
 * Cowork Session Panel Component
 *
 * Displays active cowork sessions with real-time progress tracking,
 * agent activity indicators, and session controls (pause/resume/cancel).
 */

import React from 'react';
import type { CoworkSession } from '../../types/cowork';

interface CoworkSessionPanelProps {
  sessions: CoworkSession[];
  loading?: boolean;
  onPause?: (sessionId: string) => void;
  onResume?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  onViewDetails?: (session: CoworkSession) => void;
}

const STATUS_CONFIG: Record<
  CoworkSession['status'],
  { label: string; color: string; pulse: boolean }
> = {
  idle: { label: 'Idle', color: 'gray', pulse: false },
  running: { label: 'Running', color: 'green', pulse: true },
  paused: { label: 'Paused', color: 'yellow', pulse: false },
  completed: { label: 'Completed', color: 'blue', pulse: false },
  failed: { label: 'Failed', color: 'red', pulse: false },
};

export function CoworkSessionPanel({
  sessions,
  loading = false,
  onPause,
  onResume,
  onCancel,
  onViewDetails,
}: CoworkSessionPanelProps) {
  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt
      ? new Date(completedAt).getTime()
      : Date.now();
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatCost = (cost: number) =>
    cost < 0.01 ? '<$0.01' : `$${cost.toFixed(2)}`;

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return String(tokens);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-400 text-4xl mb-3">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No active sessions
        </h3>
        <p className="text-gray-500 text-sm">
          Launch a cowork template or workflow to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const statusConfig = STATUS_CONFIG[session.status];

        return (
          <div
            key={session.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-indigo-200 transition-colors"
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  <span className="relative flex h-3 w-3">
                    {statusConfig.pulse && (
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${statusConfig.color}-400 opacity-75`}
                      />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 bg-${statusConfig.color}-500`}
                    />
                  </span>
                  <h4 className="font-semibold text-gray-900">
                    {session.item.displayName}
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                  {session.status === 'running' && onPause && (
                    <button
                      onClick={() => onPause(session.id)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                      title="Pause session"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      </svg>
                    </button>
                  )}
                  {session.status === 'paused' && onResume && (
                    <button
                      onClick={() => onResume(session.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Resume session"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}
                  {(session.status === 'running' ||
                    session.status === 'paused') &&
                    onCancel && (
                      <button
                        onClick={() => onCancel(session.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Cancel session"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                </div>
              </div>

              {/* Progress Bar */}
              {(session.status === 'running' ||
                session.status === 'paused') && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>
                      {session.currentStep || 'Processing...'}
                    </span>
                    <span>{Math.round(session.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        session.status === 'paused'
                          ? 'bg-yellow-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  {formatDuration(session.startedAt, session.completedAt)}
                </span>
                <span>{session.activeAgents} agents</span>
                <span>{formatTokens(session.tokensUsed)} tokens</span>
                <span>{formatCost(session.estimatedCost)}</span>
                {session.outputs.length > 0 && (
                  <span>
                    {session.outputs.length} output
                    {session.outputs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Outputs (if completed) */}
            {session.status === 'completed' &&
              session.outputs.length > 0 && (
                <div className="px-4 pb-3 border-t border-gray-100 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {session.outputs.map((output) => (
                      <span
                        key={output.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded"
                      >
                        {output.type === 'file' && '📄'}
                        {output.type === 'report' && '📊'}
                        {output.type === 'artifact' && '📦'}
                        {output.type === 'data' && '💾'}
                        {output.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* View Details Button */}
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(session)}
                className="w-full px-4 py-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-t border-gray-100 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CoworkSessionPanel;
