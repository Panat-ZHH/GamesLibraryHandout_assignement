# Testkonzept GamesLibrary

Stand: 22.11.2026, erste Fassung (Meilenstein 1, Auftrag 5.2).
Das Konzept beschreibt den aktuellen Stand im Repository und wird vor jeder Änderung an den Tests nachgeführt.

## 1. Teststrategie

### 1.1 Testobjekt

Testobjekt ist unser GamesLibrary-Gruppenrepository aus Modul 321. Die Anwendung besteht aus diesen Maven-Ordnern (je mit eigenem `mvnw`):

| Ordner | Rolle | Port | Wichtigste Klassen |
|---|---|---|---|
| `backend` | games-service: CRUD und Suche für Spiele, Import aus Steam | 8081 | `GameService`, `GameController`, `SteamImportService`, `TitleNormalizer` |
| `gateway` | Spring Cloud Gateway, leitet `/api/games/**` und `/api/steam/**` weiter | 8080 | Routen in `application.yml` |
| `steam-service` | Proxy zur Steam Store API | 8082 | `SteamController` |

Der Eureka-Server (Port 8761) liegt nicht in diesem Repository und ist darum kein Testobjekt. Das `frontend` (React) hat eigene Cypress-Tests, gehört aber nicht zur Pipeline, weil es keinen Maven-Wrapper hat.

### 1.2 Abzudeckende Funktionen

| Nr. | Funktion | Ort |
|---|---|---|
| F1 | Alle Spiele auflisten | `GameService.getAllGames`, `GET /api/games` |
| F2 | Spiel nach ID lesen, Fehler bei unbekannter ID | `GameService.getGameById`, `GET /api/games/{id}` |
| F3 | Suche nach Titel | `GameService.searchByTitle`, `GET /api/games/search` |
| F4 | Spiel anlegen, ändern, löschen | `GameService.createGame/updateGame/deleteGame` |
| F5 | Validierung: Titel Pflicht, Erscheinungsdatum Pflicht und nicht in der Zukunft | `Game` (Bean Validation) |
| F6 | Titel einheitlich normalisieren | `TitleNormalizer.normalize` |
| F7 | Weiterleitung über das Gateway | Routen `games` und `steam` |
| F8 | Import aus Steam mit Timeout und Fehlerbehandlung (503) | `SteamImportService`, `steam-service` |

### 1.3 Risiken

| Nr. | Risiko | Eintritt | Auswirkung | Bewertung | Teststufe |
|---|---|---|---|---|---|
| R1 | Ein Umbau der Service-Logik ändert unbemerkt das Verhalten von CRUD (z. B. `updateGame` überschreibt ein Feld nicht) | mittel | hoch | hoch | Unit-Test (`GameServiceTest`) |
| R2 | Uneinheitliche oder leere Titel landen in der Datenbank | hoch | mittel | hoch | Unit-Test (`TitleNormalizerTest`), später Controller-Test |
| R3 | Ein Port, eine Route oder ein Profil wird in Modul 321 geändert und das Gateway leitet falsch weiter | mittel | hoch | hoch | Integrationstest (`GatewayRoutesTest`), später Postman gegen das Gateway |
| R4 | Steam ist langsam oder nicht erreichbar und der games-service hängt oder liefert 500 | mittel | mittel | mittel | Integrations- und Schnittstellentest (geplant, 5.3 / 6.1) |
| R5 | Tests sind lokal grün, in der Pipeline aber rot (fehlende Datenbank, Umgebungsvariable) | mittel | mittel | mittel | Pipeline auf frischem Runner |

### 1.4 Teststufen

