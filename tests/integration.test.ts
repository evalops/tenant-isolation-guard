import { test } from 'node:test';
import assert from 'node:assert';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { checkTenantIsolation } from '../src/index.js';
import { Severity } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('detects tenant isolation issues in test fixture', async () => {
  const fixturePath = resolve(__dirname, '../fixtures/test-app');
  const expectedIssuesPath = resolve(fixturePath, 'expected-issues.json');
  
  const expectedIssues = JSON.parse(
    await readFile(expectedIssuesPath, 'utf-8')
  );

  const result = await checkTenantIsolation({ targetPath: fixturePath });
  
  assert.strictEqual(result.success, true, 'Analysis should complete successfully');
  assert.ok(result.output, 'Should return analysis output');
  
  const output = result.output!.toLowerCase();
  
  assert.ok(
    output.includes('list_users_bad') || (output.includes('missing') && output.includes('filter')),
    'Should detect list_users_bad missing tenant filter'
  );
  
  assert.ok(
    output.includes('list_projects_no_auth') || (output.includes('missing') && output.includes('dependency')),
    'Should detect list_projects_no_auth missing tenant dependency'
  );
  
  assert.ok(
    output.includes('update_project_bad') || (output.includes('update') && output.includes('workspace')),
    'Should detect update_project_bad missing tenant filter'
  );
  
  assert.ok(
    output.includes('delete_user_bad') || (output.includes('delete') && output.includes('workspace')),
    'Should detect delete_user_bad missing tenant filter'
  );
  
  console.log('✅ All tenant isolation checks passed');
});

test('identifies safe endpoints correctly', async () => {
  const fixturePath = resolve(__dirname, '../fixtures/test-app');
  const result = await checkTenantIsolation({ targetPath: fixturePath });
  
  assert.ok(result.success, 'Analysis should succeed');
  
  const output = result.output!.toLowerCase();
  
  assert.ok(
    output.includes('list_users_good') || output.includes('safe') || output.includes('correct'),
    'Should recognize correctly implemented endpoints'
  );
  
  assert.ok(
    output.includes('admin') || output.includes('global'),
    'Should mention admin/global table exemptions'
  );
});

test('parses issues with correct severity levels', async () => {
  const fixturePath = resolve(__dirname, '../fixtures/test-app');
  const result = await checkTenantIsolation({ targetPath: fixturePath });
  
  assert.ok(result.success, 'Analysis should succeed');
  assert.ok(result.issues.length > 0, 'Should find issues');
  
  const hasCriticalOrHigh = result.issues.some(
    issue => issue.severity === Severity.CRITICAL || issue.severity === Severity.HIGH
  );
  
  assert.ok(hasCriticalOrHigh, 'Should identify high severity issues');
});

test('generates proper summary statistics', async () => {
  const fixturePath = resolve(__dirname, '../fixtures/test-app');
  const result = await checkTenantIsolation({ targetPath: fixturePath });
  
  assert.ok(result.success, 'Analysis should succeed');
  assert.ok(result.summary, 'Should include summary');
  assert.strictEqual(
    result.summary.totalIssues,
    result.summary.critical + result.summary.high + result.summary.medium + result.summary.low,
    'Total issues should equal sum of severity counts'
  );
});

test('handles missing config gracefully', async () => {
  const result = await checkTenantIsolation({ 
    targetPath: '/tmp/nonexistent-path-12345' 
  });
  
  assert.strictEqual(result.success, false, 'Should fail gracefully');
  assert.ok(result.error, 'Should include error message');
  assert.ok(result.error.includes('config'), 'Error should mention config file');
});

test('JSON output contains all required fields', async () => {
  const fixturePath = resolve(__dirname, '../fixtures/test-app');
  const result = await checkTenantIsolation({ 
    targetPath: fixturePath,
    jsonOutput: true 
  });
  
  assert.ok(result.success, 'Analysis should succeed');
  assert.ok(Array.isArray(result.issues), 'Should have issues array');
  assert.ok(Array.isArray(result.safeEndpoints), 'Should have safeEndpoints array');
  assert.ok(result.summary, 'Should have summary object');
  
  if (result.issues.length > 0) {
    const issue = result.issues[0];
    assert.ok(issue.severity, 'Issue should have severity');
    assert.ok(issue.type, 'Issue should have type');
    assert.ok(issue.endpoint, 'Issue should have endpoint');
    assert.ok(issue.model, 'Issue should have model');
    assert.ok(issue.file, 'Issue should have file');
    assert.ok(issue.description, 'Issue should have description');
  }
});
