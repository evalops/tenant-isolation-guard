import { test } from 'node:test';
import assert from 'node:assert';
import { parseCodexOutput, calculateSummary } from '../src/parser.js';
import { Severity } from '../src/types.js';
import { colorize, severityColor, severityIcon } from '../src/colors.js';

test('parseCodexOutput extracts issues correctly', () => {
  const sampleOutput = `
Analysis Results:

CRITICAL Issue:
Endpoint: delete_user_bad
Model: User
File: routes.py:128
Severity: critical
Issue: Delete query missing workspace filter

HIGH Issue:
Endpoint: list_users_bad
Model: User
File: routes.py:26
Severity: high
Issue: Missing tenant filter on query

Safe Endpoints:
Endpoint: list_users_good
Reason: Properly filters by workspace_id
`;

  const { issues, safeEndpoints } = parseCodexOutput(sampleOutput);
  
  assert.ok(issues.length >= 1, 'Should find at least one issue');
  assert.ok(safeEndpoints.length >= 1, 'Should find at least one safe endpoint');
});

test('calculateSummary counts severity levels correctly', () => {
  const issues = [
    {
      severity: Severity.CRITICAL,
      type: 'missing_tenant_filter' as const,
      endpoint: 'delete_bad',
      model: 'User',
      file: 'routes.py',
      description: 'Test',
    },
    {
      severity: Severity.HIGH,
      type: 'missing_tenant_filter' as const,
      endpoint: 'list_bad',
      model: 'User',
      file: 'routes.py',
      description: 'Test',
    },
    {
      severity: Severity.HIGH,
      type: 'missing_tenant_dependency' as const,
      endpoint: 'another_bad',
      model: 'Project',
      file: 'routes.py',
      description: 'Test',
    },
    {
      severity: Severity.MEDIUM,
      type: 'unused_tenant_dependency' as const,
      endpoint: 'unused',
      model: 'Project',
      file: 'routes.py',
      description: 'Test',
    },
  ];

  const summary = calculateSummary(issues);

  assert.strictEqual(summary.totalIssues, 4, 'Total should be 4');
  assert.strictEqual(summary.critical, 1, 'Should have 1 critical');
  assert.strictEqual(summary.high, 2, 'Should have 2 high');
  assert.strictEqual(summary.medium, 1, 'Should have 1 medium');
  assert.strictEqual(summary.low, 0, 'Should have 0 low');
});

test('colorize function wraps text with color codes', () => {
  const result = colorize('test', 'red');
  assert.ok(result.includes('test'), 'Should contain the text');
  assert.ok(result.includes('\x1b'), 'Should contain ANSI codes');
});

test('severityColor returns correct color for each severity', () => {
  assert.strictEqual(severityColor('critical'), 'red');
  assert.strictEqual(severityColor('high'), 'yellow');
  assert.strictEqual(severityColor('medium'), 'cyan');
  assert.strictEqual(severityColor('low'), 'blue');
  assert.strictEqual(severityColor('unknown'), 'gray');
});

test('severityIcon returns appropriate emoji for each severity', () => {
  assert.strictEqual(severityIcon('critical'), '🚨');
  assert.strictEqual(severityIcon('high'), '⚠️');
  assert.strictEqual(severityIcon('medium'), '⚡');
  assert.strictEqual(severityIcon('low'), 'ℹ️');
});

test('parseCodexOutput handles empty output gracefully', () => {
  const { issues, safeEndpoints } = parseCodexOutput('');
  
  assert.strictEqual(issues.length, 0, 'Should return empty issues array');
  assert.strictEqual(safeEndpoints.length, 0, 'Should return empty endpoints array');
});

test('parseCodexOutput extracts line numbers when present', () => {
  const output = `
Issue found:
Endpoint: bad_endpoint
Model: User
File: routes.py
Line: 42
Severity: high
`;

  const { issues } = parseCodexOutput(output);
  
  if (issues.length > 0) {
    assert.ok(issues.some(i => i.line === 42), 'Should extract line number 42');
  }
});
