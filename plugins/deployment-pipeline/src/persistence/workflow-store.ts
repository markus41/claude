/**
 * Workflow Persistence Store
 *
 * Provides file-based persistence for deployment workflow state
 * with support for crash recovery and audit logging.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DeploymentContext, DeploymentStateMachine } from '../workflow/state-machine';

export interface WorkflowStoreConfig {
  storagePath: string;
  format: 'json' | 'yaml';
  enableBackup: boolean;
  maxBackups: number;
}

const DEFAULT_CONFIG: WorkflowStoreConfig = {
  storagePath: '.claude/workflow-state',
  format: 'json',
  enableBackup: true,
  maxBackups: 10,
};

/**
 * WorkflowStore
 * Manages persistence of deployment workflow state
 */
export class WorkflowStore {
  private config: WorkflowStoreConfig;
  private basePath: string;

  constructor(config: Partial<WorkflowStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.basePath = path.resolve(process.cwd(), this.config.storagePath);
    this.ensureDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureDirectory(): void {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    const backupPath = path.join(this.basePath, 'backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
  }

  /**
   * Get file path for deployment
   */
  private getFilePath(deploymentId: string): string {
    return path.join(this.basePath, `${deploymentId}.${this.config.format}`);
  }

  /**
   * Save deployment state
   */
  async save(stateMachine: DeploymentStateMachine): Promise<void> {
    const context = stateMachine.deploymentContext;
    const filePath = this.getFilePath(context.id);

    // Create backup if enabled
    if (this.config.enableBackup && fs.existsSync(filePath)) {
      await this.createBackup(context.id);
    }

    const content = stateMachine.serialize();
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Load deployment state
   */
  async load(deploymentId: string): Promise<DeploymentStateMachine | null> {
    const filePath = this.getFilePath(deploymentId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return DeploymentStateMachine.deserialize(content);
  }

  /**
   * List all deployments
   */
  async list(): Promise<DeploymentContext[]> {
    const files = fs.readdirSync(this.basePath)
      .filter(f => f.endsWith(`.${this.config.format}`) && !f.startsWith('.'));

    const deployments: DeploymentContext[] = [];

    for (const file of files) {
      const filePath = path.join(this.basePath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const context = JSON.parse(content) as DeploymentContext;
      deployments.push(context);
    }

    return deployments.sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * Get active deployments (non-terminal states)
   */
  async getActive(): Promise<DeploymentContext[]> {
    const all = await this.list();
    const terminalStates = ['completed', 'failed', 'rolled-back'];
    return all.filter(d => !terminalStates.includes(d.currentState));
  }

  /**
   * Delete deployment state
   */
  async delete(deploymentId: string): Promise<boolean> {
    const filePath = this.getFilePath(deploymentId);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Archive before delete
    await this.createBackup(deploymentId);
    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * Create backup of deployment state
   */
  private async createBackup(deploymentId: string): Promise<void> {
    const filePath = this.getFilePath(deploymentId);

    if (!fs.existsSync(filePath)) {
      return;
    }

    const backupDir = path.join(this.basePath, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${deploymentId}-${timestamp}.${this.config.format}`);

    fs.copyFileSync(filePath, backupPath);

    // Cleanup old backups
    await this.cleanupBackups(deploymentId);
  }

  /**
   * Cleanup old backups keeping only maxBackups
   */
  private async cleanupBackups(deploymentId: string): Promise<void> {
    const backupDir = path.join(this.basePath, 'backups');
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(deploymentId))
      .sort()
      .reverse();

    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);
      for (const backup of toDelete) {
        fs.unlinkSync(path.join(backupDir, backup));
      }
    }
  }

  /**
   * Recover from latest backup
   */
  async recover(deploymentId: string): Promise<DeploymentStateMachine | null> {
    const backupDir = path.join(this.basePath, 'backups');
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(deploymentId))
      .sort()
      .reverse();

    if (backups.length === 0) {
      return null;
    }

    const latestBackup = path.join(backupDir, backups[0]);
    const content = fs.readFileSync(latestBackup, 'utf-8');
    return DeploymentStateMachine.deserialize(content);
  }
}

// Export singleton instance
export const workflowStore = new WorkflowStore();
