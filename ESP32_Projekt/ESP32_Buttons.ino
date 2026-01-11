/*
 * ESP32 Button Controller für Projekt DeSync
 * 
 * physische Buttons da viel lustiger sind als Touch
 * 
 * Hardware-Setup (pro Button):
 * - Button zwischen GPIO Pin und GND
 * - Interner Pull-up Widerstand wird aktiviert
 * - Button gedrückt = LOW Signal
 * 
 * Pin-Mapping (wie im SDK):
 * Button 1 -> GPIO 12
 * Button 2 -> GPIO 13
 * Button 3 -> GPIO 14
 * Button 4 -> GPIO 27
 * Button 5 -> GPIO 32
 * Button 6 -> GPIO 33
 */

// Button Pins (gleiche wie vorher für Touch)
const int BUTTON_PINS[] = {12, 13, 14, 27, 32, 33};
const int NUM_BUTTONS = 6;

// Entprellungs-Parameter
const unsigned long DEBOUNCE_DELAY = 50;  // 50ms Entprellzeit

// Status-Arrays für jeden Button
int buttonStates[NUM_BUTTONS];
int lastButtonStates[NUM_BUTTONS];
unsigned long lastDebounceTimes[NUM_BUTTONS];

// Simulierte Intensitätswerte (0-99)
// Niedrigere Werte = stärkerer "Druck" (wie bei Touch)
const int BUTTON_PRESSED_INTENSITY = 10;   // Wert wenn gedrückt
const int BUTTON_RELEASED_INTENSITY = 99;  // Wert wenn nicht gedrückt

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Initialisiere alle Button Pins
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);  // Interner Pull-up
    buttonStates[i] = HIGH;
    lastButtonStates[i] = HIGH;
    lastDebounceTimes[i] = 0;
  }
  
  // Initialisierungs-Nachricht (vom SDK erwartet)
  Serial.println("[ESP32 Button Controller Ready]");
  
  delay(100);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Prüfe jeden Button
  for (int i = 0; i < NUM_BUTTONS; i++) {
    int reading = digitalRead(BUTTON_PINS[i]);
    
    // Wenn sich der Zustand geändert hat, starte Entprellungs-Timer
    if (reading != lastButtonStates[i]) {
      lastDebounceTimes[i] = currentTime;
    }
    
    // Prüfe ob genug Zeit vergangen ist (Entprellung)
    if ((currentTime - lastDebounceTimes[i]) > DEBOUNCE_DELAY) {
      
      // Wenn sich der stabile Zustand geändert hat
      if (reading != buttonStates[i]) {
        buttonStates[i] = reading;
        
        // Sende Daten im SDK-Format: "[Txx-yy]"
        // xx = Pin Nummer (2-stellig)
        // yy = Intensität (2-stellig, 00-99)
        
        int intensity;
        if (buttonStates[i] == LOW) {
          // Button gedrückt
          intensity = BUTTON_PRESSED_INTENSITY;
        } else {
          // Button losgelassen
          intensity = BUTTON_RELEASED_INTENSITY;
        }
        
        sendButtonData(BUTTON_PINS[i], intensity);
      }
    }
    
    lastButtonStates[i] = reading;
  }
  
  // Kleine Verzögerung um CPU zu schonen
  delay(10);
}

// Sendet Button-Daten im SDK-Format
void sendButtonData(int pin, int intensity) {
  char buffer[9];
  sprintf(buffer, "[T%02d-%02d]", pin, intensity);
  Serial.print(buffer);
  Serial.flush();
}
