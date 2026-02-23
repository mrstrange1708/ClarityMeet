import { useState, useEffect } from 'react';
import { getMeetings } from '../services/api';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, ClipboardList, Inbox, ChevronRight, Plus } from 'lucide-react';

export default function MeetingsList() {
    const [meetings, setMeetings] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchMeetings = () => {
        setLoading(true);
        getMeetings(filter || undefined)
            .then((res) => setMeetings(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMeetings();
    }, [filter]);

    const filters = [
        { label: 'All', value: '' },
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'In Progress', value: 'InProgress' },
        { label: 'Closed', value: 'Closed' },
        { label: 'Reviewed', value: 'Reviewed' },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Meetings</h2>
                <p>All meetings — filter by status</p>
            </div>

            {/* Filters + Create */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <Link to="/meetings/new" className="btn btn-primary">
                    <Plus size={16} /> New Meeting
                </Link>
            </div>

            {/* List */}
            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : meetings.length > 0 ? (
                <div className="meeting-list">
                    {meetings.map((m) => (
                        <Link key={m.id} to={`/meetings/${m.id}`} className="meeting-row">
                            <div className="meeting-row-info">
                                <h3>{m.title}</h3>
                                <div className="meta">
                                    <span><CalendarDays size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{new Date(m.scheduled_time).toLocaleString()}</span>
                                    <span><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{m.duration_minutes} min</span>
                                    <span><ClipboardList size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{m.action_items?.length || 0} actions</span>
                                </div>
                            </div>
                            <div className="meeting-row-actions">
                                <span className={`badge ${m.status.toLowerCase()}`}>
                                    {m.status}
                                </span>
                                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="icon"><Inbox size={48} strokeWidth={1} /></div>
                    <p>No meetings found</p>
                </div>
            )}
        </div>
    );
}
