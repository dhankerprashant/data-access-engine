import { mergeRulesWithTrace, resolveAccessCodes } from '../src/services/ruleResolver';

describe('mergeRulesWithTrace', () => {
  it('merges correctly with most-restrictive strategy', () => {
    const result = mergeRulesWithTrace(['ACCESS_CODE_BASIC'], 'v1.0');
    expect(Array.isArray(result.rules)).toBe(true);
    expect(result.rules.length).toBeGreaterThan(0);
  });

  it('handles mismatched schema version gracefully', () => {
    const result = mergeRulesWithTrace(['ACCESS_CODE_BASIC'], 'v9.9'); // invalid version
    expect(result.rules).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it('resolves access codes from ldap groups', () => {
    const ldapGroups = ['LDAP_SUPPORT_TEAM', 'LDAP_FINANCE_TEAM'];
    const codes = resolveAccessCodes(ldapGroups);
    expect(codes).toEqual(expect.arrayContaining(['ACCESS_CODE_BASIC']));
  });

  it('evaluates first-match strategy and retains first rule', () => {
    const result = mergeRulesWithTrace(['ACCESS_CODE_CONFLICT_MASK', 'ACCESS_CODE_CONFLICT_HIDE'], 'v1.0');
    const emailRule = result.rules.find(r => r.field === 'contactInformation.email');
    expect(emailRule?.action).toBe('mask'); // from first access code
  });

  it('evaluates most-restrictive override', () => {
    const result = mergeRulesWithTrace(['ACCESS_CODE_PII'], 'v1.0');
    const rule = result.rules.find(r => r.field === 'audit.lastUpdatedBy');
    expect(rule?.action).toBe('truncate');
    expect(rule?.priority).toBe(100);
  });
});