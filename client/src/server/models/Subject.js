const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Classes conducted so far / classes the student attended.
    held: { type: Number, default: 0, min: 0 },
    attended: { type: Number, default: 0, min: 0 },
    // Classes still scheduled for the rest of the semester (before holidays).
    upcoming: { type: Number, default: 0, min: 0 },
    // Upcoming classes that will not happen because of holidays.
    holidays: { type: Number, default: 0, min: 0 },
    // Required attendance percentage.
    target: { type: Number, default: 75, min: 1, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
