# ESP32 Button Controller - Setup Anleitung

## 📋 Benötigte Hardware

- **ESP32 Development Board**
- **6x Taster/Buttons** (normale Push-Buttons)
- **Breadboard**
- **Jumperkabel** (Male-to-Male)
- **KEINE Widerstände nötig** (interne Pull-ups werden verwendet)

---

## 🔌 Hardware-Verkabelung

### Schaltplan pro Button:

```
              ESP32
               │
    Button ────┼──── GPIO Pin (12, 13, 14, 27, 32, oder 33)
               │
               └──── GND
```

**Wichtig**: Button zwischen GPIO-Pin und GND anschließen!

### Detaillierte Pin-Belegung:

| Button Nr. | ESP32 GPIO | Funktion        | Farbe Kabel (Vorschlag) |
|-----------|------------|-----------------|------------------------|
| Button 1  | GPIO 12    | handleTouch12() | Rot                    |
| Button 2  | GPIO 13    | handleTouch13() | Orange                 |
| Button 3  | GPIO 14    | handleTouch14() | Gelb                   |
| Button 4  | GPIO 27    | handleTouch27() | Grün                   |
| Button 5  | GPIO 32    | handleTouch32() | Blau                   |
| Button 6  | GPIO 33    | handleTouch33() | Violett                |
| Alle      | GND        | Gemeinsame Masse| Schwarz                |

### Breadboard-Aufbau:

```
ESP32
┌─────────────┐
│ GPIO 12 ────┼──→ Button 1 ──┐
│ GPIO 13 ────┼──→ Button 2 ──┤
│ GPIO 14 ────┼──→ Button 3 ──┤
│ GPIO 27 ────┼──→ Button 4 ──┼──→ GND Rail (Breadboard)
│ GPIO 32 ────┼──→ Button 5 ──┤
│ GPIO 33 ────┼──→ Button 6 ──┘
│             │
│ GND ────────┼──→ GND Rail (Breadboard)
└─────────────┘
```

---

## 🛠️ Software-Installation

### Schritt 1: Arduino IDE installieren

1. Download von: https://www.arduino.cc/en/software
2. Installation durchführen

### Schritt 2: ESP32 Board hinzufügen

1. Arduino IDE öffnen
2. **Datei** → **Voreinstellungen**
3. Bei "Zusätzliche Boardverwalter-URLs" einfügen:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. OK klicken
5. **Tools** → **Board** → **Boardverwalter**
6. "esp32" suchen
7. **"ESP32 by Espressif Systems"** installieren

### Schritt 3: USB-Treiber installieren (falls nötig)

- **CP210x**: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- **CH340**: http://www.wch-ic.com/downloads/CH341SER_ZIP.html

(Welcher Treiber benötigt wird, steht auf dem ESP32-Board)

---

## 📤 Code hochladen

### 1. Datei öffnen
- **ESP32_Buttons.ino** in Arduino IDE öffnen

### 2. Board-Einstellungen

Gehe zu **Tools** und wähle:

| Einstellung | Wert |
|------------|------|
| Board | "ESP32 Dev Module" |
| Upload Speed | 115200 |
| CPU Frequency | 240MHz (WiFi/BT) |
| Flash Frequency | 80MHz |
| Flash Mode | QIO |
| Flash Size | 4MB (32Mb) |
| Partition Scheme | Default 4MB |
| Port | Dein COM-Port (z.B. COM3) |

### 3. Upload

1. ESP32 per USB anschließen
2. **Port auswählen**: Tools → Port → [Dein COM-Port]
3. **Hochladen**-Button (→) klicken
4. Warten bis "Hard resetting..." erscheint

### 4. Testen

1. **Tools** → **Serieller Monitor** öffnen
2. Baudrate auf **115200** stellen
3. Du solltest sehen:
   ```
   [ESP32 Button Controller Ready]
   ```
4. Beim Button-Drücken erscheint:
   ```
   [T12-10]  ← Button an Pin 12 gedrückt
   [T12-99]  ← Button losgelassen
   ```

---

## 🌐 Mit Webseite verbinden

### Browser-Voraussetzungen

- **Chrome** oder **Edge** (Web Serial API erforderlich)
- **NICHT Firefox oder Safari** (unterstützen Web Serial nicht)

### Verbindung herstellen

1. ESP32 per USB angeschlossen lassen
2. Deine HTML-Seite öffnen (z.B. `landingpage.html`)
3. Im GUI auf **"Connect to ESP"** klicken
4. Serial Port auswählen (z.B. "USB Serial Device (COM3)")
5. "Verbinden" klicken
6. Status wird grün: "✓ Connected"

