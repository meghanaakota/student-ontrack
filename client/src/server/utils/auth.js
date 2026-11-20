const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function validateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { error: 'Enter a valid email address.' };
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return { error: 'Password must be between 12 and 128 characters.' };
  }
  return { email: normalizedEmail };
}

module.exports = { normalizeEmail, validateCredentials };
