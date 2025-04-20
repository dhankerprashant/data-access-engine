import { applyMask } from '../src/utils/maskUtils';

describe('applyMask', () => {
  it('masks all characters', () => {
    expect(applyMask('SensitiveData1', 'MASK_ALL')).toBe('**************'); // 14 characters
  });

  it('masks last 4 characters', () => {
    expect(applyMask('1234567890', 'MASK_LAST4')).toBe('******7890');
  });

  it('masks first 4 characters', () => {
    expect(applyMask('1234567890', 'MASK_FIRST4')).toBe('1234******');
  });

  it('masks email correctly', () => {
    expect(applyMask('john.doe@example.com', 'EMAIL_MASK')).toBe('j*******@example.com');
    expect(applyMask('a@b.com', 'EMAIL_MASK')).toBe('*@b.com');
    expect(applyMask('ab@domain.com', 'EMAIL_MASK')).toBe('a*@domain.com');
  });

  it('returns original value for unknown mask', () => {
    expect(applyMask('test', 'UNKNOWN')).toBe('test');
  });

  it('returns non-string values unchanged', () => {
    expect(applyMask(123456, 'MASK_ALL')).toBe(123456);
  });

  it('returns original value if string is empty or whitespace', () => {
    expect(applyMask('', 'MASK_ALL')).toBe('');
    expect(applyMask('   ', 'MASK_ALL')).toBe('   ');
  });
});