/**
 * Harness platform type definitions
 *
 * Provides type-safe interfaces for Harness CI/CD operations including
 * pipelines, templates, stages, and steps to streamline deployment automation.
 */

/**
 * Harness template types
 */
export type HarnessTemplateType = 'Step' | 'Stage' | 'Pipeline' | 'StepGroup' | 'SecretManager';

/**
 * Harness template scope
 */
export type HarnessTemplateScope = 'project' | 'org' | 'account';

/**
 * Pipeline deployment strategy types
 */
export type DeploymentStrategy =
  | 'Rolling'
  | 'Canary'
  | 'BlueGreen'
  | 'Basic'
  | 'Custom';

/**
 * Infrastructure types supported
 */
export type InfrastructureType =
  | 'KubernetesDirect'
  | 'KubernetesGcp'
  | 'KubernetesAzure'
  | 'KubernetesAws'
  | 'ServerlessAwsLambda'
  | 'AzureWebApp'
  | 'ECS'
  | 'SSH'
  | 'WinRM'
  | 'Custom';

/**
 * Harness pipeline configuration
 */
export interface HarnessPipelineConfig {
  /** Pipeline name */
  name: string;
  /** Pipeline identifier (auto-generated if not specified) */
  identifier?: string;
  /** Organization identifier */
  orgIdentifier: string;
  /** Project identifier */
  projectIdentifier: string;
  /** Pipeline description */
  description?: string;
  /** Pipeline tags */
  tags?: Record<string, string>;
  /** Target repository for GitOps */
  repository?: RepositoryConfig;
  /** Pipeline stages */
  stages: HarnessStageConfig[];
  /** Pipeline variables */
  variables?: PipelineVariable[];
  /** Notification rules */
  notificationRules?: NotificationRule[];
  /** Pipeline properties */
  properties?: PipelineProperties;
}

/**
 * Repository configuration for GitOps
 */
export interface RepositoryConfig {
  /** Repository connector identifier */
  connectorRef: string;
  /** Repository name */
  repoName: string;
  /** Branch name */
  branch?: string;
  /** File path for pipeline YAML */
  filePath?: string;
}

/**
 * Pipeline properties
 */
export interface PipelineProperties {
  /** CI properties */
  ci?: CIProperties;
}

/**
 * CI-specific properties
 */
export interface CIProperties {
  /** Code base configuration */
  codebase?: CodebaseConfig;
}

/**
 * Codebase configuration
 */
export interface CodebaseConfig {
  /** Connector reference */
  connectorRef: string;
  /** Repository name */
  repoName: string;
  /** Build configuration */
  build: BuildConfig;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  /** Build type */
  type: 'branch' | 'tag' | 'PR';
  /** Spec details */
  spec: Record<string, unknown>;
}

/**
 * Harness stage configuration
 */
export interface HarnessStageConfig {
  /** Stage name */
  name: string;
  /** Stage identifier */
  identifier?: string;
  /** Stage type */
  type: StageType;
  /** Stage description */
  description?: string;
  /** Stage specification */
  spec: StageSpec;
  /** Failure strategy */
  failureStrategies?: FailureStrategy[];
  /** When condition */
  when?: StageWhenCondition;
  /** Variables */
  variables?: StageVariable[];
  /** Tags */
  tags?: Record<string, string>;
}

/**
 * Stage types
 */
export type StageType =
  | 'CI'
  | 'Deployment'
  | 'Approval'
  | 'Custom'
  | 'Pipeline'
  | 'FeatureFlag'
  | 'SecurityTests'
  | 'IACMTerraform'
  | 'IACMTerragrunt';

/**
 * Stage specification
 */
export interface StageSpec {
  /** CI stage spec */
  cloneCodebase?: boolean;
  /** Infrastructure */
  infrastructure?: Infrastructure;
  /** Service configuration */
  serviceConfig?: ServiceConfig;
  /** Execution */
  execution?: ExecutionConfig;
  /** Environment */
  environment?: EnvironmentConfig;
  /** Deployment type */
  deploymentType?: string;
}

/**
 * Infrastructure configuration
 */
