# TESTREPORT

## 1. Tabelle aller Tests

| Testname | Testart | Box-Ansatz | Begründung |
|---|---|---|---|
| GameServiceTest | Unit | White-Box | Direkter Mock auf `GameRepository` und Prüfung der internen Logik in `GameService` |
| GameControllerIT | Integration | White-Box | HTTP-Aufrufe mit `MockMvc` gegen den echten Spring-Kontext, aber ohne manuelle UI-Interaktion |
| Smoke Test (`00-smoke.cy.ts`) | Smoke | White-Box | prüft Kernfaktoren einer laufenden App und der API-Verfügbarkeit |
| Eigene Cypress-Tests (`07-eigene-tests.cy.ts`) | System / E2E | White-/Grey-Box | Testen konkrete UI- und Fehlerzustände mit technischem Wissen zur App-Struktur |
| Formularvalidierung (bestehende Cypress-Dateien) | System / E2E | White-/Grey-Box | prüft UI und logische Regeln im Formular |
| CRUD- und Suche-Tests (bestehende Cypress-Dateien) | System / E2E | White-/Grey-Box | prüft reale Nutzerflüsse mit bekannter App-Architektur |
| Sicherheitsbeobachtungen | Security | Grey-/Black-Box | Testen das Verhalten über die Schnittstelle und Konfiguration, ohne Code zu ändern |
| Usability & Accessibility | Usability / Accessibility | Black-Box | Menschliche Bedienung ohne interne Implementierungskenntnis |

## 2. Regressionstest-Protokoll

- Vor dem Einsatz wurde der Code auf die bestehende Basis geprüft und die Kernfunktionalität der Spieleverwaltung identifiziert.
- Die wichtigsten Regressionsrisiken lagen in der Java-Toolchain und den Spring-/Mock-Testdaten.
- Beim lokalen Durchlauf war die Ursache ein zu hohes Java-Release (`26`) in `backend/pom.xml`. Nach Anpassung auf Java 21 lief der Backend-Build mit der verfügbaren JDK konsistent durch.
- Fazit: Das Problem war ein echtes Konfigurationsproblem, kein Produktfehler, und wurde durch die passende Toolchain-Anpassung behoben.

## 3. Security-Beobachtungen

- React schützt Standard-HTML-Ausgaben gegen XSS, weil React Strings als Text statt als HTML rendert.
- Validierungsfehler und falsche Daten werden über die API mit `400 Bad Request` beantwortet, falls Pflichtfelder oder Zeitpunkte ungültig sind.
- CORS und API-Policy sollten in der Backend-Konfiguration kontrolliert werden; in der vorliegenden App wird der Frontend-Proxy lokal über `http://localhost:8080` verwendet.

## 4. Usability- und Accessibility-Protokoll

- Die Oberfläche ist grundsätzlich verständlich: Titel, Suchfeld, Sortierung und Formular sind klar benannt.
- Die wichtigsten Elemente sind in der UI-Wiedergabe gut sichtbar und die Labels sind in der Form weitgehend selbsterklärend.
- Für Accessibility ist die Aufnahme von `aria-label` an rein dekorativen Icons sinnvoll; die vorhandene App verwendet zwar erklärende Symbole, aber für echte Screenreader-Funktionen sollten Buttons zusätzlich textuell oder semantisch klar annotiert werden.
- Die Tastaturbedienbarkeit ist gut, solange die Formulare und Buttons fokussierbar sind; die Umsetzung entspricht dem üblichen React-Pattern.

## 5. Optional: Performance

- Die App ist für kleine bis mittlere Datensätze schnell genug.
- Für größere Listen empfiehlt sich ein späteres Caching bzw. paginiertes Laden, wenn der Datensatz stark wächst.

## 6. Gesamtergebnis

Die wichtigsten Abgabekriterien wurden mit Backend-Unit-Tests, Integrationstests, Frontend-Smoke-/E2E-Testfällen und einer nachvollziehbaren Dokumentation vollständig abgedeckt.
