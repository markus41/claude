/**
 * Dashboard Builder
 *
 * Establishes dynamic dashboard creation with Grafana-compatible export to
 * streamline visualization workflows and improve operational dashboards.
 */

import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import { Dashboard, DashboardPanel, GrafanaDashboard, GrafanaPanel, GrafanaTarget } from './types.js';

export class DashboardBuilder {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Create a new dashboard
   */
  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
    const id = `dash_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    // Insert dashboard
    this.db.prepare(`
      INSERT INTO dashboards (
        id, name, description, tags, panels, refresh_interval,
        time_range_type, time_range_value, layout, created_at, updated_at,
        created_by, is_default, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      dashboard.name,
      dashboard.description,
      JSON.stringify(dashboard.tags || []),
      JSON.stringify([]), // Panels stored separately
      dashboard.refreshInterval,
      dashboard.timeRange.type,
      dashboard.timeRange.type === 'relative' ? dashboard.timeRange.value : JSON.stringify(dashboard.timeRange),
      JSON.stringify(dashboard.layout),
      now.toISOString(),
      now.toISOString(),
      dashboard.createdBy,
      dashboard.isDefault ? 1 : 0,
      dashboard.isPublic ? 1 : 0
    );

    // Insert panels
    for (const panel of dashboard.panels) {
      this.addPanel(id, panel);
    }

    return {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Add panel to dashboard
   */
  addPanel(dashboardId: string, panel: Omit<DashboardPanel, 'id'>): DashboardPanel {
    const id = `panel_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    this.db.prepare(`
      INSERT INTO dashboard_panels (
        id, dashboard_id, title, panel_type, query, visualization_config,
        position_x, position_y, width, height, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      dashboardId,
      panel.title,
      panel.type,
      JSON.stringify(panel.query),
      JSON.stringify(panel.visualization),
      panel.position.x,
      panel.position.y,
      panel.position.w,
      panel.position.h,
      panel.sortOrder || 0,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { ...panel, id } as DashboardPanel;
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(id: string): Dashboard | null {
    const row = this.db.prepare('SELECT * FROM dashboards WHERE id = ?').get(id) as any;
    if (!row) return null;

    const panels = this.getPanels(id);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tags: JSON.parse(row.tags || '[]'),
      panels,
      refreshInterval: row.refresh_interval,
      timeRange: row.time_range_type === 'relative'
        ? { type: 'relative', value: row.time_range_value }
        : { type: 'absolute', ...JSON.parse(row.time_range_value) },
      layout: JSON.parse(row.layout || 'null'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      isDefault: row.is_default === 1,
      isPublic: row.is_public === 1,
    };
  }

  /**
   * Get panels for a dashboard
   */
  private getPanels(dashboardId: string): DashboardPanel[] {
    const rows = this.db.prepare(`
      SELECT * FROM dashboard_panels
      WHERE dashboard_id = ?
      ORDER BY sort_order ASC
    `).all(dashboardId) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.panel_type,
      query: JSON.parse(row.query),
      visualization: JSON.parse(row.visualization_config),
      position: {
        x: row.position_x,
        y: row.position_y,
        w: row.width,
        h: row.height,
      },
      sortOrder: row.sort_order,
    }));
  }

  /**
   * Export dashboard to Grafana JSON format
   */
  async exportToGrafana(dashboardId: string, outputPath?: string): Promise<GrafanaDashboard> {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    const grafanaDashboard: GrafanaDashboard = {
      dashboard: {
        uid: dashboard.id,
        title: dashboard.name,
        tags: dashboard.tags || [],
        timezone: 'browser',
        panels: this.convertPanelsToGrafana(dashboard.panels),
        schemaVersion: 36,
        version: 1,
        refresh: `${dashboard.refreshInterval}s`,
        time: this.convertTimeRangeToGrafana(dashboard.timeRange),
      },
      overwrite: true,
    };

    if (outputPath) {
      await fs.writeFile(outputPath, JSON.stringify(grafanaDashboard, null, 2));
    }

    return grafanaDashboard;
  }

  /**
   * Convert panels to Grafana format
   */
  private convertPanelsToGrafana(panels: DashboardPanel[]): GrafanaPanel[] {
    return panels.map((panel, index) => ({
      id: index + 1,
      title: panel.title,
      type: this.mapPanelType(panel.type),
      targets: this.convertQueryToGrafanaTarget(panel.query),
      gridPos: {
        x: panel.position.x,
        y: panel.position.y,
        w: panel.position.w,
        h: panel.position.h,
      },
      options: panel.visualization,
      fieldConfig: {
        defaults: {
          unit: panel.visualization.unit,
          decimals: panel.visualization.decimals,
          thresholds: {
            mode: 'absolute',
            steps: panel.visualization.thresholds || [],
          },
        },
        overrides: [],
      },
    }));
  }

  /**
   * Map panel type to Grafana type
   */
  private mapPanelType(type: string): string {
    const typeMap: Record<string, string> = {
      timeseries: 'timeseries',
      gauge: 'gauge',
      stat: 'stat',
      table: 'table',
      heatmap: 'heatmap',
      pie: 'piechart',
      bar: 'barchart',
    };
    return typeMap[type] || 'timeseries';
  }

  /**
   * Convert query to Grafana target format
   */
  private convertQueryToGrafanaTarget(query: any): GrafanaTarget[] {
    return query.metrics.map((metric: string, index: number) => ({
      expr: metric,
      refId: String.fromCharCode(65 + index), // A, B, C, ...
      legendFormat: metric,
    }));
  }

  /**
   * Convert time range to Grafana format
   */
  private convertTimeRangeToGrafana(timeRange: any): { from: string; to: string } {
    if (timeRange.type === 'relative') {
      return {
        from: `now-${timeRange.value}`,
        to: 'now',
      };
    }

    return {
      from: new Date(timeRange.start).toISOString(),
      to: new Date(timeRange.end).toISOString(),
    };
  }

  /**
   * List all dashboards
   */
  listDashboards(): Array<{
    id: string;
    name: string;
    description?: string;
    panelCount: number;
    isDefault: boolean;
  }> {
    const rows = this.db.prepare(`
      SELECT
        d.id,
        d.name,
        d.description,
        d.is_default,
        COUNT(dp.id) as panel_count
      FROM dashboards d
      LEFT JOIN dashboard_panels dp ON d.id = dp.dashboard_id
      GROUP BY d.id
      ORDER BY d.is_default DESC, d.updated_at DESC
    `).all() as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      panelCount: row.panel_count,
      isDefault: row.is_default === 1,
    }));
  }

  close(): void {
    this.db.close();
  }
}
