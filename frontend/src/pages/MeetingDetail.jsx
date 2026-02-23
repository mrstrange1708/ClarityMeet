import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getMeeting,
    startMeeting,
    closeMeeting,
    addAgendaItem,
    updateAgendaItem,
    deleteAgendaItem,
    createActionItem,
    completeActionItem,
    createReview,
    suggestAgenda,
    suggestActions,
    summarizeReview,
} from '../services/api';
import {
    Play,
    CheckCircle2,
    FileEdit,
    ArrowLeft,
    CalendarDays,
    Clock,
    Lock,
    ClipboardList,
    Target,
    Sparkles,
    Plus,
    X,
    Check,
    User,
    AlertTriangle,
    Star,
    Bot,
    Pencil,
} from 'lucide-react';

export default function MeetingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    // Form states
    const [agendaForm, setAgendaForm] = useState({ topic: '', time_allocation: 10 });
    const [actionForm, setActionForm] = useState({ description: '', owner: '', deadline: '' });
    const [reviewForm, setReviewForm] = useState({ summary: '', outcome_rating: 3, followup_required: false });
    const [showAgendaForm, setShowAgendaForm] = useState(false);
    const [showActionForm, setShowActionForm] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState({ agenda: [], actions: [], review: null });
    const [editingAgendaId, setEditingAgendaId] = useState(null);
    const [editAgendaTime, setEditAgendaTime] = useState(0);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const refresh = useCallback(() => {
        getMeeting(id)
            .then((res) => { setMeeting(res.data); setError(''); })
            .catch((err) => setError(err.response?.data?.error || 'Failed to load meeting.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { refresh(); }, [refresh]);

    // ─── State Transitions ──────────────────────────────
    const handleStart = async () => {
        try {
            await startMeeting(id);
            showToast('Meeting started!');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to start', 'error');
        }
    };

    const handleClose = async () => {
        try {
            await closeMeeting(id);
            showToast('Meeting closed!');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to close', 'error');
        }
    };

    // ─── Agenda ─────────────────────────────────────────
    const handleAddAgenda = async (e) => {
        e.preventDefault();
        try {
            await addAgendaItem(id, agendaForm);
            setAgendaForm({ topic: '', time_allocation: 10 });
            setShowAgendaForm(false);
            showToast('Agenda item added!');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add agenda item', 'error');
        }
    };

    const handleDeleteAgenda = async (itemId) => {
        try {
            await deleteAgendaItem(itemId);
            showToast('Agenda item removed');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete', 'error');
        }
    };

    const handleUpdateAgendaTime = async (itemId) => {
        try {
            await updateAgendaItem(itemId, { time_allocation: editAgendaTime });
            setEditingAgendaId(null);
            showToast('Time updated!');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update', 'error');
        }
    };

    // ─── Action Items ──────────────────────────────────
    const handleAddAction = async (e) => {
        e.preventDefault();
        try {
            await createActionItem(id, actionForm);
            setActionForm({ description: '', owner: '', deadline: '' });
            setShowActionForm(false);
            showToast('Action item created!');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create action item', 'error');
        }
    };

    const handleComplete = async (actionId) => {
        try {
            await completeActionItem(actionId);
            showToast('Action item completed!');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to complete', 'error');
        }
    };

    // ─── Review ─────────────────────────────────────────
    const handleReview = async (e) => {
        e.preventDefault();
        try {
            await createReview(id, reviewForm);
            setShowReviewForm(false);
            showToast('Review submitted! Meeting marked as Reviewed.');
            refresh();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to submit review', 'error');
        }
    };

    // ─── AI Suggestions ────────────────────────────────
    const handleSuggestAgenda = async () => {
        try {
            const res = await suggestAgenda({ title: meeting.title });
            setAiSuggestions((s) => ({ ...s, agenda: res.data.suggestions }));
        } catch { showToast('AI suggestion failed', 'error'); }
    };

    const handleSuggestActions = async () => {
        try {
            const topics = meeting.agenda_items?.map((a) => a.topic) || [];
            const res = await suggestActions({ title: meeting.title, agenda_topics: topics });
            setAiSuggestions((s) => ({ ...s, actions: res.data.suggestions }));
        } catch { showToast('AI suggestion failed', 'error'); }
    };

    const handleSuggestReview = async () => {
        try {
            const res = await summarizeReview({ title: meeting.title, action_items: meeting.action_items || [] });
            setAiSuggestions((s) => ({ ...s, review: res.data }));
            setReviewForm((f) => ({ ...f, summary: res.data.summary, outcome_rating: res.data.suggested_rating }));
        } catch { showToast('AI suggestion failed', 'error'); }
    };

    const applyAgendaSuggestion = (s) => {
        setAgendaForm({ topic: s.topic, time_allocation: s.time_allocation });
        setShowAgendaForm(true);
    };

    const applyActionSuggestion = (s) => {
        setActionForm({ description: s.description, owner: s.owner || '', deadline: s.deadline || '' });
        setShowActionForm(true);
    };

    if (loading) return <div className="loading"><div className="spinner" /></div>;
    if (error) return <div className="toast error" style={{ margin: '48px auto', maxWidth: '400px' }}>{error}</div>;
    if (!meeting) return null;

    const status = meeting.status;
    const totalAgendaTime = meeting.agenda_items?.reduce((sum, a) => sum + a.time_allocation, 0) || 0;

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>{toast.msg}</div>
                </div>
            )}

            {/* Header */}
            <div className="detail-header">
                <div className="detail-header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <h2>{meeting.title}</h2>
                        <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                    </div>
                    <div className="detail-header-meta">
                        <span><CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />{new Date(meeting.scheduled_time).toLocaleString()}</span>
                        <span><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />{meeting.duration_minutes} min</span>
                        {meeting.closed_at && <span><Lock size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Closed: {new Date(meeting.closed_at).toLocaleString()}</span>}
                    </div>
                </div>
                <div className="detail-header-actions">
                    {status === 'Scheduled' && (
                        <button className="btn btn-success" onClick={handleStart}><Play size={16} /> Start Meeting</button>
                    )}
                    {status === 'InProgress' && (
                        <button className="btn btn-primary" onClick={handleClose}><CheckCircle2 size={16} /> Close Meeting</button>
                    )}
                    {status === 'Closed' && !meeting.review && (
                        <button className="btn btn-primary" onClick={() => setShowReviewForm(true)}><FileEdit size={16} /> Write Review</button>
                    )}
                    <button className="btn btn-ghost" onClick={() => navigate('/meetings')}><ArrowLeft size={16} /> Back</button>
                </div>
            </div>

            {/* Agenda Section */}
            <div className="detail-section">
                <div className="detail-section-header">
                    <h3><ClipboardList size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Agenda ({totalAgendaTime} / {meeting.duration_minutes} min)</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {status === 'Scheduled' && (
                            <>
                                <button className="btn btn-sm btn-secondary" onClick={handleSuggestAgenda}>
                                    <Bot size={14} /> AI Suggest
                                </button>
                                <button className="btn btn-sm btn-primary" onClick={() => setShowAgendaForm(!showAgendaForm)}>
                                    <Plus size={14} /> Add
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* AI Suggestions */}
                {aiSuggestions.agenda.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        {aiSuggestions.agenda.map((s, i) => (
                            <div key={i} className="ai-suggestion">
                                <div>
                                    <span className="ai-badge">AI Suggestion</span>{' '}
                                    <span style={{ marginLeft: '8px' }}>{s.topic} ({s.time_allocation} min)</span>
                                </div>
                                <button className="btn btn-sm btn-secondary" onClick={() => applyAgendaSuggestion(s)}>
                                    Use
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Agenda Form */}
                {showAgendaForm && status === 'Scheduled' && (
                    <form className="card" style={{ marginBottom: '16px' }} onSubmit={handleAddAgenda}>
                        <div className="form-group">
                            <label>Topic</label>
                            <input
                                className="form-input"
                                placeholder="Discussion topic"
                                value={agendaForm.topic}
                                onChange={(e) => setAgendaForm({ ...agendaForm, topic: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Time Allocation (min)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={agendaForm.time_allocation}
                                onChange={(e) => setAgendaForm({ ...agendaForm, time_allocation: parseInt(e.target.value) || 0 })}
                                min="1"
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAgendaForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-sm">Add Agenda Item</button>
                        </div>
                    </form>
                )}

                {/* Agenda List */}
                {meeting.agenda_items?.length > 0 ? (
                    meeting.agenda_items.map((a) => (
                        <div key={a.id} className="item-card">
                            <div className="item-card-info">
                                <h4>{a.topic}</h4>
                                {editingAgendaId === a.id ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '80px', padding: '4px 8px', fontSize: '0.8rem' }}
                                            value={editAgendaTime}
                                            onChange={(e) => setEditAgendaTime(parseInt(e.target.value) || 0)}
                                            min="1"
                                            autoFocus
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>min</span>
                                        <button className="btn btn-success btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleUpdateAgendaTime(a.id)}><Check size={12} /></button>
                                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditingAgendaId(null)}><X size={12} /></button>
                                    </div>
                                ) : (
                                    <div className="meta"><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{a.time_allocation} min</div>
                                )}
                            </div>
                            {status === 'Scheduled' && editingAgendaId !== a.id && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingAgendaId(a.id); setEditAgendaTime(a.time_allocation); }}><Pencil size={14} /></button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAgenda(a.id)}><X size={14} /></button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No agenda items yet</p>
                    </div>
                )}
            </div>

            {/* Action Items Section */}
            <div className="detail-section">
                <div className="detail-section-header">
                    <h3><Target size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Action Items ({meeting.action_items?.length || 0})</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(status === 'Scheduled' || status === 'InProgress') && (
                            <>
                                <button className="btn btn-sm btn-secondary" onClick={handleSuggestActions}>
                                    <Bot size={14} /> AI Suggest
                                </button>
                                <button className="btn btn-sm btn-primary" onClick={() => setShowActionForm(!showActionForm)}>
                                    <Plus size={14} /> Add
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* AI Suggestions */}
                {aiSuggestions.actions.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        {aiSuggestions.actions.map((s, i) => (
                            <div key={i} className="ai-suggestion">
                                <div>
                                    <span className="ai-badge">AI Suggestion</span>{' '}
                                    <span style={{ marginLeft: '8px' }}>{s.description}</span>
                                </div>
                                <button className="btn btn-sm btn-secondary" onClick={() => applyActionSuggestion(s)}>
                                    Use
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Action Form */}
                {showActionForm && (status === 'Scheduled' || status === 'InProgress') && (
                    <form className="card" style={{ marginBottom: '16px' }} onSubmit={handleAddAction}>
                        <div className="form-group">
                            <label>Description</label>
                            <input
                                className="form-input"
                                placeholder="What needs to be done?"
                                value={actionForm.description}
                                onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>Owner</label>
                                <input
                                    className="form-input"
                                    placeholder="Who is responsible?"
                                    value={actionForm.owner}
                                    onChange={(e) => setActionForm({ ...actionForm, owner: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Deadline</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={actionForm.deadline}
                                    onChange={(e) => setActionForm({ ...actionForm, deadline: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActionForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-sm">Add Action Item</button>
                        </div>
                    </form>
                )}

                {/* Action Items List */}
                {meeting.action_items?.length > 0 ? (
                    meeting.action_items.map((a) => (
                        <div key={a.id} className="item-card">
                            <div className="item-card-info">
                                <h4 style={{ textDecoration: a.status === 'Completed' ? 'line-through' : 'none', opacity: a.status === 'Completed' ? 0.6 : 1 }}>
                                    {a.description}
                                </h4>
                                <div className="meta">
                                    <User size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{a.owner}
                                    <span style={{ margin: '0 6px' }}>&middot;</span>
                                    <CalendarDays size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{a.deadline}
                                    {a.is_overdue && <span style={{ color: 'var(--accent-rose)', marginLeft: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> OVERDUE</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`badge ${a.is_overdue ? 'overdue' : a.status.toLowerCase()}`}>
                                    {a.is_overdue ? 'Overdue' : a.status}
                                </span>
                                {a.status === 'Open' && status !== 'Reviewed' && (
                                    <button className="btn btn-success btn-sm" onClick={() => handleComplete(a.id)}>
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No action items yet</p>
                    </div>
                )}
            </div>

            {/* Review Section */}
            <div className="detail-section">
                <div className="detail-section-header">
                    <h3><FileEdit size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Review</h3>
                    {status === 'Closed' && !meeting.review && !showReviewForm && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-sm btn-secondary" onClick={handleSuggestReview}>
                                <Bot size={14} /> AI Summarize
                            </button>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowReviewForm(true)}>
                                Write Review
                            </button>
                        </div>
                    )}
                </div>

                {/* Review Form */}
                {showReviewForm && status === 'Closed' && !meeting.review && (
                    <form className="card" onSubmit={handleReview}>
                        <div className="form-group">
                            <label>Summary</label>
                            <textarea
                                className="form-input"
                                placeholder="Summary of meeting outcomes and key decisions..."
                                value={reviewForm.summary}
                                onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Outcome Rating (1-5)</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        className={`btn ${reviewForm.outcome_rating === n ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ width: '48px', height: '48px', fontSize: '20px', justifyContent: 'center' }}
                                        onClick={() => setReviewForm({ ...reviewForm, outcome_rating: n })}
                                    >
                                        <Star size={20} fill={n <= reviewForm.outcome_rating ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>
                            {reviewForm.outcome_rating < 3 && (
                                <p style={{ color: 'var(--accent-amber)', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertTriangle size={12} /> Rating below 3 — follow-up will be required
                                </p>
                            )}
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reviewForm.followup_required || reviewForm.outcome_rating < 3}
                                    onChange={(e) => setReviewForm({ ...reviewForm, followup_required: e.target.checked })}
                                    disabled={reviewForm.outcome_rating < 3}
                                />
                                Follow-up Required
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Review</button>
                        </div>
                    </form>
                )}

                {/* Existing Review */}
                {meeting.review && (
                    <div className="review-card">
                        <div className="rating">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                    key={n}
                                    size={24}
                                    className={n <= meeting.review.outcome_rating ? 'star filled' : 'star empty'}
                                    fill={n <= meeting.review.outcome_rating ? 'var(--accent-amber)' : 'none'}
                                    stroke={n <= meeting.review.outcome_rating ? 'var(--accent-amber)' : 'var(--text-muted)'}
                                />
                            ))}
                        </div>
                        <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>{meeting.review.summary}</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {meeting.review.followup_required && (
                                <span className="badge overdue">Follow-up Required</span>
                            )}
                            <span className="badge reviewed">Reviewed</span>
                        </div>
                    </div>
                )}

                {status !== 'Closed' && status !== 'Reviewed' && (
                    <div className="empty-state">
                        <p>Review available after meeting is closed</p>
                    </div>
                )}
            </div>
        </div>
    );
}
