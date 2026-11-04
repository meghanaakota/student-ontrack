import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Planner from './pages/Planner.jsx';
import Attendance from './pages/Attendance.jsx';

export default function App() {
  return (
    <>
      <header className="nav">
        <NavLink to="/" className="brand">
          Student <span>OnTrack</span>
        </NavLink>
        <nav>
          <NavLink to="/planner">Study Planner</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
