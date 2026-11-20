require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const crypto = require('crypto');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/require-auth');

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI
  || (IS_PRODUCTION ? '' : 'mongodb://127.0.0.1:27017/student-ontrack');
const SESSION_SECRET = process.env.SESSION_SECRET
  || (IS_PRODUCTION ? '' : crypto.randomBytes(32).toString('hex'));

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be set to a MongoDB connection string.');
}
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
}

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (IS_PRODUCTION && allowedOrigins.length === 0) {
  throw new Error('FRONTEND_URL must contain the HTTPS origin allowed to call the API.');
}

if (!IS_PRODUCTION) {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

const corsOptions = {
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (!origin || allowedOrigins.includes(origin)) return next();
  return res.status(403).json({ error: 'Origin not allowed.' });
});

if (IS_PRODUCTION) app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.use(
  session({
    name: 'ontrack.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      sameSite: IS_PRODUCTION ? 'none' : 'lax',
      secure: IS_PRODUCTION,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', requireAuth, require('./routes/tasks'));
app.use('/api/attendance', requireAuth, require('./routes/attendance'));

// Serve the built React app when it exists (after `npm run build` in /client).
const dist = path.join(__dirname, '..', '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Central error handler: bad ids / validation errors -> 400, everything else -> 500.
app.use((err, req, res, next) => {
  const bad = err.name === 'CastError' || err.name === 'ValidationError';
  if (!bad) console.error(err);
  res.status(bad ? 400 : 500).json({ error: bad ? err.message : 'Server error' });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API listening on port ${PORT}`)))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
