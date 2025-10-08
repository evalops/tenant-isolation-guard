import { AnalysisResult, Issue } from './types.js';
import { colorize, severityColor, severityIcon } from './colors.js';

export function formatConsoleOutput(result: AnalysisResult, verbose: boolean = false): void {
  console.log('\n' + colorize('═'.repeat(80), 'cyan'));
  console.log(colorize('  🔐 TENANT ISOLATION ANALYSIS REPORT', 'bold'));
  console.log(colorize('═'.repeat(80), 'cyan') + '\n');

  if (!result.success) {
    console.log(colorize('❌ Analysis failed: ', 'red') + (result.error || 'Unknown error'));
    return;
  }

  const { summary } = result;

  console.log(colorize('Summary:', 'bold'));
  console.log(`  Total Issues: ${colorize(summary.totalIssues.toString(), summary.totalIssues > 0 ? 'yellow' : 'green')}`);
  
  if (summary.critical > 0) {
    console.log(`  ${severityIcon('critical')} Critical: ${colorize(summary.critical.toString(), 'red')}`);
  }
  if (summary.high > 0) {
    console.log(`  ${severityIcon('high')} High: ${colorize(summary.high.toString(), 'yellow')}`);
  }
  if (summary.medium > 0) {
    console.log(`  ${severityIcon('medium')} Medium: ${colorize(summary.medium.toString(), 'cyan')}`);
  }
  if (summary.low > 0) {
    console.log(`  ${severityIcon('low')} Low: ${colorize(summary.low.toString(), 'blue')}`);
  }

  if (result.issues.length > 0) {
    console.log('\n' + colorize('Issues Found:', 'bold'));
    console.log(colorize('─'.repeat(80), 'gray') + '\n');

    const groupedBySeverity = groupIssuesBySeverity(result.issues);
    
    for (const [severity, issues] of Object.entries(groupedBySeverity)) {
      if (issues.length === 0) continue;
      
      const color = severityColor(severity);
      const icon = severityIcon(severity);
      
      console.log(colorize(`${icon} ${severity.toUpperCase()} (${issues.length})`, color));
      console.log();
      
      issues.forEach((issue, idx) => {
        const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
        
        console.log(`  ${idx + 1}. ${colorize(issue.endpoint, 'bold')} ${issue.route ? colorize(`[${issue.route}]`, 'dim') : ''}`);
        console.log(`     ${colorize('Type:', 'dim')} ${issue.type}`);
        console.log(`     ${colorize('Model:', 'dim')} ${issue.model}`);
        console.log(`     ${colorize('Location:', 'dim')} ${location}`);
        console.log(`     ${colorize('Issue:', 'dim')} ${issue.description}`);
        
        if (issue.suggestedFix && verbose) {
          console.log(`     ${colorize('Fix:', 'green')} ${issue.suggestedFix}`);
        }
        console.log();
      });
    }
  }

  if (result.safeEndpoints.length > 0) {
    console.log(colorize('✅ Safe Endpoints:', 'green') + colorize(` (${result.safeEndpoints.length})`, 'dim'));
    
    if (verbose) {
      result.safeEndpoints.forEach(endpoint => {
        console.log(`  • ${endpoint.endpoint} ${colorize(`- ${endpoint.reason}`, 'dim')}`);
      });
    } else {
      console.log(colorize('  (Use --verbose to see details)', 'dim'));
    }
    console.log();
  }

  console.log(colorize('─'.repeat(80), 'gray'));
  
  if (summary.totalIssues === 0) {
    console.log(colorize('✨ No tenant isolation issues found!', 'green'));
  } else {
    console.log(colorize(`⚠️  Found ${summary.totalIssues} issue${summary.totalIssues !== 1 ? 's' : ''} requiring attention`, 'yellow'));
  }
  
  console.log(colorize('─'.repeat(80), 'gray') + '\n');

  if (verbose && result.threadId) {
    console.log(colorize(`Thread ID: ${result.threadId}`, 'dim'));
  }
}

export function formatJsonOutput(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

function groupIssuesBySeverity(issues: Issue[]): Record<string, Issue[]> {
  const grouped: Record<string, Issue[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const issue of issues) {
    const severity = issue.severity.toLowerCase();
    if (grouped[severity]) {
      grouped[severity].push(issue);
    }
  }

  return grouped;
}
