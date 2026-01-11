
// ADHS Simulation - Das Chaos beginnt!


class ADHSSimulation {
    constructor() {
        this.active = false;
        this.distractionLevel = 0; // 0 = chillig, 1 = bisschen nervig, 2 = echt störend, 3 = CHAOS
        
        // Listen für Ablenkungen (hier landen die ganzen nervigen Sachen)
        this.visualDistractions = [];
        this.audioDistractions = [];
        
        // Welche Umgebung? (Schreibtisch, Hörsaal oder Supermarkt)
        this.environment = this.detectEnvironment();
        
        // Timer fürs Chaos spawnen
        this.visualInterval = null;
        this.audioInterval = null;
        this.notificationInterval = null;
        
        // Professor-Audio (nur Hörsaal)
        this.professorAudioContext = null;
        this.professorGain = null;
        
        // Wie oft soll's nerven? (in Millisekunden, weil JS halt so tickt)
        this.config = {
            none: {
                visualFrequency: 0,      // Nix
                audioFrequency: 0,       // Nada
                notificationFrequency: 0, // Garnix
                movementSpeed: 0
            },
            low: {
                visualFrequency: 8000,  // Alle 8 Sek ein bisschen nerven
                audioFrequency: 15000,  // Alle 15 Sek ein Sound
                notificationFrequency: 20000, // Alle 20 Sek ne Nachricht
                movementSpeed: 0.3
            },
            medium: {
                visualFrequency: 5000,  // Alle 5 Sek wird's bunter
                audioFrequency: 8000,   // Alle 8 Sek Geräusche
                notificationFrequency: 10000, // Alle 10 Sek Handy vibriert
                movementSpeed: 0.5
            },
            high: {
                visualFrequency: 3000,  // KONSTANT was los (alle 3 Sek)
                audioFrequency: 5000,   // Dauerbeschallung (alle 5 Sek)
                notificationFrequency: 6000,  // iPhone im Dauereinsatz
                movementSpeed: 0.8
            }
        };
    }

    // Erkennt in welcher Umgebung wir sind (über URL)
    detectEnvironment() {
        const url = window.location.href;
        if (url.includes('desk.html')) return 'desk';
        if (url.includes('hoersaal.html')) return 'hoersaal';
        if (url.includes('supermarkt.html')) return 'supermarkt';
        return 'desk'; // Fallback
    }

    // Simulation starten - LET THE CHAOS BEGIN!
    start(level = 1) {
        this.stop(); // Erst mal alles clearen
        this.active = true;
        this.distractionLevel = level;
        
        const levelName = ['none', 'low', 'medium', 'high'][level];
        const config = this.config[levelName];
        
        console.log(`🎮 ADHS Simulation läuft - Level: ${levelName}`);
        
        if (level > 0) {
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
        }
        
        // Anzeige updaten
        this.updateStatusDisplay();
    }

    // Alles stoppen - Ruhe bitte!
    stop() {
        this.active = false;
        
        // Alle Timer killen
        if (this.visualInterval) clearInterval(this.visualInterval);
        if (this.audioInterval) clearInterval(this.audioInterval);
        if (this.notificationInterval) clearInterval(this.notificationInterval);
        
        // Professor-Audio stoppen
        this.stopProfessorTalking();
        
        // Aufräumen
        this.clearAllDistractions();
        
        console.log('🛑 Simulation gestoppt - endlich Ruhe!');
    }

    /**
     * Zeigt Status-Information an
     */
    updateStatusDisplay() {
        const levelNames = ['Aus', 'Leicht', 'Mittel', 'Stark'];
        console.log(`Aktuelle Intensität: ${levelNames[this.distractionLevel]}`);
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
     * Dimmt die Umgebung kurzzeitig für dramatischen Effekt
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
     * Erzeugt visuelle Ablenkung - Fokusshift-Simulationen
     */
    spawnVisualDistraction() {
        const scene = document.querySelector('a-scene');
        if (!scene) return;
        
        const types = ['largePopup', 'movingObject', 'flashingLight', 'peripheralMovement'];
        const type = types[Math.floor(Math.random() * types.length)];
        
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
        }
    }

