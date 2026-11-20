import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { AuthPage, ProtectedRoute, useAuth } from './Auth.jsx';
import Home from './pages/Home.jsx';
import Planner from './pages/Planner.jsx';
import Attendance from './pages/Attendance.jsx';

export default function App() {
  const { user, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState('');

  const logout = async () => {
    setSignOutError('');
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error.message);
    }
  };

  return (
    <>
      <header className="nav">
        <NavLink to="/" className="brand">
          Student <span>OnTrack</span>
        </NavLink>
        <nav>
          {user && (
            <>
              <NavLink to="/planner">Study Planner</NavLink>
              <NavLink to="/attendance">Attendance</NavLink>
              <span className="account-email">{user.email}</span>
              <button className="ghost account-button" onClick={logout}>Sign out</button>
            </>
          )}
          {!user && (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Create account</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>
        {signOutError && <div className="alert" role="alert">{signOutError}</div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
