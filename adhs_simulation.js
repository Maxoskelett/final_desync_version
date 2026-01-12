// ADHS Simulation
// =============================================================
// Überblick (wo ist was?)
// - Klasse ADHSSimulation: Hauptlogik pro Szene/Umgebung
// - State/Parameter: Aufgaben, Stress, Zeitblindheit, Intensität
// - Ablenkungen: visuell (Gedankenblase etc.) + audio (Geräusche)
// - UI: DOM-Overlay (Browser) + VR-HUD (Fallback im Headset)
// - Input: Tastatur (Q/W/E/G/R + Shift+V) + ESP32 Buttons
// - Globaler Bootstrap: erstellt window.adhs und initialisiert
// =============================================================


export class ADHSSimulation {

    constructor() {
        // Basis-Zustand
        this.environment = this.detectEnvironment();
        this.active = false;
        this.paused = false;
        this.distractionLevel = 0;

        // Timers/Intervals
        this.visualInterval = null;
        this.audioInterval = null;
        this.notificationInterval = null;
        this._taskTickInterval = null;

        // Collections
        this.visualDistractions = [];
        this.taskPanel = null;

        // Aufgabe/Status
        this.tasks = this._buildDefaultTasks(this.environment);
        this.taskList = (this.tasks || []).map(t => t.text);
        this.activeTaskIndex = 0;
        this.taskState = 'idle';
        this.taskStateUntil = 0;

        // Psychologie/Meta
        this.stress = 0;
        this._totalTimeWasted = 0;
        this._giveInCount = 0;
        this._giveInSpiralMultiplier = 1.0;
        this._refocusStreak = 0;
        this._refocusBoost = 0;
        this._refocusBoostUntil = 0;
        this._refocusShieldUntil = 0;
        this._refocusHardLockUntil = 0;
        this._hyperfocusUntil = 0;
        this._reentryUntil = 0;
        this._timeBlindnessUntil = 0;
        this._timeBlindnessMsg = '';
        this._actionMsg = '';
        this._actionMsgUntil = 0;

        // Habituation
        this._habituation = new Map();

        // Audio
        this._audioCtx = null;
        this.professorAudioContext = null;
        this.professorGain = null;

        // Default Config pro Level
        // Frequenzen sind Intervalle (ms): kleiner = häufiger.
        this.config = {
            none: { visualFrequency: 999999, audioFrequency: 999999, notificationFrequency: 999999, movementSpeed: 0 },
            low: { visualFrequency: 5200, audioFrequency: 6400, notificationFrequency: 9000, movementSpeed: 0.35 },
            medium: { visualFrequency: 3800, audioFrequency: 4600, notificationFrequency: 7200, movementSpeed: 0.55 },
            high: { visualFrequency: 2600, audioFrequency: 3400, notificationFrequency: 5800, movementSpeed: 0.8 }
        };

        // UI einmal initial synchronisieren
        try { this.updateStatusDisplay(); } catch (e) {}
    }

    _buildDefaultTasks(env) {
        const byEnv = {
            desk: [
                { text: 'Hausarbeit weiterschreiben', kind: 'deepwork', progress: 0 },
                { text: 'Mails beantworten', kind: 'email', progress: 0 },
                { text: 'Abgabe planen', kind: 'planning', progress: 0 }
            ],
            hoersaal: [
                { text: 'Mitschreiben: Kernaussagen', kind: 'study', progress: 0 },
                { text: 'Folie verstehen', kind: 'study', progress: 0 },
                { text: 'Frage formulieren', kind: 'planning', progress: 0 }
            ],
            supermarkt: [
                { text: 'Einkaufsliste abarbeiten', kind: 'errand', progress: 0 },
                { text: 'Nichts vergessen', kind: 'planning', progress: 0 },
                { text: 'Kasse finden', kind: 'errand', progress: 0 }
            ]
        };
        return (byEnv[env] || byEnv.desk).map(t => ({ ...t }));
    }

                /**
                 * Gedankenblase als visuelle Ablenkung
                 */
                createThoughtBubble() {
                    const scene = document.querySelector('a-scene');
                    const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
                    if (!scene || !camera) return;
                    // Typische Gedanken für jede Umgebung
                    const thoughtsByEnv = {
                        desk: [
                            'Was gibt’s zu essen?',
                            'Hab ich was vergessen?',
                            'Wie spät ist es?',
                            'Nachrichten checken...',
                            'Was läuft auf YouTube?',
                            'Schon wieder eine Mail?'
                        ],
                        hoersaal: [
                            'Was hat der Prof gerade gesagt?',
                            'Ich muss noch einkaufen...',
                            'Wann ist Pause?',
                            'Handy vibriert?',
                            'Was macht die Lerngruppe?',
                            'Hoffentlich fragt er mich nicht!'
                        ],
                        supermarkt: [
                            'Was fehlt noch?',
                            'Wo ist das Sonderangebot?',
                            'Habe ich genug Geld dabei?',
                            'Was wollte ich noch kaufen?',
                            'Gibt’s Rabatt?',
                            'Schon wieder WhatsApp...'
                        ]
                    };
                    const thoughts = thoughtsByEnv[this.environment] || thoughtsByEnv.desk;
                    const text = this.randomChoice(thoughts);
                    // Blase als a-entity vor der Kamera
                    const bubble = document.createElement('a-entity');
                    bubble.setAttribute('position', `0 0.18 -0.7`);
                    // Wolkenform (Ellipse)
                    const ellipse = document.createElement('a-sphere');
                    ellipse.setAttribute('radius', '0.22');
                    ellipse.setAttribute('scale', '1 0.5 1');
                    ellipse.setAttribute('color', '#f1f5f9');
                    ellipse.setAttribute('opacity', '0.92');
                    ellipse.setAttribute('material', 'shader: flat');
                    bubble.appendChild(ellipse);
                    // Text (angepasst: kleiner, wrap, mittig in der Blase)
                    const bubbleText = document.createElement('a-troika-text');
                    bubbleText.setAttribute('value', text);
                    bubbleText.setAttribute('position', '0 0.01 0.23');
                    bubbleText.setAttribute('max-width', '0.38');
                    bubbleText.setAttribute('font-size', '0.032');
                    bubbleText.setAttribute('line-height', '1.12');
                    bubbleText.setAttribute('align', 'center');
                    bubbleText.setAttribute('anchor', 'center');
                    bubbleText.setAttribute('color', '#334155');
                    bubbleText.setAttribute('baseline', 'center');
                    bubble.appendChild(bubbleText);
                    // "Gedankenpunkte" (kleine Kreise)
                    for (let i = 1; i <= 3; i++) {
                        const dot = document.createElement('a-sphere');
                        dot.setAttribute('radius', `${0.03 - i*0.006}`);
                        dot.setAttribute('position', `0 ${-0.09 - i*0.045} ${-0.18 + i*0.06}`);
                        dot.setAttribute('color', '#f1f5f9');
                        dot.setAttribute('opacity', '0.92');
                        dot.setAttribute('material', 'shader: flat');
                        bubble.appendChild(dot);
                    }
                    camera.appendChild(bubble);
                    this.visualDistractions.push(bubble);

                    // Interaktion: Wenn man die Gedankenblase anklickt, "geht man dem Gedanken nach"
                    // -> Prokrastination/Stress steigen durch User-Aktion (nicht nur random).
                    if (typeof this.makeEntityClickable === 'function') {
                        this.makeEntityClickable(bubble, { type: 'thoughtBubble', label: 'Gedanken nachgehen', severity: 0.8 });
                    }

                    // Fokus-Shift: Kamera bleibt, aber Bubble ist prominent
                    // Blase je nach Intensität etwas länger (bei starkem Level bleibt der Gedanke „kleben“)
                    const level = this.distractionLevel || 0;
                    const baseLifeByLevel = [0, 2300, 2800, 3300];
                    const jitterByLevel = [0, 550, 650, 750];
                    const life = (baseLifeByLevel[level] || 2600) + Math.random() * (jitterByLevel[level] || 600);
                    setTimeout(() => {
                        try {
                            if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
                        } catch (e) {}
                        const idx = this.visualDistractions.indexOf(bubble);
                        if (idx > -1) this.visualDistractions.splice(idx, 1);
                    }, life);
                }

    showTaskPanel() {
        // HTML-Overlay wie Steuerung
        let todoDiv = document.getElementById('todo-ui');
        if (!todoDiv) {
            todoDiv = document.createElement('div');
            todoDiv.id = 'todo-ui';
            todoDiv.classList.add('hud-card', 'hud-todo');
            todoDiv.style.position = 'fixed';
            todoDiv.style.bottom = '24px';
            todoDiv.style.left = '24px';
            todoDiv.style.zIndex = '9999';
            todoDiv.style.pointerEvents = 'none';
            const overlayRoot = document.getElementById('ui-overlay') || document.body;
            overlayRoot.appendChild(todoDiv);
        }

        const now = Date.now();
        let html = `<div class="hud-title">To-Do-Liste</div>`;

        // Zusatzinfo (spürbar + psychologisch): Fokuszustand, Stress, Zeitblindheit
        try {
            const stateLabel = {
                idle: 'Warten',
                procrastinating: 'Prokrastination',
                working: 'Arbeit',
                hyperfocus: 'Hyperfokus'
            };
            const s = this.isHyperfocusActive() ? 'hyperfocus' : (this.taskState || 'idle');
            const isReentry = (s === 'working' && this.isReentryActive && this.isReentryActive());
            const focusLabel = isReentry ? 'Re-Entry' : (stateLabel[s] || '—');
            const stressPct = Math.round((this.stress || 0) * 100);
            const tb = (now < (this._timeBlindnessUntil || 0) && this._timeBlindnessMsg) ? ` · ${this._timeBlindnessMsg}` : '';
            const am = (now < (this._actionMsgUntil || 0) && this._actionMsg) ? ` · ${this._actionMsg}` : '';
            html += `<div class="hud-subtitle">Fokus: ${focusLabel} · Stress: ${stressPct}%${tb}${am}</div>`;
        } catch (e) {}

        // Statuswerte (sauber als eigene Zeile/"Chips")
        try {
            const stressPct = Math.round((this.stress || 0) * 100);
            const streak = Math.max(0, (this._refocusStreak || 0));
            const wastedMin = Math.max(0, Math.round(((this._totalTimeWasted || 0) / 60)));
            const spiral = Math.max(1, (this._giveInSpiralMultiplier || 1));
            const spiralTxt = spiral.toFixed(1);
            const shieldLeft = Math.max(0, Math.round(Math.max(0, (this._refocusShieldUntil || 0) - now) / 1000));
            const shieldChip = shieldLeft > 0 ? `<div class="hud-chip hud-chip-focus">Shield <strong>${shieldLeft}s</strong></div>` : '';

            html += `
                <div class="hud-metrics">
                    <div class="hud-chip">Stress <strong>${stressPct}%</strong></div>
                    <div class="hud-chip hud-chip-streak">Streak <strong>${streak}x</strong></div>
                    <div class="hud-chip">Zeit weg <strong>${wastedMin}m</strong></div>
                    <div class="hud-chip hud-chip-spiral">Spirale <strong>${spiralTxt}×</strong></div>
                    ${shieldChip}
                </div>
            `;
        } catch (e) {}

        const fullList = (this.tasks && this.tasks.length) ? this.tasks : (this.taskList || []).map(t => ({ text: t, kind: 'misc', progress: 0 }));
        const list = (this.isFocusModeActive && this.isFocusModeActive())
            ? [fullList[Math.max(0, Math.min(this.activeTaskIndex || 0, fullList.length - 1))]].filter(Boolean)
            : fullList;

        list.forEach((task, i) => {
            const text = task.text || String(task);
            const isUrgent = /abgabe|hausarbeit|seminar|vortrag|feedback|meeting|präsentation|aufgabe|lernen|übung/i.test(text);
            const isWarn = /einkauf|milch|pizza|arzt|rechnung|kontostand/i.test(text);
            const icon = isUrgent ? '📚' : (isWarn ? '🛒' : '📝');
            const baseCls = isUrgent ? 'todo-item todo-urgent' : (isWarn ? 'todo-item todo-warn' : 'todo-item');
            const isActive = (this.isFocusModeActive && this.isFocusModeActive()) ? true : (i === this.activeTaskIndex);
            const cls = isActive ? `${baseCls} is-active` : baseCls;
            const pct = Math.max(0, Math.min(100, Math.round((task.progress || 0) * 100)));
            html += `<div class="${cls}"><span class="todo-icon">${icon}</span><span class="todo-text">${text}</span><span class="todo-progress">${pct}%</span></div>`;
        });
        todoDiv.innerHTML = html;
        this.taskPanel = todoDiv;

        this.updateVrHud();
    }

    // Panel aktualisieren (z.B. nach Hinzufügen/Entfernen)
    updateTaskPanel() {
        this.showTaskPanel();
    }

    // Aufgabe hinzufügen
    addTask(task) {
        const text = String(task || '').trim();
        if (!text) return;
        if (this.tasks) {
            this.tasks.push({ text, kind: 'misc', progress: 0 });
            this.taskList = this.tasks.map(t => t.text);
        } else {
            this.taskList.push(text);
        }
        this.updateTaskPanel();
    }

    // Aufgabe entfernen (per Index)
    removeTask(idx) {
        if (this.tasks && idx >= 0 && idx < this.tasks.length) {
            this.tasks.splice(idx, 1);
            this.taskList = this.tasks.map(t => t.text);
            if (this.activeTaskIndex >= this.tasks.length) this.activeTaskIndex = Math.max(0, this.tasks.length - 1);
            this.updateTaskPanel();
            return;
        }
        if (idx >= 0 && idx < this.taskList.length) {
            this.taskList.splice(idx, 1);
            this.updateTaskPanel();
        }
    }

    // Panel beim Stoppen entfernen
    removeTaskPanel() {
        const todoDiv = document.getElementById('todo-ui');
        if (todoDiv && todoDiv.parentNode) {
            todoDiv.parentNode.removeChild(todoDiv);
        }
        this.taskPanel = null;

        this.updateVrHud();
    }

    // --- Aufgabe vs. Reiz: State + Helpers ---
    getActiveTask() {
        if (this.tasks && this.tasks.length) {
            return this.tasks[Math.max(0, Math.min(this.activeTaskIndex, this.tasks.length - 1))];
        }
        const text = (this.taskList && this.taskList.length) ? this.taskList[0] : 'Aufgabe';
        return { text, kind: 'misc', progress: 0 };
    }

    isHyperfocusActive() {
        return !!(this.active && !this.paused && this.distractionLevel > 0 && Date.now() < (this._hyperfocusUntil || 0));
    }

    isReentryActive() {
        return !!(this.active && !this.paused && this.distractionLevel > 0 && Date.now() < (this._reentryUntil || 0));
    }

    isRefocusShieldActive() {
        return !!(this.active && !this.paused && this.distractionLevel > 0 && Date.now() < (this._refocusShieldUntil || 0));
    }

    isRefocusHardLockActive() {
        return !!(this.active && !this.paused && this.distractionLevel > 0 && Date.now() < (this._refocusHardLockUntil || 0));
    }

    isFocusModeActive() {
        return !!(this.active && !this.paused && this.distractionLevel > 0 && Date.now() < (this._focusModeUntil || 0));
    }

    _habKey(kind, id) {
        return `${kind || 'x'}:${id || 'x'}`;
    }

    // Exponential-decay counter (half-life ~12s)
    _habGetCount(kind, id) {
        const entry = this._habituation && this._habituation.get(this._habKey(kind, id));
        if (!entry) return 0;
        const now = Date.now();
        const lastAt = entry.lastAt || now;
        const dt = Math.max(0, now - lastAt);
        const halfLife = 12000;
        const decay = Math.pow(0.5, dt / halfLife);
        return (entry.count || 0) * decay;
    }

    getHabituationFactor(kind, id) {
        const c = this._habGetCount(kind, id);
        const f = 1 / (1 + 0.65 * c);
        return Math.max(0.35, Math.min(1.0, f));
    }

    noteStimulus(kind, id) {
        if (!this._habituation) this._habituation = new Map();
        const key = this._habKey(kind, id);
        const now = Date.now();
        const decayed = this._habGetCount(kind, id);
        this._habituation.set(key, { count: decayed + 1, lastAt: now });
    }

    setTaskState(state, durationMs = 0) {
        this.taskState = state;
        this._lastTaskStateChangeAt = Date.now();
        this.taskStateUntil = durationMs > 0 ? (Date.now() + durationMs) : 0;
        this.updateTaskPanel();
        this.updateVrHud();
    }

    startTaskTicking() {
        this.stopTaskTicking();
        this._taskTickInterval = setInterval(() => this.tickTaskLoop(), 900);
    }

    stopTaskTicking() {
        if (this._taskTickInterval) {
            clearInterval(this._taskTickInterval);
            this._taskTickInterval = null;
        }
    }

