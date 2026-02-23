import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, PlusCircle, Diamond } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MeetingsList from './pages/MeetingsList';
import CreateMeeting from './pages/CreateMeeting';
import MeetingDetail from './pages/MeetingDetail';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Diamond size={20} />
            </div>
            <h1>ClarityMeet</h1>
          </div>
          <nav className="sidebar-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon"><LayoutDashboard size={18} /></span> Dashboard
            </NavLink>
            <NavLink
              to="/meetings"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon"><CalendarDays size={18} /></span> Meetings
            </NavLink>
          </nav>
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: 'auto'
          }}>
            ClarityMeet v1.0<br />
            Meeting Accountability System
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meetings" element={<MeetingsList />} />
            <Route path="/meetings/new" element={<CreateMeeting />} />
            <Route path="/meetings/:id" element={<MeetingDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
