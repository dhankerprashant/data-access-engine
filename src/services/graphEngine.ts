import { Rule } from '../types';

interface GraphNode {
  code: string;
  rules: Rule[];
  inherits?: string[];
}

const accessGraph: Record<string, GraphNode> = {};

export function registerAccessCode(code: string, rules: Rule[], inherits: string[] = []) {
  accessGraph[code] = { code, rules, inherits };
}

export function resolveGraphRules(accessCodes: string[]): Rule[] {
  const visited = new Set<string>();
  const resolved: Rule[] = [];

  function traverse(code: string) {
    if (visited.has(code)) return;
    visited.add(code);

    const node = accessGraph[code];
    if (!node) return;

    node.inherits?.forEach(traverse);
    resolved.push(...node.rules);
  }

  accessCodes.forEach(traverse);
  return resolved;
}