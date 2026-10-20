# Lernjournal M321 – 3.1 Spring Cloud Gateway

Setup: Eureka auf 8761, Backend als `games-service` auf 8081, Gateway auf 8080.
Spring Boot 4.1.0, Spring Cloud 2025.1.3.

## Kapitel 1.2

**Welche Adressen muss das Frontend nach dem Einbau des Gateways noch kennen, welche nicht mehr? Was passiert, wenn der games-service morgen auf Port 8181 startet?**

Das Frontend kennt nur noch eine Adresse, nämlich das Gateway auf `localhost:8080`. Das steht ja schon als
Proxy in der `package.json`, deshalb mussten wir im Frontend nichts ändern. Die Adresse vom Backend
(8081) und später vom steam-service (8082) muss es nicht mehr kennen.

Wenn der games-service auf 8181 startet, meldet er sich mit dem neuen Port bei Eureka an. Das Gateway
fragt bei `lb://games-service` Eureka nach der Adresse und bekommt dann einfach 8181 zurück. Am
Frontend und an der Gateway-Konfiguration muss man nichts anpassen. Mit der festen Adresse
`http://localhost:8081` aus Teil 1 würde es hingegen nicht mehr gehen, da müsste man die Route von Hand
ändern.

## Teil 1

**Warum braucht die Route games keinen StripPrefix-Filter, die Route lager aus Kapitel 1 aber schon? Welcher Pfad käme beim Lager-Service ohne den Filter an, und mit welchem Status würde er antworten?**

Unser Backend hat die Endpunkte schon unter `/api/games/...`. Der Pfad, den das Frontend schickt,
ist also genau der Pfad, den das Backend erwartet, und kann unverändert weitergegeben werden.

Beim Lager-Beispiel ist `/lager` nur ein Präfix, damit das Gateway weiss, welcher Service gemeint ist.
Der Lager-Service selbst kennt nur `/api/bestand`. Ohne `StripPrefix=1` käme bei ihm
`/lager/api/bestand` an, dafür hat er keinen Endpunkt und antwortet mit **404 Not Found**.

## Teil 2

**Worin unterscheiden sich AddRequestHeader und AddResponseHeader? Wer sieht den Header jeweils?**

- `AddRequestHeader` hängt den Header an die Anfrage, die das Gateway an den Zielservice weiterleitet.
  Den sieht nur der Zielservice, der Client merkt nichts davon.
- `AddResponseHeader` hängt den Header an die Antwort, die zurück zum Client geht. Den sieht nur der
  Client, der Zielservice hat ihn ja nicht gesetzt.

Bei uns konnte man das gut sehen: Über `localhost:8080/api/games/1` steht `X-Gateway: gameslibrary`
in der Antwort, beim direkten Aufruf auf `localhost:8081/api/games/1` fehlt der Header.

**Discovery-Locator: Welcher Filter entfernt den Servicenamen aus dem Pfad? Lassen wir ihn eingeschaltet?**

Unter `/actuator/gateway/routes` kamen mit dem Locator zwei zusätzliche Routen dazu, eine für
`GAMES-SERVICE` und eine für `GATEWAY` selbst. Den Servicenamen entfernt der Filter **RewritePath**:
`/games-service/?(?<remaining>.*)` wird zu `/${remaining}`. `curl -i http://localhost:8080/games-service/api/games/1`
hat damit 200 geliefert, ohne dass wir eine Route geschrieben haben.

Wir haben den Locator wieder **ausgeschaltet** (`enabled: false`). Er macht alles erreichbar, was im
Service läuft. Beim Testen ging über `http://localhost:8080/games-service/h2-console/` sogar die
H2-Konsole mit Status 200, und die soll von aussen sicher niemand aufrufen können. Mit den
handgeschriebenen Routen ist klar festgelegt, dass nur `/api/games/**` und `/api/steam/**` durchgehen.
Ausserdem bleibt die URL für das Frontend gleich, wenn die Steam-Suche am 03.11. in einen eigenen
Service zieht. Mit dem Locator würde sich der Pfad mit dem Servicenamen ändern.

## Teil 3

**Beobachtung Fehlerfall (Backend gestoppt, Eureka und Gateway laufen weiter)**

| Zeitpunkt | Status | Antworttext |
|---|---|---|
| sofort | `500 Internal Server Error` | `{"timestamp":"…","path":"/api/games/1","status":500,"error":"Internal Server Error","requestId":"…"}` |
| nach ca. 1 Minute | `503 Service Unavailable` | `{"timestamp":"…","path":"/api/games/1","status":503,"error":"Service Unavailable","requestId":"…"}` |

Erklärung: Direkt nach dem Stoppen hat das Gateway die Instanz `localhost:8081` noch in seinem Cache.
Es versucht also weiterzuleiten, bekommt `Connection refused` (steht so im Gateway-Log) und gibt einen
500 zurück. Nach dem Refresh (Eureka und Gateway alle 30 Sekunden) gibt es keine Instanz von
games-service mehr. Der Load Balancer findet nichts und das Gateway antwortet mit 503.

Im Frontend lädt die Spieleliste dann nicht, und in `useGames.ts` wird die Meldung
«Fehler beim Laden der Spiele.» gesetzt.

Nach dem Neustart vom Backend kam nach etwa 37 Sekunden wieder 200, also innerhalb der einen Minute.

Routen-Test: `./mvnw test` im Ordner `gateway` ist grün, auch ohne laufenden Eureka. Als wir die ID
`steam` testweise in `shop` umbenannt haben, ist der Test mit `Route steam fehlt: [games, shop]`
fehlgeschlagen. Danach haben wir es wieder rückgängig gemacht.

**Was sieht der Client, wenn das Backend fehlt: mit Gateway und ohne Gateway? Welche Massnahme würde die Antwort verbessern?**

Ohne Gateway bekommt der Client gar keine HTTP-Antwort, die Verbindung wird abgelehnt
(`curl: (7) Failed to connect to localhost port 8081`). Der Client weiss nur, dass nichts da ist.

Mit Gateway bekommt er immerhin eine richtige HTTP-Antwort mit Statuscode und JSON (500 oder 503).
Für den Benutzer ist das aber auch nicht viel besser, und das 500 am Anfang ist eigentlich irreführend,
weil ja kein Fehler im Server passiert ist, sondern der Service einfach weg ist.

Verbessern könnte man das mit einem **Circuit Breaker mit Fallback** im Gateway, z. B. eine leere Liste
oder eine verständliche Meldung unter `/fallback/games`. Zusätzlich hilft ein **Timeout**, damit der Client
nicht lange warten muss. Und wenn der games-service in zwei Instanzen läuft, kann das Gateway über
Eureka einfach auf die andere ausweichen.

## Checkpoint-Fragen (Plenum)

- **Woraus besteht eine Route?** `id` (Name), `uri` (Ziel, fest oder `lb://servicename`), `predicates`
  (wann die Route greift, z. B. `Path=`) und `filters` (was an Anfrage oder Antwort geändert wird).
- **`http://localhost:8081` → `lb://games-service`?** Das Ziel ist nicht mehr fest eingetragen, sondern
  wird bei Eureka nachgeschaut. Port-Wechsel und mehrere Instanzen funktionieren ohne Änderung, und bei
  mehreren Instanzen wird die Last verteilt.
- **Warum Fehlerstatus statt endlos versuchen?** Sonst würde jede Anfrage hängen bleiben und Verbindungen
  im Gateway belegen, bis irgendwann auch das Gateway selbst nicht mehr antwortet. Mit einem schnellen
  Fehler kann der Client reagieren, z. B. eine Meldung anzeigen oder es später nochmals versuchen.
