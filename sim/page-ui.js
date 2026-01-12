// Shared DOM UI wiring for scene pages (desk/hoersaal/supermarkt)

function getAdhs() {
	return (typeof window !== 'undefined' && window.adhs) ? window.adhs : null;
}

function setText(el, text) {
	if (!el) return;
	el.textContent = text;
}

function updateLevelDisplay() {
	const levelSpan = document.getElementById('adhs-level');
	if (!levelSpan) return;

	const adhs = getAdhs();
	const levelNames = ['Aus', 'Leicht', 'Mittel', 'Stark'];
	const levelColors = ['#10b981', '#fbbf24', '#f59e0b', '#ef4444'];

	if (!adhs || !adhs.active || adhs.paused) {
		setText(levelSpan, levelNames[0]);
		levelSpan.style.color = levelColors[0];
		return;
	}

	const lvl = Math.max(0, Math.min(3, Number(adhs.distractionLevel || 0)));
	setText(levelSpan, levelNames[lvl] || levelNames[0]);
	levelSpan.style.color = levelColors[lvl] || levelColors[0];
}

function installNavigation() {
	document.querySelectorAll('[data-href]').forEach((el) => {
		el.addEventListener('click', () => {
			const href = el.getAttribute('data-href');
			if (href) location.href = href;
		});
	});
}

function installAdhsControls() {
	const plusBtn = document.getElementById('adhs-btn-plus');
	const minusBtn = document.getElementById('adhs-btn-minus');
	const toggleBtn = document.getElementById('adhs-btn-toggle');
	const giveInBtn = document.getElementById('adhs-btn-givein');
	const refocusBtn = document.getElementById('adhs-btn-refocus');
	const hideBtn = document.getElementById('adhs-btn-hide');

	if (plusBtn) {
		plusBtn.addEventListener('click', () => {
			const adhs = getAdhs();
			if (!adhs) return;
			if (adhs.distractionLevel < 3) adhs.start(adhs.distractionLevel + 1);
			adhs.paused = false;
		});
	}

	if (minusBtn) {
		minusBtn.addEventListener('click', () => {
			const adhs = getAdhs();
			if (!adhs) return;
			if (adhs.distractionLevel > 0) adhs.start(adhs.distractionLevel - 1);
		});
	}

	if (toggleBtn) {
		toggleBtn.addEventListener('click', () => {
			const adhs = getAdhs();
			if (!adhs) return;
			if (adhs.active && !adhs.paused) {
				adhs.paused = true;
				adhs.stop();
				return;
			}

			const level = (adhs.distractionLevel && adhs.distractionLevel > 0) ? adhs.distractionLevel : 1;
			adhs.start(level);
			adhs.paused = false;
		});
	}

	if (giveInBtn) {
		giveInBtn.addEventListener('click', () => {
			const adhs = getAdhs();
			if (!adhs || typeof adhs.handleUserGaveIn !== 'function') return;
			adhs.handleUserGaveIn({ type: 'manual', label: 'Nachgegeben', severity: 1.0 });
		});
	}

	if (refocusBtn) {
		refocusBtn.addEventListener('click', () => {
			const adhs = getAdhs();
			if (!adhs || typeof adhs.handleUserRefocus !== 'function') return;
			adhs.handleUserRefocus();
		});
	}

	if (hideBtn) {
		hideBtn.addEventListener('click', () => {
			const panel = document.getElementById('adhs-controls');
			if (panel) panel.style.display = 'none';
		});
	}
}

function installKeyboardShortcuts() {
	window.addEventListener('keydown', (e) => {
		const k = String(e.key || '');

		if (k === '+' || k === '=') {
			const btn = document.getElementById('adhs-btn-plus');
			if (btn) btn.click();
			return;
		}

		if (k === '-') {
			const btn = document.getElementById('adhs-btn-minus');
			if (btn) btn.click();
			return;
		}

		if (k.toLowerCase() === 'o') {
			const btn = document.getElementById('adhs-btn-toggle');
			if (btn) btn.click();
			return;
		}

		if (k.toLowerCase() === 'h') {
			const panel = document.getElementById('adhs-controls');
			if (!panel) return;
			panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
		}
	});
}

function installBootstrapSelfCheck() {
	// Selbstdiagnose: Wenn ES-Module (sim/bootstrap.js) nicht lädt, bleibt window.adhs undefined.
	window.addEventListener('load', () => {
		setTimeout(() => {
			if (window.adhs) return;

			const host = document.getElementById('ui-overlay') || document.body;
			if (!host) return;

			const msg = document.createElement('div');
			msg.style.cssText = 'position:fixed; left:12px; right:12px; bottom:12px; z-index:99999; padding:12px 14px; border-radius:10px; background:rgba(239,68,68,.92); color:#fff; font:14px/1.35 system-ui,Segoe UI,Roboto,sans-serif; box-shadow:0 10px 25px rgba(0,0,0,.25)';
			const errTxt = (window.adhsInitError && (window.adhsInitError.message || String(window.adhsInitError)))
				? ('<br><br><strong>Init-Fehler:</strong><br><code style="white-space:pre-wrap">' + (window.adhsInitError.message || String(window.adhsInitError)) + '</code>')
				: '';
			msg.innerHTML = 'Simulation wurde nicht initialisiert (window.adhs fehlt).<br><strong>Bitte über einen lokalen Server öffnen</strong> (z.B. VS Code Live Server).<br>Aktuelles Protokoll: <code>' + String(location.protocol) + '</code>' + errTxt;
			host.appendChild(msg);
			console.error('[ADHS] Bootstrap nicht geladen. Öffne die Seite über http:// statt file://', { protocol: location.protocol, href: location.href });
		}, 1200);
	});
}

document.addEventListener('DOMContentLoaded', () => {
	installNavigation();
	installAdhsControls();
	installKeyboardShortcuts();
	installBootstrapSelfCheck();
	updateLevelDisplay();
	setInterval(updateLevelDisplay, 250);
});
