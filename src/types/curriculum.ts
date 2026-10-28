export interface CodeExample {
  id: string;
  title: string;
  filename: string;
  language: string;
  description: string;
  code: string;
}

export interface ComparisonRow {
  criterion: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  architectVerdict: string;
}

export interface CalloutBox {
  type: 'warning' | 'best-practice' | 'architecture';
  title: string;
  content: string;
}

export interface SubSection {
  id: string;
  titleFa: string;
  titleEn: string;
  contentFa: string[];
  bulletPoints?: { termEn: string; descFa: string }[];
  comparisonTable?: {
    headers: string[];
    rows: ComparisonRow[];
  };
  callouts?: CalloutBox[];
  codeExamples?: CodeExample[];
}

export interface CurriculumModule {
  id: string;
  number: number;
  titleFa: string;
  titleEn: string;
  readingTime: string;
  difficulty: string;
  summaryFa: string;
  keyTakeaways: {
    titleFa: string;
    metricOrBadge: string;
    descFa: string;
  }[];
  interactiveWidgetType:
    | 'editor-vs-manager'
    | 'artifact-auditor'
    | 'autonomy-matrix'
    | 'rule-activation'
    | 'workflow-pipeline'
    | 'browser-telemetry'
    | 'mcp-topology'
    | 'worktree-troubleshooter';
  subSections: SubSection[];
}

export interface RuleGeneratorConfig {
  name: string;
  activationMode: 'Always On' | 'Glob' | 'Model Decision' | 'Manual';
  globs: string[];
  description: string;
  domains: {
    fastapi: boolean;
    sqlalchemy: boolean;
    alembic: boolean;
    pytest: boolean;
    security: boolean;
    logging: boolean;
  };
}

export interface WorkflowStepConfig {
  id: string;
  title: string;
  commandOrAction: string;
  description: string;
  turboStep: boolean;
}

export interface WorkflowGeneratorConfig {
  commandName: string;
  description: string;
  turboAll: boolean;
  steps: WorkflowStepConfig[];
}

export interface AutonomyRiskProfile {
  environment: 'local-sandbox' | 'staging-ci' | 'enterprise-prod';
  hasDestructiveDbAccess: boolean;
  teamExperience: 'junior' | 'senior' | 'principal';
  requiresAuditTrail: boolean;
}

export interface AutonomyRecommendation {
  executionMode: 'Planning Mode' | 'Fast Mode';
  terminalPolicy: 'Off' | 'Auto' | 'Turbo';
  artifactReviewPolicy: 'Request Review' | 'Agent Decides' | 'Always Proceed';
  allowList: string[];
  denyList: string[];
  rationaleFa: string;
}

export interface McpIntegrationSelection {
  postgres: boolean;
  github: boolean;
  opensearchTelemetry: boolean;
  rocketchatAlert: boolean;
  redisCache: boolean;
  envVars: {
    postgresUrl: string;
    opensearchUrl: string;
    rocketchatWebhook: string;
    githubTokenEnv: string;
  };
}

export interface ArchitectScenario {
  id: string;
  number: number;
  titleFa: string;
  titleEn: string;
  category: string;
  problemStatementFa: string;
  contextCodeOrConfig: string;
  options: {
    id: string;
    labelFa: string;
    commandOrSpecEn: string;
    isOptimal: boolean;
    explanationFa: string;
    impactMetrics: string;
  }[];
}

export interface CheatSheetCard {
  id: string;
  titleFa: string;
  titleEn: string;
  category: string;
  items: {
    keyEn: string;
    labelFa: string;
    detailFa: string;
  }[];
}
