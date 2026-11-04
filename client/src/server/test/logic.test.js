const assert = require('assert');
const { compute } = require('../utils/attendance');
const { buildSchedule } = require('../utils/planner');

// ---------- Attendance ----------
// 30 held, 24 attended (80%), 30 upcoming, 6 holidays -> 24 remaining, total 54.
// Need ceil(0.75*54)=41 attended -> must attend 17 more, can skip 7.
let a = compute({ held: 30, attended: 24, upcoming: 30, holidays: 6, target: 75 });
assert.strictEqual(a.remaining, 24);
assert.strictEqual(a.total, 54);
assert.strictEqual(a.required, 41);
assert.strictEqual(a.mustAttend, 17);
assert.strictEqual(a.canSkip, 7);
assert.strictEqual(a.currentPct, 80);

// Impossible case: 10 held, 2 attended, 5 remaining -> max (2+5)/15 = 46.7%
a = compute({ held: 10, attended: 2, upcoming: 5, holidays: 0, target: 75 });
assert.strictEqual(a.possible, false);
assert.strictEqual(a.status, 'impossible');

// Exactly at 75% now: 3 of 4 -> skipNow should be 0, needNow 0.
a = compute({ held: 4, attended: 3, upcoming: 0, target: 75 });
assert.strictEqual(a.skipNow, 0);
assert.strictEqual(a.needNow, 0);

// Below target now: 6 of 10 (60%) -> need 6 straight classes to reach 75% (12/16).
a = compute({ held: 10, attended: 6, upcoming: 40, target: 75 });
assert.strictEqual(a.needNow, 6);

// Holidays reduce what must be attended when you are behind (fewer classes in total).
const noHol = compute({ held: 20, attended: 12, upcoming: 20, holidays: 0 });
const hol = compute({ held: 20, attended: 12, upcoming: 20, holidays: 10 });
assert.ok(hol.mustAttend < noHol.mustAttend);

// ---------- Planner ----------
const tasks = [
  { _id: 'ai', title: 'AI assignment', deadline: '2026-11-15', totalHours: 5, minDays: 5, priority: 1, hoursDone: 0 },
  { _id: 'sem', title: 'Seminar', deadline: '2026-11-09', totalHours: 2, minDays: 1, priority: 3, hoursDone: 0 },
];
const { schedule, summary } = buildSchedule(tasks, '2026-11-05', 4);

const day0 = schedule[0];
assert.strictEqual(day0.date, '2026-11-05');
const ai0 = day0.items.find((i) => i.taskId === 'ai');
assert.strictEqual(ai0.hours, 1); // 5 h over 5 days = 1 h/day
const sem0 = day0.items.find((i) => i.taskId === 'sem');
assert.strictEqual(sem0.hours, 2); // fits inside the 4 h budget
assert.ok(day0.totalHours <= 4);
assert.ok(summary.every((s) => s.status === 'on-track'));

// With a 1-hour budget the high-priority task wins and the low-priority one is deferred.
const tight = buildSchedule(tasks, '2026-11-05', 1);
const t0 = tight.schedule[0];
assert.strictEqual(t0.items.find((i) => i.taskId === 'ai').hours, 1);
assert.ok(t0.items.find((i) => i.taskId === 'sem').deferred);

// Logging progress shrinks remaining work.
const progressed = buildSchedule([{ ...tasks[0], hoursDone: 4 }], '2026-11-10', 4);
assert.strictEqual(progressed.summary[0].hoursLeft, 1);

// Overdue task is flagged.
const overdue = buildSchedule([{ ...tasks[1], deadline: '2026-11-01' }], '2026-11-05', 4);
assert.strictEqual(overdue.summary[0].status, 'overdue');

console.log('All logic tests passed');
