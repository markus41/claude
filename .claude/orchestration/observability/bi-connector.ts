/**
 * BI Connector
 *
 * Establishes data export functionality for external BI tools and analytics platforms
 * to streamline reporting workflows and improve data accessibility.
 */

import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import { BIExport, ExportExecution, ExportFormat, AnalyticsQuery, QueryResult } from './types.js';
import { AnalyticsEngine } from './analytics-engine.js';

export class BIConnector {
  private db: Database.Database;
  private analyticsEngine: AnalyticsEngine;
  private exportTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.analyticsEngine = new AnalyticsEngine(dbPath);
  }

  /**
   * Start scheduled export processing
   */
  start(checkIntervalSeconds = 60): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleExports(checkIntervalSeconds);
  }

  /**
   * Stop scheduled export processing
   */
  stop(): void {
    if (this.exportTimer) {
      clearTimeout(this.exportTimer);
      this.exportTimer = null;
    }
    this.isRunning = false;
  }

  private scheduleExports(intervalSeconds: number): void {
    if (!this.isRunning) return;

    this.exportTimer = setTimeout(() => {
      this.processScheduledExports().catch(err => console.error('Export processing error:', err))
        .finally(() => this.scheduleExports(intervalSeconds));
    }, intervalSeconds * 1000);
  }

  /**
   * Process all due scheduled exports
   */
  private async processScheduledExports(): Promise<void> {
    const dueExports = this.getDueExports();

    for (const exportJob of dueExports) {
      try {
        await this.executeExport(exportJob.id);
      } catch (error) {
        console.error(`Error executing export ${exportJob.id}:`, error);
      }
    }
  }

  /**
   * Get exports that are due for execution
   */
  private getDueExports(): BIExport[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM bi_exports
      WHERE status = 'active'
        AND export_type = 'scheduled'
        AND (next_run_at IS NULL OR next_run_at <= datetime('now'))
    `).all() as any[];

    return rows.map(row => this.rowToExport(row));
  }

  /**
   * Execute a single export job
   */
  async executeExport(exportId: string, manualQuery?: AnalyticsQuery): Promise<ExportExecution> {
    const exportJob = this.getExport(exportId);
    if (!exportJob) {
      throw new Error(`Export not found: ${exportId}`);
    }

    const execution: Partial<ExportExecution> = {
      exportId,
      startedAt: new Date(),
      status: 'running',
      rowsExported: 0,
    };

    // Record execution start
    const result = this.db.prepare(`
      INSERT INTO bi_export_history (
        export_id, started_at, status, rows_exported
      ) VALUES (?, ?, ?, ?)
    `).run(
      execution.exportId,
      execution.startedAt!.toISOString(),
      execution.status,
      execution.rowsExported
    );

    const executionId = result.lastInsertRowid as number;

    try {
      // Get data
      const query = manualQuery || this.getExportQuery(exportJob);
      const queryResult = await this.analyticsEngine.executeQuery(query);

      // Export data
      const filePath = await this.exportData(exportJob, queryResult);

      // Get file size
      const stats = await fs.stat(filePath);

      // Update execution record
      const completedAt = new Date();
      const executionTimeMs = completedAt.getTime() - execution.startedAt!.getTime();

      this.db.prepare(`
        UPDATE bi_export_history
        SET completed_at = ?,
            status = 'success',
            rows_exported = ?,
            file_path = ?,
            file_size_bytes = ?,
            execution_time_ms = ?
        WHERE id = ?
      `).run(
        completedAt.toISOString(),
        queryResult.rowCount,
        filePath,
        stats.size,
        executionTimeMs,
        executionId
      );

      // Update export job
      this.updateExportJob(exportJob);

      return {
        ...execution,
        id: executionId,
        completedAt,
        status: 'success',
        rowsExported: queryResult.rowCount,
        filePath,
        fileSizeBytes: stats.size,
        executionTimeMs,
      } as ExportExecution;
    } catch (error) {
      // Record failure
      this.db.prepare(`
        UPDATE bi_export_history
        SET status = 'failed',
            error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        error instanceof Error ? error.message : String(error),
        executionId
      );

      throw error;
    }
  }

  /**
   * Export data in specified format
   */
  private async exportData(exportJob: BIExport, queryResult: QueryResult): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${exportJob.name}_${timestamp}.${exportJob.format}`;
    const filePath = `/tmp/${filename}`; // Customize based on destination config

    switch (exportJob.format) {
      case 'csv':
        await this.exportToCSV(filePath, queryResult);
        break;
      case 'json':
        await this.exportToJSON(filePath, queryResult);
        break;
      case 'excel':
        await this.exportToExcel(filePath, queryResult);
        break;
      case 'parquet':
        await this.exportToParquet(filePath, queryResult);
        break;
      default:
        throw new Error(`Unsupported export format: ${exportJob.format}`);
    }

    return filePath;
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(filePath: string, queryResult: QueryResult): Promise<void> {
    const stream = createWriteStream(filePath);

    // Write header
    stream.write('timestamp,value,labels\n');

    // Write data
    for (const point of queryResult.data) {
      const labels = point.labels ? JSON.stringify(point.labels).replace(/"/g, '""') : '';
      stream.write(`${point.timestamp.toISOString()},${point.value},"${labels}"\n`);
    }

    stream.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(filePath: string, queryResult: QueryResult): Promise<void> {
    const data = {
      query: queryResult.query,
      data: queryResult.data,
      metadata: {
        generatedAt: queryResult.generatedAt,
        rowCount: queryResult.rowCount,
        executionTimeMs: queryResult.executionTimeMs,
        cached: queryResult.cached,
      },
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Export to Excel format (simplified - requires additional library)
   */
  private async exportToExcel(filePath: string, queryResult: QueryResult): Promise<void> {
    // Placeholder - would require library like 'exceljs'
    console.warn('Excel export requires additional library implementation');
    await this.exportToCSV(filePath.replace('.excel', '.csv'), queryResult);
  }

  /**
   * Export to Parquet format (simplified - requires additional library)
   */
  private async exportToParquet(filePath: string, queryResult: QueryResult): Promise<void> {
    // Placeholder - would require library like 'parquetjs'
    console.warn('Parquet export requires additional library implementation');
    await this.exportToJSON(filePath.replace('.parquet', '.json'), queryResult);
  }

  /**
   * Get query for export job
   */
  private getExportQuery(exportJob: BIExport): AnalyticsQuery {
    if (exportJob.queryDefinition) {
      return exportJob.queryDefinition;
    }

    if (exportJob.queryId) {
      const row = this.db.prepare('SELECT * FROM analytics_queries WHERE id = ?').get(exportJob.queryId) as any;
      if (row) {
        return {
          metrics: JSON.parse(row.metrics),
          dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
          filters: row.filters ? JSON.parse(row.filters) : undefined,
          timeRange: row.time_range_type === 'relative'
            ? { type: 'relative', value: row.time_range_value }
            : { type: 'absolute', ...JSON.parse(row.time_range_value) },
          granularity: row.granularity,
          aggregations: row.aggregations ? JSON.parse(row.aggregations) : undefined,
          orderBy: row.order_by ? JSON.parse(row.order_by) : undefined,
          limit: row.limit_rows,
        };
      }
    }

    throw new Error('No query definition found for export');
  }

  /**
   * Update export job after execution
   */
  private updateExportJob(exportJob: BIExport): void {
    const nextRun = exportJob.scheduleCron
      ? this.calculateNextRun(exportJob.scheduleCron)
      : null;

    this.db.prepare(`
      UPDATE bi_exports
      SET last_run_at = CURRENT_TIMESTAMP,
          next_run_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nextRun ? nextRun.toISOString() : null,
      exportJob.id
    );
  }

  /**
   * Calculate next run time from cron expression (simplified)
   */
  private calculateNextRun(cronExpression: string): Date {
    // Simplified - would need proper cron parser in production
    // For now, assume hourly: 0 * * * *
    return new Date(Date.now() + 3600000); // +1 hour
  }

  /**
   * Create a new export job
   */
  createExport(exportDef: Omit<BIExport, 'id' | 'createdAt' | 'updatedAt'>): BIExport {
    const id = `export_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    this.db.prepare(`
      INSERT INTO bi_exports (
        id, name, description, export_type, format, query_id, query_definition,
        schedule_cron, next_run_at, destination_type, destination_config, status,
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      exportDef.name,
      exportDef.description,
      exportDef.exportType,
      exportDef.format,
      exportDef.queryId,
      exportDef.queryDefinition ? JSON.stringify(exportDef.queryDefinition) : null,
      exportDef.scheduleCron,
      exportDef.nextRunAt ? exportDef.nextRunAt.toISOString() : null,
      exportDef.destination.type,
      JSON.stringify(exportDef.destination.config),
      exportDef.status,
      now.toISOString(),
      now.toISOString(),
      exportDef.createdBy
    );

    return {
      ...exportDef,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get export job by ID
   */
  private getExport(id: string): BIExport | null {
    const row = this.db.prepare('SELECT * FROM bi_exports WHERE id = ?').get(id) as any;
    return row ? this.rowToExport(row) : null;
  }

  /**
   * Convert database row to BIExport object
   */
  private rowToExport(row: any): BIExport {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      exportType: row.export_type,
      format: row.format,
      queryId: row.query_id,
      queryDefinition: row.query_definition ? JSON.parse(row.query_definition) : undefined,
      scheduleCron: row.schedule_cron,
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
      nextRunAt: row.next_run_at ? new Date(row.next_run_at) : undefined,
      destination: {
        type: row.destination_type,
        config: JSON.parse(row.destination_config),
      },
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }

  close(): void {
    this.stop();
    this.analyticsEngine.close();
    this.db.close();
  }
}
