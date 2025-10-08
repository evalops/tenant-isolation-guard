# Migration Guide: JavaScript to TypeScript

## Overview

The tenant-isolation-guard project has been successfully migrated from JavaScript to TypeScript with significant improvements in type safety, output formatting, and usability.

## What Changed

### File Structure

**Before:**
```
src/
  index.js
tests/
  integration.test.js
package.json
```

**After:**
```
src/
  index.ts          # Main CLI and analysis logic
  types.ts          # Type definitions
  colors.ts         # ANSI color utilities
  formatter.ts      # Output formatting
  parser.ts         # Codex output parsing
tests/
  integration.test.ts
  unit.test.ts
tsconfig.json       # TypeScript config
dist/              # Compiled output
```

### API Changes

The `checkTenantIsolation` function now accepts an options object:

**Before:**
```javascript
checkTenantIsolation(targetPath)
```

**After:**
```typescript
checkTenantIsolation({
  targetPath: string,
  jsonOutput?: boolean,
  verbose?: boolean,
  configPath?: string
})
```

### Return Value Structure

The result object is now fully typed with detailed fields:

```typescript
interface AnalysisResult {
  success: boolean;
  issues: Issue[];              // NEW: Parsed issues array
  safeEndpoints: SafeEndpoint[];// NEW: Safe endpoints array
  summary: {                    // NEW: Statistics
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
```

### CLI Improvements

New command-line options:
- `--json` - Output results as JSON
- `--verbose` / `-v` - Show detailed output
- `--config` / `-c` - Custom config path
- `--help` / `-h` - Show help

### Output Format

**Before:** Plain text Codex output

**After:** 
- Colored, formatted console output with sections
- Severity-based color coding (🚨 Critical, ⚠️ High, ⚡ Medium, ℹ️ Low)
- Summary statistics
- Optional JSON export for CI/CD

## Migration Steps

### For Users

1. Pull latest changes
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build TypeScript:
   ```bash
   npm run build
   ```
4. Run as before:
   ```bash
   npm run check
   ```

### For Developers

If you were importing the module:

**Before:**
```javascript
import { checkTenantIsolation } from './src/index.js';

const result = await checkTenantIsolation('./my-app');
console.log(result.output);
```

**After:**
```typescript
import { checkTenantIsolation } from './dist/index.js';
import { AnalysisResult } from './dist/types.js';

const result: AnalysisResult = await checkTenantIsolation({ 
  targetPath: './my-app',
  verbose: true 
});

// Access structured data
console.log(`Found ${result.summary.totalIssues} issues`);
console.log(`Critical: ${result.summary.critical}`);

// Or get JSON
const jsonResult = await checkTenantIsolation({ 
  targetPath: './my-app',
  jsonOutput: true 
});
console.log(JSON.stringify(jsonResult, null, 2));
```

## Benefits

1. **Type Safety** - Full TypeScript types prevent errors
2. **Better DX** - IDE autocomplete and type checking
3. **Structured Output** - Parsed issues instead of raw text
4. **Severity Levels** - Color-coded by criticality
5. **Flexible Output** - Console or JSON
6. **Comprehensive Tests** - Unit + integration tests
7. **Better Errors** - Typed error handling

## Breaking Changes

### Direct JavaScript Import
If you were importing the JavaScript file directly, update to import from `dist/`:

```diff
- import { checkTenantIsolation } from './src/index.js';
+ import { checkTenantIsolation } from './dist/index.js';
```

### Function Signature
Update function calls to use options object:

```diff
- await checkTenantIsolation('./path');
+ await checkTenantIsolation({ targetPath: './path' });
```

### Build Step Required
TypeScript must be compiled before running:

```bash
npm run build  # Required before running
```

## Backward Compatibility

- All fixtures remain unchanged
- Config file format unchanged
- Core analysis logic preserved
- Integration tests verify same functionality

## Questions?

See README.md for usage examples or run:
```bash
node dist/index.js --help
```
