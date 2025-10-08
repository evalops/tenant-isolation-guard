#!/usr/bin/env node
import { Codex } from '@openai/codex-sdk';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFile } from 'fs/promises';
import { config as loadEnv } from 'dotenv';
import { TenantGuardConfig, AnalysisResult, CheckOptions } from './types.js';
import { formatConsoleOutput, formatJsonOutput } from './formatter.js';
import { parseCodexOutput, calculateSummary } from './parser.js';

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadConfig(configPath: string): Promise<TenantGuardConfig> {
  try {
    const configData = await readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    throw new Error(
      `Failed to load tenant-guard.config.json: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
      'Create a config file with tenant_markers, global_tables, etc.'
    );
  }
}

function buildAnalysisPrompt(config: TenantGuardConfig): string {
  return `Analyze this FastAPI application for tenant isolation vulnerabilities.

**Configuration:**
- Tenant markers (columns that indicate tenant scope): ${config.tenant_markers.join(', ')}
- Global tables (not tenant-scoped): ${config.global_tables.join(', ')}
- Tenant auth dependencies: ${config.tenant_dependencies.join(', ')}
- Admin dependencies (exempt): ${config.admin_dependencies.join(', ')}
- Admin route prefixes (exempt): ${config.admin_route_prefixes.join(', ')}

**Analysis Steps:**

1. **Classify Models** (models.py):
   - Find all SQLAlchemy models
   - Identify which tables are tenant-scoped (have ${config.tenant_markers.join(' or ')} column)
   - Identify global tables from config: ${config.global_tables.join(', ')}
   - List tenant-scoped models vs global models

2. **Analyze FastAPI Endpoints** (routes.py):
   - Extract all @router.get/post/put/delete/patch endpoints
   - For each endpoint, identify:
     a) Dependencies used (Depends(...))
     b) Database queries (db.query(...), select(...))
     c) Which models are accessed in queries
   
3. **Detect Issues**:
   
   **HIGH SEVERITY - Missing Tenant Filter:**
   - Endpoint queries a tenant-scoped model (User, Project, etc.)
   - Query does NOT filter by tenant marker (e.g., .filter(Model.workspace_id == workspace.id))
   - Especially critical for .update() and .delete() operations
   
   **HIGH SEVERITY - Missing Tenant Dependency:**
   - Endpoint accesses tenant-scoped tables
   - Does NOT have tenant auth dependency (${config.tenant_dependencies.join(' or ')})
   - Is NOT an admin route (not in ${config.admin_route_prefixes.join(', ')} and no ${config.admin_dependencies.join(' or ')})
   
   **MEDIUM SEVERITY - Unused Dependency:**
   - Has tenant dependency but doesn't use it in filter
   - Could lead to accidental cross-tenant access

4. **Mark as Safe**:
   - Endpoints that only access global tables (${config.global_tables.join(', ')})
   - Admin endpoints with ${config.admin_dependencies.join(' or ')} 
   - Routes under ${config.admin_route_prefixes.join(' or ')}
   - Queries that properly filter by tenant marker

**Output Format:**

For each issue found, provide:
- Severity: CRITICAL (delete/update without filter) | HIGH | MEDIUM
- Endpoint function name and route
- Model being accessed
- Issue type: missing_tenant_filter | missing_tenant_dependency | unused_tenant_dependency
- File and line number
- Explanation of the vulnerability
- Suggested fix

Also list endpoints that are correctly implemented for reference.

Be specific with file paths and line numbers.`;
}

export async function checkTenantIsolation(options: CheckOptions): Promise<AnalysisResult> {
  const absolutePath = resolve(process.cwd(), options.targetPath);
  const configPath = options.configPath || resolve(absolutePath, 'tenant-guard.config.json');
  
  if (!options.jsonOutput) {
    console.log(`🔐 Scanning for tenant isolation issues in: ${absolutePath}\n`);
  }

  let tenantConfig: TenantGuardConfig;
  try {
    tenantConfig = await loadConfig(configPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error loading config';
    return {
      success: false,
      issues: [],
      safeEndpoints: [],
      summary: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      error: errorMessage,
    };
  }

  const codex = new Codex();

  try {
    const thread = codex.startThread({
      workingDirectory: absolutePath,
      skipGitRepoCheck: true,
    });
    
    const prompt = buildAnalysisPrompt(tenantConfig);
    const result = await thread.run(prompt);

    const output = result.finalResponse || '';
    
    const { issues, safeEndpoints } = parseCodexOutput(output);
    const summary = calculateSummary(issues);
    
    return {
      success: true,
      issues,
      safeEndpoints,
      summary,
      output,
      threadId: thread.id || undefined,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis';
    return {
      success: false,
      issues: [],
      safeEndpoints: [],
      summary: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      error: errorMessage,
    };
  }
}

function showHelp() {
  console.log(`
Tenant Isolation Guard - Detect missing tenant isolation in FastAPI apps

Usage: tenant-guard [path] [options]

Arguments:
  path                    Path to FastAPI application (default: ./fixtures/test-app)

Options:
  --json                  Output results as JSON
  --verbose, -v           Show detailed output including safe endpoints
  --config, -c <path>     Path to custom config file
  --help, -h              Show this help message

Examples:
  tenant-guard ./my-app
  tenant-guard ./my-app --verbose
  tenant-guard ./my-app --json > results.json
  tenant-guard ./my-app --config ./custom-config.json

Configuration:
  Create a tenant-guard.config.json in your project root with:
  - tenant_markers: Column names that indicate tenant scope
  - global_tables: Tables shared across tenants
  - tenant_dependencies: FastAPI dependencies for tenant auth
  - admin_dependencies: Dependencies for admin endpoints
  - admin_route_prefixes: Route prefixes exempt from checks
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const options: CheckOptions = {
    targetPath: './fixtures/test-app',
    jsonOutput: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--json') {
      options.jsonOutput = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--config' || arg === '-c') {
      options.configPath = args[++i];
    } else if (!arg.startsWith('-')) {
      options.targetPath = arg;
    }
  }

  const result = await checkTenantIsolation(options);

  if (options.jsonOutput) {
    console.log(formatJsonOutput(result));
  } else {
    formatConsoleOutput(result, options.verbose);
  }

  process.exit(result.success && result.summary.totalIssues === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
