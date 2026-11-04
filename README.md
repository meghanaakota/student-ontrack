# Student OnTrack

A full-stack MERN app with two tools on one landing page:

1. **Study Planner**: add assignments and seminars (deadline, total hours, minimum days, priority). It builds a day-by-day plan showing how long to spend on each task, what is pending, what is at risk, and a 14-day calendar.
2. **Attendance Tracker**: per-subject attendance against your 75% rule, with holidays counted. Shows classes you must attend, classes you can skip, and a what-if calculator.

Stack: React (Vite) + Express + MongoDB (Mongoose).

## Run it

You need Node.js 18+ and MongoDB (local install, or a free MongoDB Atlas cluster).

```bash
# 1. API
cd server
npm install
cp .env.example .env      # edit MONGODB_URI if you use Atlas
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173.

Single-server mode: run `npm run build` in `client`, then `npm start` in `server`.
Express then serves the built site at http://localhost:5000.

## Tests

```bash
cd server && npm test
```

Covers the attendance maths and the planner scheduler.

## How the planner decides

- Each task has a **pace** = total hours / minimum days (5 h over 5 days = 1 h/day).
- Every day, your available hours are given out in this order: urgent tasks (no slack before the deadline), then higher priority, then earliest deadline.
- If you run out of hours, lower priority tasks are deferred or shortened, and any task that cannot finish before its deadline is marked **At risk**.
- Use **Log hours** after studying so tomorrow's plan reflects real progress.

## How attendance is calculated

```
semester total = classes held + (upcoming classes - holiday classes)
required       = ceil(target% x semester total)
must attend    = required - attended so far
can skip       = remaining classes - must attend
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/tasks/plan?date=YYYY-MM-DD&capacity=4 | Plan for a day, calendar, task summary |
| POST | /api/tasks | Add a task |
| POST | /api/tasks/:id/log | Log hours worked |
| PATCH / DELETE | /api/tasks/:id | Edit / delete |
| GET | /api/attendance | Subjects with calculated numbers |
| POST | /api/attendance | Add subject |
| POST | /api/attendance/:id/mark | Record a class (present or absent) |
| POST | /api/attendance/calc | Stateless what-if calculator |
| PATCH / DELETE | /api/attendance/:id | Edit / delete |

## Ideas for next steps

- User accounts (JWT) so each student has their own data.
- Import the timetable and holiday list to fill in class counts automatically.
- Email or browser reminders for tasks that are at risk.
