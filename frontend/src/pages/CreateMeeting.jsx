import { useState } from 'react';
import { createMeeting } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function CreateMeeting() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        scheduled_time: '',
        duration_minutes: 30,
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await createMeeting(form);
            navigate(`/meetings/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create meeting.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Create Meeting</h2>
                <p>Schedule a new structured meeting</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Meeting Title</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Sprint Planning, Design Review"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Scheduled Time</label>
                        <input
                            type="datetime-local"
                            className="form-input"
                            value={form.scheduled_time}
                            onChange={(e) =>
                                setForm({ ...form, scheduled_time: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Duration (minutes)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={form.duration_minutes}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    duration_minutes: parseInt(e.target.value) || 0,
                                })
                            }
                            min="1"
                            required
                        />
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