    tickTaskLoop() {
        if (!this.active || this.paused || this.distractionLevel <= 0) {
            this.taskState = 'idle';
            this._hyperfocusUntil = 0;
            this._reentryUntil = 0;
            this._timeBlindnessUntil = 0;
            this._timeBlindnessMsg = '';
            this.updateVrHud();
            return;
        }

        const now = Date.now();
        const level = this.distractionLevel;
        const task = this.getActiveTask();

        const clamp01 = (v) => Math.max(0, Math.min(1, v));

        // Initial: erst mal "Starten" fällt schwer
        if (this.taskState === 'idle') {
            this.setTaskState('procrastinating', 3500 + Math.random() * 6500);
            return;
        }

        // Timed transitions
        if (this.taskStateUntil && now >= this.taskStateUntil) {
            if (this.taskState === 'procrastinating') {
                // Wieder reinfinden ist schwer: nach Prokrastination kurze Re-Entry-Phase
                const reentryByLevel = [0, 1800, 2600, 3400];
                this._reentryUntil = now + (reentryByLevel[level] || 2400) + Math.random() * 1200;
                this.setTaskState('working', 0);
                // Direkt nach dem "Anfangen" kommt oft sofort ein kleiner Reiz
                if (this.environment === 'desk') this.createMonitorMicroDistraction({ reason: 'reentry' });
                else this.showNotification({ reason: 'reentry' });
            } else if (this.taskState === 'hyperfocus') {
                // Nach Hyperfokus oft kurzer "Crash"
                this._hyperfocusUntil = 0;
                this.setTaskState('procrastinating', 1800 + Math.random() * 3500);
            }
        }

        // Hyperfokus Startchance (selten, aber spürbar)
        const canHyperfocus = (now - (this._lastHyperfocusAt || 0)) > 25000;
        const isWorking = this.taskState === 'working';
        const baseHyperfocusChance = (level === 1 ? 0.06 : level === 2 ? 0.05 : 0.04);
        let hyperfocusChance = baseHyperfocusChance;
        if (now < (this._refocusBoostUntil || 0)) {
            hyperfocusChance = Math.min(0.085, hyperfocusChance + (this._refocusBoost || 0));
        }
        if (isWorking && canHyperfocus && Math.random() < hyperfocusChance) {
            this._lastHyperfocusAt = now;
            const dur = 12000 + Math.random() * 14000;
            this._hyperfocusUntil = now + dur;
            this.setTaskState('hyperfocus', dur);
        }

        // Interruption / task switching ("dranbleiben" schwer)
        if (this.taskState === 'working' && Math.random() < (level === 1 ? 0.12 : level === 2 ? 0.18 : 0.26)) {
            // Unterbrechung fühlt sich nachher wie "wieder neu anfangen" an
            const reentryByLevel = [0, 2200, 3200, 4400];
            this._reentryUntil = now + (reentryByLevel[level] || 3200) + Math.random() * 1600;
            this.stress = clamp01((this.stress || 0) + (0.06 + 0.03 * level));
            this.setTaskState('procrastinating', 2200 + Math.random() * 5200);
            // "Reiz" sofort sichtbar machen
            if (this.environment === 'desk') this.createMonitorMicroDistraction({ reason: 'interrupt' });
            else this.showNotification({ reason: 'interrupt' });
            return;
        }

        // Stress-Drift (spürbar, aber nicht extrem)
        if (this.taskState === 'procrastinating') {
            this.stress = clamp01((this.stress || 0) + (0.0025 + 0.0015 * level));
        } else if (this.taskState === 'working') {
            this.stress = clamp01((this.stress || 0) - 0.002);
        } else if (this.taskState === 'hyperfocus') {
            this.stress = clamp01((this.stress || 0) - 0.003);
        }

        // Progress: in Hyperfokus schneller, sonst langsam + abhängig vom Level
        const base = this.taskState === 'hyperfocus' ? 0.040 : 0.015;
        const levelPenalty = level === 1 ? 1.0 : level === 2 ? 0.80 : 0.62;
        const kindBonus = (task.kind === 'deepwork') ? 0.75 : (task.kind === 'chores') ? 0.90 : 1.0;
        const reentryFactor = (this.taskState === 'working' && this.isReentryActive()) ? 0.35 : 1.0;
        const stressFactor = Math.max(0.45, 1.0 - 0.45 * (this.stress || 0));
        const inc = base * levelPenalty * kindBonus * reentryFactor * stressFactor;
        if (this.taskState === 'working' || this.taskState === 'hyperfocus') {
            task.progress = Math.min(1, (task.progress || 0) + inc);
        }

        // Zeitblindheit: besonders in Hyperfokus/Arbeit "vergeht" Zeit unbemerkt
        const timeBlindnessCooldownOk = (now - (this._lastTimeBlindnessAt || 0)) > 45000;
        const inFocusWork = (this.taskState === 'working' || this.taskState === 'hyperfocus');
        if (timeBlindnessCooldownOk && inFocusWork) {
            const baseChance = (this.taskState === 'hyperfocus') ? 0.016 : 0.007;
            const levelBoost = (level === 1 ? 0.85 : level === 2 ? 1.0 : 1.15);
            if (Math.random() < (baseChance * levelBoost)) {
                this._lastTimeBlindnessAt = now;
                const lostMin = 5 + Math.floor(Math.random() * 21); // 5..25
                this._timeBlindnessMsg = `Zeitblindheit: +${lostMin} Min`;
                this._timeBlindnessUntil = now + 4200;
                this.stress = clamp01((this.stress || 0) + 0.04);
            }
        }

        // Task completion: nächste Aufgabe (realistisch: neue Aufgabe taucht auf)
        if ((task.progress || 0) >= 1) {
            task.progress = 0;
            if (this.tasks && this.tasks.length) {
                this.activeTaskIndex = (this.activeTaskIndex + 1) % this.tasks.length;
                this.taskList = this.tasks.map(t => t.text);
            }
            this.setTaskState('procrastinating', 1800 + Math.random() * 4200);
        }

        this.updateTaskPanel();
        this.updateVrHud();
    }

    // --- VR HUD fallback ---
    installVrHudOnce() {
        if (this._vrHudInstalled) return;

        const scene = document.querySelector('a-scene');
        if (!scene) {
            this._vrHudRetryCount = (this._vrHudRetryCount || 0) + 1;
            if (this._vrHudRetryCount > 40) return; // ~8s, danach aufgeben
            // Szene ist beim Script-Load evtl. noch nicht im DOM: später nochmal versuchen
            setTimeout(() => this.installVrHudOnce(), 200);
            return;
        }

        this._vrHudInstalled = true;

        scene.addEventListener('enter-vr', () => {
            try { document.documentElement.classList.add('in-vr'); } catch (e) {}
            // Nach Session-Start prüfen, ob DOM-Overlay wirklich aktiv ist
            setTimeout(() => {
                let hasDomOverlay = false;
                try {
                    const session = scene.renderer && scene.renderer.xr && scene.renderer.xr.getSession && scene.renderer.xr.getSession();
                    hasDomOverlay = !!(session && session.domOverlayState);
                } catch (e) {
                    hasDomOverlay = false;
                }

                // Wenn der Browser in Fullscreen geht, sind nur Kinder von fullscreenElement sichtbar.
                // Wenn unser #ui-overlay außerhalb liegt, verschwindet die HTML-UI -> dann HUD nutzen.
                const overlayRoot = document.getElementById('ui-overlay');
                const fsEl = document.fullscreenElement;
                const overlayHiddenByFullscreen = !!(fsEl && overlayRoot && !fsEl.contains(overlayRoot));

                // Manche Browser liefern domOverlayState, zeigen das Overlay aber trotzdem nicht.
                // Deshalb prüfen wir zusätzlich, ob das Overlay tatsächlich sichtbar ist.
                let overlayActuallyVisible = false;
                try {
                    if (overlayRoot) {
                        const rect = overlayRoot.getBoundingClientRect();
                        const cs = window.getComputedStyle(overlayRoot);
                        const opacity = parseFloat(cs.opacity || '1');
                        overlayActuallyVisible = rect.width > 10 && rect.height > 10 && cs.display !== 'none' && cs.visibility !== 'hidden' && opacity > 0.02;
                    }
                } catch (e) {
                    overlayActuallyVisible = false;
                }

                // HUD nur wenn nötig (sonst sieht man doppelt)
                if (!overlayActuallyVisible || overlayHiddenByFullscreen || !hasDomOverlay) {
                    this.createVrHud();
                } else {
                    // Falls vorher ein HUD existierte, ausblenden
                    this.removeVrHud();
                }
                this.updateVrHud();
            }, 250);
        });

        scene.addEventListener('exit-vr', () => {
            try { document.documentElement.classList.remove('in-vr'); } catch (e) {}
            this.removeVrHud();
        });
    }

    createVrHud() {
        if (this._vrHud) return;
        const scene = document.querySelector('a-scene');
        const camera = (scene && scene.camera && scene.camera.el) ? scene.camera.el : (document.querySelector('[camera]') || document.querySelector('a-camera'));
        if (!camera) {
            // Kamera kann in A-Frame erst nach renderstart verfügbar sein
            setTimeout(() => this.createVrHud(), 200);
            return;
        }

        const root = document.createElement('a-entity');
        root.setAttribute('id', 'vr-hud');
        // Screen-fixed HUD: Root zentral vor der Kamera, Panels in die Ecken.
        // Etwas weiter weg (Z), sonst wird es bei manchen Headsets/FOV an den Rändern abgeschnitten.
        root.setAttribute('position', '0 0 -1.35');
        root.setAttribute('rotation', '0 0 0');
        root.setAttribute('scale', '1 1 1');

        const commonMat = 'shader:flat; transparent:true; depthTest:false; depthWrite:false';

        // Stil an das normale Overlay angleichen (helles "HUD-Card" Design)
        // NOTE: a-text/troika `color` ist nicht überall rgba-parsable -> Hex + material opacity.
        const hudText = '#0f172a';
        const hudSubText = '#334155';
        const hudMuted = '#475569';
        const hudAccent = '#ff453a';
        const cardBg = '#f8fafc';
        const cardBorder = '#ffffff';
        const cardShadow = '#000000';

        // Bottom-left: To-Do
        const todoCard = document.createElement('a-entity');
        todoCard.setAttribute('id', 'vr-hud-todo-panel');
        todoCard.setAttribute('position', '-0.58 -0.33 0.01');
        todoCard.innerHTML = `
            <!-- Shadow + border + main card (light UI like DOM overlay) -->
            <a-plane width="0.888" height="0.408" material="color:${cardShadow}; opacity:0.22; ${commonMat}" position="0.010 -0.010 -0.006"></a-plane>
            <a-plane width="0.868" height="0.388" material="color:${cardBorder}; opacity:0.62; ${commonMat}" position="0 0 -0.005"></a-plane>
            <a-plane width="0.86" height="0.38" material="color:${cardBg}; opacity:0.88; ${commonMat}" position="0 0 -0.004"></a-plane>
            <a-plane width="0.86" height="0.012" material="color:${hudAccent}; opacity:0.92; ${commonMat}" position="0 0.183 0.000"></a-plane>

            <a-troika-text value="To-Do-Liste" max-width="0.80" font-size="0.040" color="${hudText}" position="-0.34 0.10 0.006" align="left" anchor="left" baseline="center"></a-troika-text>
            <a-troika-text id="vr-hud-todo-text" value="" max-width="0.82" font-size="0.032" color="${hudMuted}" position="-0.37 0.05 0.006" align="left" anchor="left" baseline="top" line-height="1.16" fill-opacity="0.92"></a-troika-text>
        `;

        // Bottom-right: Focus / Level / Stress
        const levelCard = document.createElement('a-entity');
        levelCard.setAttribute('id', 'vr-hud-level-panel');
        levelCard.setAttribute('position', '0.58 -0.33 0.01');
        levelCard.innerHTML = `
            <a-plane width="0.688" height="0.448" material="color:${cardShadow}; opacity:0.22; ${commonMat}" position="0.010 -0.010 -0.006"></a-plane>
            <a-plane width="0.668" height="0.428" material="color:${cardBorder}; opacity:0.62; ${commonMat}" position="0 0 -0.005"></a-plane>
            <a-plane width="0.66" height="0.42" material="color:${cardBg}; opacity:0.88; ${commonMat}" position="0 0 -0.004"></a-plane>
            <a-plane width="0.66" height="0.012" material="color:${hudAccent}; opacity:0.92; ${commonMat}" position="0 0.203 0.000"></a-plane>

            <a-troika-text value="ADHS Simulation" max-width="0.62" font-size="0.036" color="${hudText}" position="-0.24 0.10 0.006" align="left" anchor="left" baseline="center"></a-troika-text>
            <a-troika-text value="Intensität" max-width="0.62" font-size="0.032" color="${hudSubText}" position="-0.24 0.062 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.92"></a-troika-text>

            <!-- "Chip" wie im DOM-Overlay: Shadow + Border + Fill (id bleibt fürs Update) -->
            <a-plane id="vr-hud-level-chip-shadow" width="0.272" height="0.112" material="color:#000000; opacity:0.16; ${commonMat}" position="0.148 0.047 -0.003"></a-plane>
            <a-plane id="vr-hud-level-chip-border" width="0.268" height="0.108" material="color:#ffffff; opacity:0.72; ${commonMat}" position="0.145 0.050 -0.002"></a-plane>
            <a-plane id="vr-hud-level-chip" width="0.26" height="0.10" material="color:#e2e8f0; opacity:0.92; ${commonMat}" position="0.14 0.055 -0.001"></a-plane>
            <a-troika-text id="vr-hud-level-chip-text" value="Aus" max-width="0.24" font-size="0.038" color="#0f172a" position="0.14 0.035 0.006" align="center" anchor="center" baseline="center"></a-troika-text>

            <a-troika-text id="vr-hud-focus-text" value="" max-width="0.86" font-size="0.028" color="${hudMuted}" position="-0.24 -0.005 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.92"></a-troika-text>
            <a-troika-text id="vr-hud-active-task-text" value="" max-width="0.86" font-size="0.032" color="${hudText}" position="-0.24 -0.055 0.006" align="left" anchor="left" baseline="center"></a-troika-text>

            <a-plane width="0.52" height="0.030" material="color:#0f172a; opacity:0.10; ${commonMat}" position="-0.01 -0.100 0"></a-plane>
            <a-plane id="vr-hud-stress-fill" width="0.01" height="0.030" material="color:#10b981; opacity:0.92; ${commonMat}" position="-0.270 -0.100 0.001"></a-plane>

            <a-troika-text id="vr-hud-stress-text" value="Stress: 0%" max-width="0.86" font-size="0.028" color="${hudMuted}" position="-0.24 -0.135 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.92"></a-troika-text>
            <a-troika-text id="vr-hud-meta-text" value="" max-width="0.86" font-size="0.025" color="${hudMuted}" position="-0.24 -0.168 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.86"></a-troika-text>
        `;

        // Top-left: Scene + message
        const envCard = document.createElement('a-entity');
        envCard.setAttribute('id', 'vr-hud-env-panel');
        envCard.setAttribute('position', '-0.58 0.34 0.01');
        envCard.innerHTML = `
            <a-plane width="0.688" height="0.208" material="color:${cardShadow}; opacity:0.22; ${commonMat}" position="0.010 -0.010 -0.006"></a-plane>
            <a-plane width="0.668" height="0.188" material="color:${cardBorder}; opacity:0.62; ${commonMat}" position="0 0 -0.005"></a-plane>
            <a-plane width="0.66" height="0.18" material="color:${cardBg}; opacity:0.88; ${commonMat}" position="0 0 -0.004"></a-plane>
            <a-plane width="0.66" height="0.012" material="color:${hudAccent}; opacity:0.92; ${commonMat}" position="0 0.083 0.000"></a-plane>

            <a-circle id="vr-hud-env-dot" radius="0.016" segments="18" material="color:#94a3b8; opacity:0.95; ${commonMat}" position="-0.29 0.040 0"></a-circle>
            <a-troika-text id="vr-hud-env-title" value="" max-width="0.86" font-size="0.036" color="${hudText}" position="-0.26 0.050 0.006" align="left" anchor="left" baseline="center"></a-troika-text>
            <a-troika-text id="vr-hud-msg-text" value="" max-width="0.86" font-size="0.030" color="${hudMuted}" position="-0.26 0.010 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.92"></a-troika-text>
        `;

        // Top-right: ESP32 status
        const espCard = document.createElement('a-entity');
        espCard.setAttribute('id', 'vr-hud-esp-panel');
        espCard.setAttribute('position', '0.58 0.34 0.01');
        espCard.innerHTML = `
            <a-plane width="0.688" height="0.208" material="color:${cardShadow}; opacity:0.22; ${commonMat}" position="0.010 -0.010 -0.006"></a-plane>
            <a-plane width="0.668" height="0.188" material="color:${cardBorder}; opacity:0.62; ${commonMat}" position="0 0 -0.005"></a-plane>
            <a-plane width="0.66" height="0.18" material="color:${cardBg}; opacity:0.88; ${commonMat}" position="0 0 -0.004"></a-plane>
            <a-plane width="0.66" height="0.012" material="color:${hudAccent}; opacity:0.92; ${commonMat}" position="0 0.083 0.000"></a-plane>

            <a-circle id="vr-hud-esp-dot" radius="0.016" segments="18" material="color:#94a3b8; opacity:0.95; ${commonMat}" position="-0.29 0.040 0"></a-circle>
            <a-troika-text value="ESP32" max-width="0.86" font-size="0.030" color="${hudSubText}" position="-0.26 0.050 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.92"></a-troika-text>
            <a-troika-text id="vr-hud-esp-text" value="—" max-width="0.86" font-size="0.030" color="${hudMuted}" position="-0.26 0.010 0.006" align="left" anchor="left" baseline="center" fill-opacity="0.92"></a-troika-text>
        `;

        root.appendChild(todoCard);
        root.appendChild(levelCard);
        root.appendChild(envCard);
        root.appendChild(espCard);
        camera.appendChild(root);
        this._vrHud = root;

        // Dynamisches Layout: zuverlässig in den Ecken unabhängig von FOV/Aspect.
        setTimeout(() => this.layoutVrHud(), 0);
        try {
            if (!this._vrHudOnResize) {
                this._vrHudOnResize = () => this.layoutVrHud();
                window.addEventListener('resize', this._vrHudOnResize);
            }
        } catch (e) {}

        // Extra: Render-Layering erzwingen.
        // Bei transparenten Panels kann die Sortierung sonst dazu führen, dass das Panel den Text "übermalt".
        setTimeout(() => {
            try {
                if (!this._vrHud) return;
                const planes = this._vrHud.querySelectorAll('a-plane, a-circle');
                planes.forEach(el => {
                    if (!el || !el.object3D) return;
                    el.object3D.traverse((o) => { o.renderOrder = 998; });
                });

                const texts = this._vrHud.querySelectorAll('a-text, a-troika-text');
                texts.forEach(el => {
                    if (!el || !el.object3D) return;
                    el.object3D.traverse((o) => { o.renderOrder = 1000; });
                });
            } catch (e) {}
        }, 0);
    }

    removeVrHud() {
        if (!this._vrHud) return;
        try {
            if (this._vrHud.parentNode) this._vrHud.parentNode.removeChild(this._vrHud);
        } catch (e) {}
        this._vrHud = null;

        try {
            if (this._vrHudOnResize) {
                window.removeEventListener('resize', this._vrHudOnResize);
                this._vrHudOnResize = null;
            }
        } catch (e) {}
    }

    layoutVrHud() {
        if (!this._vrHud) return;

        const todoPanel = this._vrHud.querySelector('#vr-hud-todo-panel');
        const levelPanel = this._vrHud.querySelector('#vr-hud-level-panel');
        const envPanel = this._vrHud.querySelector('#vr-hud-env-panel');
        const espPanel = this._vrHud.querySelector('#vr-hud-esp-panel');
        if (!todoPanel || !levelPanel || !envPanel || !espPanel) return;

        const scene = document.querySelector('a-scene');
        const cam = (scene && scene.camera) ? scene.camera : null;
        const THREERef = (typeof THREE !== 'undefined') ? THREE : null;
        if (!cam || !THREERef || !cam.isPerspectiveCamera) return;

        const z = 1.35; // entspricht root.position.z (Betrag)
        const fovRad = THREERef.MathUtils.degToRad(cam.fov || 60);
        const halfH = Math.tan(fovRad / 2) * z;
        const aspect = cam.aspect || ((scene && scene.renderer && scene.renderer.domElement) ? (scene.renderer.domElement.clientWidth / scene.renderer.domElement.clientHeight) : 1);
        const halfW = halfH * (aspect || 1);
        const margin = 0.10;

        // Panel sizes (in A-Frame units / meters)
        const todoW = 0.86, todoH = 0.38;
        const levelW = 0.66, levelH = 0.42;
        const topW = 0.66, topH = 0.18;

        const xLeft = -halfW + margin;
        const xRight = halfW - margin;
        const yTop = halfH - margin;
        const yBottom = -halfH + margin;

        const todoX = xLeft + todoW / 2;
        const todoY = yBottom + todoH / 2;
        todoPanel.setAttribute('position', `${todoX.toFixed(3)} ${todoY.toFixed(3)} 0.01`);

        const levelX = xRight - levelW / 2;
        const levelY = yBottom + levelH / 2;
        levelPanel.setAttribute('position', `${levelX.toFixed(3)} ${levelY.toFixed(3)} 0.01`);

        const envX = xLeft + topW / 2;
        const envY = yTop - topH / 2;
        envPanel.setAttribute('position', `${envX.toFixed(3)} ${envY.toFixed(3)} 0.01`);

        const espX = xRight - topW / 2;
        const espY = yTop - topH / 2;
        espPanel.setAttribute('position', `${espX.toFixed(3)} ${espY.toFixed(3)} 0.01`);
    }

