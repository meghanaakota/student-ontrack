import { describe, expect, it } from 'vitest';
import attendance from '../utils/attendance.js';
import planner from '../utils/planner.js';

const { compute } = attendance;
const { buildSchedule } = planner;

describe('attendance calculations', () => {
  it('calculates the minimum required attendance after holidays', () => {
    const result = compute({ held: 30, attended: 24, upcoming: 30, holidays: 6, target: 75 });

    expect(result).toMatchObject({
      remaining: 24,
      total: 54,
      required: 41,
      mustAttend: 17,
      canSkip: 7,
      currentPct: 80,
    });
  });

  it('marks an impossible target', () => {
    const result = compute({ held: 10, attended: 2, upcoming: 5, holidays: 0, target: 75 });

    expect(result).toMatchObject({ possible: false, status: 'impossible' });
  });

  it('handles exact and below-target attendance', () => {
    const atTarget = compute({ held: 4, attended: 3, upcoming: 0, target: 75 });
    const belowTarget = compute({ held: 10, attended: 6, upcoming: 40, target: 75 });

    expect(atTarget).toMatchObject({ skipNow: 0, needNow: 0 });
    expect(belowTarget.needNow).toBe(6);
  });

  it('reduces required attendance when holidays are excluded', () => {
    const noHolidays = compute({ held: 20, attended: 12, upcoming: 20, holidays: 0 });
    const withHolidays = compute({ held: 20, attended: 12, upcoming: 20, holidays: 10 });

    expect(withHolidays.mustAttend).toBeLessThan(noHolidays.mustAttend);
  });
});

describe('planner schedules', () => {
  const tasks = [
    { _id: 'ai', title: 'AI assignment', deadline: '2026-11-15', totalHours: 5, minDays: 5, priority: 1, hoursDone: 0 },
    { _id: 'sem', title: 'Seminar', deadline: '2026-11-09', totalHours: 2, minDays: 1, priority: 3, hoursDone: 0 },
  ];

  it('allocates work within the daily capacity', () => {
    const { schedule, summary } = buildSchedule(tasks, '2026-11-05', 4);
    const day = schedule[0];

    expect(day.date).toBe('2026-11-05');
    expect(day.items.find((item) => item.taskId === 'ai').hours).toBe(1);
    expect(day.items.find((item) => item.taskId === 'sem').hours).toBe(2);
    expect(day.totalHours).toBeLessThanOrEqual(4);
    expect(summary.every((item) => item.status === 'on-track')).toBe(true);
  });

  it('defers lower priority work when capacity is tight', () => {
    const { schedule } = buildSchedule(tasks, '2026-11-05', 1);
    const day = schedule[0];

    expect(day.items.find((item) => item.taskId === 'ai').hours).toBe(1);
    expect(day.items.find((item) => item.taskId === 'sem').deferred).toBe(true);
  });

  it('accounts for progress and overdue tasks', () => {
    const progressed = buildSchedule([{ ...tasks[0], hoursDone: 4 }], '2026-11-10', 4);
    const overdue = buildSchedule([{ ...tasks[1], deadline: '2026-11-01' }], '2026-11-05', 4);

    expect(progressed.summary[0].hoursLeft).toBe(1);
    expect(overdue.summary[0].status).toBe('overdue');
  });
});
