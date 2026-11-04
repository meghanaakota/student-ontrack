import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { name: '', held: 0, attended: 0, upcoming: 0, holidays: 0, target: 75 };

function SubjectCard({ s, onChange, onDelete }) {
  const [local, setLocal] = useState({ upcoming: s.upcoming, holidays: s.holidays, held: s.held, attended: s.attended });

  useEffect(() => {
    setLocal({ upcoming: s.upcoming, holidays: s.holidays, held: s.held, attended: s.attended });
  }, [s.upcoming, s.holidays, s.held, s.attended]);

  const save = (k) => () => {
    if (Number(local[k]) !== s[k]) onChange(s._id, { [k]: Number(local[k]) || 0 });
  };
  const edit = (k) => (e) => setLocal({ ...local, [k]: e.target.value });

  const pct = s.currentPct ?? 0;

  return (
    <article className={`card subject ${s.status}`}>
      <div className="subject-head">
        <h3>{s.name}</h3>
        <button className="ghost danger" onClick={() => window.confirm(`Delete ${s.name}?`) && onDelete(s._id)}>Delete</button>
      </div>

      <div className="big">
        {s.currentPct === null ? '--' : `${s.currentPct}%`}
        <small> now ({s.attended}/{s.held})</small>
      </div>
      <div className="bar tall">
        <i style={{ width: `${Math.min(100, pct)}%` }} />
        <u style={{ left: `${s.target}%` }} title={`Target ${s.target}%`} />
      </div>

      <div className="facts">
        <div><b>{s.remaining}</b><span>classes left</span></div>
        <div><b>{s.mustAttend}</b><span>must attend</span></div>
        <div><b>{s.canSkip}</b><span>can skip</span></div>
        <div><b>{s.maxPossiblePct ?? '--'}%</b><span>best possible</span></div>
      </div>

      <p className={`advice ${s.status}`}>{s.advice}</p>
      {s.holidays > 0 && (
        <p className="hint">
          Holidays remove {s.holidays} classes. Without them you could skip {s.holidayImpact.canSkipWithout} instead of {s.canSkip}.
        </p>
      )}
      {s.currentPct !== null && s.currentPct >= s.target && (
        <p className="hint">Right now you could miss {s.skipNow} classes in a row and stay at {s.target}%.</p>
      )}
      {s.currentPct !== null && s.currentPct < s.target && s.needNow > 0 && (
        <p className="hint">Attend the next {s.needNow} classes in a row to get back to {s.target}%.</p>
      )}

      <div className="mark">
        <button className="primary" onClick={() => onChange(s._id, null, true)}>Attended a class</button>
        <button className="ghost" onClick={() => onChange(s._id, null, false)}>Missed a class</button>
      </div>

      <div className="edit-grid">
        <label>Held so far<input type="number" min="0" value={local.held} onChange={edit('held')} onBlur={save('held')} /></label>
        <label>Attended<input type="number" min="0" value={local.attended} onChange={edit('attended')} onBlur={save('attended')} /></label>
        <label>Upcoming classes<input type="number" min="0" value={local.upcoming} onChange={edit('upcoming')} onBlur={save('upcoming')} /></label>
        <label>Holiday classes<input type="number" min="0" value={local.holidays} onChange={edit('holidays')} onBlur={save('holidays')} /></label>
      </div>
    </article>
  );
}

function Calculator() {
  const [f, setF] = useState({ held: 40, attended: 28, upcoming: 30, holidays: 5, target: 75 });
  const [r, setR] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const t = setTimeout(() => {
      api.calc({ held: +f.held, attended: +f.attended, upcoming: +f.upcoming, holidays: +f.holidays, target: +f.target })
        .then(setR).catch(() => setR(null));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  return (
    <section className="card">
      <h2>What-if calculator</h2>
      <p className="muted">Try different numbers without saving anything.</p>
      <div className="edit-grid five">
        <label>Held<input type="number" min="0" value={f.held} onChange={set('held')} /></label>
        <label>Attended<input type="number" min="0" value={f.attended} onChange={set('attended')} /></label>
        <label>Upcoming<input type="number" min="0" value={f.upcoming} onChange={set('upcoming')} /></label>
        <label>Holidays<input type="number" min="0" value={f.holidays} onChange={set('holidays')} /></label>
        <label>Target %<input type="number" min="1" max="100" value={f.target} onChange={set('target')} /></label>
      </div>
      {r && (
        <>
          <div className="facts">
            <div><b>{r.currentPct ?? '--'}%</b><span>current</span></div>
            <div><b>{r.mustAttend}</b><span>must attend of {r.remaining}</span></div>
            <div><b>{r.canSkip}</b><span>can skip</span></div>
            <div><b>{r.maxPossiblePct ?? '--'}%</b><span>best possible</span></div>
          </div>
          <p className={`advice ${r.status}`}>{r.advice}</p>
        </>
      )}
    </section>
  );
}

export default function Attendance() {
  const [data, setData] = useState({ subjects: [], overall: null });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api.getSubjects());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (id, body, present) => {
    try {
      if (body) await api.updateSubject(id, body);
      else await api.markClass(id, present);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteSubject(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.addSubject(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === 'name' ? v : Number(v)])));
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const o = data.overall;

  return (
    <div className="page">
      <h1 className="page-title">Attendance Tracker</h1>
      {error && <div className="alert">{error}. Is the server running?</div>}

      {o && o.held > 0 && (
        <section className="card overall">
          <div>
            <span className="muted">Overall attendance</span>
            <div className="big">{o.pct}%</div>
          </div>
          <span className="muted">{o.attended} of {o.held} classes attended across all subjects</span>
        </section>
      )}

      <section className="card">
        <h2>Add a subject</h2>
        <form onSubmit={submit} className="form">
          <label>
            Subject
            <input required placeholder="e.g. Data Structures" value={form.name} onChange={set('name')} />
          </label>
          <div className="edit-grid five">
            <label>Classes held so far<input type="number" min="0" value={form.held} onChange={set('held')} /></label>
            <label>Classes attended<input type="number" min="0" value={form.attended} onChange={set('attended')} /></label>
            <label>Upcoming classes<input type="number" min="0" value={form.upcoming} onChange={set('upcoming')} /></label>
            <label>Of those, on holidays<input type="number" min="0" value={form.holidays} onChange={set('holidays')} /></label>
            <label>Target %<input type="number" min="1" max="100" value={form.target} onChange={set('target')} /></label>
          </div>
          <button className="primary">Add subject</button>
        </form>
      </section>

      <div className="subjects">
        {data.subjects.map((s) => (
          <SubjectCard key={s._id} s={s} onChange={change} onDelete={remove} />
        ))}
      </div>
      {data.subjects.length === 0 && <p className="muted">No subjects yet. Add one above.</p>}

      <Calculator />
    </div>
  );
}