export interface Infrastructure {
  /** Infrastructure type */
  type: InfrastructureType;
  /** Infrastructure spec */
  spec: InfrastructureSpec;
}

/**
 * Infrastructure specification
 */
export interface InfrastructureSpec {
  /** Connector reference */
  connectorRef?: string;
  /** Namespace (for Kubernetes) */
  namespace?: string;
  /** Release name (for Kubernetes) */
  releaseName?: string;
  /** Cluster */
  cluster?: string;
  /** Region */
  region?: string;
  /** Additional properties */
  [key: string]: unknown;
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  /** Service reference */
  serviceRef: string;
  /** Service inputs */
  serviceInputs?: Record<string, unknown>;
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  /** Execution steps */
  steps: HarnessStepConfig[];
  /** Rollback steps */
  rollbackSteps?: HarnessStepConfig[];
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  /** Environment reference */
  environmentRef: string;
  /** Deploy to all environments */
  deployToAll?: boolean;
  /** Infrastructure definitions */
  infrastructureDefinitions?: InfrastructureDefinition[];
}

/**
 * Infrastructure definition
 */
export interface InfrastructureDefinition {
  /** Identifier */
  identifier: string;
  /** Inputs */
  inputs?: Record<string, unknown>;
}

/**
 * Harness step configuration
 */
export interface HarnessStepConfig {
  /** Step name */
  name: string;
  /** Step identifier */
  identifier?: string;
  /** Step type */
  type: StepType;
  /** Step specification */
  spec: StepSpec;
  /** Timeout */
  timeout?: string;
  /** Failure strategy */
  failureStrategies?: FailureStrategy[];
  /** When condition */
  when?: StepWhenCondition;
}

/**
 * Step types available in Harness
 */
export type StepType =
  // CI Steps
  | 'Run'
  | 'RunTests'
  | 'Background'
  | 'BuildAndPushDockerRegistry'
  | 'BuildAndPushECR'
  | 'BuildAndPushGCR'
  | 'BuildAndPushACR'
  | 'Plugin'
  | 'RestoreCacheGCS'
  | 'SaveCacheGCS'
  | 'RestoreCacheS3'
  | 'SaveCacheS3'
  | 'GitClone'
  | 'ArtifactoryUpload'
  // CD Steps
  | 'ShellScript'
  | 'Http'
  | 'K8sRollingDeploy'
  | 'K8sRollingRollback'
  | 'K8sBlueGreenDeploy'
  | 'K8sCanaryDeploy'
  | 'K8sDelete'
  | 'K8sApply'
  | 'K8sBGSwapServices'
  | 'K8sCanaryDelete'
  | 'K8sScale'
  | 'TerraformPlan'
  | 'TerraformApply'
  | 'TerraformDestroy'
  | 'TerraformRollback'
  | 'HelmDeploy'
  | 'HelmRollback'
  // Approval Steps
  | 'HarnessApproval'
  | 'JiraApproval'
  | 'ServiceNowApproval'
  | 'CustomApproval'
  // Utility Steps
  | 'Wait'
  | 'Queue'
  | 'Barrier'
  // Template Step
  | 'Template';

/**
 * Step specification
 */
export interface StepSpec {
  /** Shell for Run steps */
  shell?: 'Bash' | 'Sh' | 'Pwsh' | 'Powershell';
  /** Command to run */
  command?: string;
  /** Script content */
  script?: string;
  /** Image for containerized steps */
  image?: string;
  /** Connector reference */
  connectorRef?: string;
  /** Working directory */
  workingDir?: string;
  /** Environment variables */
  envVariables?: Record<string, string>;
  /** Output variables */
  outputVariables?: OutputVariable[];
  /** Template reference (for Template step) */
  templateRef?: string;
  /** Template version label */
  versionLabel?: string;
  /** Template inputs */
  templateInputs?: Record<string, unknown>;
  /** URL for HTTP step */
  url?: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** HTTP headers */
  headers?: HttpHeader[];
  /** Request body */
  body?: string;
  /** Assertion */
  assertion?: string;
  /** Additional properties */
  [key: string]: unknown;
}

