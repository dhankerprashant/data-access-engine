import _ from 'lodash';
import { Rule } from '../types';
import { resolvePaths } from '../utils/pathUtils';
import { applyMask } from '../utils/maskUtils';

interface ApplyRulesOutput {
  transformed: any;
  original: any;
  _appliedRules: Rule[];
  _deniedBy?: Rule;
}

function evaluateCondition(obj: any, condition: any): boolean {
  if (!condition) return false;

  if (condition.logic === 'AND' && Array.isArray(condition.conditions)) {
    return condition.conditions.every((c: any) => evaluateCondition(obj, c));
  }
  if (condition.logic === 'OR' && Array.isArray(condition.conditions)) {
    return condition.conditions.some((c: any) => evaluateCondition(obj, c));
  }

  const targetValue = _.get(obj, condition.field);
  switch (condition.operator) {
    case '==': return targetValue === condition.value;
    case '!=': return targetValue !== condition.value;
    case '>': return targetValue > condition.value;
    case '<': return targetValue < condition.value;
    case '>=': return targetValue >= condition.value;
    case '<=': return targetValue <= condition.value;
    default: return false;
  }
}

function shouldIncludeField(fieldPath: string, allowedPaths: string[]): boolean {
  return allowedPaths.some(base => fieldPath === base || fieldPath.startsWith(`${base}.`) || fieldPath.startsWith(`${base}[`));
}

function collectAllPaths(obj: any, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  const paths: string[] = [];
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        paths.push(...collectAllPaths(item, `${fullPath}[${index}]`));
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      paths.push(...collectAllPaths(obj[key], fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

export function applyRules(original: any, rules: Rule[]): ApplyRulesOutput {
  const transformed = _.cloneDeep(original);
  const appliedRules: Rule[] = [];

  // Collect include-only fields first
  const includeOnlyPaths: string[] = rules
    .filter(r => r.action === 'include-only' && typeof r.field === 'string' && !r.field.startsWith('@'))
    .flatMap(r => resolvePaths(transformed, r.field));

  if (includeOnlyPaths.length > 0) {
    const allPaths = collectAllPaths(transformed);
    const filtered = {};

    for (const fullPath of allPaths) {
      if (shouldIncludeField(fullPath, includeOnlyPaths)) {
        const val = _.get(transformed, fullPath);
        _.set(filtered, fullPath, val);
      }
    }

    return {
      transformed: filtered,
      original,
      _appliedRules: rules.filter(r => r.action === 'include-only')
    };
  }

  for (const rule of rules) {
    if (!rule || typeof rule.field !== 'string') {
      console.warn('Skipping invalid rule:', rule);
      continue;
    }

    if (rule.field.startsWith('@')) {
      console.log(`Skipping transformation for unresolved meta-field: ${rule.field}`);
      continue;
    }

    if (rule.action === 'deny-if-condition') {
      const matched = evaluateCondition(transformed, rule.condition);
      if (matched) {
        console.log(`Deny-if-condition matched on ${rule.field}. Blocking response.`);
        return {
          transformed: null,
          original,
          _appliedRules: [rule],
          _deniedBy: rule
        };
      }
      continue;
    }

    const paths = resolvePaths(transformed, rule.field);

    for (const p of paths) {
      switch (rule.action) {
        case 'hide':
          _.unset(transformed, p);
          break;

        case 'nullify':
          _.set(transformed, p, null);
          break;

        case 'redact':
          _.set(transformed, p, '***REDACTED***');
          break;

        case 'mask':
          const valToMask = _.get(transformed, p);
          const masked = applyMask(valToMask, rule.maskType ?? 'DEFAULT');
          _.set(transformed, p, masked);
          break;

        case 'truncate':
          const val = _.get(transformed, p);
          if (typeof val === 'string') {
            _.set(transformed, p, val.slice(0, rule.length || 5));
          }
          break;
      }
    }

    appliedRules.push(rule);
  }

  return {
    transformed,
    original,
    _appliedRules: appliedRules
  };
}
