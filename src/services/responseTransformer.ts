import _ from 'lodash';
import { Rule } from '../types';
import { resolvePaths } from '../utils/pathUtils';
import { applyMask } from '../utils/maskUtils';

/**
 * Output structure of applyRules function.
 */
interface ApplyRulesOutput {
  transformed: any;
  original: any;
  _appliedRules: Rule[];
  _deniedBy?: Rule;
}

/**
 * Evaluates a condition object using nested logical expressions (AND/OR) or basic operators.
 * Supports both simple and composite conditions.
 */
function evaluateCondition(obj: any, condition: any): boolean {
  if (!condition) return false;

  // Composite: AND
  if (condition.logic === 'AND' && Array.isArray(condition.conditions)) {
    return condition.conditions.every((c: any) => evaluateCondition(obj, c));
  }

  // Composite: OR
  if (condition.logic === 'OR' && Array.isArray(condition.conditions)) {
    return condition.conditions.some((c: any) => evaluateCondition(obj, c));
  }

  // Simple condition
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

/**
 * Checks whether a given fieldPath is within the allowed `include-only` paths.
 */
function shouldIncludeField(fieldPath: string, allowedPaths: string[]): boolean {
  return allowedPaths.some(base =>
    fieldPath === base || fieldPath.startsWith(`${base}.`) || fieldPath.startsWith(`${base}[`)
  );
}

/**
 * Recursively collects all deep field paths from a given object.
 * Returns flattened paths such as: contact.email, address[0].city, etc.
 */
function collectAllPaths(obj: any, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];

  const paths: string[] = [];
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        paths.push(...collectAllPaths(item, `${fullPath}[${index}]`));
      });
    } else if (typeof obj[key] === 'object') {
      paths.push(...collectAllPaths(obj[key], fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

/**
 * Main engine for applying field-level data transformation rules.
 * Applies a combination of masking, hiding, redacting, truncation, and nullification
 * based on the user's resolved access codes and rule priority.
 */
export function applyRules(original: any, rules: Rule[]): ApplyRulesOutput {
  const transformed = _.cloneDeep(original);
  const appliedRules: Rule[] = [];

  // Step 1: Check for `include-only` logic. This becomes a strict allowlist filter.
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

  // Step 2: Apply all transformation rules
  for (const rule of rules) {
    if (!rule || typeof rule.field !== 'string') {
      console.warn('Skipping invalid rule:', rule);
      continue;
    }

    // Meta-field guards (e.g., @PII_FIELDS should have been expanded beforehand)
    if (rule.field.startsWith('@')) {
      console.log(`Skipping transformation for unresolved meta-field: ${rule.field}`);
      continue;
    }

    // Step 2a: Evaluate conditional deny rules (hard block on access)
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

    // Step 2b: Get all resolved path variants for the rule
    const paths = resolvePaths(transformed, rule.field);

    // Step 2c: Apply transformation for each resolved path
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
