import { useCallback, useEffect, useState } from 'react';
import { api, dateStr, prettyDate } from '../api.js';

const PRIORITY = { 1: 'High', 2: 'Medium', 3: 'Low' };
const STATUS = { 'on-track': 'On track', 'at-risk': 'At risk', overdue: 'Overdue' };

const emptyForm = { title: '', deadline: dateStr(7), totalHours: 5, minDays: 5, priority: 2 };

export default function Planner() {
  const [date, setDate] = useState(dateStr(0));
  const [capacity, setCapacity] = useState(4);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api.getPlan(date, capacity));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [date, capacity]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    act(async () => {
      await api.addTask({
        ...form,
        totalHours: Number(form.totalHours),
        minDays: Number(form.minDays),
        priority: Number(form.priority),
      });
      setForm({ ...emptyForm, deadline: form.deadline });
    });
  };

  const logHours = (t) => {
    const v = window.prompt(`Hours you worked on "${t.title}":`, '1');
    if (v && Number(v) > 0) act(() => api.logHours(t.id, Number(v)));
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const plan = data?.plan;

  return (
    <div className="page">
      <h1 className="page-title">Study Planner</h1>
      {error && <div className="alert">{error}. Is the server running?</div>}

      <section className="card controls">
        <label>
          Plan for
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="quick">
          <button className="ghost" onClick={() => setDate(dateStr(0))}>Today</button>
          <button className="ghost" onClick={() => setDate(dateStr(1))}>Tomorrow</button>
        </div>
        <label>
          Hours I can study that day
          <input
            type="number" min="0.5" max="16" step="0.5" value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) || 4)}
          />
        </label>
      </section>

      <div className="two-col">
        <section className="card">
          <h2>Plan for {prettyDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          {!plan || plan.items.length === 0 ? (
            <p className="muted">Nothing to study. Add a task to get started.</p>
          ) : (
            <>
              <p className="muted">
                {plan.totalHours} of {capacity} hours planned
              </p>
              <ul className="plan-list">
                {plan.items.map((i) => (
                  <li key={i.taskId} className={i.deferred ? 'deferred' : ''}>
                    <div>
                      <strong>{i.title}</strong>
                      <div className="meta">
                        <span className={`tag p${i.priority}`}>{PRIORITY[i.priority]}</span>
                        <span>due {prettyDate(i.deadline)}</span>
                        {i.critical && <span className="tag danger">urgent</span>}
                        {i.late && <span className="tag danger">past deadline</span>}
                      </div>
                    </div>
                    <div className="hours">
                      {i.deferred ? (
                        <small>No time left. Move it to the next day.</small>
                      ) : (
                        <>
                          <b>{i.hours} h</b>
                          {i.short && <small>wanted {i.wanted} h</small>}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card">
          <h2>Add a task</h2>
          <form onSubmit={submit} className="form">
            <label>
              Task
              <input required placeholder="e.g. Complete AI assignment" value={form.title} onChange={set('title')} />
            </label>
            <div className="row">
              <label>
                Deadline
                <input required type="date" value={form.deadline} onChange={set('deadline')} />
              </label>
              <label>
                Priority
                <select value={form.priority} onChange={set('priority')}>
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label>
                Total hours needed
                <input required type="number" min="0.25" step="0.25" value={form.totalHours} onChange={set('totalHours')} />
              </label>
              <label>
                Minimum days it needs
                <input required type="number" min="1" value={form.minDays} onChange={set('minDays')} />
              </label>
            </div>
            <p className="hint">
              Example: 5 hours over at least 5 days means about 1 hour a day.
            </p>
            <button className="primary">Add task</button>
          </form>
        </section>
      </div>

      <section className="card">
        <h2>Pending tasks</h2>
        {!data || data.tasks.length === 0 ? (
          <p className="muted">No pending tasks.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th><th>Deadline</th><th>Progress</th><th>Daily pace</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.title}</strong>
                      <div className="meta"><span className={`tag p${t.priority}`}>{PRIORITY[t.priority]}</span></div>
                    </td>
                    <td>
                      {prettyDate(t.deadline)}
                      <div className="meta">{t.daysLeft < 0 ? `${-t.daysLeft} d ago` : `${t.daysLeft} d left`}</div>
                    </td>
                    <td>
                      <div className="bar"><i style={{ width: `${(t.hoursDone / t.totalHours) * 100}%` }} /></div>
                      <div className="meta">{t.hoursDone} / {t.totalHours} h</div>
                    </td>
                    <td>{t.dailyPace} h/day</td>
                    <td><span className={`tag ${t.status}`}>{STATUS[t.status]}</span></td>
                    <td className="actions">
                      <button className="ghost" onClick={() => logHours(t)}>Log hours</button>
                      <button className="ghost" onClick={() => act(() => api.updateTask(t.id, { completed: true }))}>Done</button>
                      <button className="ghost danger" onClick={() => window.confirm('Delete this task?') && act(() => api.deleteTask(t.id))}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Calendar: next 14 days</h2>
        <div className="calendar">
          {data?.calendar.slice(0, 14).map((d) => (
            <div key={d.date} className={`day ${d.date === dateStr(0) ? 'today' : ''} ${d.date === date ? 'selected' : ''}`} onClick={() => setDate(d.date)}>
              <div className="day-head">
                <span>{prettyDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <b>{d.totalHours ? `${d.totalHours} h` : '-'}</b>
              </div>
              {d.deadlines.map((n) => (
                <div key={n} className="chip deadline">Due: {n}</div>
              ))}
              {d.items.filter((i) => i.hours > 0).map((i) => (
                <div key={i.taskId} className={`chip p${i.priority}`}>
                  {i.title} · {i.hours} h
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
