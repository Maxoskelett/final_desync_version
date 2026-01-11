# 🛒 Einkaufsliste - ESP32 Button Controller

## 🔧 Benötigte Hardware

### ✅ Zwingend erforderlich

| Artikel | Anzahl | Preis ca. | Bezugsquelle | Artikelbeispiel |
|---------|--------|-----------|--------------|-----------------|
| **ESP32 Dev Board** | 1x | 5-10€ | Amazon, AZ-Delivery, Berrybase | ESP32-DevKitC, ESP32-WROOM-32 |
| **Breadboard** | 1x | 3-5€ | Amazon, Conrad, Reichelt | 400 oder 830 Löcher |
| **Taster/Push-Buttons** | 6x | 2-5€ | Amazon, Conrad | 12mm Taster, 4-Pin |
| **Jumperkabel Male-to-Male** | 1 Set | 3-5€ | Amazon, Conrad | 20-40 Stück Set |
| **Micro-USB Kabel** | 1x | 2-5€ | Amazon, Conrad | Datenkabel (nicht nur Ladekabel!) |

**Gesamtpreis: ca. 15-30€**

---

## 📦 Empfohlene Bundle-Sets

### Option 1: Komplett-Set (empfohlen für Anfänger)
**"ESP32 Starter Kit"** (~20-35€)
- Enthält meist: ESP32, Breadboard, Jumperkabel, LEDs, Widerstände, Buttons
- Bezug: Amazon, AZ-Delivery
- Vorteil: Alles dabei, gut für weitere Projekte

### Option 2: Einzelkauf (günstiger wenn du schon Material hast)
- Nur ESP32 + 6 Buttons + evtl. Breadboard kaufen
- Nutze vorhandene Jumperkabel

---

## 🏪 Konkrete Bezugsquellen (Deutschland)

### Online-Shops

**Amazon.de**
- Schnelle Lieferung (Prime: 1 Tag)
- Gute Rücksendung
- Suche nach: "ESP32 DevKit", "Breadboard Set"

**AZ-Delivery**
- Deutscher Arduino/ESP-Spezialist
- Website: www.az-delivery.de
- Gute Dokumentation dabei

**Berrybase.de**
- Raspberry Pi & Arduino Shop
- Qualität meist höher
- Versand aus Berlin

**Conrad Electronic**
- Filiale + Online
- Teurer, aber schnell bei Abholung
- conrad.de

**Reichelt Elektronik**
- Großer deutscher Elektronikhändler
- reichelt.de
- Günstig bei Großbestellung

### Lokale Geschäfte

**Conrad Filiale**
- In größeren Städten
- Sofort mitnehmen
- Beratung vor Ort

**Saturn/MediaMarkt**
- Haben manchmal Arduino-Kits
- Meist überteuert

---

## 📋 Detaillierte Artikelbeschreibungen

### ESP32 Development Board

**Was genau kaufen?**
- **ESP32-DevKitC V4** (empfohlen)
- **ESP32-WROOM-32** 
- **ESP32-DOIT-DevKit V1**

**Darauf achten:**
- ✅ 30-38 Pins
- ✅ USB-Anschluss onboard (Micro-USB oder USB-C)
- ✅ CP2102 oder CH340 USB-Chip
- ❌ NICHT ESP8266 (ist älter, andere Pins)
- ❌ NICHT ESP32-CAM (für Kameras)

**Beispiel-Suche Amazon:**
```
"AZ-Delivery ESP32 Dev Kit C V4"
"ESP32 NodeMCU Entwicklungsboard"
```

---

### Breadboard

**Größe:**
- **830 Löcher** (groß, viel Platz) - empfohlen
- **400 Löcher** (kompakt, ausreichend)

**Darauf achten:**
- Mit Power-Rails (+ und - Reihen an der Seite)
- Selbstklebend ist praktisch

**Beispiel Amazon:**
```
"Breadboard 830"
"Steckplatine Experimentierboard"
```

---

### Taster/Buttons

**Typ: Tactile Push Button**

**Größe:**
- **12mm x 12mm** (Standard, passt auf Breadboard)
- 4-Pin oder 2-Pin (beides OK)

**Anzahl:** 
- Mindestens 6 Stück
- Besser 10+ (Reserve)

**Farben (optional):**
- Verschiedene Farben zur Unterscheidung
- Oder alle gleich (günstiger)

**Beispiel Amazon:**
```
"Taster 12mm Breadboard"
"Push Button Arduino Set"
"Tactile Button Kit"
```

**Alternative: Arcade-Buttons**
- Größer, professioneller
- Brauchen mehr Platz
- Teurer (~2€/Stück)

---

### Jumperkabel

**Typ: Male-to-Male** (Stecker-Stecker)

**Länge:**
- 10-20cm (Standard)
- Verschiedene Längen praktisch

**Anzahl:**
- Mindestens 10 Stück
- Set mit 40-65 Stück empfohlen

**Farben:**
- Bunt gemischt (Übersichtlichkeit)

**Beispiel Amazon:**
```
"Jumper Wire Male to Male"
"Breadboard Kabel Set"
```

**Profi-Tipp:**
- Male-to-Female auch nützlich (für später)
- Female-to-Female (für später)