/**
 * Output variable definition
 */
export interface OutputVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'String' | 'Secret';
  /** Value expression */
  value?: string;
}

/**
 * HTTP header definition
 */
export interface HttpHeader {
  /** Header key */
  key: string;
  /** Header value */
  value: string;
}

/**
 * Failure strategy
 */
export interface FailureStrategy {
  /** On failure actions */
  onFailure: OnFailure;
}

/**
 * On failure configuration
 */
export interface OnFailure {
  /** Error types to match */
  errors: FailureErrorType[];
  /** Action to take */
  action: FailureAction;
}

/**
 * Failure error types
 */
export type FailureErrorType =
  | 'AllErrors'
  | 'Unknown'
  | 'Timeout'
  | 'Authentication'
  | 'Authorization'
  | 'Connectivity'
  | 'DelegateProvisioning'
  | 'Verification'
  | 'PolicyEvaluationFailure'
  | 'InputTimeoutError';

/**
 * Failure action
 */
export interface FailureAction {
  /** Action type */
  type: FailureActionType;
  /** Spec for retry */
  spec?: RetrySpec;
}

/**
 * Failure action types
 */
export type FailureActionType =
  | 'Ignore'
  | 'MarkAsSuccess'
  | 'Abort'
  | 'StageRollback'
  | 'PipelineRollback'
  | 'Retry'
  | 'ManualIntervention'
  | 'MarkAsFailure';

/**
 * Retry specification
 */
export interface RetrySpec {
  /** Retry count */
  retryCount: number;
  /** Retry intervals */
  retryIntervals: string[];
  /** On retry failure */
  onRetryFailure?: FailureAction;
}

/**
 * Stage when condition
 */
export interface StageWhenCondition {
  /** Pipeline status condition */
  pipelineStatus: 'Success' | 'Failure' | 'All';
  /** JEXL condition */
  condition?: string;
}

/**
 * Step when condition
 */
export interface StepWhenCondition {
  /** Stage status condition */
  stageStatus: 'Success' | 'Failure' | 'All';
  /** JEXL condition */
  condition?: string;
}

/**
 * Pipeline variable
 */
export interface PipelineVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'String' | 'Number' | 'Secret';
  /** Variable value */
  value?: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Required */
  required?: boolean;
}

/**
 * Stage variable
 */
export interface StageVariable extends PipelineVariable {
  /** Scope */
  scope?: 'stage' | 'pipeline';
}

/**
 * Notification rule
 */
export interface NotificationRule {
  /** Rule name */
  name: string;
  /** Pipeline events */
  pipelineEvents: PipelineEvent[];
  /** Notification method */
  notificationMethod: NotificationMethod;
  /** Enabled */
  enabled?: boolean;
}

/**
 * Pipeline events for notifications
 */
export type PipelineEvent =
  | 'AllEvents'
  | 'PipelineStart'
  | 'PipelineSuccess'
  | 'PipelineFailed'
  | 'PipelinePaused'
  | 'StageStart'
  | 'StageSuccess'
  | 'StageFailed'
  | 'StepFailed';

/**
 * Notification method
 */
export interface NotificationMethod {
  /** Method type */
  type: 'Slack' | 'Email' | 'PagerDuty' | 'MSTeams' | 'Webhook';
  /** Spec */
  spec: NotificationSpec;
}

/**
 * Notification specification
 */
export interface NotificationSpec {
  /** Webhook URL for Slack/Teams/Webhook */
  webhookUrl?: string;
  /** Email addresses */
  recipients?: string[];
  /** User groups */
  userGroups?: string[];
  /** Integration key for PagerDuty */
  integrationKey?: string;
}

/**
 * Harness template configuration
 */
export interface HarnessTemplateConfig {
  /** Template name */
  name: string;
  /** Template identifier */
  identifier?: string;
  /** Template type */
  type: HarnessTemplateType;
  /** Template scope */
  scope: HarnessTemplateScope;
  /** Organization identifier (for org/account scope) */
  orgIdentifier?: string;
  /** Project identifier (for project scope) */
  projectIdentifier?: string;
  /** Version label */
  versionLabel: string;
  /** Description */
  description?: string;
  /** Tags */
  tags?: Record<string, string>;
  /** Template spec (step, stage, or pipeline config) */
  spec: HarnessStepConfig | HarnessStageConfig | HarnessPipelineConfig;
}

