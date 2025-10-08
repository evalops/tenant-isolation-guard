# Tenant Isolation Guard

Detect missing tenant isolation in multi-tenant FastAPI applications using AI-powered analysis via the Codex SDK.

## Features

✨ **TypeScript** - Fully typed with comprehensive type definitions  
🎨 **Colored Output** - Beautiful, easy-to-read console output with severity-based colors  
📊 **Severity Levels** - Issues categorized as CRITICAL, HIGH, MEDIUM, or LOW  
📝 **JSON Export** - Structured JSON output for CI/CD integration  
🔍 **Smart Detection** - Identifies missing tenant filters, dependencies, and more  
⚡ **Fast Analysis** - Powered by Codex SDK for intelligent code analysis

## Installation

```bash
npm install
npm run build
```

### Requirements
- Node.js 18+
- npm or yarn
- Codex API key (set in `.env` or `CODEX_API_KEY` environment variable)

## Usage

### Basic Usage

```bash
npm run check
```

### Analyze a specific directory

```bash
node dist/index.js /path/to/your/fastapi/app
```

### Command-line options

```bash
node dist/index.js [path] [options]

Options:
  --json              Output results as JSON
  --verbose, -v       Show detailed output including safe endpoints
  --config, -c        Path to custom config file
```

### Examples

```bash
# Check with verbose output
node dist/index.js ./my-app --verbose

# Output JSON for CI/CD
node dist/index.js ./my-app --json > results.json

# Use custom config
node dist/index.js ./my-app --config ./custom-config.json
```

## Configuration

Create a `tenant-guard.config.json` in your project root:

```json
{
  "tenant_markers": ["workspace_id", "tenant_id", "org_id"],
  "global_tables": ["feature_flags", "audit_logs", "system_config"],
  "tenant_dependencies": [
    "Depends(get_current_workspace)",
    "Depends(get_tenant)",
    "Depends(require_workspace)"
  ],
  "admin_dependencies": ["Depends(require_admin)", "Depends(is_admin)"],
  "admin_route_prefixes": ["/admin", "/internal", "/system"],
  "ignore_patterns": ["# tenant-guard: ignore", "# codex-ignore: tenant"]
}
```

### Configuration Fields

- **tenant_markers**: Column names that indicate a table is tenant-scoped
- **global_tables**: Tables that are intentionally shared across tenants
- **tenant_dependencies**: FastAPI dependencies that provide tenant context
- **admin_dependencies**: Dependencies that mark admin-only endpoints
- **admin_route_prefixes**: Route prefixes for admin endpoints (exempt from checks)
- **ignore_patterns**: Comment patterns to ignore specific lines

## Issue Types

### 🚨 CRITICAL - Missing Tenant Filter on Mutations
- Delete or update operations without tenant filtering
- Can lead to cross-tenant data modification

### ⚠️ HIGH - Missing Tenant Filter on Queries
- Query operations on tenant-scoped tables without filtering
- Exposes data from other tenants

### ⚠️ HIGH - Missing Tenant Dependency
- Endpoints accessing tenant data without authentication
- No workspace/tenant context in the request

### ⚡ MEDIUM - Unused Tenant Dependency
- Has tenant dependency but doesn't use it in queries
- Could lead to accidental cross-tenant access

## Development

### Run tests

```bash
npm test
```

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run dev
```

## Output Example

```
═══════════════════════════════════════════════════════════════════════════════
  🔐 TENANT ISOLATION ANALYSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

Summary:
  Total Issues: 5
  🚨 Critical: 2
  ⚠️ High: 2
  ⚡ Medium: 1

Issues Found:
───────────────────────────────────────────────────────────────────────────────

🚨 CRITICAL (2)

  1. delete_user_bad [DELETE /users/{user_id}]
     Type: missing_tenant_filter
     Model: User
     Location: routes.py:128
     Issue: Delete query missing workspace filter - allows cross-tenant deletion

  2. update_project_bad [PUT /projects/{project_id}]
     Type: missing_tenant_filter
     Model: Project
     Location: routes.py:81
     Issue: Update doesn't verify workspace_id - allows cross-tenant modification

✅ Safe Endpoints: (6)
  (Use --verbose to see details)

───────────────────────────────────────────────────────────────────────────────
⚠️  Found 5 issues requiring attention
───────────────────────────────────────────────────────────────────────────────
```

## How It Works

1. Reads your FastAPI codebase (routes.py, models.py)
2. Identifies SQLAlchemy models and their tenant-scoping
3. Analyzes each endpoint's database queries
4. Detects missing tenant filters and dependencies
5. Generates a detailed report with severity levels

## Environment Variables

Set your Codex API key:

```bash
CODEX_API_KEY=your-api-key-here
```

Or create a `.env` file in the project root.

## License

MIT
