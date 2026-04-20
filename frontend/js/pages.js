/**
 * Page Renderers — Guard, Register, People, Phishing
 */

// ─── Utility ────────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success' ? '<path d="M20 6L9 17l-5-5"/>' :
              type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
              '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
        </svg>
        ${message}
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function getInitials(name) {
    return name.split(/[\s_]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── REGISTER PAGE ──────────────────────────────────────────────────────────

function renderRegister() {
    const content = document.getElementById('page-content');
    let stream = null;
    let capturedImages = [];
    const MAX_CAPTURES = 8;

    content.innerHTML = `
        <div class="page-header">
            <h1>Register New Person</h1>
            <p>Capture face images to register a new person in the system</p>
        </div>

        <div class="register-layout">
            <div>
                <div class="webcam-container" id="webcam-box">
                    <div class="webcam-placeholder" id="webcam-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <p>Camera preview will appear here</p>
                    </div>
                    <video id="webcam-video" autoplay playsinline style="display:none"></video>
                    <canvas id="webcam-canvas" style="display:none"></canvas>
                    <div class="webcam-overlay">
                        <div class="webcam-corner tl"></div>
                        <div class="webcam-corner tr"></div>
                        <div class="webcam-corner bl"></div>
                        <div class="webcam-corner br"></div>
                    </div>
                </div>
            </div>

            <div class="register-controls">
                <div class="card">
                    <div class="form-group">
                        <label class="form-label" for="person-name">Full Name</label>
                        <input class="form-input" type="text" id="person-name" placeholder="e.g. John Doe" />
                    </div>

                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <button class="btn btn-primary" id="btn-start-camera">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            Start Camera
                        </button>
                        <button class="btn btn-secondary" id="btn-capture" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                            Capture
                        </button>
                    </div>

                    <div class="capture-progress" style="margin-top:16px;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="capture-progress" style="width: 0%"></div>
                        </div>
                        <span class="progress-text" id="capture-count">0/${MAX_CAPTURES}</span>
                    </div>
                </div>

                <div class="card">
                    <div class="section-header">
                        <h2>Captured Images</h2>
                        <button class="btn btn-sm btn-secondary" id="btn-clear-captures">Clear</button>
                    </div>
                    <div class="capture-grid" id="capture-grid"></div>
                </div>

                <button class="btn btn-primary" id="btn-register" disabled style="width:100%;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                    Register Person
                </button>
            </div>
        </div>
    `;

    // Camera
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('webcam-canvas');
    const placeholder = document.getElementById('webcam-placeholder');

    document.getElementById('btn-start-camera').addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
            video.srcObject = stream;
            video.style.display = 'block';
            placeholder.style.display = 'none';
            document.getElementById('btn-capture').disabled = false;
            showToast('Camera started', 'success');
        } catch (e) {
            showToast('Camera access denied: ' + e.message, 'error');
        }
    });

    // Capture
    document.getElementById('btn-capture').addEventListener('click', () => {
        if (capturedImages.length >= MAX_CAPTURES) {
            showToast(`Maximum ${MAX_CAPTURES} captures reached`, 'info');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        capturedImages.push(dataUrl);
        updateCaptureUI();
        showToast(`Captured ${capturedImages.length}/${MAX_CAPTURES}`, 'success');
    });

    // Clear
    document.getElementById('btn-clear-captures').addEventListener('click', () => {
        capturedImages = [];
        updateCaptureUI();
    });

    // Register
    document.getElementById('btn-register').addEventListener('click', async () => {
        const name = document.getElementById('person-name').value.trim();
        if (!name) {
            showToast('Please enter a name', 'error');
            return;
        }
        if (capturedImages.length === 0) {
            showToast('Please capture at least one image', 'error');
            return;
        }

        const btn = document.getElementById('btn-register');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Registering...';

        try {
            const result = await api.register(name, capturedImages);
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast(result.message, 'success');
                capturedImages = [];
                document.getElementById('person-name').value = '';
                updateCaptureUI();
            }
        } catch (e) {
            showToast('Registration failed: ' + e.message, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg> Register Person`;
    });

    function updateCaptureUI() {
        const grid = document.getElementById('capture-grid');
        const progress = document.getElementById('capture-progress');
        const countEl = document.getElementById('capture-count');
        const regBtn = document.getElementById('btn-register');

        grid.innerHTML = capturedImages.map(img =>
            `<div class="capture-thumb"><img src="${img}" alt="Captured face" /></div>`
        ).join('');

        const pct = (capturedImages.length / MAX_CAPTURES) * 100;
        progress.style.width = `${pct}%`;
        countEl.textContent = `${capturedImages.length}/${MAX_CAPTURES}`;
        regBtn.disabled = capturedImages.length === 0;
    }

    return {
        destroy() {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
        }
    };
}


// ─── ATTENDANCE PAGE ────────────────────────────────────────────────────────

function renderAttendance() {
    const content = document.getElementById('page-content');
    let stream = null;
    let recognitionInterval = null;
    let isRecognizing = false;
    let recognizedFaces = [];

    content.innerHTML = `
        <div class="page-header">
            <h1>Attendance</h1>
            <p>Start recognition to automatically log attendance</p>
        </div>

        <div class="attendance-layout">
            <div>
                <div class="webcam-container" id="att-webcam-box">
                    <div class="webcam-placeholder" id="att-webcam-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <p>Start recognition to activate camera</p>
                    </div>
                    <video id="att-video" autoplay playsinline style="display:none"></video>
                    <canvas id="att-canvas" style="display:none"></canvas>
                    <div class="webcam-overlay" id="att-overlay">
                        <div class="webcam-corner tl"></div>
                        <div class="webcam-corner tr"></div>
                        <div class="webcam-corner bl"></div>
                        <div class="webcam-corner br"></div>
                    </div>
                    <div class="webcam-status" id="att-status" style="display:none">
                        <span class="rec-dot"></span>
                        RECOGNIZING
                    </div>
                </div>

                <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
                    <button class="btn btn-primary" id="btn-start-recognition">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Start Recognition
                    </button>
                    <button class="btn btn-danger" id="btn-stop-recognition" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        Stop
                    </button>
                </div>
            </div>

            <div>
                <div class="card" style="margin-bottom:20px;">
                    <div class="section-header">
                        <h2>Live Results</h2>
                        <span class="badge badge-success" id="recognized-count">0 faces</span>
                    </div>
                    <div class="attendance-feed" id="live-results">
                        <div class="empty-state" style="padding:30px;">
                            <p>Recognized faces will appear here…</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="section-header">
                        <h2>Today's Log</h2>
                        <div class="date-filter">
                            <input type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}" />
                        </div>
                    </div>
                    <div id="att-table-content">
                        <div class="loading-container" style="padding:30px;">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const video = document.getElementById('att-video');
    const canvas = document.getElementById('att-canvas');
    const placeholder = document.getElementById('att-webcam-placeholder');

    // Load initial attendance
    loadAttendanceTable();

    document.getElementById('att-date').addEventListener('change', loadAttendanceTable);

    function loadAttendanceTable() {
        const dateVal = document.getElementById('att-date').value;
        api.getAttendance(dateVal).then(data => {
            const container = document.getElementById('att-table-content');
            if (data.records.length === 0) {
                container.innerHTML = `<div class="empty-state" style="padding:20px;"><p>No records for this date.</p></div>`;
            } else {
                container.innerHTML = `
                    <div class="table-container">
                        <table>
                            <thead><tr><th>#</th><th>Name</th><th>Time</th></tr></thead>
                            <tbody>${data.records.map((r, i) => `
                                <tr><td>${i+1}</td><td><strong>${r.name.replace(/_/g,' ')}</strong></td><td>${r.time}</td></tr>
                            `).join('')}</tbody>
                        </table>
                    </div>
                `;
            }
        }).catch(() => {
            document.getElementById('att-table-content').innerHTML = `<div class="empty-state" style="padding:20px;"><p>Failed to load attendance.</p></div>`;
        });
    }

    // Start Recognition
    document.getElementById('btn-start-recognition').addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
            video.srcObject = stream;
            video.style.display = 'block';
            placeholder.style.display = 'none';
            document.getElementById('att-status').style.display = 'flex';
            document.getElementById('btn-start-recognition').disabled = true;
            document.getElementById('btn-stop-recognition').disabled = false;
            isRecognizing = true;

            // Send frame every 2 seconds
            recognitionInterval = setInterval(async () => {
                if (!isRecognizing) return;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                try {
                    const result = await api.recognize(dataUrl);
                    if (result.faces && result.faces.length > 0) {
                        updateLiveResults(result.faces);
                    }
                    if (result.newly_logged && result.newly_logged.length > 0) {
                        result.newly_logged.forEach(name => {
                            showToast(`✅ ${name.replace(/_/g,' ')} marked present!`, 'success');
                        });
                        loadAttendanceTable();
                    }
                } catch (e) {
                    // Silently retry
                }
            }, 2000);

            showToast('Recognition started', 'success');
        } catch (e) {
            showToast('Camera access denied: ' + e.message, 'error');
        }
    });

    // Stop
    document.getElementById('btn-stop-recognition').addEventListener('click', () => {
        isRecognizing = false;
        if (recognitionInterval) clearInterval(recognitionInterval);
        if (stream) stream.getTracks().forEach(t => t.stop());
        video.style.display = 'none';
        placeholder.style.display = 'flex';
        document.getElementById('att-status').style.display = 'none';
        document.getElementById('btn-start-recognition').disabled = false;
        document.getElementById('btn-stop-recognition').disabled = true;
        showToast('Recognition stopped', 'info');
    });

    function updateLiveResults(faces) {
        const container = document.getElementById('live-results');
        const countEl = document.getElementById('recognized-count');

        // Build unique face map
        faces.forEach(f => {
            const existing = recognizedFaces.find(rf => rf.name === f.name);
            if (existing) {
                existing.confidence = Math.max(existing.confidence, f.confidence);
            } else {
                recognizedFaces.push(f);
            }
        });

        countEl.textContent = `${recognizedFaces.length} face${recognizedFaces.length !== 1 ? 's' : ''}`;

        container.innerHTML = recognizedFaces.map(f => {
            const isUnknown = f.name === 'Unknown';
            return `
            <div class="recognition-result${isUnknown ? ' unknown' : ''}">
                <div style="width:36px;height:36px;border-radius:50%;background:${isUnknown ? '#ef4444' : 'var(--accent-gradient)'};display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;color:#fff;">
                    ${isUnknown ? '?' : getInitials(f.name)}
                </div>
                <span class="face-name">${f.name.replace(/_/g, ' ')}</span>
                <span class="confidence">${(f.confidence * 100).toFixed(1)}%</span>
            </div>
        `}).join('');
    }

    return {
        destroy() {
            isRecognizing = false;
            if (recognitionInterval) clearInterval(recognitionInterval);
            if (stream) stream.getTracks().forEach(t => t.stop());
        }
    };
}


