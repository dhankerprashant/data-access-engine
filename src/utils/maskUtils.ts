/**
 * Applies masking to string values based on strategy.
 */
export function applyMask(value: any, type: string): string {
  if (typeof value !== 'string' || !value.trim()) return value;

  switch (type) {
    case 'MASK_ALL':
      return '*'.repeat(value.length);

    case 'MASK_LAST4':
      if (value.length <= 4) return '*'.repeat(value.length);
      return '*'.repeat(value.length - 4) + value.slice(-4);

    case 'MASK_FIRST4':
      if (value.length <= 4) return '*'.repeat(value.length);
      return value.slice(0, 4) + '*'.repeat(value.length - 4);

    case 'EMAIL_MASK':
      const [user, domain] = value.split('@');
      if (!user || !domain) return value; // not a valid email format
      const maskedUser =
        user.length <= 1 ? '*' : user.charAt(0) + '*'.repeat(user.length - 1);
      return `${maskedUser}@${domain}`;

    default:
      return value;
  }
}