### Testen

- Drücke Button 1 → `handleTouch12()` wird ausgeführt
- Drücke Taste "1" auf Tastatur → gleicher Effekt (Fallback)

---

## ⚙️ Anpassungen

### Empfindlichkeit ändern

Im ESP-Code (`ESP32_Buttons.ino`):

```cpp
const int BUTTON_PRESSED_INTENSITY = 10;   // Niedriger = stärker
const int BUTTON_RELEASED_INTENSITY = 99;  // Hoch = losgelassen
```

Im SDK muss der Wert **unter** dem Threshold sein:
- Standard-Threshold: `24`
- Button sendet: `10` (< 24 → erkannt ✓)

### Entprellung anpassen

Wenn Buttons mehrfach auslösen:

```cpp
const unsigned long DEBOUNCE_DELAY = 50;  // Erhöhe auf 100 oder 150
```

### Andere Pins verwenden

Ändere im Code:

```cpp
const int BUTTON_PINS[] = {12, 13, 14, 27, 32, 33};  // Deine Pins
```

**Wichtig**: Pins auch im SDK anpassen!

---

## 🐛 Fehlerbehebung

### Problem: ESP wird nicht erkannt

**Lösung:**
- USB-Treiber installieren (siehe oben)
- Anderes USB-Kabel versuchen (manche sind nur zum Laden)
- Anderen USB-Port am Computer verwenden
- Beim Upload BOOT-Taste am ESP32 gedrückt halten

### Problem: Upload-Fehler "Failed to connect"

**Lösung:**
1. Serial Monitor schließen
2. BOOT-Taste am ESP32 drücken und halten
3. Upload starten
4. BOOT-Taste loslassen wenn "Connecting..." erscheint

### Problem: Buttons reagieren nicht

**Checks:**
1. Serial Monitor: Werden Daten gesendet? `[T12-10]`
2. Verkabelung: Button zwischen Pin und GND?
3. Test-Code einfügen:
   ```cpp
   if (buttonStates[i] == LOW) {
     digitalWrite(LED_BUILTIN, HIGH);  // LED an
   }
   ```

### Problem: Browser verbindet nicht

**Lösung:**
- **Chrome oder Edge** verwenden
- Auf **localhost** oder **HTTPS** hosten
- Port-Berechtigung im Browser erlauben
- Seite neu laden (F5)

### Problem: Mehrfache Events

**Lösung:**
- Entprellzeit erhöhen: `DEBOUNCE_DELAY = 100`
- Bessere Buttons verwenden (billige prellen mehr)

---

## 📊 Technische Details

### Datenformat

Format: `[Txx-yy]`
- `T` = Touch/Button-Indikator
- `xx` = Pin-Nummer (2-stellig, z.B. `12`)
- `yy` = Intensität (2-stellig, `00`-`99`)

Beispiele:
- `[T12-10]` → Pin 12, gedrückt
- `[T13-99]` → Pin 13, losgelassen

### Warum Pull-up?

- **INPUT_PULLUP**: Pin wird auf HIGH (3.3V) gezogen
- **Button offen**: Signal = HIGH (3.3V)
- **Button gedrückt**: Pin mit GND verbunden → Signal = LOW (0V)

Vorteil: Keine externen Widerstände nötig!

### Stromverbrauch

- Pro Button: ~0.1 mA (Pull-up aktiv)
- ESP32 aktiv: ~80-160 mA
- USB-Stromversorgung: Ausreichend

---

## ✅ Checkliste

- [ ] Arduino IDE installiert
- [ ] ESP32 Board-Unterstützung installiert
- [ ] USB-Treiber installiert (falls nötig)
- [ ] ESP32_Buttons.ino hochgeladen
- [ ] Serial Monitor zeigt: `[ESP32 Button Controller Ready]`
- [ ] Alle 6 Buttons auf Breadboard verkabelt
- [ ] Verbindung zur Webseite funktioniert
- [ ] Buttons lösen Events aus

---

## 🎓 Weiterführende Links

- ESP32 Pinout: https://randomnerdtutorials.com/esp32-pinout-reference-gpios/
- Arduino Referenz: https://www.arduino.cc/reference/de/
- Web Serial API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API

---

**Viel Erfolg mit deinem Projekt! 🚀**

Bei Fragen: Dokumentation lesen oder Dozenten fragen.