/**
 * Harness service configuration
 */
export interface HarnessServiceConfig {
  /** Service name */
  name: string;
  /** Service identifier */
  identifier?: string;
  /** Organization identifier */
  orgIdentifier: string;
  /** Project identifier */
  projectIdentifier: string;
  /** Description */
  description?: string;
  /** Tags */
  tags?: Record<string, string>;
  /** Service definition */
  serviceDefinition: ServiceDefinition;
}

/**
 * Service definition
 */
export interface ServiceDefinition {
  /** Service type */
  type: ServiceType;
  /** Service spec */
  spec: ServiceDefinitionSpec;
}

/**
 * Service types
 */
export type ServiceType =
  | 'Kubernetes'
  | 'NativeHelm'
  | 'ServerlessAwsLambda'
  | 'AzureWebApp'
  | 'Ssh'
  | 'WinRm'
  | 'ECS'
  | 'CustomDeployment';

/**
 * Service definition specification
 */
export interface ServiceDefinitionSpec {
  /** Manifests */
  manifests?: ManifestConfig[];
  /** Artifacts */
  artifacts?: ArtifactConfig;
  /** Variables */
  variables?: ServiceVariable[];
}

/**
 * Manifest configuration
 */
export interface ManifestConfig {
  /** Manifest identifier */
  identifier: string;
  /** Manifest type */
  type: ManifestType;
  /** Manifest spec */
  spec: ManifestSpec;
}

/**
 * Manifest types
 */
export type ManifestType =
  | 'K8sManifest'
  | 'Values'
  | 'HelmChart'
  | 'Kustomize'
  | 'OpenshiftTemplate'
  | 'OpenshiftParam'
  | 'KustomizePatches';

/**
 * Manifest specification
 */
export interface ManifestSpec {
  /** Store configuration */
  store: ManifestStore;
  /** Skip resource versioning */
  skipResourceVersioning?: boolean;
  /** Values paths */
  valuesPaths?: string[];
}

/**
 * Manifest store configuration
 */
export interface ManifestStore {
  /** Store type */
  type: 'Git' | 'Github' | 'GitLab' | 'Bitbucket' | 'AzureRepo' | 'Harness' | 'Http' | 'S3' | 'GCS';
  /** Store spec */
  spec: ManifestStoreSpec;
}

/**
 * Manifest store specification
 */
export interface ManifestStoreSpec {
  /** Connector reference */
  connectorRef?: string;
  /** Git fetch type */
  gitFetchType?: 'Branch' | 'Commit';
  /** Branch */
  branch?: string;
  /** Commit ID */
  commitId?: string;
  /** Paths */
  paths?: string[];
  /** Folder path */
  folderPath?: string;
  /** Repo name */
  repoName?: string;
}

/**
 * Artifact configuration
 */
export interface ArtifactConfig {
  /** Primary artifact */
  primary?: ArtifactSource;
  /** Sidecars */
  sidecars?: ArtifactSource[];
}

/**
 * Artifact source
 */
export interface ArtifactSource {
  /** Source identifier */
  identifier: string;
  /** Source type */
  type: ArtifactSourceType;
  /** Source spec */
  spec: ArtifactSourceSpec;
}

/**
 * Artifact source types
 */
export type ArtifactSourceType =
  | 'DockerRegistry'
  | 'Gcr'
  | 'Ecr'
  | 'Acr'
  | 'Nexus3Registry'
  | 'ArtifactoryRegistry'
  | 'CustomArtifact'
  | 'AmazonS3'
  | 'GoogleCloudStorage'
  | 'Jenkins';

/**
 * Artifact source specification
 */
