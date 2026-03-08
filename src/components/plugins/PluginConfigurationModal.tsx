import React, { useMemo, useState } from 'react';
import { SchemaForm } from '@/components/Properties';
import type { Plugin, PluginInstallation } from '@/types/plugins';
import type { NodeSchema } from '@/types/workflow';

interface PluginConfigurationModalProps {
  plugin: Plugin;
  installation: PluginInstallation;
  onSave: (configuration: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

type ViewMode = 'form' | 'json';

function getPluginConfigSchema(plugin: Plugin): NodeSchema | null {
  const candidateSchema = (
    plugin.configSchema ||
    plugin.configurationSchema ||
    plugin.config_schema ||
    plugin.configuration_schema
  ) as NodeSchema | undefined;

  if (!candidateSchema || candidateSchema.type !== 'object') {
    return null;
  }

  return candidateSchema;
}

function countTopLevelKeys(configuration: Record<string, unknown>): number {
  return Object.keys(configuration).length;
}

export function PluginConfigurationModal({
  plugin,
  installation,
  onSave,
  onClose,
}: PluginConfigurationModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [rawConfig, setRawConfig] = useState(
    JSON.stringify(installation.configuration ?? {}, null, 2)
  );

  const configSchema = useMemo(() => getPluginConfigSchema(plugin), [plugin]);
  const schemaFieldCount = Object.keys(configSchema?.properties ?? {}).length;
  const installedConfig = installation.configuration ?? {};

  const handleSchemaSave = async (configuration: Record<string, unknown>) => {
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      await onSave(configuration);
      setSaveSuccess('Configuration saved successfully.');
      setRawConfig(JSON.stringify(configuration, null, 2));
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save plugin configuration.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRawSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    let parsedConfiguration: Record<string, unknown>;

    try {
      const parsed = JSON.parse(rawConfig) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Configuration must be a JSON object.');
      }
      parsedConfiguration = parsed as Record<string, unknown>;
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Configuration JSON is invalid.'
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsedConfiguration);
      setSaveSuccess('Configuration saved successfully.');
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save plugin configuration.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyConfig = async () => {
    setSaveError(null);
    try {
      await navigator.clipboard.writeText(rawConfig);
      setSaveSuccess('Copied configuration JSON to clipboard.');
    } catch {
      setSaveError('Unable to copy JSON in this browser context.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl w-full max-h-[92vh] flex flex-col border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-slate-900">Configure {plugin.displayName}</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white border border-slate-200 text-slate-600">
                {plugin.type.replace('_', ' ')} plugin
              </span>
              {configSchema ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Schema driven
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  JSON only
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Save runtime configuration changes for this installed plugin.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {(saveSuccess || saveError) && (
          <div className="px-6 pt-4">
            {saveSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {saveSuccess}
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-2">
                {saveError}
              </div>
            )}
          </div>
        )}

        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <div className="text-xs text-slate-500">Configuration workspace</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'form'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'json'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {configSchema && viewMode === 'form' ? (
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <SchemaForm
                  schema={configSchema}
                  nodeId={`plugin:${installation.id}`}
                  defaultValues={installation.configuration}
                  enableAutoSave={false}
                  showSaveStatus={false}
                  showReset
                  onSubmit={handleSchemaSave}
                  disabled={isSaving}
                  enableVariables={false}
                />
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-slate-200 p-4 bg-white">
                {!configSchema && (
                  <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800">
                    This plugin does not provide a configuration schema. Use raw JSON to inspect and
                    optionally update configuration.
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRawEditor((prev) => !prev)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {showRawEditor ? 'Preview JSON' : 'Edit raw JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyConfig}
                    className="text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    Copy JSON
                  </button>
                </div>

                {showRawEditor ? (
                  <div className="space-y-3">
                    <textarea
                      value={rawConfig}
                      onChange={(event) => setRawConfig(event.target.value)}
                      className="w-full min-h-[320px] rounded-lg border border-slate-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      spellCheck={false}
                      disabled={isSaving}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRawSave}
                        disabled={isSaving}
                        className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-auto min-h-[320px]">
                    {rawConfig}
                  </pre>
                )}
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Configuration Canvas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Schema fields</div>
                  <div className="text-xl font-semibold text-slate-900">{schemaFieldCount}</div>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Configured keys</div>
                  <div className="text-xl font-semibold text-slate-900">
                    {countTopLevelKeys(installedConfig)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Installation ID: <span className="font-mono">{installation.id}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h5 className="text-sm font-semibold text-slate-900 mb-2">Current keys</h5>
              {Object.keys(installedConfig).length > 0 ? (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {Object.keys(installedConfig).map((key) => (
                    <li
                      key={key}
                      className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono"
                    >
                      {key}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No keys are currently configured.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default PluginConfigurationModal;