    /**
     * Große auffällige Benachrichtigung im Sichtfeld - als realistisches iPhone
     */
    createLargePopup() {
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
        
        const notif = notifications[Math.floor(Math.random() * notifications.length)];
        
        // iPhone basteln (Apple wäre stolz auf uns)
        const phone = document.createElement('a-entity');
        const startY = -1.5; // Start: unter dem Bildschirm (unsichtbar)
        const endY = 0.2;  // Ziel: direkt vor deiner Nase
        phone.setAttribute('position', `0 ${startY} -0.45`);
        phone.setAttribute('rotation', '-15 0 0');  // Leicht geneigt, wie wenn du's in der Hand hältst
        
        // iPhone Gehäuse - schwarz und edgy
        const body = document.createElement('a-box');
        body.setAttribute('width', '0.18');
        body.setAttribute('height', '0.38');
        body.setAttribute('depth', '0.015');
        body.setAttribute('color', '#1a1a1a');
        body.setAttribute('material', 'metalness: 0.8; roughness: 0.2');  // Shiny!
        phone.appendChild(body);
        
        // Display - der schwarze Bildschirm
        const screen = document.createElement('a-plane');
        screen.setAttribute('width', '0.17');
        screen.setAttribute('height', '0.36');
        screen.setAttribute('position', '0 0 0.009');
        screen.setAttribute('color', '#0a0a0a');
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
        notifCard.setAttribute('width', '0.15');
        notifCard.setAttribute('height', '0.08');
        notifCard.setAttribute('position', '0 0.12 0.011');
        notifCard.setAttribute('color', '#1e293b');  // Dunkelgrau wie bei iOS
        notifCard.setAttribute('opacity', '0.95');
        notifCard.setAttribute('material', 'shader: flat');
        phone.appendChild(notifCard);
        
        // App-Name mit Icon (links oben in der Notification)
        const appName = document.createElement('a-text');
        appName.setAttribute('value', `${notif.icon} ${notif.app}`);
        appName.setAttribute('position', '-0.07 0.15 0.012');
        appName.setAttribute('width', '0.3');
        appName.setAttribute('color', '#94a3b8');
        appName.setAttribute('align', 'left');
        phone.appendChild(appName);
        
        // Zeitstempel (rechts oben)
        const time = document.createElement('a-text');
        time.setAttribute('value', notif.time);
        time.setAttribute('position', '0.045 0.15 0.012');
        time.setAttribute('width', '0.2');
        time.setAttribute('color', '#64748b');
        time.setAttribute('align', 'right');
        phone.appendChild(time);
        
        // Wer hat geschrieben? (dick gedruckt)
        const sender = document.createElement('a-text');
        sender.setAttribute('value', notif.sender);
        sender.setAttribute('position', '-0.07 0.13 0.012');
        sender.setAttribute('width', '0.32');
        sender.setAttribute('color', '#ffffff');
        sender.setAttribute('align', 'left');
        phone.appendChild(sender);
        
        // Die eigentliche Nachricht
        const text = document.createElement('a-text');
        text.setAttribute('value', notif.text);
        text.setAttribute('position', '-0.07 0.11 0.012');
        text.setAttribute('width', '0.32');
        text.setAttribute('color', '#cbd5e1');
        text.setAttribute('align', 'left');
        text.setAttribute('wrapCount', '22');  // Umbruch nach 22 Zeichen
        phone.appendChild(text);
        
        // Uhrzeit in der Status-Bar (weil Detail!)
        const statusTime = document.createElement('a-text');
        const now = new Date();
        statusTime.setAttribute('value', `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
        statusTime.setAttribute('position', '0 0.178 0.012');
        statusTime.setAttribute('width', '0.15');
        statusTime.setAttribute('color', '#ffffff');
        statusTime.setAttribute('align', 'center');
        phone.appendChild(statusTime);
        
        // Batterie & Signal Icons (klassisch)
        const statusIcons = document.createElement('a-text');
        statusIcons.setAttribute('value', '📶 🔋');
        statusIcons.setAttribute('position', '0.06 0.178 0.012');
        statusIcons.setAttribute('width', '0.12');
        statusIcons.setAttribute('color', '#ffffff');
        statusIcons.setAttribute('align', 'right');
        phone.appendChild(statusIcons);
        
        // Animation: Handy fliegt von unten rein (smooth!)
        phone.setAttribute('animation__flyup', {
            property: 'position',
            to: `0 ${endY} -0.45`,
            dur: 800,
            easing: 'easeOutBack'
        });
        
        // Leichtes Vibrieren wie bei echter Notification
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
        
        // FOKUSSHIFT: Kamera zum iPhone zwingen (je höher der Level, desto länger)
        const lookDuration = [0, 800, 1200, 1800][this.distractionLevel];  // Level 0-3
        if (lookDuration > 0) {
            this.forceCameraLook(0, endY, -0.45, lookDuration, 400);
        }
        
        // Nach 3.5 Sekunden wieder verschwinden
        setTimeout(() => {
            phone.setAttribute('animation__flydown', {
                property: 'position',
                to: `0 ${startY} -0.45`,
                dur: 600,
                easing: 'easeInBack'
            });
            
            // Handy wieder verschwinden lassen (Notification gelesen oder ignoriert)
            setTimeout(() => {
                if (phone.parentNode) {
                    phone.parentNode.removeChild(phone);
                }
                const index = this.visualDistractions.indexOf(phone);
                if (index > -1) this.visualDistractions.splice(index, 1);
            }, 700);
        }, 3500);
    }

    // Irgendwas fliegt durchs Bild - einfach nur nervig!
    createMovingDistraction() {
        const scene = document.querySelector('a-scene');
        const mover = document.createElement('a-entity');
        
        // Kurz dimmen für extra Aufmerksamkeit
        this.dimEnvironmentTemporarily(1500);
        
        // Verschiedene nervige Dinge die rumfliegen können
        const objects = [
            { shape: 'sphere', color: '#ef4444', size: 0.15, text: '!', light: 3 },
            { shape: 'box', color: '#fbbf24', size: 0.12, text: '⚠️', light: 2.5 },
            { shape: 'sphere', color: '#3b82f6', size: 0.2, text: '💬', light: 3.5 },
        ];
        
        const obj = objects[Math.floor(Math.random() * objects.length)];
        const startX = (Math.random() > 0.5 ? -5 : 5);  // Von links oder rechts
        const endX = -startX;  // Zur anderen Seite
        const y = 1.2 + Math.random() * 1.5;  // Irgendwo in Blickhöhe
        const z = -1 - Math.random() * 2;  // Irgendwo vor dir
        
        // Objekt bauen mit Leuchteffekt
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
        
        scene.appendChild(mover);
        this.visualDistractions.push(mover);
        
        // FOKUSSHIFT: Kamera kurz zum Objekt zwingen
        const lookDuration = [0, 600, 900, 1400][this.distractionLevel];
        if (lookDuration > 0) {
            // Zur Mitte des Pfads schauen
            const midX = (startX + endX) / 2;
            setTimeout(() => {
                this.forceCameraLook(midX, y, z, lookDuration, 400);
            }, 500);  // Kurz warten bis Objekt sichtbar
        }
        
        // Nach 4.5 Sekunden aufräumen
        setTimeout(() => {
            if (mover.parentNode) mover.parentNode.removeChild(mover);
            const index = this.visualDistractions.indexOf(mover);
            if (index > -1) this.visualDistractions.splice(index, 1);
        }, 4500);
    }

    // BLITZLICHT! Lenkt deine Aufmerksamkeit irgendwo hin (genau wie bei echtem ADHS)
    createFlashingLight() {
        const scene = document.querySelector('a-scene');
        const flash = document.createElement('a-entity');
        
        // Umgebung dimmen während es blitzt
        this.dimEnvironmentTemporarily(2000);
        
        // Random Position im ganzen Raum
        const x = (Math.random() - 0.5) * 8;
        const y = 1 + Math.random() * 3;
        const z = (Math.random() - 0.5) * 12;
        
        // Bunte Lichter (je bunter desto ablenkender)
        const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#a855f7', '#10b981', '#f97316'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Nur das Licht, keine sichtbare Kugel (sieht creepier aus)
        flash.innerHTML = `
            <a-light type="point" intensity="6" distance="12" color="${color}" position="${x} ${y} ${z}">
                <a-animation attribute="intensity" from="6" to="0.5" direction="alternate" dur="150" repeat="12"></a-animation>
            </a-light>
        `;
        
        scene.appendChild(flash);
        this.visualDistractions.push(flash);
        
        // Kamera ZWINGEN zum Licht zu gucken (weil dein Gehirn das auch macht)
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        const rig = document.querySelector('#rig');
        
        if (camera && rig) {
            const currentRotation = rig.getAttribute('rotation');
            const rigPos = rig.getAttribute('position');
            
            // Mathematik für "wo muss ich hingucken?" (Trigonometrie ftw)
            const dx = x - rigPos.x;
            const dz = z - rigPos.z;
            const dy = y - rigPos.y - 1.6;  // Augenhöhe
            
            const yaw = Math.atan2(dx, dz) * (180 / Math.PI);  // Links/Rechts
            const distance = Math.sqrt(dx*dx + dz*dz);
            const pitch = -Math.atan2(dy, distance) * (180 / Math.PI);  // Hoch/Runter
            
            // Kamera smooth zum Licht drehen
            rig.setAttribute('animation__looklight', {
                property: 'rotation',
                to: `${pitch} ${yaw} 0`,
                dur: 600,
                easing: 'easeInOutQuad'
            });
            
            // Nach 1.5 Sekunden zurück zur normalen Blickrichtung
            setTimeout(() => {
                rig.setAttribute('animation__lookneutral', {
                    property: 'rotation',
                    to: `${currentRotation.x} ${currentRotation.y} ${currentRotation.z}`,
                    dur: 800,
                    easing: 'easeInOutQuad'
                });
            }, 1500);
        }
        
        // Aufräumen nach 2 Sekunden
        setTimeout(() => {
            if (flash.parentNode) flash.parentNode.removeChild(flash);
            const index = this.visualDistractions.indexOf(flash);
            if (index > -1) this.visualDistractions.splice(index, 1);
        }, 2000);
    }

    // Irgendwas bewegt sich am Rand (wie wenn jemand vorbeiläuft)
    createPeripheralMovement() {
        const scene = document.querySelector('a-scene');
        const peripheral = document.createElement('a-entity');
        
        const side = Math.random() > 0.5 ? 1 : -1;  // Links oder rechts?
        const startZ = 3;   // Hinten
        const endZ = -8;    // Vorne vorbeigehen
        
        // Grauer Körper (symbolisiert eine Person oder so)
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
        
        // FOKUSSHIFT: Kamera zur Seite zwingen (periphere Ablenkung)
        const lookDuration = [0, 500, 800, 1200][this.distractionLevel];
        if (lookDuration > 0) {
            setTimeout(() => {
                this.forceCameraLook(side * 4, 0.8, (startZ + endZ) / 2, lookDuration, 500);
            }, 800);  // Warten bis Person vorbeigekommen ist
        }
        
        // Nach 3.5 Sekunden weg damit
        setTimeout(() => {
            if (peripheral.parentNode) peripheral.parentNode.removeChild(peripheral);
            const index = this.visualDistractions.indexOf(peripheral);
            if (index > -1) this.visualDistractions.splice(index, 1);
        }, 3500);
    }

    // AUDIO-ABLENKUNGEN! Töne die dich aus dem Fokus reißen
    playAudioDistraction() {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Kontextspezifische Sounds je nach Umgebung
        const soundsByEnvironment = {
            desk: [
                { type: 'keyboard', name: 'Tastatur tippen' },
                { type: 'notification', name: 'Discord Ping' },
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
        
        const sound = sounds[Math.floor(Math.random() * sounds.length)];
        console.log(`🔊 Audio-Ablenkung: ${sound.name}`);
        
        // Wähle den Sound aus und spiel ihn ab
        switch(sound.type) {
            case 'penClick':
                this.playPenClick(audioContext);
                break;
            case 'keyboard':
                this.playKeyboardTyping(audioContext);
                break;
            case 'phoneVibrate':
                this.playPhoneVibrate(audioContext);
                break;
            case 'notification':
                this.playNotificationSound(audioContext);
                break;
            case 'cough':
                this.playCough(audioContext);
                break;
            case 'chairCreak':
                this.playChairCreak(audioContext);
                break;
            case 'doorSlam':
                this.playDoorSlam(audioContext);
                break;
            case 'steps':
                this.playSteps(audioContext);
                break;
            // Neue Sounds für Schreibtisch
            case 'pcFan':
                this.playPCFan(audioContext);
                break;
            case 'mouseClick':
                this.playMouseClick(audioContext);
                break;
            case 'neighborNoise':
                this.playNeighborNoise(audioContext);
                break;
            // Neue Sounds für Hörsaal
            case 'paperRustle':
                this.playPaperRustle(audioContext);
                break;
            case 'whisper':
                this.playWhisper(audioContext);
                break;
            // Neue Sounds für Supermarkt
            case 'announcement':
                this.playAnnouncement(audioContext);
                break;
            case 'shoppingCart':
                this.playShoppingCart(audioContext);
                break;
            case 'cashRegister':
                this.playCashRegister(audioContext);
                break;
            case 'kidCrying':
                this.playKidCrying(audioContext);
                break;
            case 'footsteps':
                this.playFootsteps(audioContext);
                break;
            case 'fridgeHum':
                this.playFridgeHum(audioContext);
                break;
            case 'productDrop':
                this.playProductDrop(audioContext);
                break;
            case 'chatter':
                this.playChatter(audioContext);
                break;
        }
    }

    // Stift-Klick Sound (das nervigste Geräusch in Vorlesungen)
    playPenClick(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 800;  // Scharfer hoher Ton
        osc.type = 'square';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
        
        // Doppel-Klick (weil einmal reicht ja nie)
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 850;
            osc2.type = 'square';
            gain2.gain.setValueAtTime(0.3, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.05);
        }, 150);
    }

    // Tastatur tippen (jemand tippt wie verrückt neben dir)
    playKeyboardTyping(ctx) {
        // 5 schnelle Tastenanschläge hintereinander
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = 300 + Math.random() * 200;  // Jede Taste klingt etwas anders
                osc.type = 'square';
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.03);
            }, i * 80);  // Alle 80ms eine Taste
        }
    }

    // Handy vibriert auf dem Tisch (BZZZZZZ)
    playPhoneVibrate(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 100;  // Tiefer Brumm-Ton
        osc.type = 'sawtooth';  // Klingt rau wie echte Vibration
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    }

    // Notification-Sound (der klassische Doppel-Ping)
    playNotificationSound(ctx) {
        // Macht zwei Töne nacheinander (wie WhatsApp oder iPhone)
        const playTone = (freq, delay) => {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';  // Weicher Ton
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            }, delay);
        };
        
        playTone(800, 0);      // Erster Ping
        playTone(600, 150);    // Zweiter Ping
    }

    // Husten (jemand ist krank und du musst es mitbekommen)
    playCough(ctx) {
        // Macht Weißes Rauschen für realistisches Husten
        const duration = 0.3;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Random Rauschen das langsam leiser wird
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        
        const noise = ctx.createBufferSource();
        const gain = ctx.createGain();
        noise.buffer = buffer;
        noise.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.25;  // Nicht zu laut
        
        noise.start(ctx.currentTime);
    }

    // Stuhl knarzt (jemand lehnt sich zurück)
    playChairCreak(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Frequenz gleitet runter (wie echtes Knarzen)
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.4);
        osc.type = 'sawtooth';  // Rauer Ton
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    }

    // Tür fällt zu - BUMM!
    playDoorSlam(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 80;  // Sehr tief = laut
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    }

    // Schritte (jemand läuft vorbei)
    playSteps(ctx) {
        // Zwei Schritte hintereinander
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = 200;  // Dumpfer Ton
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            }, i * 400);  // Alle 400ms ein Schritt
        }
    }

    // === NEUE SOUNDS FÜR SCHREIBTISCH ===
    
    // PC-Lüfter dreht auf (Gaming PC halt)
    playPCFan(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 120;  // Tiefes Brummen
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.0);
    }

    // Maus klicken (zocken nebenbei)
    playMouseClick(ctx) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = 600;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.02);
            }, i * 150);
        }
    }

    // Nachbar bohrt (klassisch)
    playNeighborNoise(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 180 + Math.random() * 40;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
    }

    // === NEUE SOUNDS FÜR HÖRSAAL ===
    
    // Papier raschelt (jemand blättert)
    playPaperRustle(ctx) {
        const duration = 0.4;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3 * Math.exp(-i / (bufferSize * 0.5));
        }
        
        const noise = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;  // Hohe Frequenzen für Papier
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.2;
        
        noise.start(ctx.currentTime);
    }

    // Flüstern (Studierende tuscheln)
    playWhisper(ctx) {
        const duration = 0.6;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
        }
        
        const noise = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.15;
        
        noise.start(ctx.currentTime);
    }

    // === NEUE SOUNDS FÜR SUPERMARKT ===
    
    // Durchsage (piep-piep)
    playAnnouncement(ctx) {
        // Doppel-Piep
        [800, 700].forEach((freq, i) => {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            }, i * 250);
        });
    }

    // Einkaufswagen rollt (metallisches Rumpeln)
    playShoppingCart(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 80 + Math.random() * 40;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
    }

    // Kasse piept (Scanner)
    playCashRegister(ctx) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = 1200;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.08);
            }, i * 600);
        }
    }

    // Kind schreit (hochfrequent)
    playKidCrying(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.6);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
    }

    // Viele Schritte (mehrere Leute)
    playFootsteps(ctx) {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = 180 + Math.random() * 50;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.08);
            }, i * 300);
        }
    }

    // Kühlregal brummt
    playFridgeHum(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 60;  // Sehr tief
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 2.0);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.5);
    }

    // Produkt fällt runter (Klonk!)
    playProductDrop(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 250;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }

    // Leute reden (Gemurmel)
    playChatter(ctx) {
        const duration = 1.0;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.2;
        }
        
        const noise = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500;  // Sprachbereich
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.15;
        
        noise.start(ctx.currentTime);
    }

    // Benachrichtigung auf dem rechten Monitor anzeigen (nur im Schreibtisch-Szenario)
    showNotification() {
        const taskRight = document.querySelector('#task-right');
        if (!taskRight) return;  // Gibt's nur im Schreibtisch
        
        const notifications = [
            'E-Mail erhalten',
            'Kalender-Erinnerung',
            'Download: 45%',
            'Akku bei 20%',
            'WLAN getrennt',
            'Update: 3 von 8'
        ];
        
        // Random Nachricht auswählen und kurz anzeigen
        const oldValue = taskRight.getAttribute('value');
        taskRight.setAttribute('value', notifications[Math.floor(Math.random() * notifications.length)]);
        
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

    // === PROFESSOR REDET (SIMLISH) ===
    
    // Professor redet wie bei Sims - klingt wie Sprache aber ist unverständlich
    startProfessorTalking() {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
        if (this.professorAudioContext) return; // Läuft schon
        
        this.professorAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.professorAudioContext;
        
        // Gain Node für Lautstärke-Kontrolle
        this.professorGain = ctx.createGain();
        this.professorGain.gain.value = 0.12; // Leise im Hintergrund
        this.professorGain.connect(ctx.destination);
        
        // Kontinuierliches Simlish generieren
        this.generateProfessorSpeech(ctx);
        
        console.log('👨‍🏫 Professor redet (Simlish Mode)');
    }
    
    // Generiert Sims-ähnliche Sprachlaute
    generateProfessorSpeech(ctx) {
        if (!this.active || !this.professorGain) return;
        
        // Random "Silbe" generieren
        const duration = 0.1 + Math.random() * 0.15; // 100-250ms pro Silbe
        const frequency = 180 + Math.random() * 120; // Männliche Stimme (180-300Hz)
        
        // Oszillator für Grundton (Stimme)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = 'sawtooth'; // Rau wie echte Stimme
        osc2.type = 'sine';
        
        // Grundfrequenz + Oberton
        osc1.frequency.value = frequency;
        osc2.frequency.value = frequency * 2.1; // Oberton
        
        // Filter für Vokal-Sound (wie "ah", "oh", "eh")
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800 + Math.random() * 1200; // Formant
        filter.Q.value = 5;
        
        // Verbindungen
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.professorGain);
        
        // Lautstärke-Hüllkurve (Attack-Decay)
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); // Attack
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + duration * 0.7); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration); // Release
        
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + duration);
        osc2.stop(ctx.currentTime + duration);
        
        // Nächste Silbe nach kurzer Pause (Sprachrhythmus)
        const pause = Math.random() * 0.3; // 0-300ms Pause
        setTimeout(() => {
            this.generateProfessorSpeech(ctx);
        }, (duration + pause) * 1000);
    }
    
    // Professor-Audio stoppen
    stopProfessorTalking() {
        if (this.professorAudioContext) {
            try {
                this.professorAudioContext.close();
            } catch(e) {
                // Ignorieren
            }
            this.professorAudioContext = null;
            this.professorGain = null;
            console.log('🔇 Professor hört auf zu reden');
        }
    }

    // FOKUSSHIFT HELPER: Zwingt Kamera zum Punkt zu schauen (simuliert ADHS Aufmerksamkeitswechsel)
    forceCameraLook(targetX, targetY, targetZ, duration = 1000, speed = 600) {
        const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
        const rig = document.querySelector('#rig');
        
        if (!camera || !rig) return;
        
        const currentRotation = rig.getAttribute('rotation');
        const rigPos = rig.getAttribute('position');
        
        // Mathematik für "wo muss ich hingucken?" (Trigonometrie ftw)
        const dx = targetX - rigPos.x;
        const dz = targetZ - rigPos.z;
        const dy = targetY - rigPos.y - 1.6;  // Augenhöhe
        
        const yaw = Math.atan2(dx, dz) * (180 / Math.PI);  // Links/Rechts
        const distance = Math.sqrt(dx*dx + dz*dz);
        const pitch = -Math.atan2(dy, distance) * (180 / Math.PI);  // Hoch/Runter
        
        // Kamera ZWINGEN zum Ziel zu drehen (je höher der Level, desto schneller/aggressiver)
        rig.setAttribute('animation__lookdistraction', {
            property: 'rotation',
            to: `${pitch} ${yaw} 0`,
            dur: speed,
            easing: 'easeOutQuad'  // Schnell hinschauen
        });
        
        // Nach 'duration' langsam zurück zur normalen Blickrichtung
        setTimeout(() => {
            rig.setAttribute('animation__lookneutral', {
                property: 'rotation',
                to: `${currentRotation.x} ${currentRotation.y} ${currentRotation.z}`,
                dur: 1000,
                easing: 'easeInOutQuad'  // Langsamer zurück
            });
        }, duration);
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

}

// Globale Instanz erstellen (damit alle drauf zugreifen können)
const adhs = new ADHSSimulation();

// ===== ESP32 BUTTON HANDLER =====
// 3 Buttons am ESP32:
// Touch 12 = Plus (+)
// Touch 13 = Minus (-)
// Touch 14 = Ausschalten

// Touch 12: Intensität HOCH!
function handleTouch12() {
    const newLevel = Math.min(adhs.distractionLevel + 1, 3);  // Max 3
    adhs.start(newLevel);
    console.log(`[ESP32] Intensität erhöht auf: ${['Aus', 'Leicht', 'Mittel', 'Stark'][newLevel]}`);
}

// Touch 13: Intensität RUNTER!
function handleTouch13() {
    const newLevel = Math.max(adhs.distractionLevel - 1, 0);  // Min 0
    if (newLevel === 0) {
        adhs.stop();  // Bei 0 = komplett aus
        if (typeof updateLevelDisplay === 'function') {
            setTimeout(() => updateLevelDisplay(), 50);  // Interface updaten
        }
    } else {
        adhs.start(newLevel);
    }
    console.log(`[ESP32] Intensität verringert auf: ${['Aus', 'Leicht', 'Mittel', 'Stark'][newLevel]}`);
}

// Touch 14: ALLES AUS!
function handleTouch14() {
    adhs.stop();
    console.log('[ESP32] Simulation ausgeschaltet');
    // Interface updaten damit "Aus" angezeigt wird
    if (typeof updateLevelDisplay === 'function') {
        setTimeout(() => updateLevelDisplay(), 50);
    }
}

// Touch 27, 32, 33: Nicht verwendet (ESP32 hat halt mehr Pins als wir brauchen)
function handleTouch27() {}
function handleTouch32() {}
function handleTouch33() {}

// Beim Laden der Seite Hinweis ausgeben
window.addEventListener('load', () => {
    console.log('🎮 ADHS Simulation bereit');
    console.log('Steuerung: Touch 12/13 = +/-, Touch 14 = Ausschalten');
});