    updateVrHud() {
        if (!this._vrHud) return;

        const clampHudText = (value, maxChars) => {
            const s = String(value || '');
            if (s.length <= maxChars) return s;
            return s.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
        };

        const clampHudMultiline = (value, maxLines, maxCharsPerLine) => {
            const raw = String(value || '').replace(/\r\n/g, '\n');
            const lines = raw.split('\n');
            const out = [];

            for (let i = 0; i < lines.length && out.length < maxLines; i++) {
                const line = lines[i].trimEnd();
                if (!line) {
                    out.push('');
                    continue;
                }
                out.push(clampHudText(line, maxCharsPerLine));
            }

            let joined = out.join('\n');
            if (lines.length > maxLines) joined = joined.trimEnd() + '…';
            return joined;
        };

        // Top-left: Environment + short message
        try {
            const envTitle = this._vrHud.querySelector('#vr-hud-env-title');
            const msgText = this._vrHud.querySelector('#vr-hud-msg-text');
            const envDot = this._vrHud.querySelector('#vr-hud-env-dot');
            const envLabel = {
                desk: 'Schreibtisch',
                hoersaal: 'Hörsaal',
                supermarkt: 'Supermarkt'
            };
            if (envTitle) envTitle.setAttribute('value', envLabel[this.environment] || 'Simulation');

            if (envDot) {
                const envColor = {
                    desk: '#60a5fa',
                    hoersaal: '#a78bfa',
                    supermarkt: '#34d399'
                };
                envDot.setAttribute('material', 'color', envColor[this.environment] || '#94a3b8');
            }

            const tb = (Date.now() < (this._timeBlindnessUntil || 0) && this._timeBlindnessMsg) ? this._timeBlindnessMsg : '';
            const am = (Date.now() < (this._actionMsgUntil || 0) && this._actionMsg) ? this._actionMsg : '';
            const gaze = (Date.now() < (this._gazeCueUntil || 0) && this._gazeCueMsg) ? this._gazeCueMsg : '';
            if (msgText) msgText.setAttribute('value', clampHudText((am || gaze || tb || ''), 64));
        } catch (e) {}

        // Top-right: ESP32 Status spiegeln (VR = View-only)
        try {
            const espText = this._vrHud.querySelector('#vr-hud-esp-text');
            const espDot = this._vrHud.querySelector('#vr-hud-esp-dot');
            const espPanel = document.getElementById('esp32-panel');
            const raw = espPanel ? (espPanel.textContent || '').trim() : '';
            if (espText) espText.setAttribute('value', clampHudText((raw ? `${raw}` : 'Status unbekannt'), 64));

            if (espDot) {
                const s = (raw || '').toLowerCase();
                const looksOk = s.includes('verbunden') || s.includes('connected') || s.includes('ok') || s.includes('ready');
                const looksBad = s.includes('offline') || s.includes('nicht') || s.includes('disconnected') || s.includes('error');
                const c = looksOk ? '#22c55e' : looksBad ? '#ef4444' : '#94a3b8';
                espDot.setAttribute('material', 'color', c);
            }
        } catch (e) {}

        const levelNames = ['Aus', 'Leicht', 'Mittel', 'Stark'];
        const label = (!this.active || this.paused) ? 'Aus' : (levelNames[this.distractionLevel] || 'Aus');
        const chipText = this._vrHud.querySelector('#vr-hud-level-chip-text');
        if (chipText) chipText.setAttribute('value', `${label}`);

        const chip = this._vrHud.querySelector('#vr-hud-level-chip');
        const chipBorder = this._vrHud.querySelector('#vr-hud-level-chip-border');
        if (chip) {
            // Farben ähnlich wie DOM-Chips (pastellig, aber gut lesbar in VR)
            const chipColors = {
                Aus: '#e2e8f0',
                Leicht: '#86efac',
                Mittel: '#fde047',
                Stark: '#fda4af'
            };
            const c = chipColors[label] || '#e2e8f0';
            try { chip.setAttribute('material', 'color', c); } catch (e) {}

            // Border/Typo leicht anpassen je nach Chip-Farbe (mehr Kontrast)
            try {
                if (chipBorder) chipBorder.setAttribute('material', 'color', '#ffffff');
            } catch (e) {}
            try {
                if (chipText) chipText.setAttribute('color', '#0f172a');
            } catch (e) {}
        }

        // Fokus/Task-Info rechts
        const focusText = this._vrHud.querySelector('#vr-hud-focus-text');
        const activeTaskText = this._vrHud.querySelector('#vr-hud-active-task-text');
        const metaText = this._vrHud.querySelector('#vr-hud-meta-text');
        if (focusText || activeTaskText) {
            const stateLabel = {
                idle: 'Warten',
                procrastinating: 'Prokrastination',
                working: 'Arbeit',
                hyperfocus: 'Hyperfokus'
            };
            const s = this.isHyperfocusActive() ? 'hyperfocus' : (this.taskState || 'idle');
            const isReentry = (s === 'working' && this.isReentryActive && this.isReentryActive());
            const focusLabel = isReentry ? 'Re-Entry' : (stateLabel[s] || '—');
            const stressPct = Math.round((this.stress || 0) * 100);
            const tb = (Date.now() < (this._timeBlindnessUntil || 0) && this._timeBlindnessMsg) ? ` · ${this._timeBlindnessMsg}` : '';
            const am = (Date.now() < (this._actionMsgUntil || 0) && this._actionMsg) ? ` · ${this._actionMsg}` : '';
            if (focusText) focusText.setAttribute('value', clampHudText(`Fokus: ${focusLabel} · Stress: ${stressPct}%${tb}${am}`, 84));

            const t = this.getActiveTask ? this.getActiveTask() : null;
            const pct = t ? Math.round((t.progress || 0) * 100) : 0;
            const name = t ? (t.text || 'Aufgabe') : 'Aufgabe';
            if (activeTaskText) activeTaskText.setAttribute('value', clampHudText(`${pct}% · ${name}`, 54));
        }

        try {
            if (metaText) {
                const now = Date.now();
                const streak = Math.max(0, (this._refocusStreak || 0));
                const wastedMin = Math.max(0, Math.round(((this._totalTimeWasted || 0) / 60)));
                const spiral = Math.max(1, (this._giveInSpiralMultiplier || 1));
                const spiralTxt = spiral.toFixed(1);
                const shieldLeft = Math.max(0, Math.round(Math.max(0, (this._refocusShieldUntil || 0) - now) / 1000));
                const shield = shieldLeft > 0 ? ` · Shield ${shieldLeft}s` : '';
                metaText.setAttribute('value', clampHudText(`Streak: ${streak}x · Zeit: ${wastedMin}m · Spirale: ${spiralTxt}×${shield}`, 62));
            }
        } catch (e) {}

        // Stress Bar
        try {
            const fill = this._vrHud.querySelector('#vr-hud-stress-fill');
            const txt = this._vrHud.querySelector('#vr-hud-stress-text');
            const barW = 0.52;
            const stress = Math.max(0, Math.min(1, (this.stress || 0)));
            const w = Math.max(0.01, barW * stress);
            if (fill) {
                fill.setAttribute('width', w.toFixed(3));
                const x = (-barW / 2 + w / 2);
                fill.setAttribute('position', `${x.toFixed(3)} -0.100 0.001`);
                const c = (stress >= 0.66) ? '#ef4444' : (stress >= 0.33) ? '#f59e0b' : '#10b981';
                fill.setAttribute('material', 'color', c);

                // Critical highlight: subtle pulse (only the bar) when stress is high
                if (stress >= 0.66) {
                    const t = Date.now();
                    const pulse = 0.70 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.009));
                    fill.setAttribute('material', 'opacity', pulse);
                } else {
                    fill.setAttribute('material', 'opacity', 0.90);
                }
            }
            if (txt) txt.setAttribute('value', `Stress: ${Math.round(stress * 100)}%`);
        } catch (e) {}

        // To-Dos erst anzeigen, wenn Intensität wirklich gestartet ist
        const showTodos = !!(this.active && !this.paused && this.distractionLevel > 0);
        const todoPanel = this._vrHud.querySelector('#vr-hud-todo-panel');
        if (todoPanel) todoPanel.setAttribute('visible', showTodos);

        const todoText = this._vrHud.querySelector('#vr-hud-todo-text');
        if (todoText) {
            if (!showTodos) {
                todoText.setAttribute('value', '');
            } else {
                const list = (this.tasks && this.tasks.length) ? this.tasks : (this.taskList || []).map(t => ({ text: t, progress: 0 }));
                const lines = list.slice(0, 4).map((t, i) => {
                    const isActive = i === this.activeTaskIndex;
                    const pct = Math.round((t.progress || 0) * 100);
                    const name = t.text || String(t);
                    return `${isActive ? '▶' : '•'} ${pct}% ${name}`;
                }).join('\n');
                // Verhindert, dass lange Aufgaben über die Card hinausragen
                todoText.setAttribute('value', clampHudMultiline(lines, 4, 34));
            }
        }
    }

    // --- Debug: VR-HUD ohne Headset testen ---
    // Shift+V oder URL ?debugHud=1
    setVrHudDebugEnabled(enabled) {
        const on = !!enabled;
        this._vrHudDebug = on;
        if (on) {
            this.createVrHud();
            this.updateVrHud();
        } else {
            // Nur entfernen, wenn es wirklich unser Debug-Mode ist oder kein XR läuft.
            // (In echter XR-Session wird HUD ohnehin über enter/exit-vr gemanaged.)
            this.removeVrHud();
        }
    }

    toggleVrHudDebug() {
        this.setVrHudDebugEnabled(!this._vrHudDebug);
    }
        // --- ALLE SOUNDS AUS DEM SOUNDS-ORDNER ---
        playSound_keyboard(ctx) {
            this.playSoundFile('CD_MACBOOK PRO LAPTOP KEYBOARD 01_10_08_13.wav', 1.2);
        }
        playSound_notification(ctx) {
            this.playSoundFile('MultimediaNotify_S011TE.579.wav', 0.8);
        }
        playSound_pencil(ctx) {
            this.playSoundFile('PencilWrite_S08OF.380.wav', 0.4);
        }
        playSound_whisper(ctx) {
            this.playSoundFile('SFX,Whispers,Layered,Verb.wav', 1.0);
        }
        playSound_shopping_cart(ctx) {
            this.playSoundFile('ShoppingCartTurn_S011IN.548.wav', 0.8);
        }
        playSound_footsteps(ctx) {
            this.playSoundFile('WalkWoodFloor_BWU.39.wav', 1.2);
        }
        playSound_wood_creaks(ctx) {
            this.playSoundFile('Wood_Creaks_01_BTM00499.wav', 0.6);
        }
        playSound_professor_mumble(ctx) {
            this.playSoundFile('indistinct-deep-male-mumble-14786.mp3', 1.0);
        }
        playSound_cell_phone_vibration(ctx) {
            this.playSoundFile('cell-phone-vibration-352298.mp3', 0.7);
        }
        playSound_cough(ctx) {
            this.playSoundFile('horrible-female-cough-66368.mp3', 1.0);
        }
        playSound_baby_crying(ctx) {
            this.playSoundFile('baby-crying-463213.mp3', 1.2);
        }
        playSound_computer_fan(ctx) {
            this.playSoundFile('computer-fan-75947.mp3', 1.5);
        }
        playSound_neighbors(ctx) {
            this.playSoundFile('annoying-neighbors-on-saturday-afternoon-23947.mp3', 1.5);
        }
        playSound_neighborhood_noise(ctx) {
            this.playSoundFile('neighborhood-noise-background-33025-320959.mp3', 1.5);
        }
        playSound_supermarket(ctx) {
            this.playSoundFile('supermarket-17823.mp3', 1.5);
        }

    // Erkennt in welcher Umgebung wir sind (über URL)
    detectEnvironment() {
        const url = window.location.href;
        if (url.includes('desk.html')) return 'desk';
        if (url.includes('hoersaal.html')) return 'hoersaal';
        if (url.includes('supermarkt.html')) return 'supermarkt';
        return 'desk'; // Fallback
    }

    // Kurzes Aufklärungs-Intro (einmalig), bevor die Szene startet.
    // Ziel: Empathie/Verständnis (ADHS != "nur Konzentration").
    installSceneIntroOnce() {
        if (this._sceneIntroInstalled) return;
        this._sceneIntroInstalled = true;

        const overlay = document.getElementById('ui-overlay');
        const scene = document.querySelector('a-scene');
        if (!overlay || !scene) return;
        if (document.getElementById('adhs-intro')) return;

        const env = this.environment || this.detectEnvironment();
        const key = `adhs_intro_seen_${env}`;
        try {
            if (window.localStorage && window.localStorage.getItem(key) === '1') return;
        } catch (e) {}

        const envTitle = {
            desk: 'Schreibtisch',
            hoersaal: 'Hörsaal',
            supermarkt: 'Supermarkt'
        }[env] || 'Simulation';

        const intro = document.createElement('div');
        intro.id = 'adhs-intro';
        intro.className = 'adhs-intro';
        intro.setAttribute('role', 'dialog');
        intro.setAttribute('aria-label', 'Kurzes Intro');

        intro.innerHTML = `
            <div class="adhs-intro__title">Kurzinfo – ${envTitle}</div>
            <div class="adhs-intro__text">
                Diese Simulation soll zeigen, dass ADHS mehr ist als „schlecht konzentrieren“:
                <ul>
                    <li><strong>Starten & Planen</strong> können schwer sein.</li>
                    <li><strong>Reizfilter</strong> kostet Energie – viele Reize gleichzeitig.</li>
                    <li><strong>Wiedereinstieg</strong> nach Unterbrechungen ist teuer.</li>
                    <li><strong>Zeitblindheit</strong> und <strong>Stress</strong> verstärken das.</li>
                </ul>
                <div class="adhs-intro__note">Hinweis: vereinfachte Erlebnissimulation – ADHS ist individuell.</div>
            </div>
            <div class="adhs-intro__actions">
                <button class="adhs-intro__btn" type="button" id="adhs-intro-ok">Verstanden</button>
            </div>
        `;

        // Insert at top so it is above the rest of the overlay.
        overlay.insertBefore(intro, overlay.firstChild);

        const close = () => {
            try { intro.classList.add('is-hiding'); } catch (e) {}
            try {
                if (window.localStorage) window.localStorage.setItem(key, '1');
            } catch (e) {}
            setTimeout(() => {
                try { if (intro.parentNode) intro.parentNode.removeChild(intro); } catch (e) {}
            }, 220);
        };

        const okBtn = intro.querySelector('#adhs-intro-ok');
        if (okBtn) okBtn.addEventListener('click', close);

        // Auto-hide after a short time (still marks as seen).
        setTimeout(() => {
            if (!document.getElementById('adhs-intro')) return;
            close();
        }, 9000);

        // In VR: hide immediately (overlay feels "UI-heavy" in-headset).
        try {
            scene.addEventListener('enter-vr', close, { once: true });
        } catch (e) {}
    }

    // Simulation starten
    start(level = 0) {
        const clampedLevel = Math.max(0, Math.min(3, Number(level) || 0));

        // Immer erst sauber aufräumen
        this.stop();

        // Level 0 bedeutet: Aus (kein "active" Zustand ohne Effekte)
        if (clampedLevel === 0) {
            this.distractionLevel = 0;
            this.updateStatusDisplay();
            this.updateVrHud();
            return;
        }

        this.active = true;
        this.paused = false;
        this.distractionLevel = clampedLevel;

        // VR HUD Listener einmalig installieren
        this.installVrHudOnce();

        // Audio nach User-Gesture entsperren (Start() wird per Button/Klick ausgelöst)
        this.unlockAudio();

        const levelName = ['none', 'low', 'medium', 'high'][clampedLevel];
        const baseConfig = this.config[levelName];
        // Nicht mutieren (config wird unten ggf. desk-spezifisch angepasst)
        let config = { ...baseConfig };

        // Option B: Umgebung bleibt charakteristisch, aber Intensität (1/2/3) soll überall ähnlich deutlich wirken.
        if (clampedLevel > 0) {
            const env = this.environment;
            const multByEnv = {
                // Desk: etwas mehr "kleines Chaos" bei Mittel/Stark (ohne aggressive Kopfbewegung)
                desk: {
                    visual: [1.0, 0.92, 0.82, 0.70],
                    audio: [1.0, 0.92, 0.82, 0.70],
                    notif: [1.0, 0.96, 0.90, 0.86],
                    minVisual: 1800,
                    minAudio: 3200,
                    minNotif: 5000
                },
                // Hörsaal: mehr Audio/Social-Overload bei hoch, aber nicht nur über Lautstärke, sondern über Dichte.
                hoersaal: {
                    visual: [1.0, 0.95, 0.86, 0.76],
                    audio: [1.0, 0.92, 0.82, 0.72],
                    notif: [1.0, 0.95, 0.86, 0.78],
                    minVisual: 2000,
                    minAudio: 2800,
                    minNotif: 5500
                },
                // Supermarkt: hohe Intensität fühlt sich wie "Crowd + Noise" an.
                supermarkt: {
                    visual: [1.0, 0.95, 0.85, 0.75],
                    audio: [1.0, 0.92, 0.80, 0.70],
                    notif: [1.0, 0.96, 0.88, 0.80],
                    minVisual: 2100,
                    minAudio: 2600,
                    minNotif: 6000
                }
            };

            const t = multByEnv[env] || multByEnv.desk;
            if (typeof config.visualFrequency === 'number') {
                config.visualFrequency = Math.max(t.minVisual, Math.round(config.visualFrequency * (t.visual[clampedLevel] || 1.0)));
            }
            if (typeof config.audioFrequency === 'number') {
                config.audioFrequency = Math.max(t.minAudio, Math.round(config.audioFrequency * (t.audio[clampedLevel] || 1.0)));
            }
            if (typeof config.notificationFrequency === 'number') {
                config.notificationFrequency = Math.max(t.minNotif, Math.round(config.notificationFrequency * (t.notif[clampedLevel] || 1.0)));
            }
        }
        
        console.log(`🎮 ADHS Simulation läuft - Level: ${levelName}`);
        
        if (clampedLevel > 0) {
            // Aufgabenpanel anzeigen
            this.showTaskPanel();

            // Aufgabe-vs-Reiz Simulation
            this.setTaskState('idle', 0);
            this.startTaskTicking();

            // Visuelle Ablenkungen spawnen (Lichter, Popups, etc.)
            this.visualInterval = setInterval(() => {
                this.spawnVisualDistraction();
            }, config.visualFrequency);
            
            // Audio Ablenkungen (Piepen, Klicken, Vibrieren)
            this.audioInterval = setInterval(() => {
                this.playAudioDistraction();
            }, config.audioFrequency);
            
            // Handy-Nachrichten (weil wer braucht schon Fokus?)
            this.notificationInterval = setInterval(() => {
                this.showNotification();
            }, config.notificationFrequency);
            
            // Bewegte Objekte für extra Chaos
            this.startMovingObjects(config.movementSpeed);
            
            // Professor redet im Hörsaal (wie bei Sims - klingt wie reden aber ist unverständlich)
            if (this.environment === 'hoersaal') {
                this.startProfessorTalking();
            }
            // Nachbarschaftsgeräusch im Hintergrund für desk.html
            if (this.environment === 'desk') {
                this.startNeighborhoodNoise();
            }
        }
        
        // Anzeige updaten
        this.updateStatusDisplay();

        this.updateVrHud();
    }

    // Alles stoppen
    stop() {
        this.active = false;
        
        // Timer stoppen
        if (this.visualInterval) clearInterval(this.visualInterval);
        if (this.audioInterval) clearInterval(this.audioInterval);
        if (this.notificationInterval) clearInterval(this.notificationInterval);
        
        // Professor-Audio stoppen
        this.stopProfessorTalking();
        
        // Aufräumen
        this.clearAllDistractions();
        this.removeTaskPanel();
        this.stopTaskTicking();
        this.taskState = 'idle';
        this._hyperfocusUntil = 0;
        // Nachbarschaftsgeräusch stoppen
        this.stopNeighborhoodNoise();
        
        console.log('🛑 Simulation gestoppt - endlich Ruhe!');

        this.updateVrHud();
    }

    getAudioContext() {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return null;
        if (!this._audioCtx || this._audioCtx.state === 'closed') {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._audioCtx.state === 'suspended') {
            this._audioCtx.resume().catch(() => {});
        }
        return this._audioCtx;
    }

    unlockAudio() {
        const ctx = this.getAudioContext();
        if (!ctx || this._audioUnlocked) return;
        try {
            const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        } catch (e) {
            // ignore
        }
        this._audioUnlocked = true;
    }

    // VR-Komfort: Statt Rig zu drehen (unangenehm), zeigen wir einen Blickhinweis im Sichtfeld.
    // Dieser Hinweis simuliert den "Fokus-Shift" ohne den Nutzer physisch zu drehen.
    createGazeCue(targetX, targetY, targetZ, durationMs = 1200) {
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        const rig = document.querySelector('#rig');
        if (!camera || !rig) return;

        // Don't spam the user's view: keep a short cooldown and keep only one cue at a time.
        const now = Date.now();
        if (this._lastGazeCueAt && (now - this._lastGazeCueAt) < 650) return;
        this._lastGazeCueAt = now;

        // Neutral, weniger "spielerisch": kein Pfeil-Overlay, sondern kurzer Text-Hinweis im HUD.

        const rigPos = rig.getAttribute('position') || { x: 0, y: 0, z: 0 };
        const dx = targetX - rigPos.x;
        const dy = targetY - rigPos.y;
        const dz = targetZ - rigPos.z;

        // Richtung grob bestimmen (links/rechts/hoch/runter)
        let dir = 'rechts';
        if (Math.abs(dx) >= Math.abs(dy)) {
            dir = dx >= 0 ? 'rechts' : 'links';
        } else {
            // In A-Frame ist "hoch" typischerweise +Y
            dir = dy >= 0 ? 'oben' : 'unten';
        }

        const total = Math.max(650, Math.min(2000, durationMs));
        this._gazeCueMsg = `Blick: ${dir}`;
        this._gazeCueUntil = Date.now() + total;
        this.updateVrHud();
    }

    // --- Hintergrundgeräusch für desk.html ---
    startNeighborhoodNoise() {
        this.stopNeighborhoodNoise();

        // Prefer WebAudio so we can spatialize it.
        const ctx = this.getAudioContext();
        const filename = 'neighborhood-noise-background-33025-320959.mp3';
        const path = `Assets/Textures/sounds/${filename}`;

        if (ctx) {
            // Fixed "outside/neighbor" position: left-back-ish relative to the user.
            const pos = this.getWorldPosFromCameraOffset({ x: -1.6, y: 0.10, z: 1.25 });
            const out = this.createSpatialOutput(ctx, { volume: 0.10, pan: -0.55, pos });

            const cached = this._audioBufferCache.get(filename);
            const startLoop = (audioBuffer) => {
                if (!audioBuffer) return;
                if (!this.active) return;

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.loop = true;
                source.connect(out);
                source.start(ctx.currentTime);
                this._neighborhoodNoiseSource = source;

                // Keep listener synced while the loop is playing.
                this._neighborhoodNoiseListenerInterval = setInterval(() => {
                    this.updateListenerFromCamera(ctx);
                }, 200);
            };

            if (cached) {
                startLoop(cached);
                return;
            }

            fetch(path)
                .then(r => r.arrayBuffer())
                .then(ab => ctx.decodeAudioData(ab))
                .then(audioBuffer => {
                    this._audioBufferCache.set(filename, audioBuffer);
                    startLoop(audioBuffer);
                })
                .catch(() => {
                    // Fallback to HTMLAudio if fetch/decode fails.
                    const a = new Audio(path);
                    a.loop = true;
                    a.volume = 0.12;
                    this.neighborhoodNoiseAudio = a;
                    a.play().catch(() => {});
                });
            return;
        }

        // Fallback: HTMLAudio (non-spatial)
        const a = new Audio(path);
        a.loop = true;
        a.volume = 0.12; // Sehr dezent
        this.neighborhoodNoiseAudio = a;
        a.play().catch(() => {});
    }
    stopNeighborhoodNoise() {
        if (this._neighborhoodNoiseListenerInterval) {
            clearInterval(this._neighborhoodNoiseListenerInterval);
            this._neighborhoodNoiseListenerInterval = null;
        }

        if (this._neighborhoodNoiseSource) {
            try { this._neighborhoodNoiseSource.stop(); } catch (e) {}
            try { this._neighborhoodNoiseSource.disconnect(); } catch (e) {}
            this._neighborhoodNoiseSource = null;
        }

        if (this.neighborhoodNoiseAudio) {
            try {
                this.neighborhoodNoiseAudio.pause();
                this.neighborhoodNoiseAudio.currentTime = 0;
            } catch(e) {}
            this.neighborhoodNoiseAudio = null;
        }
    }

    /**
     * Zeigt Status-Information an
     */
    updateStatusDisplay() {
        const levelNames = ['Aus', 'Leicht', 'Mittel', 'Stark'];
        console.log(`Aktuelle Intensität: ${levelNames[this.distractionLevel]}`);

        this.updateVrHud();
    }

    /**
     * Kleine Hilfsfunktionen für Lesbarkeit
     */
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    clamp01(v) {
        return Math.max(0, Math.min(1, v));
    }

    /**
     * Erstellt Focus Tunnel Effekt (Vignette)
     */
    createFocusTunnel(durationMs = 6000) {
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        if (!camera) return;

        // Entferne alten Tunnel falls vorhanden
        if (this._focusTunnelElement && this._focusTunnelElement.parentNode) {
            this._focusTunnelElement.parentNode.removeChild(this._focusTunnelElement);
        }

        // Erstelle neuen Tunnel als Ring mit Gradient
        const tunnel = document.createElement('a-ring');
        tunnel.setAttribute('position', '0 0 -0.5');
        tunnel.setAttribute('radius-inner', '0.85');
        tunnel.setAttribute('radius-outer', '2.5');
        tunnel.setAttribute('material', 'shader: flat; color: #0a0a0a; opacity: 0; transparent: true; side: double');
        tunnel.setAttribute('segments-theta', '64');
        
        camera.appendChild(tunnel);
        this._focusTunnelElement = tunnel;
        this._focusTunnelActive = true;
        this._focusTunnelUntil = Date.now() + durationMs;

        // Fade-in Animation
        let opacity = 0;
        const fadeInInterval = setInterval(() => {
            if (opacity < 0.65) {
                opacity += 0.05;
                tunnel.setAttribute('material', `shader: flat; color: #0a0a0a; opacity: ${opacity}; transparent: true; side: double`);
            } else {
                clearInterval(fadeInInterval);
            }
        }, 30);

        // Auto-remove nach Duration mit Fade-out
        setTimeout(() => {
            const fadeOutInterval = setInterval(() => {
                if (opacity > 0) {
                    opacity -= 0.05;
                    if (tunnel && tunnel.setAttribute) {
                        tunnel.setAttribute('material', `shader: flat; color: #0a0a0a; opacity: ${opacity}; transparent: true; side: double`);
                    }
                } else {
                    clearInterval(fadeOutInterval);
                    if (tunnel && tunnel.parentNode) {
                        tunnel.parentNode.removeChild(tunnel);
                    }
                    this._focusTunnelActive = false;
                }
            }, 30);
        }, durationMs - 500);
    }

    /**
     * Erstellt Screen Tint Effekt (für Nachgeben - Schuldgefühl)
     */
    createScreenTint(durationMs = 2500, color = '#ff4444') {
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        if (!camera) return;

        // Entferne alten Tint falls vorhanden
        if (this._screenTintElement && this._screenTintElement.parentNode) {
            this._screenTintElement.parentNode.removeChild(this._screenTintElement);
        }

        // Erstelle Screen Tint als Plane vor Kamera
        const tint = document.createElement('a-plane');
        tint.setAttribute('position', '0 0 -0.45');
        tint.setAttribute('width', '3');
        tint.setAttribute('height', '3');
        tint.setAttribute('material', `shader: flat; color: ${color}; opacity: 0; transparent: true; side: double`);
        
        camera.appendChild(tint);
        this._screenTintElement = tint;
        this._screenTintUntil = Date.now() + durationMs;

        // Pulse Animation
        let opacity = 0;
        let increasing = true;
        const pulseInterval = setInterval(() => {
            if (increasing) {
                opacity += 0.02;
                if (opacity >= 0.25) increasing = false;
            } else {
                opacity -= 0.015;
            }
            
            if (opacity <= 0) {
                clearInterval(pulseInterval);
                if (tint && tint.parentNode) {
                    tint.parentNode.removeChild(tint);
                }
            } else if (tint && tint.setAttribute) {
                tint.setAttribute('material', `shader: flat; color: ${color}; opacity: ${opacity}; transparent: true; side: double`);
            }
        }, 40);
    }

    // Ermöglicht Klick-Interaktionen (Desktop) auf A-Frame Entities mit .adhs-clickable
    ensureMouseRayCursor() {
        if (this._mouseCursorEnsured) return;

        const scene = document.querySelector('a-scene');
        const isVr = !!(scene && scene.is && scene.is('vr-mode'));
        if (isVr) return;

        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        if (!camera) {
            setTimeout(() => this.ensureMouseRayCursor(), 250);
            return;
        }

        if (document.getElementById('adhs-mouse-cursor')) {
            this._mouseCursorEnsured = true;
            return;
        }

        const cursor = document.createElement('a-entity');
        cursor.setAttribute('id', 'adhs-mouse-cursor');
        cursor.setAttribute('cursor', 'rayOrigin: mouse; fuse: false');
        cursor.setAttribute('raycaster', 'objects: .adhs-clickable; far: 10');
        camera.appendChild(cursor);
        this._mouseCursorEnsured = true;
    }

    makeEntityClickable(el, meta = {}) {
        if (!el) return;
        try {
            this.ensureMouseRayCursor();
            el.classList.add('adhs-clickable');
            if (el.__adhsClickBound) return;
            el.__adhsClickBound = true;
            el.addEventListener('click', (ev) => {
                try { ev && ev.stopPropagation && ev.stopPropagation(); } catch (e) {}
                this.handleUserGaveIn(meta, el);
            });
        } catch (e) {
            // ignore
        }
    }

    handleUserGaveIn(meta = {}, clickedEl = null) {
        if (!this.active || this.paused || this.distractionLevel <= 0) return;

        const now = Date.now();
        const level = this.distractionLevel;
        const severity = typeof meta.severity === 'number' ? meta.severity : 1.0;
        const label = meta.label || meta.type || 'Ablenkung';

        // Stress-Spirale: Häufiges Nachgeben in kurzer Zeit erhöht den Multiplier
        const spiralWindow = 15000; // 15 Sekunden
        if ((now - this._lastGiveInAt) < spiralWindow) {
            this._giveInCount++;
            this._giveInSpiralMultiplier = Math.min(3.0, 1.0 + (this._giveInCount * 0.3));
        } else {
            this._giveInCount = 1;
            this._giveInSpiralMultiplier = 1.0;
        }
        this._lastGiveInAt = now;

        // Nachgeben -> Stress steigt ("Zeit weg", "schon wieder", etc.) - MIT SPIRALE
        const baseStressInc = (0.025 + 0.015 * level) * Math.max(0.5, Math.min(1.6, severity));
        const stressInc = baseStressInc * this._giveInSpiralMultiplier;
        this.stress = this.clamp01((this.stress || 0) + stressInc);

        // Zeitverlust berechnen und tracken
        const timeWasted = Math.floor(2 + (3 * level) + (2 * severity)); // 2-12 Minuten
        this._totalTimeWasted += timeWasted * 60; // in Sekunden

        // Screen Tint Effekt (Schuldgefühl visualisieren)
        this.createScreenTint(2500, '#ff4444');

        // Hyperfokus kann durch Interaktion abrupt abbrechen
        if (this.taskState === 'hyperfocus') {
            this._hyperfocusUntil = 0;
        }

        // Wenn man eigentlich arbeitet: Klick schubst in Prokrastination
        if (this.taskState === 'working' || this.taskState === 'hyperfocus') {
            const dur = 1800 + Math.random() * 2200 + 700 * severity;
            this.setTaskState('procrastinating', dur);
        }

        // Größere Progress-Strafe (deutlich spürbar)
        try {
            const t = this.getActiveTask();
            if (t) {
                const dec = (0.025 + 0.02 * level) * (0.8 + 0.7 * severity) * this._giveInSpiralMultiplier;
                t.progress = Math.max(0, (t.progress || 0) - dec);
            }
        } catch (e) {}

        // Aufgaben-Pile-Up: Bei Stress > 0.5 spawnen zusätzliche Mini-Aufgaben
        if (this.stress > 0.5 && Math.random() < 0.35) {
            const pileUpTasks = [
                { text: 'Jetzt auch noch Mails checken', kind: 'email', progress: 0 },
                { text: 'Termin bestätigen', kind: 'planning', progress: 0 },
                { text: 'Nachricht beantworten', kind: 'social', progress: 0 },
                { text: 'Wichtiges nicht vergessen', kind: 'planning', progress: 0 },
                { text: 'Schnell was googeln', kind: 'planning', progress: 0 }
            ];
            const newTask = this.randomChoice(pileUpTasks);
            this.tasks.push(newTask);
            console.log(`[Pile-Up] Neue Aufgabe: ${newTask.text}`);
        }

        // Zeitverlust-Nachricht mit Spirale-Info
        const spiralMsg = this._giveInSpiralMultiplier > 1.5 ? ' (Stress-Spirale!)' : '';
        this._actionMsg = `${label} - ${timeWasted} Min. verloren${spiralMsg}`;
        this._actionMsgUntil = now + 3500;

        // Refocus-Streak bricht beim bewussten "Nachgeben"
        this._refocusStreak = 0;
        this._refocusBoost = 0;
        this._refocusBoostUntil = 0;

        // Visuelles Feedback: angeklicktes Element schneller entfernen
        try {
            if (clickedEl && clickedEl.parentNode) clickedEl.parentNode.removeChild(clickedEl);
        } catch (e) {}

        this.updateTaskPanel();
        this.updateVrHud();
    }

    handleUserRefocus() {
        if (!this.active || this.paused || this.distractionLevel <= 0) return;

        const now = Date.now();
        const level = this.distractionLevel;

        const prevState = this.taskState;
        const cameFromProcrastination = prevState === 'procrastinating';

        // VERBESSERT: Längerer Schutz (4-8 Sekunden statt 1-2s)
        const shieldBaseByLevel = [0, 7500, 6000, 4500];
        const shieldJitterByLevel = [0, 1500, 1500, 1000];
        const shieldBase = shieldBaseByLevel[level] || 6000;
        const shieldJitter = shieldJitterByLevel[level] || 1500;
        this._refocusShieldUntil = now + shieldBase + Math.random() * shieldJitter;

        // VERBESSERT: Längerer "Hard Lock"
        const lockBaseByLevel = [0, 3500, 2800, 2200];
        const lockJitterByLevel = [0, 500, 400, 300];
        this._refocusHardLockUntil = now + (lockBaseByLevel[level] || 2500) + Math.random() * (lockJitterByLevel[level] || 400);

        // Focus Tunnel Effekt (visuelles Feedback)
        const tunnelDuration = 5000 + (this._refocusStreak || 0) * 1000; // länger bei Streak
        this.createFocusTunnel(tunnelDuration);

        // Sofortiges Aufräumen: aktuelle Ablenkungen "weg"
        try { this.clearAllDistractions(); } catch (e) {}

        // VERBESSERT: Stress sinkt drastisch (-20% statt -8%)
        const stressReduction = 0.15 + (0.05 * (this._refocusStreak || 0) / 5); // mehr bei Streak
        this.stress = this.clamp01((this.stress || 0) - stressReduction);
        
        const reentryByLevel = [0, 1100, 1600, 2200];
        this._reentryUntil = now + (reentryByLevel[level] || 1400) + Math.random() * 500;
        this.setTaskState('working', 0);

        // VERBESSERT: Längerer Focus Mode
        const focusDurByLevel = [0, 12000, 10000, 8000];
        this._focusModeUntil = now + (focusDurByLevel[level] || 10000);

        // Stress-Spirale zurücksetzen bei erfolgreichem Refocus
        this._giveInCount = 0;
        this._giveInSpiralMultiplier = 1.0;

        // Sanft zurück zur Hauptaufgabe (deepwork), falls vorhanden
        try {
            if (this.tasks && this.tasks.length) {
                const deepIdx = this.tasks.findIndex(t => (t && t.kind === 'deepwork') && ((t.progress || 0) < 1));
                if (deepIdx >= 0) this.activeTaskIndex = deepIdx;
            }
        } catch (e) {}

        // VERBESSERT: Bessere Belohnung + Streak
        if (cameFromProcrastination) {
            const streakWindowMs = 25000; // etwas längeres Fenster
            const prevAt = this._lastRefocusAt || 0;
            const nextStreak = (now - prevAt) <= streakWindowMs ? ((this._refocusStreak || 0) + 1) : 1;
            this._refocusStreak = Math.max(1, Math.min(10, nextStreak)); // max 10 statt 5
            this._lastRefocusAt = now;

            try {
                const t = this.getActiveTask();
                if (t) {
                    // VERBESSERT: 3-8% Progress statt 0.6-2%
                    const levelScale = (level === 3) ? 0.75 : (level === 2) ? 0.90 : 1.0;
                    const streakBonus = 1.0 + (this._refocusStreak - 1) * 0.15; // +15% pro Streak
                    const bonus = (0.03 + Math.random() * 0.05) * levelScale * streakBonus;
                    t.progress = Math.min(1, (t.progress || 0) + bonus);
                }
            } catch (e) {}

            // VERBESSERT: Starker Hyperfokus-Boost bei Streaks (bei 3+ Streak: bis zu 25% Chance)
            const baseBoost = 0.005 * (this._refocusStreak || 0);
            const streakMultiplier = this._refocusStreak >= 3 ? 3.0 : 1.5;
            this._refocusBoost = baseBoost * streakMultiplier; // bis zu ~15%
            this._refocusBoostUntil = now + 15000 + 3000 * ((this._refocusStreak || 1) - 1);
            
            // Bei hohem Streak: Chance auf sofortigen Hyperfokus
            if (this._refocusStreak >= 4 && Math.random() < 0.3) {
                const hyperfocusDur = 8000 + Math.random() * 6000;
                this._hyperfocusUntil = now + hyperfocusDur;
                this.setTaskState('hyperfocus', hyperfocusDur);
                console.log('[Refocus] Hyperfokus erreicht! (Streak: ' + this._refocusStreak + ')');
            }
        } else {
            this._lastRefocusAt = now;
        }

        this._actionMsg = (this._refocusStreak && this._refocusStreak > 1)
            ? `FOCUS MODE: Zurück zur Aufgabe (${this._refocusStreak}x)`
            : 'FOCUS MODE: Zurück zur Aufgabe';
        this._actionMsgUntil = now + 2600;

        // Starker Cue in die "richtige" Richtung (ohne Zwangsdrehung)
        try {
            const target = (typeof this.getRefocusTargetWorldPos === 'function') ? this.getRefocusTargetWorldPos() : null;
            if (target) {
                this.createGazeCue(target.x, target.y, target.z, 1350);
            }
        } catch (e) {}

        // Task-adjacent Cue: direkt nach Refocus eher "zurück zum Kontext" statt random Ablenkung
        if (this.environment === 'desk') {
            this.createMonitorMicroDistraction({ reason: 'refocus' });
        } else {
            this.showNotification({ reason: 'refocus' });
        }

        this.updateTaskPanel();
        this.updateVrHud();
    }

    removeAfter(element, ms) {
        setTimeout(() => {
            if (element.parentNode) element.parentNode.removeChild(element);
            const index = this.visualDistractions.indexOf(element);
            if (index > -1) this.visualDistractions.splice(index, 1);
        }, ms);
    }

    /**
     * Passt die Umgebungsbeleuchtung an die Intensität an
     */
    adjustEnvironmentLighting(level) {
        const ambientLight = document.querySelector('#ambient-light');
        const hemisphereLight = document.querySelector('#hemisphere-light');
        const directionalLight = document.querySelector('#directional-light');
        
        // Basis-Intensitäten
        const baseAmbient = 0.15;
        const baseHemisphere = 0.2;
        const baseDirectional = 0.1;
        
        // Dimm-Faktoren je nach Level (0 = normal, 3 = sehr dunkel)
        const dimmingFactors = [1.0, 0.7, 0.4, 0.2];
        const factor = dimmingFactors[level];
        
        if (ambientLight) {
            ambientLight.setAttribute('light', 'intensity', baseAmbient * factor);
        }
        if (hemisphereLight) {
            hemisphereLight.setAttribute('light', 'intensity', baseHemisphere * factor);
        }
        if (directionalLight) {
            directionalLight.setAttribute('light', 'intensity', baseDirectional * factor);
        }
    }

    /**
     * Kurz dimmen für Effekt
     */
    dimEnvironmentTemporarily(duration = 2000) {
        const ambientLight = document.querySelector('#ambient-light');
        const hemisphereLight = document.querySelector('#hemisphere-light');
        const directionalLight = document.querySelector('#directional-light');
        
        if (!ambientLight || !hemisphereLight || !directionalLight) return;
        
        // Aktuelle Werte speichern
        const originalAmbient = parseFloat(ambientLight.getAttribute('light').intensity);
        const originalHemisphere = parseFloat(hemisphereLight.getAttribute('light').intensity);
        const originalDirectional = parseFloat(directionalLight.getAttribute('light').intensity);
        
        // Auf 30% dimmen
        ambientLight.setAttribute('light', 'intensity', originalAmbient * 0.3);
        hemisphereLight.setAttribute('light', 'intensity', originalHemisphere * 0.3);
        directionalLight.setAttribute('light', 'intensity', originalDirectional * 0.3);
        
        // Nach duration zurücksetzen
        setTimeout(() => {
            if (ambientLight) ambientLight.setAttribute('light', 'intensity', originalAmbient);
            if (hemisphereLight) hemisphereLight.setAttribute('light', 'intensity', originalHemisphere);
            if (directionalLight) directionalLight.setAttribute('light', 'intensity', originalDirectional);
        }, duration);
    }

    /**
     * Erzeugt visuelle Ablenkung
     */
    spawnVisualDistraction(opts = {}) {
        const scene = document.querySelector('a-scene');
        if (!scene) return;

        const allowBurst = !(opts && opts.noBurst);

        // Hyperfokus: Reize sind "ausgeblendet" (nicht komplett weg, aber deutlich weniger)
        if (this.isHyperfocusActive()) {
            const skipChanceByLevel = [0, 0.55, 0.62, 0.70];
            if (Math.random() < (skipChanceByLevel[this.distractionLevel] || 0.6)) return;
        }

        // Kurz nach Refocus: deutlich weniger neue Reize
        if (this.isRefocusShieldActive && this.isRefocusShieldActive()) {
            // Bei hoher Intensität ist es spürbar, aber nicht "magisch".
            const skipChanceByLevel = [0, 0.88, 0.84, 0.78];
            if (Math.random() < (skipChanceByLevel[this.distractionLevel] || 0.83)) return;
        }

        // Direkt nach Refocus: absoluter Lock (damit Refocus sofort spürbar ist)
        if (this.isRefocusHardLockActive && this.isRefocusHardLockActive()) return;

        // Neue Typen: Gedankenblase
        const types = this.environment === 'hoersaal'
            ? ['largePopup', 'flashingLight', 'flashingLight', 'peripheralMovement', 'thoughtBubble']
            : (this.environment === 'desk'
                ? [
                    // Desk: eher "Monitor/PC" als fliegende Objekte
                                        'monitorMicro', 'monitorMicro', 'monitorMicro',
                                        'screenFlicker', 'screenFlicker',
                                        'flashingLight',
                    'largePopup', 'peripheralMovement', 'thoughtBubble', 'movingObject'
                  ]
                : ['largePopup', 'movingObject', 'movingObject', 'peripheralMovement', 'peripheralMovement', 'thoughtBubble']);
        // Prokrastination: mehr "tempting" Screen-Reize; Working: etwas weniger
        let bag = types.slice();
        if (this.environment === 'desk') {
            if (this.taskState === 'procrastinating') bag = bag.concat(['monitorMicro', 'monitorMicro', 'largePopup']);
            if (this.taskState === 'working') bag = bag.filter(t => t !== 'movingObject');

            // Re-Entry: eher "task-adjacent" Monitor/Screen, weniger Social/Popups
            const isReentry = (this.taskState === 'working' && this.isReentryActive && this.isReentryActive());
            if (isReentry) {
                bag = bag.filter(t => t !== 'largePopup' && t !== 'movingObject');
                bag = bag.concat(['monitorMicro', 'monitorMicro', 'screenFlicker']);
            }
        }

        // Habituation: wiederholte Typen werden wahrscheinlicher "ausgeblendet" (reroll)
        let type = this.randomChoice(bag);
        for (let tries = 0; tries < 2; tries++) {
            const f = (this.getHabituationFactor ? this.getHabituationFactor('visual', type) : 1.0);
            if (f >= 0.60) break;
            type = this.randomChoice(bag);
        }
        if (this.noteStimulus) this.noteStimulus('visual', type);
        switch(type) {
            case 'largePopup':
                this.createLargePopup();
                break;
            case 'movingObject':
                this.createMovingDistraction();
                break;
            case 'flashingLight':
                this.createFlashingLight();
                break;
            case 'peripheralMovement':
                this.createPeripheralMovement();
                break;
            case 'thoughtBubble':
                this.createThoughtBubble();
                break;
            case 'monitorMicro':
                this.createMonitorMicroDistraction();
                break;
            case 'screenFlicker':
                this.createScreenFlicker();
                break;
        }

        // Intensität spürbarer machen: bei Mittel/Stark kommen Reize manchmal in „Clustern“.
        // (Nur sichere, kurze Typen; keine aggressiven Forced-Looks.)
        if (
            allowBurst &&
            this.distractionLevel >= 2 &&
            !(this.isHyperfocusActive && this.isHyperfocusActive()) &&
            !(this.isRefocusShieldActive && this.isRefocusShieldActive())
        ) {
            const extraChance = this.distractionLevel === 3 ? 0.22 : 0.12;
            const maxActive = this.environment === 'desk' ? 4 : 3;
            if ((this.visualDistractions || []).length < maxActive && Math.random() < extraChance) {
                setTimeout(() => {
                    if (!this.active || this.paused || this.distractionLevel <= 0) return;
                    if (this.isHyperfocusActive && this.isHyperfocusActive()) return;
                    if (this.isRefocusShieldActive && this.isRefocusShieldActive()) return;

                    if (this.environment === 'desk') {
                        this.createMonitorMicroDistraction({ reason: 'burst' });
                    } else if (this.environment === 'hoersaal') {
                        this.createThoughtBubble();
                    } else {
                        this.createPeripheralMovement();
                    }
                }, 180 + Math.random() * 170);
            }
        }
    }

    isVrMode() {
        const scene = document.querySelector('a-scene');
        return !!(scene && scene.is && scene.is('vr-mode'));
    }

    getWorldPos(el) {
        if (!el) return null;
        try {
            const v = new THREE.Vector3();
            el.object3D.getWorldPosition(v);
            return { x: v.x, y: v.y, z: v.z };
        } catch (e) {
            const p = el.getAttribute('position');
            if (!p) return null;
            return { x: p.x || 0, y: p.y || 0, z: p.z || 0 };
        }
    }

    getRigWorldPos() {
        const rig = document.querySelector('#rig');
        return this.getWorldPos(rig) || { x: 0, y: 0, z: 0 };
    }

    getNearestElementTo(pos, elements) {
        try {
            if (!pos || !elements || !elements.length) return null;
            let best = null;
            let bestD = Infinity;
            for (const el of elements) {
                const wp = this.getWorldPos(el);
                if (!wp) continue;
                const dx = wp.x - pos.x;
                const dy = wp.y - pos.y;
                const dz = wp.z - pos.z;
                const d = dx * dx + dy * dy + dz * dz;
                if (d < bestD) {
                    bestD = d;
                    best = el;
                }
            }
            return best;
        } catch (e) {
            return null;
        }
    }

    // Where should Refocus guide the user back to?
    getRefocusTargetWorldPos() {
        try {
            const env = this.environment || 'desk';

            if (env === 'desk') {
                const m = document.querySelector('#monitor1') || document.querySelector('#monitor2');
                const wp = this.getWorldPos(m);
                return wp ? { x: wp.x, y: wp.y + 0.12, z: wp.z } : null;
            }

            if (env === 'supermarkt') {
                const rigPos = this.getRigWorldPos();
                const aisles = Array.from(document.querySelectorAll('#shelves > a-entity'));
                const nearest = this.getNearestElementTo(rigPos, aisles);
                const wp = this.getWorldPos(nearest || document.querySelector('#shelves'));
                if (wp) return { x: wp.x, y: wp.y + 1.1, z: wp.z };
                return { x: 0, y: 1.2, z: -2.5 };
            }

            if (env === 'hoersaal') {
                const prof = document.querySelector('#prof');
                const wpProf = this.getWorldPos(prof);
                if (wpProf) return { x: wpProf.x, y: wpProf.y + 0.25, z: wpProf.z };
                return { x: 0, y: 2.6, z: -6.8 };
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    // --- Desk: kleine, realistische Monitor-Ablenkungen (Discord/Update/Shorts) ---
    createMonitorMicroDistraction(opts = {}) {
        if (this.environment !== 'desk') return;

        const monitorEls = [document.querySelector('#monitor1'), document.querySelector('#monitor2')].filter(Boolean);
        if (!monitorEls.length) return;

        const monitorEl = this.randomChoice(monitorEls);
        const isLeft = monitorEl.getAttribute('id') === 'monitor1';

        const task = this.getActiveTask ? this.getActiveTask() : { kind: 'misc', text: '' };

        const variantsCommon = [
            { title: 'Discord', body: '„Nur kurz“: 1 neue Nachricht', accent: '#5865f2', icon: '💬' },
            { title: 'YouTube', body: 'Shorts: „2 Min Tutorial“', accent: '#ef4444', icon: '▶' },
            { title: 'System', body: 'Achtung: Akku 20%', accent: '#f59e0b', icon: '⚠' }
        ];
        const variantsByKind = {
            deepwork: [
                { title: 'GitHub', body: 'PR: „Nur kurz reviewen…“', accent: '#a78bfa', icon: '🧩' },
                { title: 'Docs', body: '„Ich schau nur schnell nach…“', accent: '#0ea5e9', icon: '🔎' },
                { title: 'Build', body: 'Fehler: 1 Warnung (fix?)', accent: '#f97316', icon: '🛠' }
            ],
            email: [
                { title: 'Mail', body: 'Neue Nachricht: „kurze Rückfrage“', accent: '#38bdf8', icon: '✉' },
                { title: 'Kalender', body: 'Meeting in 15 Min (prep?)', accent: '#60a5fa', icon: '📅' },
                { title: 'Slack', body: 'Ping: „Hast du kurz Zeit?“', accent: '#22c55e', icon: '💬' }
            ],
            planning: [
                { title: 'Notizen', body: '„Noch schnell“ 3 neue Punkte', accent: '#f59e0b', icon: '🗒' },
                { title: 'Shop', body: '„Nur kurz Preise vergleichen…“', accent: '#fb7185', icon: '🛒' }
            ],
            chores: [
                { title: 'Playlist', body: '„Nur kurz Song wechseln…“', accent: '#a855f7', icon: '🎵' },
                { title: 'Messenger', body: '„Bin gleich da…“', accent: '#38bdf8', icon: '💬' }
            ],
            social: [
                { title: 'Messenger', body: '„Nur kurz antworten…“', accent: '#38bdf8', icon: '💬' },
                { title: 'Anruf', body: 'Verpasster Anruf', accent: '#ef4444', icon: '📞' }
            ]
        };

        const isProcrastinating = this.taskState === 'procrastinating';
        const isInterrupt = opts && opts.reason === 'interrupt';
        const isReentry = (opts && opts.reason === 'reentry') || (this.taskState === 'working' && this.isReentryActive && this.isReentryActive());
        const isRefocus = opts && opts.reason === 'refocus';
        let pool = [];

        // Prokrastination: eher "Entertainment"/Chat.
        // Re-Entry: mehr "task-adjacent" (Build/Docs/PR), weniger tempting.
        // Working: Mischung, aber weniger extrem.
        if (isRefocus) {
            const systemOnly = variantsCommon.filter(v => v.title === 'System');
            pool = pool.concat(
                (variantsByKind[task.kind] || []),
                (variantsByKind[task.kind] || []),
                systemOnly,
                [{ title: 'Zurück zur Aufgabe', body: 'Weiter im aktuellen Tab', accent: '#22c55e', icon: '↩' }]
            );
        } else if (isProcrastinating || isInterrupt) {
            pool = pool.concat(variantsCommon, [{ title: 'Steam', body: 'Update verfügbar (jetzt?)', accent: '#0ea5e9', icon: '💾' }]);
        } else if (isReentry) {
            const systemOnly = variantsCommon.filter(v => v.title === 'System');
            pool = pool.concat(
                (variantsByKind[task.kind] || []),
                (variantsByKind[task.kind] || []),
                systemOnly,
                [{ title: 'Zurück', body: 'Wo war ich…? Kontext wiederfinden', accent: '#64748b', icon: '↩' }]
            );
        } else {
            pool = pool.concat((variantsByKind[task.kind] || []), variantsCommon);
        }

        // Intensität beeinflusst die „Qualität“ des Reizes.
        // Level 1: mehr neutral/task-adjacent (wirkt wie produktives Chaos)
        // Level 3: mehr tempting/social (zieht stärker weg)
        if (!isRefocus) {
            const lvl = this.distractionLevel || 0;
            const taskAdj = (variantsByKind[task.kind] || []);
            const tempting = variantsCommon.filter(v => v.title === 'Discord' || v.title === 'YouTube');
            const neutral = variantsCommon.filter(v => v.title === 'System');

            if (lvl === 1 && !(isProcrastinating || isInterrupt)) {
                // Beim Arbeiten auf niedrig: eher „Docs/Build/PR“ + System, wenig Entertainment
                pool = pool.concat(taskAdj, taskAdj, neutral);
                pool = pool.filter(v => v.title !== 'YouTube').concat(neutral);
            } else if (lvl === 3 && !(isReentry || isRefocus)) {
                // Bei stark: selbst beim Arbeiten drängt mehr tempting rein
                pool = pool.concat(tempting, tempting, [{ title: 'Steam', body: 'Update verfügbar (jetzt?)', accent: '#0ea5e9', icon: '💾' }]);
            }
        }

        const v = this.randomChoice(pool);

        // Kleine Overlay-Card auf dem Monitor
        const card = document.createElement('a-entity');
        // Exakt innerhalb der Screen-Plane platzieren (damit nichts "vom Monitor hängt").
        // Screen in desk.html: width=0.56 height=0.315 bei z=0.025
        const screenW = 0.56;
        const screenH = 0.315;
        const cardW = 0.38;
        const cardH = 0.16;
        const margin = 0.012;
        const maxX = Math.max(0, (screenW - cardW) / 2 - margin);
        const maxY = Math.max(0, (screenH - cardH) / 2 - margin);

        // Default: oben rechts, mit minimalem Jitter (wirkt "lebendig", bleibt aber sauber auf dem Screen).
        let x = maxX + (Math.random() * 0.02 - 0.01);
        let y = maxY + (Math.random() * 0.02 - 0.01);
        x = Math.max(-maxX, Math.min(maxX, x));
        y = Math.max(-maxY, Math.min(maxY, y));

        // Sehr nah an der Screen-Plane, um "auf dem Monitor" zu wirken (aber ohne Z-Fighting).
        const z = 0.0265;
        card.setAttribute('position', `${x.toFixed(3)} ${y.toFixed(3)} ${z}`);
        card.setAttribute('rotation', '0 0 0');
        card.innerHTML = `
            <a-plane width="0.38" height="0.16" material="color:#0b1020; opacity:0.75; transparent:true; shader:flat" position="0 0 0"></a-plane>
            <a-plane width="0.01" height="0.16" material="color:${v.accent}; shader:flat" position="-0.185 0 0.001"></a-plane>
            <a-troika-text value="${v.icon} ${v.title}" max-width="0.34" font-size="0.030" color="#e5e7eb" position="-0.165 0.045 0.002" align="left" anchor="left" baseline="center"></a-troika-text>
            <a-troika-text value="${v.body}" max-width="0.34" font-size="0.028" color="#cbd5e1" position="-0.165 -0.02 0.002" align="left" anchor="left" baseline="center" fill-opacity="0.85"></a-troika-text>
            <a-animation attribute="scale" from="0.92 0.92 0.92" to="1 1 1" dur="220" easing="easeOutQuad"></a-animation>
        `;
        monitorEl.appendChild(card);
        this.visualDistractions.push(card);

        // Interaktiv: Klick auf die Card = "nachgeben" (Refocus-Cue soll nicht "bestrafen")
        if (!isRefocus) {
            this.makeEntityClickable(card, { type: 'monitorMicro', label: `${v.title}`, severity: 1.0 });
        }

        // Leises Monitor-"Ping" mit Stereo-Pan (Refocus-Cue: eher kein Ping)
        if (!isRefocus) {
            const ctx = this.getAudioContext();
            if (ctx) {
                this.playSoundFile('MultimediaNotify_S011TE.579.wav', { maxDuration: 0.35, volume: 0.16, pan: isLeft ? -0.35 : 0.35 });
            }
        }

        // Desk: häufiger ein Cue (ohne Kopfzwang) – damit "mehr passiert" ohne Stress
        if (this.environment === 'desk') {
            const cueChanceByLevel = [0, 0.22, 0.40, 0.58];
            const cueChance = cueChanceByLevel[this.distractionLevel] || 0;
            if (!isRefocus && Math.random() < cueChance) {
                const wp = this.getWorldPos(monitorEl);
                if (wp) this.createGazeCue(wp.x, wp.y + 0.1, wp.z, 850 + Math.random() * 450);
            }
        }

        // Fokus-Shift: nur Blickhinweis (kein Forced-Look)
        const lookDuration = [0, 520, 850, 1200][this.distractionLevel];
        const lookChanceByLevel = [0, 0.18, 0.28, 0.42];
        const lookChance = lookChanceByLevel[this.distractionLevel] || 0;
        if (!isRefocus && lookDuration > 0 && Math.random() < lookChance) {
            const wp = this.getWorldPos(monitorEl);
            if (wp) {
                setTimeout(() => this.createGazeCue(wp.x, wp.y + 0.1, wp.z, lookDuration), 250);
            }
        }

        const level = this.distractionLevel || 0;
        const baseLifeByLevel = isRefocus ? [0, 1200, 1350, 1500] : [0, 1600, 2300, 3100];
        const jitterByLevel = isRefocus ? [0, 500, 500, 500] : [0, 900, 1100, 1300];
        const life = (baseLifeByLevel[level] || 1800) + Math.random() * (jitterByLevel[level] || 900);
        setTimeout(() => {
            if (card.parentNode) card.parentNode.removeChild(card);
            const idx = this.visualDistractions.indexOf(card);
            if (idx > -1) this.visualDistractions.splice(idx, 1);
        }, life);
    }

    // --- Desk: kurzer Flicker/Dim auf einem Monitor (wie Helligkeit schwankt / GPU/Auto-Dimming) ---
    createScreenFlicker() {
        if (this.environment !== 'desk') return;

        const monitorEls = [document.querySelector('#monitor1'), document.querySelector('#monitor2')].filter(Boolean);
        if (!monitorEls.length) return;
        const monitorEl = this.randomChoice(monitorEls);

        const flicker = document.createElement('a-entity');
        flicker.setAttribute('position', '0 0 0.032');
        flicker.innerHTML = `
            <a-plane width="0.56" height="0.315" material="color:#000000; opacity:0.0; transparent:true; shader:flat"></a-plane>
            <a-animation attribute="material.opacity" from="0.0" to="0.22" dur="90" direction="alternate" repeat="3" easing="linear"></a-animation>
        `;
        monitorEl.appendChild(flicker);
        this.visualDistractions.push(flicker);

        // Leises elektrisches "tick"/mouseclick als Ersatz für echtes Bildschirmfiepen
        const ctx = this.getAudioContext();
        if (ctx) {
            const isLeft = monitorEl.getAttribute('id') === 'monitor1';
            this.playMouseClick(ctx, { volume: 0.06, pan: isLeft ? -0.2 : 0.2 });
        }

        setTimeout(() => {
            if (flicker.parentNode) flicker.parentNode.removeChild(flicker);
            const idx = this.visualDistractions.indexOf(flicker);
            if (idx > -1) this.visualDistractions.splice(idx, 1);
        }, 420);
    }

    // Desk: kurzer "Glare" im Sichtfeld (wie Monitorblendung/Auto-Dimming), ohne Kopfzwang.
    createCameraGlareFlash(intensity = 0.12, durationMs = 420) {
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        if (!camera) return;

        const glare = document.createElement('a-entity');
        glare.setAttribute('position', '0 0 -0.65');
        glare.setAttribute('rotation', '0 0 0');
        const alpha = Math.max(0.04, Math.min(0.22, intensity));
        const dur = Math.max(260, Math.min(900, durationMs));
        glare.innerHTML = `
            <a-plane width="0.9" height="0.55" material="color:#ffffff; opacity:0.0; transparent:true; shader:flat"></a-plane>
            <a-animation attribute="material.opacity" from="0.0" to="${alpha}" dur="80" direction="alternate" repeat="2" easing="easeInOutQuad"></a-animation>
            <a-animation attribute="material.opacity" from="${alpha}" to="0.0" dur="${dur}" easing="easeOutQuad"></a-animation>
        `;
        camera.appendChild(glare);
        this.visualDistractions.push(glare);

        setTimeout(() => {
            if (glare.parentNode) glare.parentNode.removeChild(glare);
            const idx = this.visualDistractions.indexOf(glare);
            if (idx > -1) this.visualDistractions.splice(idx, 1);
        }, dur + 120);
    }

    // Kleiner elektrischer Tick (sehr leise), um "Bildschirm/Netzteil" zu suggerieren
    playTinyElectricalTick(ctx, opts = {}) {
        const out = this.createSpatialOutput(ctx, {
            volume: typeof opts.volume === 'number' ? opts.volume : 0.06,
            pan: typeof opts.pan === 'number' ? opts.pan : 0
        });
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 900 + Math.random() * 400;
        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(out);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.055);
    }

    /**
     * Große Notification vor der Kamera
     */
    createLargePopup() {
        // Handyvibration und Notification-Sound abspielen, wenn Popup erscheint
        const ctx = this.getAudioContext();
        if (ctx) {
            this.playPhoneVibrate(ctx);
            this.playNotificationSound(ctx);
        }
        const scene = document.querySelector('a-scene');
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        if (!camera) return;
        
        // Kontextspezifische Notifications je nach Umgebung
        const notificationsByEnvironment = {
            desk: [
                { app: 'Discord', sender: 'Zockerkumpels', text: 'Eine Runde zocken?', icon: '🎮', time: 'jetzt' },
                { app: 'YouTube', sender: 'Empfehlung', text: 'Neues Video von deinem Lieblingskanal', icon: '▶️', time: 'vor 2 Min' },
                { app: 'Steam', sender: 'Update', text: 'Download bereit: 47 GB', icon: '💾', time: 'jetzt' },
                { app: 'Instagram', sender: 'Lisa', text: 'hat dein Foto geliked', icon: '❤️', time: 'vor 1 Min' },
                { app: 'TikTok', sender: 'Trending', text: '12 neue Videos für dich', icon: '🎵', time: 'jetzt' },
                { app: 'Spotify', sender: 'Playlist', text: 'Deine Wochenübersicht ist da', icon: '🎧', time: 'vor 5 Min' }
            ],
            hoersaal: [
                { app: 'Mail', sender: 'Prof. Schmidt', text: 'Klausurtermin verschoben', icon: '📧', time: 'jetzt' },
                { app: 'WhatsApp', sender: 'Lerngruppe', text: 'Kommst du heute zum Lernen?', icon: '💬', time: 'jetzt' },
                { app: 'Kalender', sender: 'Erinnerung', text: 'Abgabe Hausarbeit in 2 Tagen', icon: '📅', time: 'jetzt' },
                { app: 'Moodle', sender: 'Neue Aufgabe', text: 'Übungsblatt 7 hochgeladen', icon: '📚', time: 'vor 10 Min' },
                { app: 'WhatsApp', sender: 'Mama', text: 'Kommst du am Wochenende?', icon: '👋', time: 'jetzt' },
                { app: 'Instagram', sender: 'Studigruppe', text: 'Story: Mensa closed today', icon: '📸', time: 'vor 3 Min' }
            ],
            supermarkt: [
                { app: 'Einkaufsliste', sender: 'Reminder', text: 'Noch 3 Artikel übrig', icon: '📝', time: 'jetzt' },
                { app: 'Payback', sender: 'Angebot', text: '20% auf Getränke heute!', icon: '💰', time: 'jetzt' },
                { app: 'WhatsApp', sender: 'Partner', text: 'Vergiss die Milch nicht!', icon: '🥛', time: 'vor 1 Min' },
                { app: 'Banking', sender: 'Kontostand', text: 'Abbuchung: -47,23€', icon: '💳', time: 'jetzt' },
                { app: 'Lieferando', sender: 'Rabatt', text: 'Pizza bestellen & sparen', icon: '🍕', time: 'vor 5 Min' },
                { app: 'Anruf', sender: 'Unbekannt', text: 'Eingehender Anruf...', icon: '📱', time: 'jetzt' }
            ]
        };
        
        const notifications = notificationsByEnvironment[this.environment] || notificationsByEnvironment.desk;

        // Intensität beeinflusst die "Qualität" der großen Popups:
        // Level 1: eher taskish/neutral, Level 3: eher social/entertainment.
        const lvl = this.distractionLevel || 0;
        const taskishApps = new Set(['Mail', 'Kalender', 'Moodle', 'Einkaufsliste', 'Banking', 'Payback']);
        const temptingApps = new Set(['Discord', 'YouTube', 'Instagram', 'TikTok', 'WhatsApp', 'Lieferando']);

        let bag = notifications.slice();
        if (lvl === 1) {
            const taskish = notifications.filter(n => taskishApps.has(n.app));
            const neutral = notifications.filter(n => n.app === 'Anruf');
            if (taskish.length) bag = bag.concat(taskish, taskish, taskish);
            if (neutral.length) bag = bag.concat(neutral);
        } else if (lvl === 3) {
            const tempting = notifications.filter(n => temptingApps.has(n.app));
            if (tempting.length) bag = bag.concat(tempting, tempting, tempting);
        }

        const notif = this.randomChoice(bag);

        // Mapping: Wenn Nachricht Aufgabenbezug hat, To-Do ergänzen
        const todoMappings = [
            // desk
            { env: 'desk', app: 'Discord', text: 'Eine Runde zocken?', todo: 'Mit Freunden zocken' },
            { env: 'desk', app: 'YouTube', text: 'Neues Video von deinem Lieblingskanal', todo: 'YouTube-Video anschauen' },
            { env: 'desk', app: 'Steam', text: 'Download bereit: 47 GB', todo: 'Spiel-Update installieren' },
            { env: 'desk', app: 'Instagram', text: 'hat dein Foto geliked', todo: 'Instagram checken' },
            { env: 'desk', app: 'TikTok', text: '12 neue Videos für dich', todo: 'TikTok durchscrollen' },
            { env: 'desk', app: 'Spotify', text: 'Deine Wochenübersicht ist da', todo: 'Spotify Playlist hören' },
            { env: 'desk', app: 'Mail', text: 'Projektmeeting um 15 Uhr', todo: 'Projektmeeting vorbereiten' },
            { env: 'desk', app: 'Kalender', text: 'Abgabe Präsentation morgen', todo: 'Präsentation fertigstellen' },
            { env: 'desk', app: 'Teams', text: 'Neue Aufgabe zugewiesen', todo: 'Neue Arbeitsaufgabe erledigen' },
            // hoersaal
            { env: 'hoersaal', app: 'Mail', text: 'Klausurtermin verschoben', todo: 'Klausurtermin notieren' },
            { env: 'hoersaal', app: 'WhatsApp', text: 'Kommst du heute zum Lernen?', todo: 'Lerngruppe besuchen' },
            { env: 'hoersaal', app: 'Kalender', text: 'Abgabe Hausarbeit in 2 Tagen', todo: 'Hausarbeit abgeben' },
            { env: 'hoersaal', app: 'Moodle', text: 'Übungsblatt 7 hochgeladen', todo: 'Übungsblatt 7 bearbeiten' },
            { env: 'hoersaal', app: 'WhatsApp', text: 'Kommst du am Wochenende?', todo: 'Wochenendplanung machen' },
            { env: 'hoersaal', app: 'Instagram', text: 'Story: Mensa closed today', todo: 'Mittagessen planen' },
            { env: 'hoersaal', app: 'Mail', text: 'Erinnerung: Seminararbeit abgeben', todo: 'Seminararbeit abgeben' },
            { env: 'hoersaal', app: 'Kalender', text: 'Vortrag in 1 Stunde', todo: 'Vortrag vorbereiten' },
            { env: 'hoersaal', app: 'Teams', text: 'Feedback zu Abgabe erhalten', todo: 'Feedback lesen' },
            // supermarkt
            { env: 'supermarkt', app: 'Einkaufsliste', text: 'Noch 3 Artikel übrig', todo: 'Einkaufsliste abarbeiten' },
            { env: 'supermarkt', app: 'Payback', text: '20% auf Getränke heute!', todo: 'Getränke kaufen' },
            { env: 'supermarkt', app: 'WhatsApp', text: 'Vergiss die Milch nicht!', todo: 'Milch kaufen' },
            { env: 'supermarkt', app: 'Banking', text: 'Abbuchung: -47,23€', todo: 'Kontostand prüfen' },
            { env: 'supermarkt', app: 'Lieferando', text: 'Pizza bestellen & sparen', todo: 'Pizza bestellen' },
            { env: 'supermarkt', app: 'Anruf', text: 'Eingehender Anruf...', todo: 'Anruf beantworten' },
            { env: 'supermarkt', app: 'Mail', text: 'Rechnung offen', todo: 'Rechnung bezahlen' },
            { env: 'supermarkt', app: 'Kalender', text: 'Arzttermin morgen', todo: 'Arzttermin wahrnehmen' },
        ];
        const match = todoMappings.find(m => m.env === this.environment && m.app === notif.app && notif.text.startsWith(m.text));
        if (match && !this.taskList.includes(match.todo)) {
            this.addTask(match.todo);
        }

        // Desk: Handy liegt auf dem Tisch -> Notification dort anzeigen statt "reinfliegen"
        if (this.environment === 'desk') {
            const deskPhone = document.getElementById('desk-phone');
            const card = document.getElementById('desk-phone__card');
            const appEl = document.getElementById('desk-phone__app');
            const timeEl = document.getElementById('desk-phone__time');
            const senderEl = document.getElementById('desk-phone__sender');
            const textEl = document.getElementById('desk-phone__text');

            if (deskPhone && card && appEl && timeEl && senderEl && textEl) {
                const now = new Date();
                appEl.setAttribute('value', `${notif.icon} ${notif.app}`);
                timeEl.setAttribute('value', notif.time);
                senderEl.setAttribute('value', notif.sender);
                textEl.setAttribute('value', notif.text);

                // Card einblenden
                card.setAttribute('material', 'shader: flat; color:#111827; opacity:0.98; transparent:true');

                // leichte Vibration (dezenter als im Hörsaal)
                deskPhone.setAttribute('animation__vibrate', {
                    property: 'rotation',
                    from: '-90 25 -2',
                    to: '-90 25 2',
                    dur: 90,
                    loop: 6,
                    dir: 'alternate',
                    easing: 'linear'
                });

                // nach kurzer Zeit wieder ausblenden
                setTimeout(() => {
                    card.setAttribute('material', 'shader: flat; color:#111827; opacity:0.0; transparent:true');
                    appEl.setAttribute('value', '');
                    timeEl.setAttribute('value', '');
                    senderEl.setAttribute('value', '');
                    textEl.setAttribute('value', '');
                    deskPhone.removeAttribute('animation__vibrate');
                }, 3500);
            }
        }
        
        // Telefon-Entity bauen
        const phone = document.createElement('a-entity');
        const startY = -0.7; // Start knapp unter Sichtfeld
        const endY = -0.3;   // Ziel: unteres Drittel, aber sichtbar
        phone.setAttribute('position', `0 ${startY} -0.45`);
        phone.setAttribute('rotation', '-15 0 0');  // Leicht geneigt, wie wenn du's in der Hand hältst
        
        // iPhone Gehäuse - schwarz und edgy
        const body = document.createElement('a-box');
        body.setAttribute('width', '0.18');
        body.setAttribute('height', '0.38');
        body.setAttribute('depth', '0.015');
        body.setAttribute('color', '#1a1a1a');
        body.setAttribute('material', 'metalness: 0.8; roughness: 0.2');
        phone.appendChild(body);
        
        // Display - der schwarze Bildschirm
        const screen = document.createElement('a-plane');
        screen.setAttribute('width', '0.17');
        screen.setAttribute('height', '0.365');
        screen.setAttribute('position', '0 0 0.009');
        screen.setAttribute('color', '#000000');
        screen.setAttribute('material', 'shader: flat');
        phone.appendChild(screen);
        
        // Die Notch oben (weil Apple halt so ist)
        const notch = document.createElement('a-box');
        notch.setAttribute('width', '0.06');
        notch.setAttribute('height', '0.008');
        notch.setAttribute('depth', '0.005');
        notch.setAttribute('position', '0 0.175 0.012');
        notch.setAttribute('color', '#1a1a1a');
        phone.appendChild(notch);
        
        // Die Benachrichtigungs-Karte (hier kommt die nervige Message)
        const notifCard = document.createElement('a-plane');
        notifCard.setAttribute('width', '0.16');
        notifCard.setAttribute('height', '0.085');
        notifCard.setAttribute('position', '0 0.118 0.011');
        notifCard.setAttribute('color', '#1e293b');
        notifCard.setAttribute('opacity', '0.98');
        notifCard.setAttribute('material', 'shader: flat');
        phone.appendChild(notifCard);
        
        // App-Name mit Icon (links oben in der Notification)
        const appName = document.createElement('a-troika-text');
        appName.setAttribute('value', `${notif.icon} ${notif.app}`);
        appName.setAttribute('position', '-0.073 0.158 0.012');
        appName.setAttribute('max-width', '0.15');
        appName.setAttribute('font-size', '0.014');
        appName.setAttribute('color', '#94a3b8');
        appName.setAttribute('align', 'left');
        appName.setAttribute('anchor', 'left');
        phone.appendChild(appName);
        
        // Zeitstempel (rechts oben)
        const time = document.createElement('a-troika-text');
        time.setAttribute('value', notif.time);
        time.setAttribute('position', '0.068 0.158 0.012');
        time.setAttribute('max-width', '0.15');
        time.setAttribute('font-size', '0.013');
        time.setAttribute('color', '#64748b');
        time.setAttribute('align', 'right');
        time.setAttribute('anchor', 'right');
        phone.appendChild(time);
        
        // Wer hat geschrieben? (dick gedruckt)
        const sender = document.createElement('a-troika-text');
        sender.setAttribute('value', notif.sender);
        sender.setAttribute('position', '-0.073 0.134 0.012');
        sender.setAttribute('max-width', '0.15');
        sender.setAttribute('font-size', '0.016');
        sender.setAttribute('color', '#ffffff');
        sender.setAttribute('align', 'left');
        sender.setAttribute('anchor', 'left');
        phone.appendChild(sender);
        
        // Die eigentliche Nachricht
        const text = document.createElement('a-troika-text');
        text.setAttribute('value', notif.text);
        text.setAttribute('position', '-0.073 0.108 0.012');
        text.setAttribute('max-width', '0.15');
        text.setAttribute('font-size', '0.014');
        text.setAttribute('color', '#cbd5e1');
        text.setAttribute('align', 'left');
        text.setAttribute('anchor', 'left');
        text.setAttribute('baseline', 'top');
        text.setAttribute('line-height', '1.14');
        text.setAttribute('fill-opacity', '0.90');
        phone.appendChild(text);
        
        // Uhrzeit in der Status-Bar (weil Detail!)
        const statusTime = document.createElement('a-troika-text');
        const now = new Date();
        statusTime.setAttribute('value', `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
        statusTime.setAttribute('position', '-0.005 0.1785 0.012');
        statusTime.setAttribute('max-width', '0.10');
        statusTime.setAttribute('font-size', '0.013');
        statusTime.setAttribute('color', '#ffffff');
        statusTime.setAttribute('align', 'center');
        statusTime.setAttribute('anchor', 'center');
        phone.appendChild(statusTime);
        
        // Status-Icons
        const statusIcons = document.createElement('a-troika-text');
        statusIcons.setAttribute('value', '📶 🔋');
        statusIcons.setAttribute('position', '0.062 0.1785 0.012');
        statusIcons.setAttribute('max-width', '0.10');
        statusIcons.setAttribute('font-size', '0.013');
        statusIcons.setAttribute('color', '#ffffff');
        statusIcons.setAttribute('align', 'right');
        statusIcons.setAttribute('anchor', 'right');
        phone.appendChild(statusIcons);
        
        // Rein-/Raus-Animation
        phone.setAttribute('animation__flyup', {
            property: 'position',
            to: `0 ${endY} -0.45`,
            dur: 800,
            easing: 'easeOutBack'
        });
        
        // Vibrations-Animation
        phone.setAttribute('animation__vibrate', {
            property: 'rotation',
            from: '-15 0 -2',
            to: '-15 0 2',
            dur: 100,
            loop: 4,
            dir: 'alternate',
            delay: 500
        });
        
        camera.appendChild(phone);
        this.visualDistractions.push(phone);

        // Interaktiv: Klick aufs Handy = "nachgeben" (Stress/Prokrastination steigen durch Aktion)
        this.makeEntityClickable(phone, { type: 'phone', label: `${notif.app}`, severity: 1.2 });
        
        // Kamera-Shift: Nur wenn keine andere visuelle Ablenkung gerade im Fokus ist
        // (Kein automatischer Kopfmove mehr, sondern gezielter Fokus auf das neue Objekt)
        // Hier: Fokus-Shift NUR wenn keine andere Ablenkung im Zentrum ist
        // (Optional: Fokus-Shift kann auch für andere Typen unten erfolgen)
        
        // Verschwinden
        setTimeout(() => {
            phone.setAttribute('animation__flydown', {
                property: 'position',
                to: `0 ${startY} -0.45`,
                dur: 600,
                easing: 'easeInBack'
            });
            
            // Cleanup
            setTimeout(() => {
                if (phone.parentNode) {
                    phone.parentNode.removeChild(phone);
                }
                const index = this.visualDistractions.indexOf(phone);
                if (index > -1) this.visualDistractions.splice(index, 1);
            }, 700);
        }, 3500);
    }

    // Bewegte Ablenkung im Sichtfeld
    createMovingDistraction() {
        const scene = document.querySelector('a-scene');
        const mover = document.createElement('a-entity');

        // Kurz dimmen (Desk deutlich subtiler)
        if (this.environment === 'desk') {
            this.dimEnvironmentTemporarily(700);
        } else {
            this.dimEnvironmentTemporarily(1500);
        }

        // 50% Chance: Papierflieger statt Standardobjekt
        if (Math.random() < 0.5) {
            // Papierflieger: weißes, längliches Dreieck
            const startX = (Math.random() > 0.5 ? -5 : 5);
            const endX = -startX;
            const y = 1.3 + Math.random() * 1.2;
            const z = -1.2 - Math.random() * 1.5;
            mover.innerHTML = `
                <a-entity id="paperplane"
                    position="${startX} ${y} ${z}"
                    rotation="0 0 0"
                    >
                    <a-cone radius-bottom="0.01" radius-top="0.18" height="0.38" color="#fff" material="opacity:0.93; shader: flat"></a-cone>
                    <a-box width="0.18" height="0.01" depth="0.09" position="0 0.01 -0.09" color="#e5e7eb" material="opacity:0.85; shader: flat"></a-box>
                    <a-animation attribute="position" from="${startX} ${y} ${z}" to="${endX} ${y+0.12} ${z+0.3}"
                        dur="4000" easing="easeInOutQuad"></a-animation>
                    <a-animation attribute="rotation" from="0 0 0" to="0 40 25" dur="4000" easing="easeInOutQuad"></a-animation>
                </a-entity>
            `;
        } else {
            // Standardobjekte wie bisher
            const objects = [
                { shape: 'sphere', color: '#ef4444', size: 0.15, text: '!', light: 3 },
                { shape: 'box', color: '#fbbf24', size: 0.12, text: '⚠️', light: 2.5 },
                { shape: 'sphere', color: '#3b82f6', size: 0.2, text: '💬', light: 3.5 },
            ];
            const obj = this.randomChoice(objects);
            const startX = (Math.random() > 0.5 ? -5 : 5);
            const endX = -startX;
            const y = 1.2 + Math.random() * 1.5;
            const z = -1 - Math.random() * 2;
            mover.innerHTML = `
                <a-${obj.shape} radius="${obj.size}" width="${obj.size}" height="${obj.size}" depth="${obj.size}"
                               color="${obj.color}" 
                               material="emissive: ${obj.color}; emissiveIntensity: 2.0; metalness: 0.3">
                    <a-animation attribute="position" from="${startX} ${y} ${z}" to="${endX} ${y} ${z}" 
                                dur="4000" easing="linear"></a-animation>
                    <a-animation attribute="rotation" from="0 0 0" to="0 360 0" 
                                dur="2000" easing="linear" repeat="2"></a-animation>
                </a-${obj.shape}>
                <a-text value="${obj.text}" position="0 0.3 0" width="3" align="center"></a-text>
                <a-light type="point" intensity="${obj.light}" distance="6" color="${obj.color}">
                    <a-animation attribute="position" from="${startX} ${y} ${z}" to="${endX} ${y} ${z}" 
                                dur="4000" easing="linear"></a-animation>
                </a-light>
            `;
        }

        scene.appendChild(mover);
        this.visualDistractions.push(mover);

        // Desk: keine Zwangsdrehung – nur subtiler Hinweis + räumlicher Sound
        // Andere Umgebungen: wie gehabt
        if (this.environment === 'desk') {
            const cueChanceByLevel = [0, 0.08, 0.14, 0.22];
            const cueChance = cueChanceByLevel[this.distractionLevel] || 0;

            // Grober Hinweis Richtung Zentrum, aber ohne Kopf zu drehen
            if (Math.random() < cueChance) {
                this.createGazeCue(0, 1.9, -1.5, [0, 650, 900, 1100][this.distractionLevel] || 850);
            }

            // Leiser "wer-bewegt-sich-da" Sound (Stereo-Pan abhängig von Seite)
            const pan = (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.35);
            const ctx = this.getAudioContext();
            if (ctx && this.distractionLevel > 0) {
                this.playSteps(ctx, { volume: 0.12, pan });
            }
        } else {
            // Kein Forced-Look: nur Blickhinweis
            const lookDuration = [0, 900, 1300, 1700][this.distractionLevel];
            if (lookDuration > 0) {
                const midX = 0;
                const y = 2;
                const z = -1.5;
                setTimeout(() => {
                    this.createGazeCue(midX, y, z, lookDuration);
                }, 500);
            }
        }

        // Nach 4.5 Sekunden aufräumen
        this.removeAfter(mover, 4500);
    }

    // Blitzlicht-Ablenkung
    createFlashingLight() {
        // Desk: kein Raum-Strobe. Stattdessen Monitor-Flicker + kurzer Glare (realistischer beim Lernen).
        if (this.environment === 'desk') {
            const levelGlare = [0.0, 0.08, 0.11, 0.14][this.distractionLevel] || 0.1;
            if (this.distractionLevel > 0) {
                this.createCameraGlareFlash(levelGlare, 420 + Math.random() * 280);
                this.createScreenFlicker();
                const extraChanceByLevel = [0, 0.30, 0.55, 0.72];
                if (Math.random() < (extraChanceByLevel[this.distractionLevel] || 0.45)) {
                    setTimeout(() => this.createScreenFlicker(), 180 + Math.random() * 240);
                }
                const ctx = this.getAudioContext();
                if (ctx) {
                    const pan = (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.25);
                    this.playTinyElectricalTick(ctx, { volume: 0.05 + Math.random() * 0.03, pan });
                }
            }
            return;
        }

        const scene = document.querySelector('a-scene');
        const flash = document.createElement('a-entity');
        
        // Intensität/Dauer pro Level
        const lightIntensities = {
            1: { intensity: 2, duration: 600, repeats: 2, distance: 6 },    // Leicht: subtil
            2: { intensity: 4.5, duration: 800, repeats: 3, distance: 9 },  // Mittel: stärker
            3: { intensity: 6, duration: 1000, repeats: 4, distance: 12 }   // Schwer: sehr stark
        };
        
        const config = lightIntensities[this.distractionLevel] || lightIntensities[1];
        
        // Umgebung kurz dimmen
        this.dimEnvironmentTemporarily(config.duration + 500);
        
        // Zufällige Position
        const x = (Math.random() - 0.5) * 8;
        const y = 1 + Math.random() * 3;
        const z = (Math.random() - 0.5) * 12;
        
        // Farbenpool
        const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#a855f7', '#10b981', '#f97316'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Nur Lichtquelle
        flash.innerHTML = `
            <a-light type="point" intensity="${config.intensity}" distance="${config.distance}" color="${color}" position="${x} ${y} ${z}">
                <a-animation attribute="intensity" from="${config.intensity}" to="0.3" direction="alternate" dur="${config.duration}" repeat="${config.repeats - 1}"></a-animation>
            </a-light>
        `;
        
        scene.appendChild(flash);
        this.visualDistractions.push(flash);
        
        // Kein Forced-Look: nur Blickhinweis
        const cueDuration = config.duration * config.repeats + 300;
        this.createGazeCue(x, y, z, cueDuration);
        
        // Aufräumen nach Ende
        const cleanupTime = config.duration * config.repeats + 500;
        this.removeAfter(flash, cleanupTime);
    }

    // Periphere Bewegung
    createPeripheralMovement() {
        const scene = document.querySelector('a-scene');
        const peripheral = document.createElement('a-entity');
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const startZ = 3;
        const endZ = -8;
        
        // Grauer Körper
        peripheral.innerHTML = `
            <a-box width="0.4" height="1.6" depth="0.3" color="#4b5563" 
                   position="${side * 4} 0.8 ${startZ}">
                <a-animation attribute="position" 
                            from="${side * 4} 0.8 ${startZ}" 
                            to="${side * 4} 0.8 ${endZ}" 
                            dur="3000" easing="linear"></a-animation>
            </a-box>
        `;
        
        scene.appendChild(peripheral);
        this.visualDistractions.push(peripheral);

        // Desk: keine Zwangsdrehung, stattdessen nur subtile Cues + räumliche Schritte
        if (this.environment === 'desk') {
            const ctx = this.getAudioContext();
            if (ctx && this.distractionLevel > 0) {
                this.playSteps(ctx, { volume: 0.16, pan: side * (0.55 + Math.random() * 0.25) });
            }

            const cueChanceByLevel = [0, 0.10, 0.18, 0.28];
            const cueChance = cueChanceByLevel[this.distractionLevel] || 0;
            if (Math.random() < cueChance) {
                setTimeout(() => {
                    this.createGazeCue(side * 4, 0.8, (startZ + endZ) / 2, [0, 700, 1000, 1300][this.distractionLevel] || 900);
                }, 750);
            }
        } else {
            // Kein Forced-Look: nur Blickhinweis
            const lookDuration = [0, 900, 1300, 1700][this.distractionLevel];
            if (lookDuration > 0) {
                setTimeout(() => {
                    this.createGazeCue(side * 4, 0.8, (startZ + endZ) / 2, lookDuration);
                }, 800);
            }
        }
        
        // Cleanup
        this.removeAfter(peripheral, 3500);
    }

    // Audio-Ablenkungen
    playAudioDistraction() {
        const audioContext = this.getAudioContext();
        if (!audioContext) return;

        // Direkt nach Refocus: absoluter Lock (damit Refocus sofort spürbar ist)
        if (this.isRefocusHardLockActive && this.isRefocusHardLockActive()) return;

        // Hyperfokus: vieles wird ausgeblendet (Audio seltener)
        if (this.isHyperfocusActive()) {
            const skipChanceByLevel = [0, 0.55, 0.62, 0.70];
            if (Math.random() < (skipChanceByLevel[this.distractionLevel] || 0.6)) return;
        }

        // Kurz nach Refocus: Audio-Reize deutlich seltener
        if (this.isRefocusShieldActive && this.isRefocusShieldActive()) {
            const skipChanceByLevel = [0, 0.90, 0.86, 0.80];
            if (Math.random() < (skipChanceByLevel[this.distractionLevel] || 0.85)) return;
        }
        // Kontextspezifische Sounds
        const soundsByEnvironment = {
            desk: [
                { type: 'keyboard', name: 'Tastatur tippen' },
                // Kein notification-Sound mehr hier, da dieser nur mit Handy-Popup kommen soll
                { type: 'phoneVibrate', name: 'Handy vibriert' },
                { type: 'doorSlam', name: 'Haustür knallt' },
                { type: 'steps', name: 'Schritte im Flur' },
                { type: 'pcFan', name: 'PC-Lüfter dreht auf' },
                { type: 'mouseClick', name: 'Maus klicken' },
                { type: 'neighborNoise', name: 'Nachbar bohrt' }
            ],
            hoersaal: [
                { type: 'penClick', name: 'Stift klicken' },
                { type: 'paperRustle', name: 'Papier rascheln' },
                { type: 'cough', name: 'Husten' },
                { type: 'chairCreak', name: 'Stuhl knarzt' },
                { type: 'phoneVibrate', name: 'Handy vibriert' },
                { type: 'whisper', name: 'Flüstern' },
                { type: 'doorSlam', name: 'Tür im Gang' },
                { type: 'steps', name: 'Jemand kommt zu spät' }
            ],
            supermarkt: [
                { type: 'announcement', name: 'Durchsage' },
                { type: 'shoppingCart', name: 'Einkaufswagen rollt' },
                { type: 'cashRegister', name: 'Kasse piept' },
                { type: 'kidCrying', name: 'Kind schreit' },
                { type: 'footsteps', name: 'Viele Leute laufen' },
                { type: 'fridgeHum', name: 'Kühlregal brummt' },
                { type: 'productDrop', name: 'Produkt fällt runter' },
                { type: 'chatter', name: 'Leute reden' }
            ]
        };
        const sounds = soundsByEnvironment[this.environment] || soundsByEnvironment.desk;

        const isReentry = (this.environment === 'desk' && this.taskState === 'working' && this.isReentryActive && this.isReentryActive());

        // Task-State Gewichtung (realistischer: beim Prokrastinieren mehr "tempting" Geräusche)
        let bag = sounds.slice();
        if (this.environment === 'desk') {
            if (this.taskState === 'procrastinating') {
                bag = bag.concat(
                    { type: 'phoneVibrate', name: 'Handy vibriert' },
                    { type: 'mouseClick', name: 'Maus klicken' },
                    { type: 'neighborNoise', name: 'Nachbar bohrt' }
                );
            }
            if (this.taskState === 'working') {
                bag = bag.concat(
                    { type: 'keyboard', name: 'Tastatur tippen' },
                    { type: 'keyboard', name: 'Tastatur tippen' }
                );
            }

            // Re-Entry: weniger "tempting" Audio (Handy/Maus), mehr "Arbeitsgeräusche"
            if (isReentry) {
                bag = bag.filter(s => s.type !== 'phoneVibrate' && s.type !== 'mouseClick');
                bag = bag.concat(
                    { type: 'keyboard', name: 'Tastatur tippen' },
                    { type: 'keyboard', name: 'Tastatur tippen' },
                    { type: 'pcFan', name: 'PC-Lüfter dreht auf' }
                );
            }
        }

        const sound = this.randomChoice(bag);
        console.log(`🔊 Audio-Ablenkung: ${sound.name}`);

        // Habituation: wiederholte Sounds werden ausgeblendet / wirken leiser
        const habFactor = (this.getHabituationFactor ? this.getHabituationFactor('audio', sound.type) : 1.0);
        if (habFactor < 0.55) {
            const skip = 0.18 + 0.22 * (1 - habFactor);
            if (Math.random() < skip) return;
        }

        // Surround/3D: Sound kommt aus einer "Ecke" (kontextbezogen)
        const spatial = (typeof this.getSuggestedSoundSpatial === 'function')
            ? this.getSuggestedSoundSpatial(sound.type)
            : { pan: 0, pos: null };
        const pan = typeof spatial.pan === 'number' ? spatial.pan : 0;
        const pos = spatial.pos || null;
        const vol0 = typeof spatial.volume === 'number' ? spatial.volume : undefined;
        const vol = (typeof vol0 === 'number') ? (vol0 * habFactor) : undefined;

        if (this.noteStimulus) this.noteStimulus('audio', sound.type);

        // Sound abspielen
        switch(sound.type) {
            case 'penClick':
                this.playPenClick(audioContext, { pos, pan, volume: vol });
                break;
            case 'keyboard':
                this.playKeyboardTyping(audioContext, { pos, pan, volume: vol });
                break;
            case 'phoneVibrate':
                this.playPhoneVibrate(audioContext, { pos, pan, volume: vol });
                break;
            case 'cough':
                this.playCough(audioContext, { pos, pan, volume: vol });
                break;
            case 'chairCreak':
                this.playChairCreak(audioContext, { pos, pan, volume: vol });
                break;
            case 'doorSlam':
                this.playDoorSlam(audioContext, { pos, pan, volume: vol });
                break;
            case 'steps':
                this.playSteps(audioContext, { pos, pan, volume: vol });
                break;
            // Neue Sounds für Schreibtisch
            case 'pcFan':
                this.playPCFan(audioContext, { pos, pan, volume: vol });
                break;
            case 'mouseClick':
                this.playMouseClick(audioContext, { pos, pan, volume: vol });
                break;
            case 'neighborNoise':
                this.playNeighborNoise(audioContext, { pos, pan, volume: vol });
                break;
            // Neue Sounds für Hörsaal
            case 'paperRustle':
                this.playPaperRustle(audioContext, { pos, pan, volume: vol });
                break;
            case 'whisper':
                this.playWhisper(audioContext, { pos, pan, volume: vol });
                break;
            // Neue Sounds für Supermarkt
            case 'announcement':
                this.playAnnouncement(audioContext, { pos, pan, volume: vol });
                break;
            case 'shoppingCart':
                this.playShoppingCart(audioContext, { pos, pan, volume: vol });
                break;
            case 'cashRegister':
                this.playCashRegister(audioContext, { pos, pan, volume: vol });
                break;
            case 'kidCrying':
                this.playKidCrying(audioContext, { pos, pan, volume: vol });
                break;
            case 'footsteps':
                this.playFootsteps(audioContext, { pos, pan, volume: vol });
                break;
            case 'fridgeHum':
                this.playFridgeHum(audioContext, { pos, pan, volume: vol });
                break;
            case 'productDrop':
                this.playProductDrop(audioContext, { pos, pan, volume: vol });
                break;
            case 'chatter':
                this.playChatter(audioContext, { pos, pan, volume: vol });
                break;
        }
    }

    // Stift-Klick Sound
    playPenClick(ctx, opts = {}) {
        this.playSoundFile('PencilWrite_S08OF.380.wav', { maxDuration: 0.4, volume: opts.volume ?? 0.22, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Tastatur tippen
    playKeyboardTyping(ctx, opts = {}) {
        this.playSoundFile('CD_MACBOOK PRO LAPTOP KEYBOARD 01_10_08_13.wav', { maxDuration: 1.2, volume: opts.volume ?? 0.25, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Handy vibriert auf dem Tisch (BZZZZZZ)
    playPhoneVibrate(ctx, opts = {}) {
        // Play real phone vibration sound
        this.playSoundFile('cell-phone-vibration-352298.mp3', { maxDuration: 0.7, volume: opts.volume ?? 0.35, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Notification-Sound
    playNotificationSound(ctx, opts = {}) {
        this.playSoundFile('MultimediaNotify_S011TE.579.wav', { maxDuration: 0.8, volume: opts.volume ?? 0.28, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Husten (jemand ist krank und du musst es mitbekommen)
    playCough(ctx, opts = {}) {
        this.playSoundFile('horrible-female-cough-66368.mp3', { maxDuration: 1.0, volume: opts.volume ?? 0.25, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Stuhl knarzt (jemand lehnt sich zurück)
    playChairCreak(ctx, opts = {}) {
        this.playSoundFile('Wood_Creaks_01_BTM00499.wav', { maxDuration: 0.6, volume: opts.volume ?? 0.22, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Tür fällt zu - BUMM!
    playDoorSlam(ctx, opts = {}) {
        this.playSoundFile('Wood_Creaks_01_BTM00499.wav', { maxDuration: 0.5, volume: opts.volume ?? 0.3, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Schritte (jemand läuft vorbei)
    playSteps(ctx, opts = {}) {
        this.playSoundFile('WalkWoodFloor_BWU.39.wav', { maxDuration: 1.2, volume: opts.volume ?? 0.25, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // === NEUE SOUNDS FÜR SCHREIBTISCH ===
    
    // PC-Lüfter dreht auf (Gaming PC halt)
    playPCFan(ctx, opts = {}) {
        this.playSoundFile('computer-fan-75947.mp3', { maxDuration: 2.0, volume: opts.volume ?? 0.15, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Maus klicken (zocken nebenbei)
    playMouseClick(ctx, opts = {}) {
        this.playSoundFile('CD_MACBOOK PRO LAPTOP KEYBOARD 01_10_08_13.wav', { maxDuration: 0.18, volume: opts.volume ?? 0.16, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Nachbar bohrt (klassisch)
    playNeighborNoise(ctx, opts = {}) {
        this.playSoundFile('neighborhood-noise-background-33025-320959.mp3', { maxDuration: 1.5, volume: opts.volume ?? 0.25, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // === NEUE SOUNDS FÜR HÖRSAAL ===
    
    // Papier raschelt (jemand blättert)
    playPaperRustle(ctx, opts = {}) {
        this.playSoundFile('SFX,Whispers,Layered,Verb.wav', { maxDuration: 2.2, volume: opts.volume ?? 0.22, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Flüstern (Studierende tuscheln)
    playWhisper(ctx, opts = {}) {
        this.playSoundFile('SFX,Whispers,Layered,Verb.wav', { maxDuration: 2.0, volume: opts.volume ?? 0.20, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // === NEUE SOUNDS FÜR SUPERMARKT ===
    
    // Durchsage (piep-piep)
    playAnnouncement(ctx, opts = {}) {
        // Kein spezielles Durchsage-Sample vorhanden -> wir nutzen den Supermarkt-Ambience-Track kurz als "Durchsage/PA".
        this.playSoundFile('supermarket-17823.mp3', { maxDuration: 1.2, volume: opts.volume ?? 0.18, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Einkaufswagen rollt (metallisches Rumpeln)
    playShoppingCart(ctx, opts = {}) {
        this.playSoundFile('ShoppingCartTurn_S011IN.548.wav', { maxDuration: 0.8, volume: opts.volume ?? 0.22, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Kasse piept (Scanner)
    playCashRegister(ctx, opts = {}) {
        // Scan-Beep: wir verwenden den vorhandenen Notification-Sound als Sample (statt synthetischem Oscillator).
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playSoundFile('MultimediaNotify_S011TE.579.wav', { maxDuration: 0.22, volume: opts.volume ?? 0.20, pan: opts.pan ?? 0, pos: opts.pos || null });
            }, i * 520);
        }
    }

    // Kind schreit (hochfrequent)
    playKidCrying(ctx, opts = {}) {
        this.playSoundFile('baby-crying-463213.mp3', { maxDuration: 1.2, volume: opts.volume ?? 0.20, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Viele Schritte (mehrere Leute)
    playFootsteps(ctx, opts = {}) {
        this.playSoundFile('WalkWoodFloor_BWU.39.wav', { maxDuration: 1.3, volume: opts.volume ?? 0.15, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Kühlregal brummt
    playFridgeHum(ctx, opts = {}) {
        // Kein Fridge-Sample vorhanden -> Fan/Hum Sample verwenden.
        this.playSoundFile('computer-fan-75947.mp3', { maxDuration: 2.5, volume: opts.volume ?? 0.12, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Produkt fällt runter (Klonk!)
    playProductDrop(ctx, opts = {}) {
        // Kein Drop-Sample vorhanden -> Holz-Knacken als plausibler "Klonk".
        this.playSoundFile('Wood_Creaks_01_BTM00499.wav', { maxDuration: 0.35, volume: opts.volume ?? 0.22, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Leute reden (Gemurmel)
    playChatter(ctx, opts = {}) {
        this.playSoundFile('indistinct-deep-male-mumble-14786.mp3', { maxDuration: 1.2, volume: opts.volume ?? 0.14, pan: opts.pan ?? 0, pos: opts.pos || null });
    }

    // Benachrichtigung auf dem rechten Monitor anzeigen (nur im Schreibtisch-Szenario)
    showNotification(opts = {}) {
        const taskRight = document.querySelector('#task-right');
        if (!taskRight) return;  // Gibt's nur im Schreibtisch

        // Direkt nach Refocus: absoluter Lock (damit Refocus sofort spürbar ist)
        if (this.isRefocusHardLockActive && this.isRefocusHardLockActive()) return;

        // Kurz nach Refocus: weniger "neue" Notifications
        if (this.isRefocusShieldActive && this.isRefocusShieldActive()) {
            const skipChanceByLevel = [0, 0.88, 0.84, 0.78];
            if (Math.random() < (skipChanceByLevel[this.distractionLevel] || 0.83)) return;
        }

        const task = this.getActiveTask ? this.getActiveTask() : { kind: 'misc', text: '' };
        const isProcrastinating = this.taskState === 'procrastinating';
        const isInterrupt = opts && opts.reason === 'interrupt';
        const isReentry = (opts && opts.reason === 'reentry') || (this.taskState === 'working' && this.isReentryActive && this.isReentryActive());
        const isRefocus = opts && opts.reason === 'refocus';
        const lvl = this.distractionLevel || 0;

        const base = [
            'Akku bei 20%',
            'WLAN instabil',
            'Update verfügbar'
        ];

        const taskish = (task.kind === 'deepwork')
            ? ['Build: 1 Warnung', 'PR Kommentar: „kurz schauen?“', 'Docs Tab: „nur schnell…“']
            : (task.kind === 'email')
                ? ['E-Mail erhalten', 'Kalender-Erinnerung', 'Slack: @du']
                : (task.kind === 'planning')
                    ? ['Notizen: 3 neue Punkte', 'Preisvergleich offen']
                    : ['Erinnerung: „kurz erledigen“'];

        const tempting = ['YouTube Empfehlung', 'Discord: neue Nachricht', 'Steam: Update (jetzt?)', 'Social: 2 neue Nachrichten'];

        const reentry = ['Zurück zum Tab: „Wo war ich?“', 'Cursor blinkt… (Kontext?)', 'Notiz: „Faden wieder aufnehmen“'];

        const refocus = ['Zurück zur Aufgabe', 'Nächster Schritt: klein anfangen', 'Mini-Plan: 2 Minuten dranbleiben'];

        const notifications = isRefocus
            ? base.concat(taskish, refocus)
            : ((isProcrastinating || isInterrupt)
                ? base.concat(tempting)
                : (isReentry ? base.concat(taskish, reentry) : base.concat(taskish)));

        // Intensität -> Qualität: bei Level 3 kommt mehr tempting auch beim Arbeiten durch;
        // bei Level 1 bleibt es (außer Prokrastination/Interrupt) eher taskish/neutral.
        let finalBag = notifications.slice();
        if (!isRefocus) {
            if (lvl === 3 && !(isProcrastinating || isInterrupt)) {
                finalBag = finalBag.concat(tempting, tempting);
            }
            if (lvl === 1 && !(isProcrastinating || isInterrupt)) {
                finalBag = finalBag.filter(n => !tempting.includes(n)).concat(taskish, base);
            }
        }
        
        // Random Nachricht auswählen und kurz anzeigen
        const oldValue = taskRight.getAttribute('value');
        taskRight.setAttribute('value', this.randomChoice(finalBag));
        
        // Nach 2 Sekunden wieder weg
        setTimeout(() => {
            taskRight.setAttribute('value', oldValue || '');
        }, 2000);
    }

    // Objekte im Raum bewegen (falls welche da sind)
    startMovingObjects(speed) {
        const plant = document.querySelector('#plant');
        if (plant && speed > 0) {
            // Pflanze leicht wackeln lassen (warum? Macht's halt lebendiger!)
            plant.innerHTML += `
                <a-animation attribute="position" 
                            from="${plant.getAttribute('position')}" 
                            to="${plant.getAttribute('position')}" 
                            dur="2000" 
                            direction="alternate" 
                            repeat="indefinite"></a-animation>
            `;
        }
    }

    // Professor (Simlish)
    startProfessorTalking() {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
        if (this.professorAudioContext) return; // Läuft schon

        this.professorAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.professorAudioContext;

        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        // Gain Node für Lautstärke-Kontrolle
        this.professorGain = ctx.createGain();
        this.professorGain.gain.value = 0.04; // Noch leiser im Hintergrund
        // Positional: Professor vorne im Raum
        const professorPos = this.getWorldPosFromCameraOffset({ x: 0.0, y: 1.2, z: -3.2 });
        const professorOut = this.createSpatialOutput(ctx, { volume: 1.0, pan: 0, pos: professorPos });
        this.professorGain.connect(professorOut);

        // Looping mumble
        this.professorSource = null;
        const playLoop = () => {
            if (!this.professorAudioContext || !this.professorGain) return;
            const path = 'Assets/Textures/sounds/indistinct-deep-male-mumble-14786.mp3';
            fetch(path)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    if (!this.professorAudioContext || !this.professorGain) return;
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.loop = true;
                    source.connect(this.professorGain);
                    source.playbackRate.value = 0.95 + Math.random() * 0.1; // Leicht variieren
                    source.start(ctx.currentTime);
                    this.professorSource = source;
                })
                .catch(err => console.log('Mumble nicht gefunden, fallback auf Simlish'));
        };
        playLoop();
        console.log('👨‍🏫 Professor redet (Loop Mode)');
    }
    
    // Generiert Professor-Rede mit Mumble-Sound
    generateProfessorSpeech(ctx) {
        if (!this.active || !this.professorGain) return;
        
        // Mumble-Sound abspielen
        const path = 'Assets/Textures/sounds/indistinct-deep-male-mumble-14786.mp3';
        
        fetch(path)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.professorGain);
                
                // Zufällige Playback-Rate (Geschwindigkeit variieren)
                source.playbackRate.value = 0.9 + Math.random() * 0.3; // 0.9-1.2x
                
                // Zufälliger Start-Punkt im Audio
                const offset = Math.random() * Math.max(0, audioBuffer.duration - 2);
                const duration = Math.min(0.8 + Math.random() * 0.6, audioBuffer.duration - offset); // 0.8-1.4s
                
                source.start(ctx.currentTime, offset);
                source.stop(ctx.currentTime + duration);
                
                // Nächste Silbe nach Pause
                const pause = 0.3 + Math.random() * 0.7; // 0.3-1.0s Pause
                const longPauseChance = Math.random() < 0.25 ? (0.8 + Math.random() * 1.2) : 0; // Manchmal längere Pause
                
                setTimeout(() => {
                    this.generateProfessorSpeech(ctx);
                }, (duration + pause + longPauseChance) * 1000);
            })
            .catch(err => console.log('Mumble nicht gefunden, fallback auf Simlish'));
    }
    
    // Professor-Audio stoppen
    stopProfessorTalking() {
        if (this.professorSource) {
            try { this.professorSource.stop(); } catch(e) {}
            this.professorSource = null;
        }
        if (this.professorAudioContext) {
            try {
                this.professorAudioContext.close();
            } catch(e) {}
            this.professorAudioContext = null;
            this.professorGain = null;
            console.log('🔇 Professor hört auf zu reden');
        }
    }

    // ALLES AUFRÄUMEN! (wenn Simulation stoppt)
    clearAllDistractions() {
        this.visualDistractions.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.visualDistractions = [];  // Array leeren
    }

    updateListenerFromCamera(ctx) {
        try {
            if (!ctx || !ctx.listener) return;
            const cam = document.querySelector('a-camera') || document.querySelector('[camera]');
            if (!cam || !cam.object3D) return;
            if (typeof THREE === 'undefined' || !THREE.Vector3) return;

            const pos = new THREE.Vector3();
            cam.object3D.getWorldPosition(pos);

            const forward = new THREE.Vector3();
            cam.object3D.getWorldDirection(forward);

            const quat = new THREE.Quaternion();
            cam.object3D.getWorldQuaternion(quat);
            const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);

            const L = ctx.listener;
            if (L.positionX) {
                L.positionX.value = pos.x;
                L.positionY.value = pos.y;
                L.positionZ.value = pos.z;
            } else if (typeof L.setPosition === 'function') {
                L.setPosition(pos.x, pos.y, pos.z);
            }

            if (L.forwardX) {
                L.forwardX.value = forward.x;
                L.forwardY.value = forward.y;
                L.forwardZ.value = forward.z;
                L.upX.value = up.x;
                L.upY.value = up.y;
                L.upZ.value = up.z;
            } else if (typeof L.setOrientation === 'function') {
                L.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
            }
        } catch (e) {
            // ignore
        }
    }

    // Offset is in camera-local space (x:right, y:up, z:forward where negative is in front)
    getWorldPosFromCameraOffset(offset) {
        try {
            if (typeof THREE === 'undefined' || !THREE.Vector3) return null;
            const cam = document.querySelector('a-camera') || document.querySelector('[camera]');
            if (!cam || !cam.object3D) return null;
            const v = new THREE.Vector3(offset.x || 0, offset.y || 0, offset.z || 0);
            cam.object3D.localToWorld(v);
            return { x: v.x, y: v.y, z: v.z };
        } catch (e) {
            return null;
        }
    }

    // Returns suggested spatial params per environment + sound type.
    getSuggestedSoundSpatial(type) {
        const env = this.environment || 'desk';
        const lvl = this.distractionLevel || 0;

        const j = (v, a) => v + (Math.random() * 2 - 1) * a;
        const mk = (x, y, z, pan, volume) => {
            const pos = this.getWorldPosFromCameraOffset({ x, y, z });
            return { pos, pan, volume };
        };

        if (!type) return { pos: null, pan: 0, volume: undefined };

        if (env === 'desk') {
            switch (type) {
                case 'keyboard':
                    return mk(j(0.15, 0.08), j(-0.10, 0.05), j(-0.55, 0.10), 0.0, 0.22);
                case 'mouseClick':
                    return mk(j(0.35, 0.10), j(-0.12, 0.06), j(-0.55, 0.10), 0.18, 0.18);
                case 'pcFan':
                    return mk(j(-0.55, 0.12), j(-0.05, 0.05), j(-0.95, 0.18), -0.15, 0.14);
                case 'phoneVibrate':
                    return mk(j(0.45, 0.10), j(-0.20, 0.06), j(-0.55, 0.12), 0.25, 0.26);
                case 'doorSlam':
                    return mk(j(1.10, 0.20), j(0.15, 0.08), j(1.60, 0.25), 0.65, 0.26);
                case 'steps':
                    return mk(j(-1.10, 0.22), j(0.00, 0.05), j(1.20, 0.25), -0.55, 0.20);
                case 'neighborNoise':
                    return mk(j(-1.25, 0.25), j(0.10, 0.06), j(0.80, 0.25), -0.60, 0.18);
            }
        }

        if (env === 'hoersaal') {
            const seatSide = Math.random() > 0.5 ? 1 : -1;
            const seatX = seatSide * (0.9 + Math.random() * 0.8);
            const seatZ = j(0.6, 0.5);
            switch (type) {
                case 'penClick':
                    return mk(j(seatX, 0.15), j(-0.05, 0.08), j(seatZ, 0.25), seatSide * 0.35, 0.20);
                case 'paperRustle':
                    return mk(j(seatX, 0.18), j(-0.02, 0.08), j(seatZ, 0.30), seatSide * 0.25, 0.18);
                case 'whisper':
                    return mk(j(-1.2, 0.35), j(0.10, 0.10), j(1.3, 0.40), -0.45, 0.16);
                case 'cough':
                    return mk(j(seatX, 0.22), j(0.05, 0.08), j(seatZ, 0.25), seatSide * 0.30, 0.22);
                case 'chairCreak':
                    return mk(j(seatX, 0.20), j(-0.10, 0.08), j(seatZ, 0.25), seatSide * 0.22, 0.18);
                case 'doorSlam':
                    return mk(j(0.0, 0.35), j(0.15, 0.10), j(2.0, 0.35), 0.0, 0.22);
                case 'steps':
                    return mk(j(0.8, 0.35), j(0.00, 0.08), j(2.2, 0.40), 0.35, 0.18);
                case 'phoneVibrate':
                    return mk(j(0.55, 0.18), j(-0.15, 0.06), j(-0.60, 0.15), 0.20, 0.22);
            }
        }

        if (env === 'supermarkt') {
            switch (type) {
                case 'announcement':
                    return mk(j(0.0, 0.20), j(1.35, 0.20), j(-2.6, 0.45), 0.0, 0.16);
                case 'shoppingCart':
                    return mk(j(-1.2, 0.35), j(0.00, 0.08), j(-1.4, 0.35), -0.40, 0.20);
                case 'cashRegister':
                    return mk(j(1.6, 0.45), j(0.10, 0.10), j(-2.4, 0.55), 0.55, 0.20);
                case 'kidCrying':
                    return mk(j(1.2, 0.35), j(0.10, 0.10), j(-1.2, 0.35), 0.45, 0.20);
                case 'footsteps':
                    return mk(j(-0.6, 0.40), j(0.00, 0.08), j(1.8, 0.45), -0.20, 0.16);
                case 'fridgeHum':
                    return mk(j(-2.2, 0.40), j(-0.05, 0.08), j(-1.6, 0.40), -0.65, 0.12);
                case 'productDrop':
                    return mk(j(1.0, 0.40), j(-0.10, 0.06), j(-0.9, 0.35), 0.35, 0.22);
                case 'chatter':
                    return mk(j(-0.2, 0.60), j(0.30, 0.20), j(-2.0, 0.55), 0.0, 0.14);
            }
        }

        const width = lvl === 3 ? 0.6 : (lvl === 2 ? 0.45 : 0.30);
        const fallbackPan = (Math.random() * 2 - 1) * width;
        return { pos: null, pan: fallbackPan, volume: undefined };
    }

    // Externe Sound-Datei laden und abspielen (mit Zeitlimit)
    createSpatialOutput(ctx, opts = {}) {
        const volume = typeof opts.volume === 'number' ? opts.volume : 0.6;
        const pan = typeof opts.pan === 'number' ? Math.max(-1, Math.min(1, opts.pan)) : 0;
        const pos = (opts && opts.pos && typeof opts.pos.x === 'number') ? opts.pos : null;

        const outGain = ctx.createGain();
        outGain.gain.value = volume;

        // True 3D positional audio when we have a world-space position.
        if (pos && typeof ctx.createPanner === 'function') {
            this.updateListenerFromCamera(ctx);
            const panner = ctx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 0.8;
            panner.maxDistance = 12;
            panner.rolloffFactor = 1.2;

            if (panner.positionX) {
                panner.positionX.value = pos.x;
                panner.positionY.value = pos.y;
                panner.positionZ.value = pos.z;
            } else {
                panner.setPosition(pos.x, pos.y, pos.z);
            }

            outGain.connect(panner);
            panner.connect(ctx.destination);
            return outGain;
        }

        // Stereo fallback (still gives L/R separation)
        if (typeof ctx.createStereoPanner === 'function') {
            const stereo = ctx.createStereoPanner();
            stereo.pan.value = pan;
            outGain.connect(stereo);
            stereo.connect(ctx.destination);
            return outGain;
        }

        // Last-resort fallback
        if (typeof ctx.createPanner === 'function') {
            const panner = ctx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'linear';
            panner.refDistance = 1;
            panner.maxDistance = 6;
            panner.rolloffFactor = 1;
            panner.setPosition(pan, 0, 1);
            outGain.connect(panner);
            panner.connect(ctx.destination);
            return outGain;
        }

        outGain.connect(ctx.destination);
        return outGain;
    }

    // Externe Sound-Datei laden und abspielen (mit Zeitlimit)
    // Backward-compatible:
    //   playSoundFile(name, 1.2)
    //   playSoundFile(name, {maxDuration, volume, pan})
    playSoundFile(filename, maxDurationOrOptions = 1.5, maybeOptions = null) {
        const path = `Assets/Textures/sounds/${filename}`;
        const audioCtx = this.getAudioContext();
        if (!audioCtx) return;

        let opts = {};
        let maxDuration = 1.5;
        if (typeof maxDurationOrOptions === 'object' && maxDurationOrOptions) {
            opts = maxDurationOrOptions;
            maxDuration = typeof opts.maxDuration === 'number' ? opts.maxDuration : 1.5;
        } else {
            maxDuration = typeof maxDurationOrOptions === 'number' ? maxDurationOrOptions : 1.5;
            opts = (typeof maybeOptions === 'object' && maybeOptions) ? maybeOptions : {};
        }

        const playBuffer = (audioBuffer) => {
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            const out = this.createSpatialOutput(audioCtx, {
                volume: typeof opts.volume === 'number' ? opts.volume : 0.6,
                pan: typeof opts.pan === 'number' ? opts.pan : 0,
                pos: (opts && opts.pos) ? opts.pos : null
            });
            source.connect(out);

            const duration = Math.min(audioBuffer.duration, maxDuration);
            source.start(audioCtx.currentTime);
            source.stop(audioCtx.currentTime + duration);
        };

        const cached = this._audioBufferCache.get(filename);
        if (cached) {
            playBuffer(cached);
            return;
        }

        fetch(path)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this._audioBufferCache.set(filename, audioBuffer);
                playBuffer(audioBuffer);
            })
            .catch(err => console.log(`Sound ${filename} nicht gefunden`));
    }

}

// In Module-Setups: für Legacy/Debug trotzdem global verfügbar machen.
try {
    if (typeof window !== 'undefined' && typeof window.ADHSSimulation === 'undefined') {
        window.ADHSSimulation = ADHSSimulation;
    }
} catch (e) {}
