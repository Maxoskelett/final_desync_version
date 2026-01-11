// VR-Steuerung und Pointer-Lock Setup

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');

  // VR-Button vorbereiten (falls vorhanden)
  const startVrButton = document.getElementById('start-vr');
  if (startVrButton && sceneEl) {
    startVrButton.addEventListener('click', () => enterVr(sceneEl));
  }

  // Pointer-Lock aktivieren (damit die Maus "eingefangen" wird beim Klicken)
  if (sceneEl && sceneWantsPointerLock()) {
    enablePointerLockOnCanvasClick(sceneEl);
  }
});

// VR-Modus starten (headset aufsetzen und los!)
function enterVr(sceneEl) {
  try {
    // Versuch 1: Direkt über die Scene
    if (sceneEl && typeof sceneEl.enterVR === 'function') {
      sceneEl.enterVR();
      return;
    }

    // Versuch 2: Über AFRAME global
    if (typeof AFRAME !== 'undefined' && AFRAME.scenes && AFRAME.scenes[0]) {
      AFRAME.scenes[0].enterVR();
      return;
    }
  } catch (err) {
    console.warn('VR Start fehlgeschlagen:', err);
  }

  // Wenn nix funktioniert: User Bescheid geben
  alert('VR nicht verfügbar (A-Frame/WebXR nicht unterstützt oder nicht geladen).');
}

// Checkt ob die Kamera Pointer-Lock haben will
// (steht in HTML bei look-controls="pointerLockEnabled: true")
function sceneWantsPointerLock() {
  const lookControlled = document.querySelectorAll('[look-controls]');
  for (const el of lookControlled) {
    const cfg = el.getAttribute('look-controls');
    if (!cfg) continue;
    if (cfg.pointerLockEnabled === true || cfg.pointerLockEnabled === 'true') return true;
  }
  return false;
}

// Macht Pointer-Lock sobald du auf den Canvas klickst
// (Browser braucht User-Interaktion, sonst blockt er das)
function enablePointerLockOnCanvasClick(sceneEl) {
  const attach = () => {
    const canvas = sceneEl.canvas;
    if (!canvas) return;

    // Bei Klick: Maus "einsperren" für bessere VR-Steuerung
    canvas.addEventListener('click', () => {
      try {
        if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
      } catch {
        // Manche Browser mögen kein PointerLock - dann halt nicht
      }
    });
  };

  // Wenn Canvas schon da ist: direkt loslegen
  if (sceneEl.hasLoaded && sceneEl.canvas) {
    attach();
    return;
  }

  // Sonst warten bis A-Frame den Canvas erstellt hat
  sceneEl.addEventListener('renderstart', attach, { once: true });
}
