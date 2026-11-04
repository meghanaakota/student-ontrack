import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">Your semester, under control</p>
        <h1>
          Student <span>OnTrack</span>
        </h1>
        <p className="lead">
          Know exactly what to study today, and exactly how many classes you can afford to miss.
          Two tools, one place.
        </p>
      </section>

      <section className="home-grid">
        <Link to="/planner" className="home-card planner">
          <div className="icon">📅</div>
          <h2>Study Planner</h2>
          <p>
            Add assignments and seminars with deadlines, effort and priority. Get a daily plan
            that says how long to spend on each task, what is pending, and a full calendar.
          </p>
          <span className="cta">Open planner →</span>
        </Link>

        <Link to="/attendance" className="home-card attendance">
          <div className="icon">✅</div>
          <h2>Attendance Tracker</h2>
          <p>
            Track every subject against your 75% rule. Holidays are counted, so you see how many
            classes you must attend and how many you can safely skip.
          </p>
          <span className="cta">Open attendance →</span>
        </Link>
      </section>
    </div>
  );
}