---

### USB-Kabel

**WICHTIG: Datenkabel, nicht nur Ladekabel!**

**Typ:**
- **Micro-USB** (für die meisten ESP32)
- Oder **USB-C** (neuere ESP32-Boards)

**Länge:**
- 1-2m ausreichend

**Prüfen:**
- Manche billige Kabel können nur laden, nicht Daten übertragen
- Im Zweifel: Handy-Kabel verwenden (funktioniert meist)

---

## 🎁 Starter-Kit Empfehlungen

### Budget-Option (~20€)
**"AZ-Delivery ESP32 Lernset"**
- ESP32 + Breadboard + Kabel + Buttons
- ca. 20€ bei Amazon
- Perfekt für dieses Projekt

### Premium-Option (~35€)
**"Elegoo ESP32 Super Starter Kit"**
- Viel Zubehör für weitere Projekte
- Gute Anleitungen
- ca. 35€

### Minimal-Option (~10€)
Nur kaufen:
- 1x ESP32 Board (~6€)
- 1x Button-Set 20 Stück (~3€)
Nutzen:
- Breadboard von Uni/Schule
- Kabel von alten Projekten

---

## 🔍 Such-Begriffe für Online-Shops

### Deutsch:
- ESP32 Entwicklungsboard
- ESP32 Dev Kit
- Breadboard Set
- Taster Sortiment
- Jumperkabel Set
- Arduino Starter Kit ESP32

### Englisch (oft günstiger):
- ESP32 Development Board
- ESP32 DevKit
- Breadboard Kit
- Tactile Switch Set
- Jumper Wire Kit
- ESP32 Starter Kit

---

## ⚠️ Häufige Kauf-Fehler

❌ **ESP8266 statt ESP32**
- ESP8266 ist älter, andere Pins
- Funktioniert NICHT mit diesem Code

❌ **Nur-Lade-USB-Kabel**
- Kann keine Daten übertragen
- Code-Upload unmöglich

❌ **LED-Taster ohne Button-Funktion**
- Manche LEDs sehen aus wie Buttons
- Achte auf "Push Button" in Beschreibung

❌ **Female-to-Female Kabel**
- Passen nicht auf ESP32 Pins
- Male-to-Male ist richtig

❌ **ESP32-CAM**
- Ist für Kamera-Projekte
- Andere Pin-Anordnung

---

## 💡 Spar-Tipps

1. **AliExpress/Banggood**
   - Sehr günstig (ESP32 ab 3€)
   - Nachteil: 2-4 Wochen Lieferzeit
   - Nur bei vorausschauender Planung

2. **Gebraucht auf eBay Kleinanzeigen**
   - Arduino/ESP32 Sets oft günstig
   - Vorsicht: Vollständigkeit prüfen

3. **Uni/Hochschule fragen**
   - Makerspaces haben oft Material
   - Elektronik-Labor hat Breadboards
   - Prof fragen ob Leihgeräte

4. **Mit Kommilitonen teilen**
   - Starter-Kit zu zweit kaufen
   - 10er Pack Buttons teilen

---

## ✅ Checkliste vor dem Kauf

Bevor du bestellst, prüfe:

- [ ] ESP32 (nicht ESP8266!)
- [ ] USB-Kabel ist **Datenkabel** (nicht nur laden)
- [ ] Passender USB-Anschluss (Micro-USB oder USB-C?)
- [ ] Mindestens 6 Buttons
- [ ] Male-to-Male Jumperkabel
- [ ] Breadboard (wenn nicht schon vorhanden)
- [ ] Lieferzeit passt zu deiner Deadline

---

## 🚀 Express-Bestellung (brauche es morgen!)

**Amazon Prime:**
1. Suche: "ESP32 DevKit Prime"
2. Suche: "Breadboard Kit Prime"
3. Bestelle bis 20 Uhr → Lieferung nächster Tag

**Conrad Filiale:**
1. conrad.de → Filiale suchen
2. Verfügbarkeit prüfen
3. Reservieren + abholen

**Uni/FH Materialausgabe:**
- Oft schnellste Option
- Manchmal kostenlos
- Nachfragen beim Labor-Techniker

---

## 📞 Support bei Bestellung

**Amazon-Bestellung:**
- Achte auf "Amazon verkauft und versandt"
- Prime-Artikel bevorzugen
- Bewertungen lesen (min. 4 Sterne)

**Bei Problemen:**
- Amazon: Rücksendung innerhalb 30 Tage
- Defekt: Umtausch meist problemlos

---

## 📅 Zeitplanung

**Bestelle rechtzeitig:**

| Bezugsquelle | Lieferzeit |
|--------------|------------|
| Amazon Prime | 1 Tag |
| Amazon Standard | 2-3 Tage |
| AZ-Delivery | 2-4 Tage |
| Conrad Filiale | Sofort |
| Conrad Online | 1-3 Tage |
| AliExpress | 2-6 Wochen |

**Mein Projekt-Deadline:** ________________

**Spätester Bestelltermin:** ________________

---

**Viel Erfolg beim Einkaufen! 🛍️**

Bei Fragen: Dozenten oder Makerspaces fragen!
