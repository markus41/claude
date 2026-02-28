/**
 * Cowork Marketplace Type Definitions
 *
 * Types for the Claude Cowork marketplace - a platform for discovering,
 * sharing, and installing cowork templates, agent configurations,
 * collaborative workflows, and session blueprints.
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

export type CoworkItemType =
  | 'template'
  | 'workflow'
  | 'agent_config'
  | 'skill_pack'
  | 'session_blueprint';

export type CoworkCategory =
  | 'engineering'
  | 'design'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'marketing'
  | 'legal'
  | 'research'
  | 'data'
  | 'devops'
  | 'security'
  | 'general';

export type CoworkDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CoworkItemStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'featured'
  | 'deprecated';

export type TrustGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type SessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

export interface CoworkAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  organization?: string;
  isVerified: boolean;
  itemCount: number;
}

export interface CoworkTrustScore {
  overall: number;
  grade: TrustGrade;
  signed: number;
  reputation: number;
  codeAnalysis: number;
  community: number;
  freshness: number;
}

export interface CoworkDependency {
  name: string;
  version: string;
  type: 'plugin' | 'skill' | 'mcp_server' | 'tool';
  optional: boolean;
}

export interface CoworkCapability {
  name: string;
  description: string;
  tools: string[];
}

/** Maps a cowork item to the underlying plugin agents, skills, and commands */
export interface PluginBinding {
  pluginName: string;
  pluginVersion: string;
  agents: string[];
  skills: string[];
  commands: string[];
  mcpServers?: string[];
}

/** A curated collection of cowork items grouped by use case */
export interface CoworkCollection {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  items: CoworkItem[];
  tags: string[];
}

export interface CoworkItem {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  longDescription?: string;
  type: CoworkItemType;
  category: CoworkCategory;
  difficulty: CoworkDifficulty;
  status: CoworkItemStatus;
  author: CoworkAuthor;

  // Content
  tags: string[];
  capabilities: CoworkCapability[];
  dependencies: CoworkDependency[];
  estimatedDuration?: string;
  maxParallelAgents?: number;

  // Statistics
  installCount: number;
  activeUsers: number;
  averageRating: number;
  ratingCount: number;
  completionRate: number;
  avgSessionMinutes: number;

  // Trust & Verification
  trustScore: CoworkTrustScore;
  isOfficial: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  isCurated: boolean;

  // Plugin Integration
  pluginBindings: PluginBinding[];

  // URLs
  repositoryUrl?: string;
  documentationUrl?: string;
  iconUrl?: string;
  previewUrl?: string;

  // Timestamps
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Installation & Sessions
// ---------------------------------------------------------------------------

export interface CoworkInstallation {
  id: string;
  itemId: string;
  item: CoworkItem;
  installedVersion: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  lastUsedAt?: string;
  usageCount: number;
  installedAt: string;
}

export interface CoworkSession {
  id: string;
  itemId: string;
  item: CoworkItem;
  status: SessionStatus;
  progress: number;
  currentStep?: string;
  activeAgents: number;
  tokensUsed: number;
  estimatedCost: number;
  outputs: CoworkSessionOutput[];
  startedAt: string;
  completedAt?: string;
}

export interface CoworkSessionOutput {
  id: string;
  name: string;
  type: 'file' | 'report' | 'artifact' | 'data';
  path?: string;
  size?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface CoworkReview {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  title?: string;
  content?: string;
  isVerifiedUser: boolean;
  helpfulCount: number;
  usageContext?: string;
  createdAt: string;
}

export interface CoworkReviewSubmission {
  rating: number;
  title?: string;
  content?: string;
  usageContext?: string;
}

// ---------------------------------------------------------------------------
// Search & Filtering
// ---------------------------------------------------------------------------

export interface CoworkSearchFilters {
  query?: string;
  type?: CoworkItemType;
  category?: CoworkCategory;
  difficulty?: CoworkDifficulty;
  tags?: string[];
  isVerified?: boolean;
  isOfficial?: boolean;
  isCurated?: boolean;
  minRating?: number;
  minTrustGrade?: TrustGrade;
  maxDuration?: string;
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'newest' | 'trending' | 'completion_rate';
}

export interface CoworkSearchResult {
  items: CoworkItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface CoworkMetrics {
  itemId: string;
  totalSessions: number;
  completedSessions: number;
  avgDurationMinutes: number;
  avgAgentsUsed: number;
  totalTokensUsed: number;
  estimatedTotalCost: number;
  completionRate: number;
  userSatisfaction: number;
  periodStart: string;
  periodEnd: string;
}

export type CoworkMetricsPeriod = 'day' | 'week' | 'month';

// ---------------------------------------------------------------------------
// UI Metadata
// ---------------------------------------------------------------------------

export const COWORK_ITEM_TYPE_INFO: Record<CoworkItemType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  template: {
    label: 'Template',
    description: 'Pre-built cowork session templates for common tasks',
    icon: 'FileText',
    color: 'blue',
  },
  workflow: {
    label: 'Workflow',
    description: 'Multi-step automated workflows with agent coordination',
    icon: 'GitBranch',
    color: 'green',
  },
  agent_config: {
    label: 'Agent Config',
    description: 'Specialized agent configurations for domain expertise',
    icon: 'Bot',
    color: 'purple',
  },
  skill_pack: {
    label: 'Skill Pack',
    description: 'Bundled skills and capabilities for cowork sessions',
    icon: 'Package',
    color: 'orange',
  },
  session_blueprint: {
    label: 'Blueprint',
    description: 'Complete session blueprints with inputs, agents, and outputs',
    icon: 'Map',
    color: 'teal',
  },
};

export const COWORK_CATEGORIES: Record<CoworkCategory, {
  label: string;
  description: string;
}> = {
  engineering: { label: 'Engineering', description: 'Software development and architecture' },
  design: { label: 'Design', description: 'UI/UX design and creative work' },
  operations: { label: 'Operations', description: 'Business operations and process management' },
  finance: { label: 'Finance', description: 'Financial analysis and reporting' },
  hr: { label: 'HR', description: 'Human resources and people management' },
  marketing: { label: 'Marketing', description: 'Marketing strategy and content creation' },
  legal: { label: 'Legal', description: 'Legal review and compliance' },
  research: { label: 'Research', description: 'Research and knowledge synthesis' },
  data: { label: 'Data', description: 'Data analysis and visualization' },
  devops: { label: 'DevOps', description: 'Infrastructure and deployment automation' },
  security: { label: 'Security', description: 'Security auditing and compliance' },
  general: { label: 'General', description: 'Cross-functional and general purpose' },
};

export const COWORK_DIFFICULTY_INFO: Record<CoworkDifficulty, {
  label: string;
  color: string;
}> = {
  beginner: { label: 'Beginner', color: 'green' },
  intermediate: { label: 'Intermediate', color: 'blue' },
  advanced: { label: 'Advanced', color: 'orange' },
  expert: { label: 'Expert', color: 'red' },
};

export const TRUST_GRADE_INFO: Record<TrustGrade, {
  label: string;
  color: string;
  minScore: number;
}> = {
  A: { label: 'Excellent', color: 'green', minScore: 90 },
  B: { label: 'Good', color: 'blue', minScore: 80 },
  C: { label: 'Adequate', color: 'yellow', minScore: 60 },
  D: { label: 'Low', color: 'orange', minScore: 40 },
  F: { label: 'Untrusted', color: 'red', minScore: 0 },
};
