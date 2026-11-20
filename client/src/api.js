const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return data;
}

// Local date as YYYY-MM-DD (avoids UTC shifting the day for IST users).
export function dateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function prettyDate(s, opts = { day: 'numeric', month: 'short' }) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', opts);
}

export const api = {
  // account
  currentUser: () => req('/auth/me'),
  register: (body) => req('/auth/register', { method: 'POST', body }),
  login: (body) => req('/auth/login', { method: 'POST', body }),
  logout: () => req('/auth/logout', { method: 'POST' }),
  // planner / tasks
  getPlan: (date, capacity) => req(`/tasks/plan?date=${date}&capacity=${capacity}`),
  addTask: (body) => req('/tasks', { method: 'POST', body }),
  logHours: (id, hours) => req(`/tasks/${id}/log`, { method: 'POST', body: { hours } }),
  updateTask: (id, body) => req(`/tasks/${id}`, { method: 'PATCH', body }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),
  // attendance
  getSubjects: () => req('/attendance'),
  addSubject: (body) => req('/attendance', { method: 'POST', body }),
  updateSubject: (id, body) => req(`/attendance/${id}`, { method: 'PATCH', body }),
  markClass: (id, present) => req(`/attendance/${id}/mark`, { method: 'POST', body: { present } }),
  deleteSubject: (id) => req(`/attendance/${id}`, { method: 'DELETE' }),
  calc: (body) => req('/attendance/calc', { method: 'POST', body }),
};
