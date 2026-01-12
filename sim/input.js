// Input + ESP32 Handler (als ES Module)

let installed = false;

export function installInput(adhs) {
  if (installed) return;
  installed = true;

  // ESP32: cc_sdk erwartet typischerweise globale handler-Funktionen.
  // Wir hängen sie bewusst an window, damit die Hardware-Integration weiterläuft.
  try {
    window.handleTouch12 = function handleTouch12() {
      if (!window.adhs) return;
      let newLevel = window.adhs.distractionLevel + 1;
      if (newLevel > 3) newLevel = 3;
      window.adhs.start(newLevel);
      console.log(`[ESP32] Intensität erhöht auf: ${['Aus', 'Leicht', 'Mittel', 'Stark'][newLevel]}`);
    };

    window.handleTouch13 = function handleTouch13() {
      if (!window.adhs) return;
      let newLevel = window.adhs.distractionLevel - 1;
      if (newLevel < 0) newLevel = 0;
      window.adhs.start(newLevel);
      if (newLevel === 0 && typeof window.updateLevelDisplay === 'function') {
        setTimeout(() => window.updateLevelDisplay(), 50);
      }
      console.log(`[ESP32] Intensität verringert auf: ${['Aus', 'Leicht', 'Mittel', 'Stark'][newLevel]}`);
    };

    window.handleTouch14 = function handleTouch14() {
      if (!window.adhs) return;
      window.adhs.stop();
      console.log('[ESP32] Simulation ausgeschaltet');
      if (typeof window.updateLevelDisplay === 'function') {
        setTimeout(() => window.updateLevelDisplay(), 50);
      }
    };

    window.handleTouch27 = function handleTouch27() {};
    window.handleTouch32 = function handleTouch32() {};
    window.handleTouch33 = function handleTouch33() {};
  } catch (e) {
    // ignore
  }

  // Tastatursteuerung
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.repeat) return;
      if (!window.adhs) return;

      // Debug: VR-HUD ohne Headset togglen
      if (e.shiftKey && e.key && e.key.toLowerCase() === 'v') {
        if (typeof window.adhs.toggleVrHudDebug === 'function') {
          window.adhs.toggleVrHudDebug();
          console.log(`[Debug] VR HUD: ${window.adhs._vrHudDebug ? 'AN' : 'AUS'}`);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case '1':
          if (typeof window.handleTouch12 === 'function') {
            window.handleTouch12();
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
          }
          break;
        case '2':
          if (typeof window.handleTouch13 === 'function') {
            window.handleTouch13();
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
          }
          break;
        case '3':
          if (typeof window.handleTouch14 === 'function') {
            window.handleTouch14();
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
          }
          break;
        case 'g':
          if (typeof window.adhs.handleUserGaveIn === 'function') {
            window.adhs.handleUserGaveIn({ type: 'manual', label: 'Handy/Tab wechseln', severity: 1.0 });
            console.log('[Tastatur] Nachgegeben (G)');
          }
          break;
        case 'r':
          if (typeof window.adhs.handleUserRefocus === 'function') {
            window.adhs.handleUserRefocus();
            console.log('[Tastatur] Refocus (R)');
          }
          break;
        case 'q':
          if (window.adhs.active && !window.adhs.paused) {
            window.adhs.paused = true;
            window.adhs.stop();
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
            console.log('[Tastatur] Simulation pausiert');
          } else if (!window.adhs.active && window.adhs.paused) {
            window.adhs.start(window.adhs.distractionLevel);
            window.adhs.paused = false;
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
            console.log('[Tastatur] Simulation fortgesetzt');
          }
          break;
        case 'w':
          if (window.adhs.distractionLevel > 0) {
            window.adhs.start(window.adhs.distractionLevel - 1);
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
            console.log(`[Tastatur] Intensität verringert auf: ${['Aus', 'Leicht', 'Mittel', 'Stark'][window.adhs.distractionLevel - 1]}`);
          }
          break;
        case 'e':
          if (window.adhs.distractionLevel < 3) {
            window.adhs.start(window.adhs.distractionLevel + 1);
            if (typeof window.updateLevelDisplay === 'function') setTimeout(() => window.updateLevelDisplay(), 50);
            console.log(`[Tastatur] Intensität erhöht auf: ${['Aus', 'Leicht', 'Mittel', 'Stark'][window.adhs.distractionLevel + 1]}`);
          }
          break;
      }
    },
    true
  );

  // Erste User-Geste entsperrt Audio (wichtig für WebXR/Autoplay-Policies)
  document.addEventListener(
    'pointerdown',
    () => {
      if (window.adhs && typeof window.adhs.unlockAudio === 'function') {
        window.adhs.unlockAudio();
      }
    },
    { once: true, passive: true }
  );
}
