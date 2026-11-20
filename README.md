# Student OnTrack

A responsive full-stack MERN app with two tools on one landing page:

1. **Study Planner**: add assignments and seminars (deadline, total hours, minimum days, priority). It builds a day-by-day plan showing how long to spend on each task, what is pending, what is at risk, and a 14-day calendar.
2. **Attendance Tracker**: per-subject attendance against your 75% rule, with holidays counted. Shows classes you must attend, classes you can skip, and a what-if calculator.

Stack: React (Vite) + Express + MongoDB (Mongoose).

## Run locally

You need Node.js 20.19+ (or 22.12+) and MongoDB (local install, or a MongoDB Atlas cluster). Open two terminals from the project root. For local development, the API generates a temporary session secret if `SESSION_SECRET` is not set; set a persistent secret in `client/src/server/.env` to keep sessions across restarts.

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

The Express API serves the built frontend and API on port 5000. Configure `MONGODB_URI`, `SESSION_SECRET`, and `FRONTEND_URL` (the app's own HTTPS origin) in the server environment before starting. Do not expose a local MongoDB instance directly to the internet.

## Accounts and data privacy

Create an account at `/register` with a valid email address and a password of at least 12 characters. Accounts have separate task and attendance records; sign in on your phone and laptop with the same account to see your own data. Existing records from before accounts were added are left unassigned and are not visible to any account; no records are automatically claimed by the first person who signs up.

## Deploy the frontend and API on Render

The API is deployed at `https://student-ontrack.onrender.com`. The included Blueprint also defines a Render Static Site named `student-ontrack-frontend`, which builds the React app and points it at that API. The frontend is served from one public HTTPS URL; Render rewrites client-side routes such as `/login` to `index.html`.

1. The Blueprint pins both services to the `modernize/typescript-20261120072029` branch, which contains the authenticated backend; `main` currently has the older unauthenticated API. Create or update the Render Blueprint from this repository's root-level `render.yaml`. After merging these changes into `main`, change both `branch` values in `render.yaml` to `main` before syncing the Blueprint.
2. Create a MongoDB Atlas cluster and database user. Configure Atlas Network Access for Render and set `MONGODB_URI` in the API service's private environment. Never put this value in frontend variables or source control.
3. Set `SESSION_SECRET` to a random value of at least 32 characters and `FRONTEND_URL` to the exact HTTPS URL assigned to the `student-ontrack-frontend` Static Site. If Render assigns a different URL or you add a custom domain, update `FRONTEND_URL` on the API and `VITE_API_URL` on the Static Site, then redeploy both.
4. The Static Site build uses `VITE_API_URL=https://student-ontrack.onrender.com`; this is a public API URL, not a secret. Deploy both services and open the Static Site URL to use the app on phones and computers.

The API allows credentialed requests only from the configured frontend origin. Production session cookies are `HttpOnly`, `Secure`, and `SameSite=None` so sign-in can work across the two Render services. Browser third-party-cookie restrictions can interfere with cross-site cookies; for the most reliable sign-in across browsers, use custom frontend/API domains under the same registrable domain (for example, `app.example.edu` and `api.example.edu`) and set `FRONTEND_URL` and `VITE_API_URL` to those domains.

If you already manage the API service outside this Blueprint, configure `MONGODB_URI`, `SESSION_SECRET`, and `FRONTEND_URL` in the existing Render service and create only the Static Site from the same configuration. Render's free web service may sleep when idle and take time to wake.

The app supports password sign-up/login and isolates data by account, but does not yet include email verification or password reset. Before broad public use, add those account recovery/abuse controls and review backups, retention, privacy notice, and Atlas network access. A Render free service may sleep when idle and take time to wake.

## Use a custom public URL

After deploying the Render services, add custom domains to the Static Site and API service in Render. For reliable session cookies across browsers, use two hostnames under the same registrable domain (for example, `app.example.edu` and `api.example.edu`), set `FRONTEND_URL` to the frontend origin, and set the Static Site's `VITE_API_URL` to the API origin.

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

- Email verification and password recovery for accounts.
- Import the timetable and holiday list to fill in class counts automatically.
- Email or browser reminders for tasks that are at risk.
