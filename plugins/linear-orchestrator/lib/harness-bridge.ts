/**
 * Harness Code ↔ Linear bridge adapter.
 *
 * This module owns the Harness side of the two-way sync:
 *  - REST client for Harness Code (apidocs.harness.io)
 *  - Webhook handler shape (delegates to handlers in commands/harness-sync.md)
 *  - Git Experience integrations
 *  - Custom Approval gateway
 *
 * The bridge is intentionally framework-agnostic — wire it to your HTTP layer of choice.
 */

import { TokenBucket } from "./rate-limit.js";

export interface HarnessConfig {
  baseUrl?: string;             // default https://app.harness.io
  apiToken: string;
  accountId: string;
  orgId?: string;
  projectId?: string;
}

export interface HarnessPullRequest {
  number: number;
  title: string;
  body?: string;
  state: "open" | "closed" | "merged" | "draft";
  url: string;
  branch: string;
  baseBranch: string;
  author: { id: string; email?: string };
  labels: string[];
  repo: string;
}

export interface HarnessDeployment {
  id: string;
  pipelineId: string;
  status: "running" | "success" | "failed" | "aborted";
  environment: string;
  service: string;
  startedAt: string;
  endedAt?: string;
  artifactRefs?: string[];
}

export class HarnessClient {
  private bucket = new TokenBucket({ capacity: 50, refillRate: 5 });
  private baseUrl: string;

  constructor(private cfg: HarnessConfig) {
    this.baseUrl = cfg.baseUrl ?? "https://app.harness.io";
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    await this.bucket.take(1);
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "x-api-key": this.cfg.apiToken,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Harness ${res.status} ${path}: ${text}`);
    }
    return (await res.json()) as T;
  }

  // ---- Pull requests ----

  async getPullRequest(repo: string, number: number): Promise<HarnessPullRequest> {
    return this.req<HarnessPullRequest>(
      `/code/api/v1/repos/${encodeURIComponent(repo)}/pullreq/${number}?accountIdentifier=${this.cfg.accountId}`
    );
  }

  async addLabel(repo: string, number: number, label: string): Promise<void> {
    await this.req(
      `/code/api/v1/repos/${encodeURIComponent(repo)}/pullreq/${number}/labels?accountIdentifier=${this.cfg.accountId}`,
      { method: "POST", body: JSON.stringify({ key: label }) }
    );
  }

  async createBranch(repo: string, name: string, fromBranch = "main"): Promise<void> {
    await this.req(
      `/code/api/v1/repos/${encodeURIComponent(repo)}/branches?accountIdentifier=${this.cfg.accountId}`,
      { method: "POST", body: JSON.stringify({ name, target: fromBranch }) }
    );
  }

  async commentOnPR(repo: string, number: number, body: string): Promise<void> {
    await this.req(
      `/code/api/v1/repos/${encodeURIComponent(repo)}/pullreq/${number}/comments?accountIdentifier=${this.cfg.accountId}`,
      { method: "POST", body: JSON.stringify({ text: body }) }
    );
  }

  // ---- Deployments ----

  async getDeployment(deploymentId: string): Promise<HarnessDeployment> {
    return this.req<HarnessDeployment>(
      `/pipeline/api/pipelines/execution/v2/${deploymentId}?accountIdentifier=${this.cfg.accountId}`
    );
  }

  // ---- Custom approvals ----

  async respondToCustomApproval(
    executionId: string,
    decision: "approved" | "rejected",
    reason?: string
  ): Promise<void> {
    await this.req(
      `/pipeline/api/pipelines/execution/${executionId}/customApproval?accountIdentifier=${this.cfg.accountId}`,
      { method: "POST", body: JSON.stringify({ decision, reason }) }
    );
  }

  // ---- Tags ----

  async tagEntity(
    entityType: "pipeline" | "service" | "environment" | "connector",
    entityId: string,
    tags: Record<string, string>
  ): Promise<void> {
    await this.req(
      `/ng/api/${entityType}s/${entityId}/tags?accountIdentifier=${this.cfg.accountId}`,
      { method: "PATCH", body: JSON.stringify({ tags }) }
    );
  }

  // ---- Triggers ----

  async createTrigger(yaml: string): Promise<{ identifier: string }> {
    return this.req<{ identifier: string }>(
      `/pipeline/api/triggers?accountIdentifier=${this.cfg.accountId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/yaml" },
        body: yaml,
      }
    );
  }

  // ---- Connectors via YAML ----

  async createConnectorFromYaml(yaml: string): Promise<void> {
    await this.req(
      `/ng/api/connectors?accountIdentifier=${this.cfg.accountId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/yaml" },
        body: yaml,
      }
    );
  }

  // ---- API keys / JWT ----

  async listApiKeys(scope: "account" | "org" | "project"): Promise<{ identifier: string; expiresAt?: string }[]> {
    const path = `/ng/api/api-keys?accountIdentifier=${this.cfg.accountId}&scope=${scope}`;
    return this.req<{ identifier: string; expiresAt?: string }[]>(path);
  }
}

/** Extract Linear issue keys (e.g. ENG-123) from arbitrary text. */
export function extractLinearKeys(text: string): string[] {
  return Array.from(new Set(text.match(/[A-Z][A-Z0-9]+-\d+/g) ?? []));
}
