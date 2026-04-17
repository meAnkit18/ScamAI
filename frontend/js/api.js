/**
 * API Module — Communicates with the Flask backend
 */
const API_BASE = window.location.origin;

const api = {
    async getStats() {
        const res = await fetch(`${API_BASE}/api/stats`);
        return res.json();
    },

    async getPeople() {
        const res = await fetch(`${API_BASE}/api/people`);
        return res.json();
    },

    async getAttendance(date) {
        const url = date
            ? `${API_BASE}/api/attendance?date=${date}`
            : `${API_BASE}/api/attendance`;
        const res = await fetch(url);
        return res.json();
    },

    async getAllAttendance() {
        const res = await fetch(`${API_BASE}/api/attendance/all`);
        return res.json();
    },

    async register(name, images) {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, images }),
        });
        return res.json();
    },

    async recognize(imageBase64) {
        const res = await fetch(`${API_BASE}/api/recognize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64 }),
        });
        return res.json();
    },

    async train() {
        const res = await fetch(`${API_BASE}/api/train`, { method: 'POST' });
        return res.json();
    },

    async detectPhishing(text) {
        const res = await fetch(`${API_BASE}/api/phishing/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        return res.json();
    },
};

window.api = api;