// ─── PEOPLE PAGE ────────────────────────────────────────────────────────────

function renderPeople() {
    const content = document.getElementById('page-content');

    content.innerHTML = `
        <div class="page-header">
            <h1>Registered People</h1>
            <p>All people currently in the face recognition database</p>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="btn-train">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Retrain Model
            </button>
            <a href="#/register" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add New Person
            </a>
        </div>

        <div id="people-content">
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading registered people...</p>
            </div>
        </div>
    `;

    // Load people
    api.getPeople().then(data => {
        const container = document.getElementById('people-content');
        if (data.people.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                        <h3>No people registered yet</h3>
                        <p>Go to the Register page to add people to the system.</p>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="people-grid">${data.people.map(p => `
                <div class="person-card">
                    <div class="person-avatar">${getInitials(p.name)}</div>
                    <div class="person-name">${p.name}</div>
                    <div class="person-images">${p.image_count} training image${p.image_count !== 1 ? 's' : ''}</div>
                </div>
            `).join('')}</div>`;
        }
    }).catch(() => {
        document.getElementById('people-content').innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <h3>Could not load people</h3>
                    <p>Make sure the backend server is running.</p>
                </div>
            </div>
        `;
    });

    // Train button
    document.getElementById('btn-train').addEventListener('click', async () => {
        const btn = document.getElementById('btn-train');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Training...';

        try {
            const result = await api.train();
            showToast(`Training complete — ${result.stats.total_images} images from ${result.stats.total_people} people`, 'success');
        } catch (e) {
            showToast('Training failed: ' + e.message, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Retrain Model`;
    });

    return {};
}


// ─── SCREEN GUARD PAGE ──────────────────────────────────────────────────────

function renderGuard() {
    const content = document.getElementById('page-content');
    let stream = null;
    let guardInterval = null;
    let isGuarding = false;
    let lastKnownFace = null;

    content.innerHTML = `
        <div class="page-header">
            <h1>ScamAI Guard</h1>
            <p>Automatically locks screen when unknown person is detected</p>
        </div>

        <div class="card" style="max-width:600px;margin:0 auto;">
            <div style="text-align:center;padding:24px 0;">
                <div style="font-size:4rem;margin-bottom:16px;">🛡️</div>
                <h2 style="margin-bottom:8px;">Privacy Screen Protection</h2>
                <p style="color:var(--text-secondary);margin-bottom:24px;">
                    When enabled, the screen will automatically black out if an unknown person is detected by the camera.
                </p>

                <div id="guard-status-display" style="display:flex;justify-content:center;margin-bottom:16px;">
                    <div class="guard-status unauthorized">
                        <span class="guard-dot"></span>
                        <span>INACTIVE</span>
                    </div>
                </div>

                <div id="guard-live-wrapper" style="display:none;margin-bottom:20px;position:relative;">
                    <canvas id="guard-overlay-canvas"
                        style="width:100%;max-width:400px;border-radius:12px;border:2px solid var(--border);background:#000;display:block;"></canvas>
                    <span style="position:absolute;top:8px;left:8px;background:rgba(220,38,38,0.85);color:#fff;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:1px;">● LIVE</span>
                </div>

                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <button class="btn btn-primary" id="btn-start-guard">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Start Guard
                    </button>
                    <button class="btn btn-danger" id="btn-stop-guard" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="6" width="12" height="12" rx="2"/>
                        </svg>
                        Stop Guard
                    </button>
                </div>
            </div>

            <div style="border-top:1px solid var(--border);padding:20px;background:var(--bg-elevated);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <strong>How it works</strong>
                </div>
                <ul style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6;margin:0;padding-left:32px;">
                    <li>Camera runs silently in the background</li>
                    <li>Scans for faces every 2 seconds</li>
                    <li>If a registered person is detected → screen stays normal</li>
                    <li>If unknown person or no face → screen blacks out instantly</li>
                    <li>Click anywhere on the black screen to manually unlock</li>
                </ul>
            </div>
        </div>

        <div id="guard-log-card" class="card" style="max-width:600px;margin:24px auto 0;">
            <div class="section-header">
                <h2>Activity Log</h2>
                <button class="btn btn-sm btn-secondary" id="btn-clear-log">Clear</button>
            </div>
            <div id="guard-log">
                <div class="empty-state" style="padding:20px;">
                    <p>No activity yet.</p>
                </div>
            </div>
        </div>

        <video id="guard-video" autoplay playsinline muted style="position:absolute;visibility:hidden;width:1px;height:1px;"></video>
        <canvas id="guard-canvas" style="display:none;"></canvas>
    `;

    const video = document.getElementById('guard-video');
    const canvas = document.getElementById('guard-canvas');
    const overlayCanvas = document.getElementById('guard-overlay-canvas');
    const overlayCtx = overlayCanvas.getContext('2d');
    const blackout = document.getElementById('screen-blackout');
    const log = [];
    let lastFaces = [];
    let rafId = null;

    function drawOverlay() {
        if (!isGuarding) return;
        overlayCanvas.width = video.videoWidth || 640;
        overlayCanvas.height = video.videoHeight || 480;
        overlayCtx.drawImage(video, 0, 0, overlayCanvas.width, overlayCanvas.height);

        lastFaces.forEach(f => {
            const { top, right, bottom, left } = f.location;
            const isKnown = f.name !== 'Unknown';
            overlayCtx.strokeStyle = isKnown ? '#22c55e' : '#ef4444';
            overlayCtx.lineWidth = 2;
            overlayCtx.strokeRect(left, top, right - left, bottom - top);

            const label = f.name.replace(/_/g, ' ');
            overlayCtx.font = 'bold 13px sans-serif';
            const tw = overlayCtx.measureText(label).width;
            overlayCtx.fillStyle = isKnown ? '#22c55e' : '#ef4444';
            overlayCtx.fillRect(left, top - 20, tw + 8, 20);
            overlayCtx.fillStyle = '#fff';
            overlayCtx.fillText(label, left + 4, top - 5);
        });

        rafId = requestAnimationFrame(drawOverlay);
    }

    function updateStatus(authorized, name = null) {
        const display = document.getElementById('guard-status-display');
        if (authorized) {
            display.innerHTML = `
                <div class="guard-status authorized">
                    <span class="guard-dot"></span>
                    <span>AUTHORIZED${name ? ` — ${name}` : ''}</span>
                </div>
            `;
            blackout.classList.remove('active');
        } else {
            display.innerHTML = `
                <div class="guard-status unauthorized">
                    <span class="guard-dot"></span>
                    <span>UNAUTHORIZED</span>
                </div>
            `;
            blackout.classList.add('active');
        }
    }

    function addLog(type, message) {
        const now = new Date().toLocaleTimeString();
        log.unshift({ type, message, time: now });
        renderLog();
    }

    function renderLog() {
        const container = document.getElementById('guard-log');
        if (log.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:20px;"><p>No activity yet.</p></div>`;
            return;
        }
        container.innerHTML = log.slice(0, 20).map(l => `
            <div class="recognition-result">
                <span class="badge ${l.type === 'authorized' ? 'badge-success' : 'badge-danger'}">${l.type}</span>
                <span style="flex:1;font-size:0.85rem;">${l.message}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);">${l.time}</span>
            </div>
        `).join('');
    }

    // Manual unlock on blackout click
    blackout.addEventListener('click', () => {
        blackout.classList.remove('active');
        addLog('manual', 'Screen manually unlocked');
        showToast('Screen unlocked manually', 'info');
    });

    // Start Guard
    document.getElementById('btn-start-guard').addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
            video.srcObject = stream;
            await new Promise(r => video.onloadedmetadata = r);
            await video.play();
            document.getElementById('guard-live-wrapper').style.display = 'block';
            isGuarding = true;
            drawOverlay();

            document.getElementById('btn-start-guard').disabled = true;
            document.getElementById('btn-stop-guard').disabled = false;

            addLog('system', 'ScamAI Guard activated');
            showToast('ScamAI Guard started', 'success');

            // Scan every 2 seconds
            guardInterval = setInterval(async () => {
                if (!isGuarding) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                try {
                    const result = await api.recognize(dataUrl);
                    lastFaces = result.faces;
                    const knownFaces = result.faces.filter(f => f.name !== 'Unknown');

                    if (knownFaces.length > 0) {
                        const name = knownFaces[0].name.replace(/_/g, ' ');
                        if (lastKnownFace !== name) {
                            addLog('authorized', `${name} detected`);
                            lastKnownFace = name;
                        }
                        updateStatus(true, name);
                    } else {
                        if (lastKnownFace !== null) {
                            addLog('unauthorized', 'Unknown person detected — screen locked');
                            lastKnownFace = null;
                        }
                        updateStatus(false);
                    }
                } catch (e) {
                    // Silently retry
                }
            }, 2000);

        } catch (e) {
            showToast('Camera access denied: ' + e.message, 'error');
        }
    });

    // Stop Guard
    document.getElementById('btn-stop-guard').addEventListener('click', () => {
        isGuarding = false;
        if (rafId) cancelAnimationFrame(rafId);
        if (guardInterval) clearInterval(guardInterval);
        if (stream) stream.getTracks().forEach(t => t.stop());
        document.getElementById('guard-live-wrapper').style.display = 'none';
        blackout.classList.remove('active');
        document.getElementById('btn-start-guard').disabled = false;
        document.getElementById('btn-stop-guard').disabled = true;
        updateStatus(false);
        document.getElementById('guard-status-display').innerHTML = `
            <div class="guard-status unauthorized">
                <span class="guard-dot"></span>
                <span>INACTIVE</span>
            </div>
        `;
        addLog('system', 'ScamAI Guard deactivated');
        showToast('ScamAI Guard stopped', 'info');
    });

    document.getElementById('btn-clear-log').addEventListener('click', () => {
        log.length = 0;
        renderLog();
    });

    return {
        destroy() {
            isGuarding = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (guardInterval) clearInterval(guardInterval);
            if (stream) stream.getTracks().forEach(t => t.stop());
            blackout.classList.remove('active');
        }
    };
}


