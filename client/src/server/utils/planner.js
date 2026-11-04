// Day-by-day study scheduler.
//
// Every pending task has a "pace" = totalHours / minDays (the daily load the
// student said it needs). Each day we hand out the available study hours:
//   1. tasks that are critical (no slack left before the deadline) come first,
//   2. then higher priority tasks (1 = high ... 3 = low),
//   3. then the earliest deadline.
// Low-priority work gets squeezed out on busy days instead of everything slipping.

const DAY = 86400000;

const toDay = (str) => new Date(String(str).slice(0, 10) + 'T00:00:00Z').getTime();
const fmt = (ms) => new Date(ms).toISOString().slice(0, 10);
const round2 = (n) => Math.round(n * 100) / 100;

function buildSchedule(tasks, startStr, capacity = 4, horizonDays) {
  const start = toDay(startStr);

  const state = tasks
    .filter((t) => !t.completed)
    .map((t) => {
      const total = Number(t.totalHours);
      return {
        id: String(t._id),
        title: t.title,
        deadline: t.deadline,
        deadlineMs: toDay(t.deadline),
        priority: t.priority || 2,
        totalHours: total,
        hoursDone: Number(t.hoursDone) || 0,
        remaining: Math.max(0, total - (Number(t.hoursDone) || 0)),
        rate: total / Math.max(1, Number(t.minDays) || 1),
        minDays: Number(t.minDays) || 1,
        scheduled: 0,
        finishDay: null,
      };
    });

  const lastDeadline = state.reduce((m, s) => Math.max(m, s.deadlineMs), start);
  const days =
    horizonDays || Math.min(90, Math.max(14, Math.round((lastDeadline - start) / DAY) + 7));

  const schedule = [];

  for (let i = 0; i < days; i++) {
    const dayMs = start + i * DAY;
    let cap = capacity;
    const items = [];

    const active = state
      .filter((s) => s.remaining > 1e-9)
      .map((s) => {
        const daysToDeadline = Math.max(1, Math.round((s.deadlineMs - dayMs) / DAY));
        const daysNeeded = Math.ceil(s.remaining / s.rate - 1e-9);
        return { s, slack: daysToDeadline - daysNeeded };
      })
      .sort(
        (a, b) =>
          (a.slack <= 0 ? 0 : 1) - (b.slack <= 0 ? 0 : 1) ||
          a.s.priority - b.s.priority ||
          a.s.deadlineMs - b.s.deadlineMs
      );

    for (const { s, slack } of active) {
      const want = Math.min(s.rate, s.remaining);
      const hours = Math.max(0, Math.min(want, cap));
      cap -= hours;
      s.remaining -= hours;
      s.scheduled += hours;
      if (s.remaining <= 1e-9 && !s.finishDay) s.finishDay = fmt(dayMs);

      items.push({
        taskId: s.id,
        title: s.title,
        priority: s.priority,
        deadline: s.deadline,
        hours: round2(hours),
        wanted: round2(want),
        deferred: hours < 1e-9, // had no time left today
        short: hours > 1e-9 && hours < want - 1e-9, // got less than it needs
        critical: slack <= 0,
        late: dayMs >= s.deadlineMs, // work happening on/after the deadline
      });
    }

    schedule.push({
      date: fmt(dayMs),
      totalHours: round2(items.reduce((a, x) => a + x.hours, 0)),
      capacity,
      items,
      deadlines: state.filter((s) => s.deadline === fmt(dayMs)).map((s) => s.title),
    });
  }

  const summary = state.map((s) => {
    const daysLeft = Math.round((s.deadlineMs - start) / DAY);
    const finishMs = s.finishDay ? toDay(s.finishDay) : null;
    const onTrack = finishMs !== null && finishMs < s.deadlineMs;
    let status = 'on-track';
    if (daysLeft < 0) status = 'overdue';
    else if (!onTrack) status = 'at-risk';
    return {
      id: s.id,
      title: s.title,
      deadline: s.deadline,
      priority: s.priority,
      totalHours: s.totalHours,
      hoursDone: round2(s.hoursDone),
      hoursLeft: round2(Math.max(0, s.totalHours - s.hoursDone)),
      minDays: s.minDays,
      dailyPace: round2(s.rate),
      daysLeft,
      startBy: fmt(s.deadlineMs - s.minDays * DAY),
      projectedFinish: s.finishDay,
      status,
    };
  });

  return { schedule, summary };
}

module.exports = { buildSchedule, toDay, fmt };
