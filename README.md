# DeSync – Wenn dein Gehirn 20 Tabs offen hat

## Was ist das hier?

Hast du dich mal gefragt, wie es ist mit ADHS durch den Alltag zu gehen? Spoiler: Es ist wie wenn du versuchst Netflix zu schauen, während 47 Leute gleichzeitig auf dich einreden, dein Handy alle 3 Sekunden vibriert und im Hintergrund ein Feuerwerk abgeht.

Dieses Projekt ist eine VR-Simulation die zeigt, wie sich ADHS in drei verschiedenen Alltagssituationen anfühlt:

### 🎓 Hörsaal
Du sitzt in der Vorlesung und willst eigentlich aufpassen. Aber:
- Jemand klickt mit dem Stift (klick klick klick)
- WhatsApp Nachrichten kommen rein
- Leute flüstern
- Dein Gehirn zwingt dich wegzuschauen
- Prof redet über... warte, worüber ging's nochmal?

### 💻 Schreibtisch (Gaming Room)
Du willst eigentlich lernen/arbeiten, aber:
- Discord pingt
- YouTube empfiehlt dir Videos
- Steam lädt Updates
- Der PC-Lüfter ist SO LAUT
- War das die Tür? Nein? Egal, Fokus weg.

### 🛍️ Supermarkt
Einfach nur einkaufen. Sollte easy sein. Ist es nicht:
- Durchsagen
- Leute überall
- Kinder schreien
- Handy vibriert ("VERGISS DIE MILCH NICHT!")
- Kasse piept, Wagen rollen, Kühlregal brummt
- Was wollte ich nochmal kaufen?

## Wie funktioniert das technisch?

Das ganze ist gebaut mit:
- **A-Frame** (WebVR Framework) – damit die 3D-Welten laufen
- **Web Audio API** – für alle nervigen Sounds (synthetisch generiert, keine Dateien)
- **Vanilla JavaScript** – weil Frameworks overrated sind
- **ESP32 Integration** – kannst die Simulation mit Hardware-Buttons steuern (Touch 12, 13, 14)

Die Simulation hat **4 Intensitäts-Level** (0-3):
- **Level 0**: Aus (endlich Ruhe)
- **Level 1**: Leicht (alle paar Sekunden was)
- **Level 2**: Mittel (konstant nervig)
- **Level 3**: CHAOS (willkommen in meinem Gehirn)

### Das Geile: Kontextspezifische Ablenkungen

Jede Umgebung hat eigene Ablenkungen:
- **Schreibtisch**: Discord, YouTube, Steam, Gaming-Zeug
- **Hörsaal**: Prof-Mails, Moodle, Lerngruppen, Uni-Stress
- **Supermarkt**: Einkaufsliste, Payback, Kassengeräusche, Leute

Und das Wichtigste: **Deine Kamera wird zu den Ablenkungen GEZWUNGEN**. Du willst auf deine Aufgabe schauen, aber dein Blick wird einfach woanders hingezogen. Das ist der Fokusshift den ADHS-Leute ständig erleben.

## Schnellstart

**Option 1: VS Code Live Server** (easy mode)
1. Installier die **Live Server** Extension in VS Code
2. Öffne `landingpage.html`
3. Rechtsklick → **Open with Live Server**
4. Fertig, läuft

**Option 2: Einfach Datei öffnen**
- Doppelklick auf `landingpage.html`
- Läuft im Browser
- Für VR brauchst du aber wahrscheinlich Option 1

## Steuerung

### Tastatur (zum Testen ohne Hardware)
- **Taste 1**: Intensität erhöhen (+)
- **Taste 2**: Intensität verringern (-)
- **Taste 3**: Simulation ausschalten
- **Taste H**: Control Panel anzeigen/verstecken
- **Maus**: Klicken & ziehen zum Umschauen

### ESP32 Hardware (falls du die hast)
- **Touch Pin 12**: Intensität +
- **Touch Pin 13**: Intensität -
- **Touch Pin 14**: Ausschalten

### VR-Brille
- Brille anschließen (Quest, Vive, etc.)
- "Enter VR" Button klicken
- Eintauchen ins Chaos

## Browser-Support

WebXR läuft am besten in:
- **Chrome/Edge** (Desktop)
- **Quest Browser** (wenn du eine Quest hast)
- Braucht HTTPS oder localhost (Live Server macht das automatisch)

## Projekt-Dateien

```
desync_cc1-main/
├── landingpage.html      # Startseite mit Info
├── hoersaal.html         # Uni-Vorlesung Szenario
├── desk.html             # Gaming Room Szenario
├── supermarkt.html       # Einkaufen Szenario
├── adhs_simulation.js    # Die ganze ADHS-Logik (826 Zeilen Chaos)
├── vr.js                 # VR Setup & Pointer Lock
├── styles.css            # Apple-inspired Neumorphic Design
├── cc_sdk.min.js         # ESP32 SDK (für Hardware-Buttons)
└── Textures/             # Texturen für die 3D-Welten
```

## Fun Facts

- Alle Sounds sind **synthetisch generiert** mit Web Audio API (kein einziges MP3 file!)
- Die Kamera wird **zwangsweise** zu Ablenkungen gedreht (je höher der Level, desto länger bist du "gefangen")
- Es gibt **24 verschiedene Sounds** (8 pro Umgebung)
- Das iPhone-Popup ist ein echtes 3D-Modell mit Notch und Status Bar
- Die Lichter werden temporär gedimmt während Ablenkungen (für extra Drama)
- Responsive Design für alle Bildschirmgrößen (weil Extrapunkte)

## Credits

Projekt von **Maximilian Wittwer** (Matrikelnummer: 287664)

Gebaut für Creative Coding 1 – weil ADHS endlich mal sichtbar gemacht werden sollte.

---

**Hinweis**: Das ist keine medizinische Diagnose-App. Nur eine Simulation um Leuten zu zeigen wie überwältigend ADHS sein kann. Wenn du denkst du hast ADHS, geh zum Arzt, nicht zu meiner VR-App 😅

- Läuft er? Vielleicht.
- Speichert er zuverlässig? Manchmal.
- Ist er hilfreich? In dem Moment, in dem er funktioniert, ja.
- Hat er mich verstört und gebrochen? Auch ja.

Es gab Phasen, da war mein Workflow ungefähr so:

1. „Ich ändere nur kurz eine Kleinigkeit.“
2. Watcher: „Ich habe deine Hoffnung neu geladen.“
3. Browser: „Cache.“
4. Ich: „Warum bewegt sich die Kamera jetzt wie ein Geist?“

Am Ende haben wir einen Friedensvertrag geschlossen: **Live Server** macht die Arbeit, und der Watcher darf im Hintergrund leise darüber nachdenken, was er getan hat.

## Tech Stack

- A‑Frame (WebXR)
- HTML/CSS/JS
- (Optional) VS Code Live Server

## Credits

- Projekt/Umsetzung: MAximilian Wittwer
- Texturen: lokal im Ordner `Textures/`
