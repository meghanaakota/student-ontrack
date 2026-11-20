# Student OnTrack

A responsive full-stack MERN app with two tools on one landing page:

1. **Study Planner**: add assignments and seminars (deadline, total hours, minimum days, priority). It builds a day-by-day plan showing how long to spend on each task, what is pending, what is at risk, and a 14-day calendar.
2. **Attendance Tracker**: per-subject attendance against your 75% rule, with holidays counted. Shows classes you must attend, classes you can skip, and a what-if calculator.

Stack: React (Vite) + Express + MongoDB (Mongoose).

## Run locally

You need Node.js 18+ and MongoDB (local install, or a MongoDB Atlas cluster). Open two terminals from the project root. For local development, the API generates a temporary session secret if `SESSION_SECRET` is not set; set a persistent secret in `client/src/server/.env` to keep sessions across restarts.

```bash
# 1. API
cd client/src/server
npm install
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173. The Vite development server proxies `/api` requests to the API on port 5000.

## Use on a phone or another computer on your Wi-Fi

Start the API as above. Then, from `client`, run:

```bash
npm run dev -- --host 0.0.0.0
```

Find this computer's private IPv4 address on Windows with `ipconfig`, then open `http://<computer-ip>:5173` on a phone or laptop connected to the same Wi-Fi (for example, `http://192.168.1.25:5173`). Allow Node.js through Windows Firewall for private networks if prompted. This link works only while both development servers and MongoDB are running on the same network. It uses plain HTTP, so only use it on a trusted private Wi-Fi network; use the hosted HTTPS deployment for public or untrusted networks.

## Production single-server mode

From the project root:

```bash
cd client
npm install
npm run build
cd src/server
npm install
npm start
```

The Express API serves the built frontend and API on port 5000. Configure `MONGODB_URI` in the server environment before starting. Do not expose a local MongoDB instance directly to the internet.

## Accounts and data privacy

Create an account at `/register` with a valid email address and a password of at least 12 characters. Accounts have separate task and attendance records; sign in on your phone and laptop with the same account to see your own data. Existing records from before accounts were added are left unassigned and are not visible to any account; no records are automatically claimed by the first person who signs up.

## Deploy for a public HTTPS URL (Render + MongoDB Atlas)

1. Push this project to a Git provider and create a MongoDB Atlas cluster. Create a database user with a strong unique password.
2. In Atlas, configure network access for the Render service's outbound IP addresses and copy the cluster connection string. Do not commit the URI or put it in frontend files.
3. In Render, create a Blueprint from the repository and select the included `render.yaml`. The blueprint builds the client and starts the Express server; Render generates a private `SESSION_SECRET`.
4. In the Render service's environment settings, set `MONGODB_URI` to the Atlas connection string and deploy. Open the public `https://...onrender.com` URL shown by Render; it works from mobile and desktop browsers.

The app supports password sign-up/login and isolates data by account, but does not yet include email verification or password reset. Before broad public use, add those account recovery/abuse controls and review backups, retention, privacy notice, and Atlas network access. A Render free service may sleep when idle and take time to wake.

## Publish a permanent public URL

Deploy the client and API behind HTTPS on a hosting provider and use a hosted MongoDB database such as MongoDB Atlas. Configure `MONGODB_URI` as a private server-side environment variable, deploy the client build with the API (single-server mode), and use the host's public HTTPS URL. A public deployment requires a hosting account, database configuration, and production security review; the local Wi-Fi link above is not publicly accessible.

## Tests

The client:

```bash
cd client
npm test
npm run build
```

The API:

```bash
cd client/src/server
npm test
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
| POST | /api/auth/register | Create an account and sign in |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Get the current account |
| POST | /api/auth/logout | Sign out |
| GET | /api/tasks/plan?date=YYYY-MM-DD&capacity=4 | Plan for a day, calendar, task summary |
| POST | /api/tasks | Add a task |
| POST | /api/tasks/:id/log | Log hours worked |
| PATCH / DELETE | /api/tasks/:id | Edit / delete |
| GET | /api/attendance | Subjects with calculated numbers |
| POST | /api/attendance | Add subject |
| POST | /api/attendance/:id/mark | Record a class (present or absent) |
| POST | /api/attendance/calc | Stateless what-if calculator |
| PATCH / DELETE | /api/attendance/:id | Edit / delete |

Task and attendance endpoints require an authenticated session and only return records owned by that account.

## Ideas for next steps

- User accounts (JWT) so each student has their own data.
- Import the timetable and holiday list to fill in class counts automatically.
- Email or browser reminders for tasks that are at risk.
