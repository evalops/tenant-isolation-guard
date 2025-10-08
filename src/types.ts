export interface TenantGuardConfig {
  tenant_markers: string[];
  global_tables: string[];
  tenant_dependencies: string[];
  admin_dependencies: string[];
  admin_route_prefixes: string[];
  ignore_patterns: string[];
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface Issue {
  severity: Severity;
  type: 'missing_tenant_filter' | 'missing_tenant_dependency' | 'unused_tenant_dependency';
  endpoint: string;
  route?: string;
  model: string;
  file: string;
  line?: number;
  description: string;
  suggestedFix?: string;
}

export interface SafeEndpoint {
  endpoint: string;
  route?: string;
  reason: string;
}

export interface AnalysisResult {
  success: boolean;
  issues: Issue[];
  safeEndpoints: SafeEndpoint[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  output?: string;
  threadId?: string;
  error?: string;
}

export interface CheckOptions {
  targetPath: string;
  jsonOutput?: boolean;
  verbose?: boolean;
  configPath?: string;
}
