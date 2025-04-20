import { resolvePaths } from '../src/utils/pathUtils';

describe('resolvePaths', () => {
  const customer = {
    accounts: [
      { balance: 100 },
      { balance: 200 }
    ],
    contact: {
      email: 'test@example.com'
    }
  };

  it('should resolve normal paths', () => {
    const paths = resolvePaths(customer, 'contact.email');
    expect(paths).toEqual(['contact.email']);
  });

  it('should resolve wildcard array paths', () => {
    const paths = resolvePaths(customer, 'accounts[i].balance');
    expect(paths).toEqual(['accounts[0].balance', 'accounts[1].balance']);
  });

  it('should resolve specific array index', () => {
    const paths = resolvePaths(customer, 'accounts[1].balance');
    expect(paths).toEqual(['accounts[1].balance']);
  });

  it('should return empty if path not found', () => {
    const paths = resolvePaths(customer, 'nonexistent[i].x');
    expect(paths).toEqual([]);
  });
});
