# v2-Backlog

Bewusst aus v1 zurückgestellte Punkte (siehe SPEC.md Abschnitt 1, „Nicht in v1").
Für keinen dieser Punkte existiert Code oder ein Schemafeld auf Vorrat.

- **Sondereinträge und Kanister-Pool** — Einträge, die keinen Tankvorgang an der Säule
  abbilden (z. B. Befüllen aus dem Kanister), inklusive einer Pool-Verwaltung dafür.
- **Abschnittslogik statt Berechnung pro Eintrag** — Verbrauch über Abschnitte zwischen
  Volltankungen statt ausschließlich aus den drei Feldern eines einzelnen Eintrags.
- **Uhrzeit** — Einträge tragen bisher nur ein Tagesdatum (`YYYY-MM-DD`).
- **E-Control-Preisabfrage** — aktuelle Spritpreise über die E-Control-API.
- **Tankstellen** — Erfassung, an welcher Tankstelle getankt wurde.
- **Spritsorten** — Erfassung der getankten Sorte (Diesel, Super, …).
- **Tankvolumen** — Tankgröße pro Fahrzeug, z. B. für Restreichweiten-Schätzungen.
- **Teilbetankungen im UI** — `isFull` wird bereits gespeichert, aber in v1 nirgends
  ausgewertet oder angezeigt.
