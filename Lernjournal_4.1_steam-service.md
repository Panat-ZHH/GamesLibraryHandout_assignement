# Lernjournal M321 – 4.1 HTTP-Clients: steam-service

Setup: Eureka 8761, Gateway 8080, games-service 8081, steam-service 8082 (neu).
Spring Boot 4.1.0, Spring Cloud 2025.1.3.

## Timeout-Nachweis (Teil 3)

Befehl: `curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" -X POST http://localhost:8080/api/games/import/620`

```
# 1) ohne Timeout, steam-service mit Thread.sleep(8000)
201 8.570715s

# 2) mit Timeout (connect 1 s, read 2 s) und Fehlerbehandlung
503 2.110334s
{"status":503,"error":"steam-service nicht erreichbar"}

# 3) steam-service gestoppt
503 0.024828s
{"status":503,"error":"steam-service nicht erreichbar"}
```

Zwischenschritt (Timeout gesetzt, aber noch ohne eigenen Handler): `500 2.092270s` mit
`"message":"Ein interner Fehler ist aufgetreten"`.

## Kapitel 1.1

**Welche Teile des Systems ändern sich, wenn die Steam-Suche ein eigener Service wird, und welche nicht? Woran würden Sie merken, dass der Strangler-Schritt geglückt ist?**

Es ändern sich:
- Neu dazu kommt der steam-service mit dem SteamController.
- Im Gateway ändert sich bei der Route `steam` nur das Ziel.
- Im games-service fällt der SteamController weg, dafür kommt später der Import-Client dazu.

Gleich bleiben das Frontend (es ruft weiterhin `/api/steam/...` über den Proxy auf 8080 auf), Eureka,
die Spielesammlung mit der H2-Datenbank und die Route `games`.

Gemerkt haben wir es so: Die Steam-Suche im Frontend läuft wie vorher. Im Eureka-Dashboard steht
STEAM-SERVICE, und `curl -i http://localhost:8080/api/steam/game/620` liefert 200 mit
`X-Gateway: gameslibrary`. Die Daten kommen jetzt aber vom steam-service, denn der games-service selbst
liefert unter `/api/steam/game/620` keine Steam-Daten mehr, nur noch einen 500er.

## Kapitel 1.4

**Welcher HTTP-Status passt zu welcher Zeile der Tabelle: 404, 502 oder 503? (Vermutung)**

Unsere Vermutung vor Teil 3:
- Kein Eintrag bei Eureka → 503
- Eintrag da, Prozess weg → 503
- Antwort dauert zu lange → 503 (zuerst hatten wir an 504 gedacht, der stand aber nicht zur Auswahl)
- steam-service antwortet mit 5xx → 502
- Spiel unbekannt → 404

Das hat sich in Teil 3 bestätigt, siehe unten.

## Teil 1

**Aufbau des JSON von `GET /api/steam/game/620`**

Auf oberster Ebene steht ein einziger Schlüssel, die AppID als Text: `"620"`. Darunter liegen `success`
(true) und `data`. In `data` sind sehr viele Felder, für uns wichtig sind `name` ("Portal 2"),
`short_description`, `header_image` und `release_date`. `release_date` ist selbst ein Objekt mit
`coming_soon` und `date` ("18 Apr, 2011"). Mit `cc=CH` steht beim Preis auch CHF drin.
Bei einer unbekannten ID kommt nur `{"99999999":{"success":false}}` ohne `data`.

**Wo im Frontend oder im Gateway mussten Sie etwas ändern, damit die Suche weiter funktioniert? Was sagt das über den Strangler-Ansatz?**

Im Frontend gar nichts. Im Gateway nur eine Zeile, bei der Route `steam` von `uri: lb://games-service`
auf `uri: lb://steam-service`. Das ist die Idee vom Strangler-Ansatz: Man löst eine Funktion nach der
anderen aus dem Monolithen heraus, und die Fassade (hier das Gateway) leitet die Anfragen um. Die Clients
merken nichts davon. Falls etwas schiefgeht, kann man die Zeile einfach wieder zurückstellen.

## Teil 2

**Warum ruft der games-service den steam-service nicht über das Gateway auf? Was würde sich ändern, wenn die Basis-URL `http://localhost:8082` lautete?**

