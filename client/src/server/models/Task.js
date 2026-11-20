const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    // Stored as 'YYYY-MM-DD' so time zones never shift the date.
    deadline: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    // Total effort needed, in hours (e.g. AI assignment = 5 days x 1 h = 5).
    totalHours: { type: Number, required: true, min: 0.25 },
    // Minimum number of days the work needs to be spread across.
    minDays: { type: Number, default: 1, min: 1 },
    // 1 = high, 2 = medium, 3 = low
    priority: { type: Number, enum: [1, 2, 3], default: 2 },
    hoursDone: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
