const express = require('express');
const Task = require('../models/Task');
const { buildSchedule } = require('../utils/planner');

const router = express.Router();

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const todayUTC = () => new Date().toISOString().slice(0, 10);

// ---- Planner (must be defined before '/:id' routes) ----
// GET /api/tasks/plan?date=2026-11-05&capacity=4
router.get('/plan', async (req, res, next) => {
  try {
    const date = isDate(req.query.date) ? req.query.date : todayUTC();
    const capacity = Math.min(16, Math.max(0.5, Number(req.query.capacity) || 4));
    const tasks = await Task.find({ ownerId: req.user._id, completed: false }).lean();
    const { schedule, summary } = buildSchedule(tasks, date, capacity);
    res.json({ date, capacity, plan: schedule[0], calendar: schedule, tasks: summary });
  } catch (e) {
    next(e);
  }
});

// ---- CRUD ----
router.get('/', async (req, res, next) => {
  try {
    res.json(await Task.find({ ownerId: req.user._id }).sort({ completed: 1, deadline: 1 }));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, deadline, totalHours, minDays, priority, notes } = req.body;
    if (!title || !isDate(deadline) || !(Number(totalHours) > 0)) {
      return res.status(400).json({ error: 'title, deadline (YYYY-MM-DD) and totalHours > 0 are required' });
    }
    const task = await Task.create({
      ownerId: req.user._id,
      title,
      deadline,
      totalHours: Number(totalHours),
      minDays: Math.max(1, Number(minDays) || 1),
      priority: [1, 2, 3].includes(Number(priority)) ? Number(priority) : 2,
      notes,
    });
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'deadline', 'totalHours', 'minDays', 'priority', 'hoursDone', 'completed', 'notes'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      update,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (e) {
    next(e);
  }
});

// Log hours worked today: POST /api/tasks/:id/log { hours: 1.5 }
router.post('/:id/log', async (req, res, next) => {
  try {
    const hours = Number(req.body.hours);
    if (!(hours > 0)) return res.status(400).json({ error: 'hours must be greater than 0' });
    const task = await Task.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.hoursDone = Math.min(task.totalHours, task.hoursDone + hours);
    if (task.hoursDone >= task.totalHours) task.completed = true;
    await task.save();
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
