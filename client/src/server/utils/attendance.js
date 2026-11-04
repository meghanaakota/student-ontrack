// Attendance maths.
//
// Semester total = classes held so far + (upcoming classes - holidays).
// To pass you need ceil(target% of the semester total) attended classes.

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

function compute({ held = 0, attended = 0, upcoming = 0, holidays = 0, target = 75 }) {
  held = Math.max(0, Math.floor(held));
  attended = Math.min(Math.max(0, Math.floor(attended)), held);
  upcoming = Math.max(0, Math.floor(upcoming));
  holidays = Math.min(Math.max(0, Math.floor(holidays)), upcoming);
  target = Math.min(100, Math.max(1, target));

  const remaining = upcoming - holidays;
  const total = held + remaining;

  const required = Math.ceil((target / 100) * total - 1e-9);
  const mustAttend = Math.max(0, required - attended);
  const possible = mustAttend <= remaining;
  const canSkip = possible ? remaining - mustAttend : 0;

  const currentPct = pct(attended, held);
  const maxPossiblePct = pct(attended + remaining, total);
  const minPct = pct(attended, total); // if you skip every remaining class

  // On today's numbers only: classes you can miss in a row / must attend in a row.
  const skipNow = Math.max(0, Math.floor((attended * 100) / target - held + 1e-9));
  const needNow =
    currentPct !== null && currentPct < target && target < 100
      ? Math.ceil((target * held - 100 * attended) / (100 - target) - 1e-9)
      : 0;

  let status = 'safe';
  if (!possible) status = 'impossible';
  else if (mustAttend > 0 && mustAttend >= remaining * 0.85) status = 'danger';
  else if (mustAttend > 0) status = 'watch';

  let advice;
  if (total === 0) advice = 'Add your class counts to see your attendance plan.';
  else if (!possible)
    advice = `Even attending all ${remaining} remaining classes only gets you to ${maxPossiblePct}%, below ${target}%. Talk to your faculty about condonation.`;
  else if (mustAttend === 0)
    advice = `You are safe. You can skip up to ${canSkip} of the ${remaining} remaining classes and still finish at ${target}% or more.`;
  else
    advice = `Attend at least ${mustAttend} of the ${remaining} remaining classes (you can skip ${canSkip}) to finish at ${target}% or more.`;

  return {
    held, attended, upcoming, holidays, target,
    remaining, total, required,
    mustAttend, canSkip, possible, status,
    currentPct, maxPossiblePct, minPct,
    skipNow, needNow, advice,
  };
}

// Compare the same subject with and without the holidays so the student can
// see how much the holidays change things.
function computeWithImpact(input) {
  const base = compute(input);
  const noHol = compute({ ...input, holidays: 0 });
  return {
    ...base,
    holidayImpact: {
      mustAttendWithout: noHol.mustAttend,
      canSkipWithout: noHol.canSkip,
      classesLost: base.holidays,
    },
  };
}

module.exports = { compute, computeWithImpact, pct };