// ─── PHISHING DETECTOR PAGE ─────────────────────────────────────────────────

function renderPhishing() {
    const content = document.getElementById('page-content');

    content.innerHTML = `
        <div class="page-header">
            <h1>Phishing Email Detector</h1>
            <p>Paste email content below to check if it's a phishing attempt</p>
        </div>

        <div class="register-layout">
            <div class="card" style="flex:1;">
                <div class="form-group">
                    <label class="form-label" for="email-text">Email Content</label>
                    <textarea class="form-input" id="email-text" rows="12"
                        placeholder="Paste the full email text here..."
                        style="resize:vertical;font-family:monospace;font-size:0.85rem;"></textarea>
                </div>
                <button class="btn btn-primary" id="btn-check" style="width:100%;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Check Email
                </button>
            </div>

            <div style="flex:1;">
                <div class="card" id="result-card" style="display:none;">
                    <div class="section-header">
                        <h2>Detection Result</h2>
                    </div>
                    <div style="text-align:center;padding:24px 0;">
                        <div id="result-icon" style="font-size:3rem;margin-bottom:12px;"></div>
                        <div id="result-badge" style="margin-bottom:16px;"></div>
                        <div style="color:var(--text-secondary);font-size:0.9rem;">Confidence</div>
                        <div id="result-confidence" style="font-size:2rem;font-weight:700;margin-top:4px;"></div>
                        <div class="progress-bar" style="margin-top:16px;">
                            <div class="progress-fill" id="result-progress" style="width:0%;"></div>
                        </div>
                    </div>
                </div>

                <div class="card" id="history-card">
                    <div class="section-header">
                        <h2>Check History</h2>
                        <button class="btn btn-sm btn-secondary" id="btn-clear-history">Clear</button>
                    </div>
                    <div id="history-list">
                        <div class="empty-state" style="padding:20px;">
                            <p>No checks yet this session.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const history = [];

    function renderHistory() {
        const list = document.getElementById('history-list');
        if (history.length === 0) {
            list.innerHTML = `<div class="empty-state" style="padding:20px;"><p>No checks yet this session.</p></div>`;
            return;
        }
        list.innerHTML = history.map(h => `
            <div class="recognition-result">
                <span class="badge ${h.label === 'Phishing' ? 'badge-danger' : 'badge-success'}">${h.label}</span>
                <span style="flex:1;font-size:0.8rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.preview}</span>
                <span class="confidence">${(h.confidence * 100).toFixed(1)}%</span>
            </div>
        `).join('');
    }

    document.getElementById('btn-check').addEventListener('click', async () => {
        const text = document.getElementById('email-text').value.trim();
        if (!text) { showToast('Please paste email content first', 'error'); return; }

        const btn = document.getElementById('btn-check');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Checking...';

        try {
            const result = await api.detectPhishing(text);
            if (result.error) { showToast(result.error, 'error'); return; }

            const isPhishing = result.label === 'Phishing';
            const pct = (result.confidence * 100).toFixed(1);

            const card = document.getElementById('result-card');
            card.style.display = 'block';
            document.getElementById('result-icon').textContent = isPhishing ? '🚨' : '✅';
            document.getElementById('result-badge').innerHTML =
                `<span class="badge ${isPhishing ? 'badge-danger' : 'badge-success'}" style="font-size:1rem;padding:6px 16px;">${result.label}</span>`;
            document.getElementById('result-confidence').textContent = `${pct}%`;
            document.getElementById('result-progress').style.width = `${pct}%`;

            history.unshift({ label: result.label, confidence: result.confidence, preview: text.slice(0, 60) });
            renderHistory();
            showToast(`Result: ${result.label} (${pct}%)`, isPhishing ? 'error' : 'success');
        } catch (e) {
            showToast('Detection failed: ' + e.message, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Check Email`;
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
        history.length = 0;
        renderHistory();
    });

    return {};
}


// Make renderers available globally
window.pages = {
    register: renderRegister,
    attendance: renderAttendance,
    people: renderPeople,
    phishing: renderPhishing,
    guard: renderGuard,
};
