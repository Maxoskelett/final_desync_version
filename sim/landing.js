// Landingpage UI (Modal + Navigation)

function installScenarioButtons() {
	document.querySelectorAll('[data-href]').forEach((el) => {
		el.addEventListener('click', () => {
			const href = el.getAttribute('data-href');
			if (href) location.href = href;
		});
	});
}

function installEduModal() {
	const modal = document.getElementById('edu-modal');
	const openBtn = document.getElementById('edu-open');
	const closeBtn = document.getElementById('edu-close');
	if (!modal || !openBtn || !closeBtn) return;

	function open() {
		modal.classList.add('is-open');
		modal.setAttribute('aria-hidden', 'false');
		try { document.body.classList.add('modal-open'); } catch (e) {}
	}
	function close() {
		modal.classList.remove('is-open');
		modal.setAttribute('aria-hidden', 'true');
		try { document.body.classList.remove('modal-open'); } catch (e) {}
	}

	openBtn.addEventListener('click', open);
	closeBtn.addEventListener('click', close);
	modal.addEventListener('click', (e) => {
		const t = e.target;
		if (t && t.getAttribute && t.getAttribute('data-close') === 'true') close();
	});
	window.addEventListener('keydown', (e) => {
		if (!modal.classList.contains('is-open')) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	}, true);
}

document.addEventListener('DOMContentLoaded', () => {
	installScenarioButtons();
	installEduModal();
});
