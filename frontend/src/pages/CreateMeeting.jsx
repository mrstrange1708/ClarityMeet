import { useState } from 'react';
import { createMeeting } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CalendarDays, Clock, Type } from 'lucide-react';

export default function CreateMeeting() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        date: '',
        time: '',
        duration_minutes: 30,
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            // Combine date + time into ISO datetime string
            const scheduled_time = `${form.date}T${form.time}`;
            const res = await createMeeting({
                title: form.title,
                scheduled_time,
                duration_minutes: form.duration_minutes,
            });
            navigate(`/meetings/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create meeting.');
        } finally {
            setSubmitting(false);
        }
    };

    const durations = [15, 30, 45, 60, 90, 120];

    return (
        <div>
            <div className="page-header">
                <h2>Create Meeting</h2>
                <p>Schedule a new structured meeting</p>
            </div>

            <div className="card" style={{ maxWidth: '560px' }}>
                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div className="form-group">
                        <label>
                            <Type size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Meeting Title
                        </label>
                        <input
                            className="form-input"
                            placeholder="e.g. Sprint Planning, Design Review, Standup"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Date and Time — side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label style={{ color: 'white' }}>
                                <CalendarDays size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                Date
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ color: 'white' }}>
                                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                Time
                            </label>
                            <input
                                type="time"
                                className="form-input"
                                value={form.time}
                                onChange={(e) => setForm({ ...form, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Duration — Quick Selectors */}
                    <div className="form-group">
                        <label style={{ color: 'white' }}>
                            <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Duration
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {durations.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    className={`btn btn-sm ${form.duration_minutes === d ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setForm({ ...form, duration_minutes: d })}
                                    style={{ minWidth: '56px', justifyContent: 'center' }}
                                >
                                    {d >= 60 ? `${d / 60}h` : `${d}m`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="toast error" style={{ position: 'static', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            <Sparkles size={16} />
                            {submitting ? 'Creating...' : 'Create Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
