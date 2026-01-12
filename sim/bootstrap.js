// Bootstrap als ES Module
import { ADHSSimulation } from '../adhs_simulation.js';
import { installInput } from './input.js';

function ensureInstance() {
  try {
    window.adhsInitError = null;
  } catch (e) {}

  // Globale Klasse für Debug/Legacy
  try {
    if (typeof window.ADHSSimulation === 'undefined') {
      window.ADHSSimulation = ADHSSimulation;
    }
  } catch (e) {}

  try {
    if (typeof window.adhs === 'undefined') {
      window.adhs = new ADHSSimulation();
    }
  } catch (e) {
    try { window.adhsInitError = e; } catch (err) {}
    console.error('[ADHS] Failed to initialize simulation instance', e);
    return;
  }

  // Input + ESP32
  try {
    installInput(window.adhs);
  } catch (e) {
    console.error('[ADHS] Failed to install input handlers', e);
  }

  // Simulation startet mit Aus
  try {
    window.adhs.stop();
  } catch (e) {}

  // VR HUD / Intro
  try {
    if (window.adhs && typeof window.adhs.installVrHudOnce === 'function') window.adhs.installVrHudOnce();
    if (window.adhs && typeof window.adhs.installSceneIntroOnce === 'function') window.adhs.installSceneIntroOnce();
  } catch (e) {}

  // Optional: Debug-HUD via URL einschalten (ohne Headset)
  try {
    const params = new URLSearchParams(window.location.search || '');
    const debugHud = params.get('debugHud') || params.get('hud');
    if ((debugHud === '1' || debugHud === 'true') && window.adhs && typeof window.adhs.setVrHudDebugEnabled === 'function') {
      window.adhs.setVrHudDebugEnabled(true);
      console.log('[Debug] VR HUD per URL aktiviert');
    }
  } catch (e) {}

  console.log('🎮 ADHS Simulation bereit');
}

// Wichtig: als Module ist Script sowieso defer; wir warten trotzdem auf load,
// damit A-Frame Scene/DOM sicher da ist.
window.addEventListener('load', () => {
  ensureInstance();
});
