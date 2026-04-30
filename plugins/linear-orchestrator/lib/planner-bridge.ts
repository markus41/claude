/**
 * Microsoft Planner ↔ Linear bridge adapter via Microsoft Graph delta queries.
 */

import { TokenBucket } from "./rate-limit.js";

export interface GraphConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  planId: string;
  bucketId: string;
  percentComplete: number;
  priority: number;
  dueDateTime: string | null;
  assignments: Record<string, { orderHint: string }>;
  appliedCategories: Record<string, boolean>;
  "@odata.etag"?: string;
}

export interface PlannerTaskDetails {
  description: string;
  checklist: Record<string, { title: string; isChecked: boolean; orderHint: string }>;
  references: Record<string, { alias: string; type: string; previewPriority: string }>;
}

export interface DeltaResult<T> {
  value: T[];
  "@odata.deltaLink"?: string;
  "@odata.nextLink"?: string;
}

export class GraphPlannerClient {
  private bucket = new TokenBucket({ capacity: 600, refillRate: 20 });
  private accessToken: string | null = null;
  private accessTokenExpiry = 0;

  constructor(private cfg: GraphConfig) {}

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiry - 60_000) return this.accessToken;
    const tokenUrl = `https://login.microsoftonline.com/${this.cfg.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default",
    });
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Graph token failed: ${res.status} ${await res.text()}`);
    const json: { access_token: string; expires_in: number } = await res.json();
    this.accessToken = json.access_token;
    this.accessTokenExpiry = Date.now() + json.expires_in * 1000;
    return this.accessToken;
  }

  private async req<T>(url: string, init: RequestInit = {}): Promise<T> {
    await this.bucket.take(1);
    const token = await this.getToken();
    const res = await fetch(url.startsWith("http") ? url : `https://graph.microsoft.com/v1.0${url}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 429 || res.status === 503) {
      const retry = Number(res.headers.get("Retry-After") ?? 30);
      await sleep(retry * 1000);
      return this.req<T>(url, init);
    }
    if (!res.ok) throw new Error(`Graph ${res.status} ${url}: ${await res.text()}`);
    return res.status === 204 ? (undefined as unknown as T) : ((await res.json()) as T);
  }

  // ---- Plans + tasks ----

  async listPlanTasks(planId: string): Promise<PlannerTask[]> {
    const out: PlannerTask[] = [];
    let next: string | undefined = `/planner/plans/${planId}/tasks`;
    while (next) {
      const page: DeltaResult<PlannerTask> = await this.req(next);
      out.push(...page.value);
      next = page["@odata.nextLink"];
    }
    return out;
  }

  async deltaPlanTasks(
    planId: string,
    deltaLink?: string
  ): Promise<{ tasks: PlannerTask[]; deltaLink?: string }> {
    const url = deltaLink ?? `/planner/plans/${planId}/tasks/delta`;
    const out: PlannerTask[] = [];
    let next = url;
    let finalDelta: string | undefined;
    while (next) {
      const page: DeltaResult<PlannerTask> = await this.req(next);
      out.push(...page.value);
      if (page["@odata.deltaLink"]) finalDelta = page["@odata.deltaLink"];
      next = page["@odata.nextLink"] ?? "";
    }
    return { tasks: out, deltaLink: finalDelta };
  }

  async createTask(input: {
    planId: string;
    bucketId: string;
    title: string;
    assignments?: Record<string, { orderHint: string; "@odata.type": "#microsoft.graph.plannerAssignment" }>;
    priority?: number;
    dueDateTime?: string;
  }): Promise<PlannerTask> {
    return this.req<PlannerTask>(`/planner/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateTask(taskId: string, etag: string, patch: Partial<PlannerTask>): Promise<void> {
    await this.req(`/planner/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "If-Match": etag },
      body: JSON.stringify(patch),
    });
  }

  async getTaskDetails(taskId: string): Promise<PlannerTaskDetails & { "@odata.etag": string }> {
    return this.req(`/planner/tasks/${taskId}/details`);
  }

  async updateTaskDetails(
    taskId: string,
    etag: string,
    patch: Partial<PlannerTaskDetails>
  ): Promise<void> {
    await this.req(`/planner/tasks/${taskId}/details`, {
      method: "PATCH",
      headers: { "If-Match": etag },
      body: JSON.stringify(patch),
    });
  }

  // ---- Users ----

  async findUserByEmail(email: string): Promise<{ id: string; mail: string } | null> {
    const res: { value: { id: string; mail: string }[] } = await this.req(
      `/users?$filter=mail eq '${encodeURIComponent(email)}'&$select=id,mail`
    );
    return res.value[0] ?? null;
  }

  // ---- OneDrive (for attachment mirror) ----

  async uploadDriveItem(
    driveId: string,
    path: string,
    content: Buffer,
    contentType: string
  ): Promise<{ id: string; webUrl: string }> {
    return this.req(`/drives/${driveId}/root:/${path}:/content`, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: content,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
