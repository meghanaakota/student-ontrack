const express = require('express');
const Subject = require('../models/Subject');
const { compute, computeWithImpact, pct } = require('../utils/attendance');

const router = express.Router();

const present = (s) => ({ _id: s._id, name: s.name, ...computeWithImpact(s.toObject ? s.toObject() : s) });

// GET /api/attendance  -> every subject with its calculated numbers + overall
router.get('/', async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: 1 });
    const list = subjects.map(present);
    const held = list.reduce((a, s) => a + s.held, 0);
    const attended = list.reduce((a, s) => a + s.attended, 0);
    res.json({ subjects: list, overall: { held, attended, pct: pct(attended, held) } });
  } catch (e) {
    next(e);
  }
});

// POST /api/attendance/calc  -> stateless what-if calculator (nothing is saved)
router.post('/calc', (req, res) => {
  const { held, attended, upcoming, holidays, target } = req.body;
  res.json(
    computeWithImpact({
      held: Number(held) || 0,
      attended: Number(attended) || 0,
      upcoming: Number(upcoming) || 0,
      holidays: Number(holidays) || 0,
      target: Number(target) || 75,
    })
  );
});

router.post('/', async (req, res, next) => {
  try {
    const { name, held, attended, upcoming, holidays, target } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const h = Math.max(0, Number(held) || 0);
    const s = await Subject.create({
      name,
      held: h,
      attended: Math.min(h, Math.max(0, Number(attended) || 0)),
      upcoming: Math.max(0, Number(upcoming) || 0),
      holidays: Math.max(0, Number(holidays) || 0),
      target: Number(target) || 75,
    });
    res.status(201).json(present(s));
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const s = await Subject.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Subject not found' });
    for (const k of ['name', 'held', 'attended', 'upcoming', 'holidays', 'target']) {
      if (k in req.body) s[k] = k === 'name' ? req.body[k] : Number(req.body[k]);
    }
    s.attended = Math.min(s.attended, s.held);
    s.holidays = Math.min(s.holidays, s.upcoming);
    await s.save();
    res.json(present(s));
  } catch (e) {
    next(e);
  }
});

// POST /api/attendance/:id/mark { present: true|false }  -> record one class
router.post('/:id/mark', async (req, res, next) => {
  try {
    const s = await Subject.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Subject not found' });
    s.held += 1;
    if (req.body.present) s.attended += 1;
    if (s.upcoming > 0) {
      s.upcoming -= 1; // this class is no longer "upcoming"
      s.holidays = Math.min(s.holidays, s.upcoming);
    }
    await s.save();
    res.json(present(s));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const s = await Subject.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ error: 'Subject not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