| Stufe | Werkzeug | Was wird geprüft | Stand |
|---|---|---|---|
| Unit-Test | JUnit 5, Mockito 5 | Services und Hilfsklassen isoliert, Abhängigkeiten gemockt | `GameServiceTest` (9 Tests), `TitleNormalizerTest` (6 Testfälle) |
| Integrationstest | `@SpringBootTest`, H2 | Zusammenspiel Controller, Service, Repository, Datenbank | `BackendApplicationTests` (Kontext startet), `GatewayRoutesTest`, `SteamServiceApplicationTests`; `GameControllerIT` vorhanden, läuft mit `./mvnw test` aber noch nicht mit (Surefire nimmt nur `*Test`), wird in 5.3 eingebunden |
| Schnittstellentest | MockMvc mit `@WebMvcTest`, Postman | REST-Endpunkte mit verschiedenen Szenarien | geplant (6.1, 6.2) |
| Systemtest (E2E) | Cypress | Benutzerabläufe im Frontend | vorhanden in `frontend/cypress/e2e`, nicht Teil der Pipeline |

## 2. Rollen und Verantwortlichkeiten

*Wird bis zur Schlussabgabe ergänzt.* Vorgesehen: Wir arbeiten im Pair Programming (Driver und Navigator, Wechsel nach jedem TDD-Zyklus); jede Person committet von ihrem eigenen Konto.

## 3. Infrastruktur

*Wird bis zur Schlussabgabe ergänzt.* Bisher: JDK 21 (laut `pom.xml` aller drei Module), Maven-Wrapper `./mvnw`, IntelliJ IDEA, GitHub Actions auf `ubuntu-latest`. Die Tests brauchen keine laufende Datenbank: Der games-service nutzt H2 im Speicher.

## 4. Entwicklungsvorgehen

### 4.1 Test-Driven Development

Neue Logik entsteht testgetrieben in kurzen Zyklen:

1. **Rot**: einen Test für genau ein neues Verhalten schreiben, er muss scheitern. Commit `rot: …` (nur der Test, allenfalls eine leere Hülle der Klasse).
2. **Grün**: so wenig Code wie nötig, bis alle Tests grün sind. Commit `grün: …`.
3. **Refactor** (optional): aufräumen ohne Verhaltensänderung, alle Tests bleiben grün. Commit `refactor: …`.

So zeigt `git log --oneline`, dass der Test vor dem Code entstanden ist. Beispiel: `TitleNormalizer` auf dem Branch `feature/title-normalizer` in vier Zyklen (trimmen, doppelte Leerzeichen, grosser Anfangsbuchstabe, leere Eingabe ablehnen).

### 4.2 Pipeline

Die Pipeline `.github/workflows/ci.yml` läuft bei jedem Push und Pull Request:

- Job `test` mit Matrix über `backend`, `gateway` und `steam-service`. Jeder Ordner läuft in einem eigenen Job auf einem frischen Runner mit `./mvnw -B test`. `fail-fast: false` sorgt dafür, dass ein roter Ordner die anderen nicht abbricht.
- Die Surefire-Berichte werden je Ordner als Artefakt hochgeladen, auch bei rotem Lauf (`if: always()`).
- Job `deploy` mit `needs: test`: Er läuft nur, wenn alle Test-Jobs grün sind. Vorerst ist er ein Platzhalter (`echo "deploy"`); später stellt er das JAR als Artefakt bereit.
- Ein absichtlich kaputter Test hat gezeigt, dass die Pipeline rot wird und `deploy` übersprungen wird.

Arbeitsweise: Änderungen entstehen auf einem Feature-Branch und kommen per Pull Request auf `main`. Gemergt wird nur, wenn die Pipeline im Pull Request grün ist.

## 5. Testfallerstellung

*Wird bis zur Schlussabgabe ergänzt* (Äquivalenzklassen, Grenzwerte). Bereits angewendet: Für `TitleNormalizer` sind die ungültigen Eingaben `null`, `""` und `"   "` eine Äquivalenzklasse und werden mit einem parametrisierten Test geprüft.

## 6. Testfalldurchführung

*Wird bis zur Schlussabgabe ergänzt* (Abnahmekriterien, Reihenfolge, Ablauf in der Pipeline).

## 7. Fehlerbehandlung

*Wird bis zur Schlussabgabe ergänzt* (Issue-Vorlage, Schweregrade).
