import { describe, expect, it } from 'vitest';
import { normalizeEmail, validateCredentials } from '../utils/auth.js';

describe('account credential validation', () => {
  it('normalizes email addresses', () => {
    expect(normalizeEmail('  Student@Example.COM ')).toBe('student@example.com');
  });

  it('requires a valid email address', () => {
    expect(validateCredentials('not-an-email', 'a sufficiently long password').error)
      .toBe('Enter a valid email address.');
  });

  it('requires a password between 12 and 128 characters', () => {
    expect(validateCredentials('student@example.com', 'short').error)
      .toBe('Password must be between 12 and 128 characters.');
    expect(validateCredentials('student@example.com', 'long-enough-password').email)
      .toBe('student@example.com');
  });
});
