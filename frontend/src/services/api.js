import axios from 'axios';

// In dev: VITE_API_URL is unset → falls back to '/api' → Vite proxy forwards to Flask
// In prod: set VITE_API_URL at build time (e.g. https://your-backend.com/api)
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// ─── Meetings ────────────────────────────────────────
export const createMeeting = (data) => API.post('/meetings', data);
export const getMeetings = (status) =>
    API.get('/meetings', { params: status ? { status } : {} });
export const getMeeting = (id) => API.get(`/meetings/${id}`);
export const startMeeting = (id) => API.patch(`/meetings/${id}/start`);
export const closeMeeting = (id) => API.patch(`/meetings/${id}/close`);

// ─── Agenda ──────────────────────────────────────────
export const addAgendaItem = (meetingId, data) =>
    API.post(`/meetings/${meetingId}/agenda`, data);
export const deleteAgendaItem = (id) => API.delete(`/agenda/${id}`);

// ─── Action Items ────────────────────────────────────
export const createActionItem = (meetingId, data) =>
    API.post(`/meetings/${meetingId}/actions`, data);
export const completeActionItem = (id) => API.patch(`/actions/${id}/complete`);
export const getActionItems = (meetingId) =>
    API.get(`/meetings/${meetingId}/actions`);

// ─── Reviews ─────────────────────────────────────────
export const createReview = (meetingId, data) =>
    API.post(`/meetings/${meetingId}/review`, data);

// ─── Dashboard ───────────────────────────────────────
export const getDashboard = () => API.get('/dashboard');

// ─── AI ──────────────────────────────────────────────
export const suggestAgenda = (data) => API.post('/ai/suggest-agenda', data);
export const suggestActions = (data) => API.post('/ai/suggest-actions', data);
export const summarizeReview = (data) => API.post('/ai/summarize-review', data);

export default API;
