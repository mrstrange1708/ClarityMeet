import { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';
import { Link } from 'react-router-dom';
import {
    CalendarDays,
    ClipboardList,
    AlertTriangle,
    FileEdit,
    Plus,
    Clock,
    User,
    CalendarOff,
    Lock,
} from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboard()
            .then((res) => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
            </div>
        );
    }

    const counts = data?.counts || {};

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Operational overview — meetings, action items, and accountability</p>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card cyan">
                    <div className="stat-icon cyan"><CalendarDays size={22} /></div>
                    <div className="stat-info">
                        <h3>{counts.upcoming || 0}</h3>
                        <p>Upcoming Meetings</p>
                    </div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-icon amber"><ClipboardList size={22} /></div>
                    <div className="stat-info">
                        <h3>{counts.open_actions || 0}</h3>
                        <p>Open Action Items</p>
                    </div>
                </div>
                <div className="stat-card rose">
                    <div className="stat-icon rose"><AlertTriangle size={22} /></div>
                    <div className="stat-info">
                        <h3>{counts.overdue_actions || 0}</h3>
                        <p>Overdue Items</p>
                    </div>
                </div>
                <div className="stat-card violet">
                    <div className="stat-icon violet"><FileEdit size={22} /></div>
                    <div className="stat-info">
                        <h3>{counts.pending_review || 0}</h3>
                        <p>Pending Reviews</p>
                    </div>
                </div>
            </div>

            {/* Upcoming Meetings */}
            <div className="detail-section">
                <div className="detail-section-header">
                    <h3>Upcoming Meetings</h3>
                    <Link to="/meetings/new" className="btn btn-primary btn-sm">
                        <Plus size={14} /> New Meeting
                    </Link>
                </div>
                {data?.upcoming_meetings?.length > 0 ? (
                    <div className="meeting-list">
                        {data.upcoming_meetings.map((m) => (
                            <Link
                                key={m.id}
                                to={`/meetings/${m.id}`}
                                className="meeting-row"
                            >
                                <div className="meeting-row-info">
                                    <h3>{m.title}</h3>
                                    <div className="meta">
                                        <span><CalendarDays size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{new Date(m.scheduled_time).toLocaleString()}</span>
                                        <span><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{m.duration_minutes} min</span>
                                    </div>
                                </div>
                                <div className="meeting-row-actions">
                                    <span className={`badge ${m.status.toLowerCase()}`}>
                                        {m.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="icon"><CalendarOff size={48} strokeWidth={1} /></div>
                        <p>No upcoming meetings</p>
                    </div>
                )}
            </div>

            {/* Overdue Action Items */}
            {data?.overdue_action_items?.length > 0 && (
                <div className="detail-section">
                    <div className="detail-section-header">
                        <h3><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Overdue Action Items</h3>
                    </div>
                    {data.overdue_action_items.map((a) => (
                        <div key={a.id} className="item-card">
                            <div className="item-card-info">
                                <h4>{a.description}</h4>
                                <div className="meta">
                                    <User size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{a.owner}
                                    <span style={{ margin: '0 6px' }}>&middot;</span>
                                    <CalendarDays size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{a.deadline}
                                </div>
                            </div>
                            <span className="badge overdue">Overdue</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Pending Reviews */}
            {data?.pending_review?.length > 0 && (
                <div className="detail-section">
                    <div className="detail-section-header">
                        <h3>Meetings Pending Review</h3>
                    </div>
                    <div className="meeting-list">
                        {data.pending_review.map((m) => (
                            <Link
                                key={m.id}
                                to={`/meetings/${m.id}`}
                                className="meeting-row"
                            >
                                <div className="meeting-row-info">
                                    <h3>{m.title}</h3>
                                    <div className="meta">
                                        <span><Lock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Closed at {m.closed_at ? new Date(m.closed_at).toLocaleString() : '—'}</span>
                                    </div>
                                </div>
                                <span className="badge closed">Needs Review</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