export interface ArtifactSourceSpec {
  /** Connector reference */
  connectorRef?: string;
  /** Image path */
  imagePath?: string;
  /** Tag */
  tag?: string;
  /** Tag regex */
  tagRegex?: string;
  /** Repository */
  repository?: string;
  /** Region */
  region?: string;
  /** Bucket */
  bucket?: string;
  /** File path filter */
  filePathRegex?: string;
}

/**
 * Service variable
 */
export interface ServiceVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'String' | 'Number' | 'Secret';
  /** Variable value */
  value: string;
}

/**
 * Harness environment configuration
 */
export interface HarnessEnvironmentConfig {
  /** Environment name */
  name: string;
  /** Environment identifier */
  identifier?: string;
  /** Organization identifier */
  orgIdentifier: string;
  /** Project identifier */
  projectIdentifier: string;
  /** Environment type */
  type: EnvironmentType;
  /** Description */
  description?: string;
  /** Tags */
  tags?: Record<string, string>;
  /** Variables */
  variables?: EnvironmentVariable[];
  /** Overrides */
  overrides?: EnvironmentOverrides;
}

/**
 * Environment types
 */
export type EnvironmentType = 'Production' | 'PreProduction';

/**
 * Environment variable
 */
export interface EnvironmentVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'String' | 'Number' | 'Secret';
  /** Variable value */
  value: string;
}

/**
 * Environment overrides
 */
export interface EnvironmentOverrides {
  /** Manifest overrides */
  manifests?: ManifestOverride[];
  /** Config file overrides */
  configFiles?: ConfigFileOverride[];
  /** Variable overrides */
  variables?: EnvironmentVariable[];
}

/**
 * Manifest override
 */
export interface ManifestOverride {
  /** Manifest identifier */
  identifier: string;
  /** Override type */
  type: ManifestType;
  /** Override spec */
  spec: ManifestSpec;
}

/**
 * Config file override
 */
export interface ConfigFileOverride {
  /** Config file identifier */
  identifier: string;
  /** Override spec */
  spec: ConfigFileSpec;
}

/**
 * Config file specification
 */
export interface ConfigFileSpec {
  /** Store configuration */
  store: ManifestStore;
}

/**
 * Harness connector configuration
 */
export interface HarnessConnectorConfig {
  /** Connector name */
  name: string;
  /** Connector identifier */
  identifier?: string;
  /** Organization identifier */
  orgIdentifier?: string;
  /** Project identifier */
  projectIdentifier?: string;
  /** Connector type */
  type: ConnectorType;
  /** Description */
  description?: string;
  /** Tags */
  tags?: Record<string, string>;
  /** Connector spec */
  spec: ConnectorSpec;
}

/**
 * Connector types
 */
export type ConnectorType =
  | 'Github'
  | 'GitLab'
  | 'Bitbucket'
  | 'AzureRepo'
  | 'DockerRegistry'
  | 'K8sCluster'
  | 'Aws'
  | 'Gcp'
  | 'Azure'
  | 'Artifactory'
  | 'Nexus'
  | 'Jira'
  | 'ServiceNow'
  | 'Slack'
  | 'PagerDuty';

/**
 * Connector specification
 */
export interface ConnectorSpec {
  /** Connection type */
  connectionType?: string;
  /** URL */
  url?: string;
  /** Authentication */
  authentication?: AuthenticationConfig;
  /** Delegate selectors */
  delegateSelectors?: string[];
  /** Execute on delegate */
  executeOnDelegate?: boolean;
  /** Additional properties */
  [key: string]: unknown;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  /** Auth type */
  type: 'UsernamePassword' | 'UsernameToken' | 'Anonymous' | 'ServiceAccount' | 'SSH' | 'Http' | 'OAuth';
  /** Auth spec */
  spec: AuthenticationSpec;
}

/**
 * Authentication specification
 */
export interface AuthenticationSpec {
  /** Username */
  username?: string;
  /** Username reference */
  usernameRef?: string;
  /** Password reference */
  passwordRef?: string;
  /** Token reference */
  tokenRef?: string;
  /** SSH key reference */
  sshKeyRef?: string;
  /** Service account token */
  serviceAccountTokenRef?: string;
}
