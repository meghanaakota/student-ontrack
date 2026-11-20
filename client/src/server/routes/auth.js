const bcrypt = require('bcryptjs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validateCredentials } = require('../utils/auth');

const router = express.Router();
const cookieName = 'ontrack.sid';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again later.' },
});

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

router.post('/register', authLimiter, async (req, res, next) => {
  const credentials = validateCredentials(req.body?.email, req.body?.password);
  if (credentials.error) return res.status(400).json({ error: credentials.error });

  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ email: credentials.email, passwordHash });
    await regenerateSession(req);
    req.session.userId = user.id;
    res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with that email already exists.' });
    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!email || typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
    if (!passwordMatches) return res.status(401).json({ error: 'Email or password is incorrect.' });

    await regenerateSession(req);
    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  if (!req.session.userId) return res.json({ user: null });

  try {
    const user = await User.findById(req.session.userId).select('_id email');
    res.json({ user: user ? { id: user.id, email: user.email } : null });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie(cookieName, cookieOptions);
    res.json({ ok: true });
  });
});

module.exports = router;
