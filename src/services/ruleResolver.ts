import accessCodeRulesRaw from '../../configs/AccessCodeRules.json';
import groupAccessMapRaw from '../../configs/GroupAccessMap.json';
import fieldSetsRaw from '../../configs/FieldSets.json';
import { Rule } from '../types';

/**
 * Loaded static configuration files.
 */
const accessCodeRules: Record<string, any> = accessCodeRulesRaw;
const groupAccessMap: Record<string, string[]> = groupAccessMapRaw;

/**
 * FIELD_SETS are flattened into special meta-keys like @PII_FIELDS.
 * These are expanded later during rule resolution.
 */
const fieldSets: Record<string, string[]> = {};
const rawSets = fieldSetsRaw?.FIELD_SETS || {};
Object.entries(rawSets).forEach(([key, fields]) => {
  fieldSets[`@${key}`] = fields;
});

/**
 * Resolves access codes from one or more LDAP group names.
 * Each group can be mapped to multiple access control codes.
 */
export function resolveAccessCodes(ldapGroups: string[]): string[] {
  const codes = new Set<string>();
  ldapGroups.forEach(group => {
    (groupAccessMap[group] || []).forEach((code: string) => codes.add(code));
  });
  return Array.from(codes);
}

/**
 * Restrictiveness level mapping for each rule action.
 * Higher numbers are considered more restrictive when resolving conflicts.
 */
function getRestrictivenessLevel(action: string): number {
  const levels: Record<string, number> = {
    'deny-if-condition': 999,
    'hide': 3,
    'redact': 2,
    'nullify': 2,
    'mask': 1,
    'truncate': 1,
    'include-only': 0
  };
  return levels[action] ?? 0;
}

/**
 * Captures detailed trace of how rule conflicts are resolved between access codes.
 */
interface ConflictTrace {
  field: string;
  ruleA: Rule & { strategy: string; source: string; priority: number };
  ruleB: Rule & { strategy: string; source: string; priority: number };
  resolvedTo: Rule & { strategy: string; source: string; priority: number };
  reason: string;
}

/**
 * Expands special meta-fields like @PII_FIELDS into concrete rules for each field path.
 */
function expandFieldSets(rules: Rule[]): Rule[] {
  const expanded: Rule[] = [];

  for (const rule of rules) {
    if (typeof rule.field === 'string' && rule.field.startsWith('@') && fieldSets[rule.field]) {
      const actualFields = fieldSets[rule.field];
      for (const actualField of actualFields) {
        expanded.push({
          ...rule,
          field: actualField
        });
      }
    } else {
      expanded.push(rule);
    }
  }

  return expanded;
}

/**
 * Main function that merges all rules associated with the user's access codes,
 * resolves conflicts according to configured merge strategies, and traces decisions.
 *
 * @param accessCodes Access control codes assigned to the user (e.g., ["ACCESS_CODE_PII", "ACCESS_CODE_BASIC"])
 * @param schemaVersion Optional schema version filter to restrict rules (default: "v1.0")
 */
export function mergeRulesWithTrace(
  accessCodes: string[],
  schemaVersion = 'v1.0'
): { rules: Rule[]; conflicts: ConflictTrace[] } {
  const fieldRulesMap: Record<string, Rule & { priority: number; strategy: string; source: string }> = {};
  const conflictTraces: ConflictTrace[] = [];

  console.log(`Merging rules for access codes: ${accessCodes.join(', ')}`);
  console.log(`Using schema version: ${schemaVersion}`);

  accessCodes.forEach(code => {
    const config: any = accessCodeRules[code];
    if (!config || config.schemaVersion !== schemaVersion) {
      console.log(`Skipping ${code} due to missing or mismatched schemaVersion`);
      return;
    }

    const strategy = config.mergeStrategy || 'most-restrictive';
    const priority = config.priority || 0;

    console.log(`\n Evaluating access code: ${code}`);
    console.log(` Strategy: ${strategy}, priority: ${priority}`);

    const expandedRules = expandFieldSets(config.rules);

    expandedRules.forEach((rule: Rule) => {
      const field = rule.field;
      const existing = fieldRulesMap[field];
      const incoming = { ...rule, priority, strategy, source: code };
      const taggedIncoming = { ...rule, strategy, source: code, priority };

      console.log(` Rule: ${JSON.stringify(rule)}`);

      // First rule wins if no conflict
      if (!existing) {
        fieldRulesMap[field] = incoming;
        console.log(` No previous rule found for ${field}. Taking new rule.`);
        return;
      }

      const taggedExisting = { ...existing };
      let shouldReplace = false;
      let reason = '';

      const levelNew = getRestrictivenessLevel(rule.action);
      const levelOld = getRestrictivenessLevel(existing.action);

      console.log(`Conflict detected on field: ${field}`);
      console.log(` Existing: action=${existing.action}, strategy=${existing.strategy}, priority=${existing.priority}, source=${existing.source}`);
      console.log(` Incoming: action=${rule.action}, strategy=${strategy}, priority=${priority}, source=${code}`);

      // Conflict resolution strategy
      if (strategy === 'most-restrictive') {
        if (levelNew > levelOld || (levelNew === levelOld && priority > existing.priority)) {
          shouldReplace = true;
          reason = 'more restrictive or higher priority (most-restrictive)';
        }
      }

      if (strategy === 'least-restrictive') {
        if (levelNew < levelOld || (levelNew === levelOld && priority > existing.priority)) {
          shouldReplace = true;
          reason = 'less restrictive or higher priority (least-restrictive)';
        }
      }

      if (strategy === 'first-match') {
        // First match always wins
        shouldReplace = false;
        reason = 'existing rule retained (first-match)';
      }

      // Update rule map and trace
      if (shouldReplace) {
        console.log(`Replacing existing rule with incoming. Reason: ${reason}`);
        conflictTraces.push({
          field,
          ruleA: taggedExisting,
          ruleB: taggedIncoming,
          resolvedTo: taggedIncoming,
          reason
        });
        fieldRulesMap[field] = incoming;
      } else {
        console.log(`Keeping existing rule. Reason: ${reason}`);
        conflictTraces.push({
          field,
          ruleA: taggedExisting,
          ruleB: taggedIncoming,
          resolvedTo: taggedExisting,
          reason
        });
      }
    });
  });

  console.log(`\n Final Merged Rules:`);
  console.log(JSON.stringify(Object.values(fieldRulesMap), null, 2));

  console.log(`\n Conflict Trace:`);
  console.log(JSON.stringify(conflictTraces, null, 2));

  return {
    rules: Object.values(fieldRulesMap),
    conflicts: conflictTraces
  };
}
