require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/attendance', require('./routes/attendance'));

// Serve the built React app when it exists (after `npm run build` in /client).
const dist = path.join(__dirname, '..', 'client', 'dist');
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
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-ontrack';

mongoose
  .connect(URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
