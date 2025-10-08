import { Issue, SafeEndpoint, Severity } from './types.js';

export function parseCodexOutput(output: string): { issues: Issue[]; safeEndpoints: SafeEndpoint[] } {
  const issues: Issue[] = [];
  const safeEndpoints: SafeEndpoint[] = [];
  
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.toLowerCase().includes('issue') || 
        line.toLowerCase().includes('vulnerability') ||
        line.toLowerCase().includes('missing')) {
      
      const issue = parseIssueBlock(lines, i);
      if (issue) {
        issues.push(issue);
      }
    }
    
    if (line.toLowerCase().includes('safe') || 
        line.toLowerCase().includes('correct') ||
        line.toLowerCase().includes('properly implemented')) {
      
      const endpoint = parseSafeEndpoint(lines, i);
      if (endpoint) {
        safeEndpoints.push(endpoint);
      }
    }
  }
  
  return { issues, safeEndpoints };
}

function parseIssueBlock(lines: string[], startIdx: number): Issue | null {
  const context = lines.slice(startIdx, Math.min(startIdx + 15, lines.length)).join('\n');
  
  const endpointMatch = context.match(/(?:endpoint|function)[:\s]+`?(\w+)`?/i);
  const modelMatch = context.match(/(?:model|table)[:\s]+`?(\w+)`?/i);
  const fileMatch = context.match(/(?:file|location)[:\s]+([^\n]+?)(?::|$)/i);
  const lineMatch = context.match(/line[:\s]+(\d+)/i);
  const severityMatch = context.match(/severity[:\s]+(critical|high|medium|low)/i);
  
  if (!endpointMatch && !modelMatch) {
    return null;
  }
  
  let type: Issue['type'] = 'missing_tenant_filter';
  if (context.toLowerCase().includes('missing') && context.toLowerCase().includes('dependency')) {
    type = 'missing_tenant_dependency';
  } else if (context.toLowerCase().includes('unused')) {
    type = 'unused_tenant_dependency';
  }
  
  let severity = Severity.MEDIUM;
  if (severityMatch) {
    severity = severityMatch[1].toLowerCase() as Severity;
  } else if (context.toLowerCase().includes('critical') || 
             context.toLowerCase().includes('delete') || 
             context.toLowerCase().includes('update')) {
    severity = Severity.CRITICAL;
  } else if (context.toLowerCase().includes('high')) {
    severity = Severity.HIGH;
  }
  
  return {
    severity,
    type,
    endpoint: endpointMatch?.[1] || 'unknown',
    model: modelMatch?.[1] || 'unknown',
    file: fileMatch?.[1]?.trim() || 'unknown',
    line: lineMatch ? parseInt(lineMatch[1]) : undefined,
    description: extractDescription(context),
    suggestedFix: extractFix(context),
  };
}

function parseSafeEndpoint(lines: string[], startIdx: number): SafeEndpoint | null {
  const context = lines.slice(startIdx, Math.min(startIdx + 5, lines.length)).join('\n');
  
  const endpointMatch = context.match(/(?:endpoint|function)[:\s]+`?(\w+)`?/i);
  if (!endpointMatch) {
    return null;
  }
  
  return {
    endpoint: endpointMatch[1],
    reason: extractReason(context),
  };
}

function extractDescription(context: string): string {
  const explanationMatch = context.match(/(?:explanation|issue|description|vulnerability)[:\s]+([^\n]+)/i);
  if (explanationMatch) {
    return explanationMatch[1].trim();
  }
  
  const lines = context.split('\n').filter(l => l.trim().length > 0);
  return lines[0]?.trim() || 'Tenant isolation issue detected';
}

function extractFix(context: string): string | undefined {
  const fixMatch = context.match(/(?:fix|suggestion|recommended)[:\s]+([^\n]+)/i);
  return fixMatch?.[1]?.trim();
}

function extractReason(context: string): string {
  const reasonMatch = context.match(/(?:reason|because)[:\s]+([^\n]+)/i);
  if (reasonMatch) {
    return reasonMatch[1].trim();
  }
  
  if (context.toLowerCase().includes('admin')) {
    return 'Admin endpoint';
  }
  if (context.toLowerCase().includes('global')) {
    return 'Global table access';
  }
  if (context.toLowerCase().includes('filter')) {
    return 'Proper tenant filter';
  }
  
  return 'Correctly implemented';
}

export function calculateSummary(issues: Issue[]) {
  return {
    totalIssues: issues.length,
    critical: issues.filter(i => i.severity === Severity.CRITICAL).length,
    high: issues.filter(i => i.severity === Severity.HIGH).length,
    medium: issues.filter(i => i.severity === Severity.MEDIUM).length,
    low: issues.filter(i => i.severity === Severity.LOW).length,
  };
}