Das Gateway ist die Haustür für Clients von aussen. Ginge der interne Aufruf auch dort durch, hätte man
einen Hop mehr, und der Import würde nicht mehr funktionieren, sobald das Gateway ausfällt, obwohl beide
Services eigentlich laufen. Im Log vom steam-service sieht man den Aufruf
(`Spieldetails angefragt: appId=620`), obwohl das Gateway nicht beteiligt war.

Mit `http://localhost:8082` wäre die Adresse wieder fest eingetragen. Startet der steam-service auf einem
anderen Port oder Rechner oder in zwei Instanzen, müsste man die Konfiguration anpassen, und es gäbe
keine Lastverteilung. Mit unserem `@LoadBalanced`-Builder würde es sogar gar nicht gehen: Der Builder
behandelt den Host immer als Servicenamen und würde bei Eureka nach einem Service `localhost` suchen.

## Teil 3

**Messungen**

| Situation | Status | Zeit | Antwort |
|---|---|---|---|
| ohne Timeout, steam-service schläft 8 s | 201 | 8,57 s | das importierte Spiel |
| Timeout, noch ohne eigenen Handler | 500 | 2,09 s | `Ein interner Fehler ist aufgetreten` |
| Timeout und Fehlerbehandlung | 503 | 2,11 s (2. Aufruf 2,02 s) | `steam-service nicht erreichbar` |
| steam-service gestoppt, sofort | 503 | 0,02 s | `steam-service nicht erreichbar` |
| steam-service gestoppt, nach 1 Minute | 503 | 0,02 s | `steam-service nicht erreichbar` |
| unbekannte ID 99999999 | 404 | – | `Spiel nicht gefunden` |
| ID 0 (steam-service liefert selbst 500) | 502 | – | `steam-service hat mit Fehler geantwortet` |

Bei gestopptem steam-service kommt die Antwort sofort und nicht erst nach 2 Sekunden: Die Verbindung wird
direkt abgelehnt, es gibt also nichts, worauf man warten müsste. Anders als auf dem Blatt war bei uns der
Eintrag nach einer Minute aus Eureka verschwunden (im Dashboard nur noch GAMES-SERVICE und GATEWAY). Der
steam-service hat sich beim Stoppen sauber abgemeldet. Der Status bleibt trotzdem 503, weil wir
`IllegalStateException` (keine Instanz) und `ResourceAccessException` (Prozess weg) gleich behandeln.

**Status-Zuordnung**

| Situation | Ausnahme im games-service | Status |
|---|---|---|
| Kein Eintrag bei Eureka | IllegalStateException | 503 |
| Eintrag da, Prozess weg | ResourceAccessException | 503 |
| Antwort dauert zu lange | ResourceAccessException | 503 |
| steam-service antwortet mit 5xx | HttpServerErrorException | 502 |
| Spiel unbekannt | `success: false` | 404 |

- **Warum 503 und nicht 500?** Der games-service selbst hat keinen Fehler, nur sein Partner ist gerade
  nicht erreichbar. 503 sagt dem Client «später nochmals versuchen», 500 würde nach einem Bug im
  games-service aussehen.
- **Warum 502 und nicht 503?** Der steam-service war erreichbar und hat geantwortet, aber mit einem
  Fehler. Der games-service hat also eine ungültige Antwort von seinem Partner bekommen (Bad Gateway).
  503 würde heissen, dass gar keine Antwort kam.

## Checkpoint-Fragen (Plenum)

- **Warum direkt und nicht über das Gateway?** Das Gateway ist nur für Clients von aussen. Intern spart
  man einen Hop und hängt nicht vom Gateway ab, siehe Teil 2.
- **Was bewirkt `@LoadBalanced`?** Ein Interceptor ersetzt bei jedem Aufruf den Host `steam-service` durch
  host:port einer Instanz aus Eureka und wechselt bei mehreren Instanzen ab. Ohne die Annotation wird
  `steam-service` als normaler Hostname behandelt, und es gibt eine `UnknownHostException`.
- **Warum Timeout, und warum kein automatisches Retry bei POST?** Ohne Timeout wartet der games-service so
  lange wie der Partner (bei uns 8,6 s), und Threads und Verbindungen stauen sich. POST ist nicht
  idempotent: Jeder Import legt einen neuen Eintrag an, ohne zu prüfen, ob das Spiel schon da ist (Portal 2
  stand bei uns danach doppelt in der Sammlung: id 11 aus den Beispieldaten, id 337 aus dem Import). Ein automatisches Retry könnte also Duplikate erzeugen.
