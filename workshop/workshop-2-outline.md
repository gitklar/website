# gitklar Workshop 2: Folienplan

Plan für `workshop/workshop-2.qmd`, geschrieben am 23. November 2026 aus den Entscheidungen desselben Abends. Die Folien entstehen aus dieser Datei, nach der Durchsicht am Dienstag, 24. November.

- **Wann:** Mittwoch, 2. Dezember 2026, 09:30 bis 11:30 Uhr, Zoom
- **Form:** die Folien von Workshop 1 (gleiches Design, Ich bin dran, Wir sind dran, Ihr seid dran, Uhrzeiten in den Notizen), mit zwei Änderungen: auf den ersten Folien stehen Stichworte, und jede Demo läuft in zwei Durchgängen (erst sagen, was passiert, dann machen)
- **Sprache der Folien:** Deutsch. Die Titel unten sind die Arbeitstitel der Folien

## Der Ablauf

| Zeit  | Block                             | Minuten |
|-------|-----------------------------------|---------|
| 09:30 | Ankommen und Spuren               | 10      |
| 09:40 | Review zu zweit                   | 30      |
| 10:10 | Ein Merge-Konflikt, als Demo      | 5       |
| 10:15 | Pause                             | 10      |
| 10:25 | Dein eigenes Projekt auf GitHub   | 25      |
| 10:50 | Aufgaben und Projekte             | 15      |
| 11:05 | Geschichte, Agenten, das Kochbuch | 10      |
| 11:15 | Feedback: Think, Pair, Share      | 15      |

## Block 0: Willkommen (09:30 bis 09:40)

Auf diesen Folien stehen Stichworte; die Details spreche ich.

1.  **Titelfolie.** gitklar, Workshop 2: vom Rezept zum eigenen Projekt.
2.  **Zum Ankommen.** Eine Frage für den Chat, während alle eintreffen: Was hast du seit dem 17. November mit GitHub gemacht?
3.  **Heute.** Der Ablauf in sechs Zeilen mit Uhrzeiten. Ein gesprochener Satz zu meiner übrigen Arbeit (Wunsch aus der Feedback-Umfrage).
4.  **Deine Spuren.** Ein Bildschirmfoto eines Commits des Demo-Kontos, mit Markierungen für Name, Adresse und Zeit, dazu das Gespräch im Pull request. Drei Minuten. Ein gesprochener Satz zur E-Mail-Adresse: Wer damit noch ein Problem hat, meldet sich im eigenen Issue.

## Block 1: Review zu zweit (09:40 bis 10:10)

5.  **Abschnittsfolie.** Review und Merge.
6.  **Eine zweite Person liest mit.** Das Bild von Kim und Robin aus der Geschichte von Workshop 1, Stichworte: lesen, kommentieren, mit einem Commit antworten, mergen.
7.  **Ich bin dran.** Ich zeige einen offenen Pull request im Kochbuch, antworte als rainbow-train und merge. Drei Minuten.
8.  **Ihr seid dran.** Die Schritte für die Breakout-Räume, 20 Minuten und 2 für den Wechsel: Die Partner:innen fragen sich gegenseitig als Reviewer an, lesen, kommentieren, antworten mit einem Commit, geben frei und mergen den Pull request der anderen Person. Beim Lesen suchen sie nach den Elementen einer Suchliste («Findet X, Y, Z»). Wer keinen offenen Pull request hat, kommt als zweite Person für das Review zu einem Paar.
9.  **Ein Merge erscheint im Buch.** Live auf kochbuch.gitklar.ch, mit einer Folie mit Bildschirmfoto als Ersatz. Drei Minuten.
    1.  TODO: Muss mir genau anschauen wie das aufgebaut ist.

Notizen: Die Paare entstehen am Tag selbst aus den Anwesenden mit einem offenen Pull request. Für alle, die fehlen, merge ich nach dem Workshop.

## Block 2: Ein Konflikt (10:10 bis 10:15)

10. **Ein Konflikt, und wie man ihn löst.** Erster Durchgang: was ein Konflikt ist (zwei Personen haben dieselbe Zeile geändert) und was ich gleich mache.
11. **Demo.** Zweiter Durchgang: der Konflikt in `inhalt.csv` des Kochbuchs, im Browser gelöst. Niemand klickt mit.
    1.  TODO: Muss ich unbedingt vorher durchspielen.

## Pause (10:15 bis 10:25)

12. **Pause.** Mit der Uhrzeit, zu der es weitergeht.

## Block 3: Dein eigenes Projekt (10:25 bis 10:50)

13. **Abschnittsfolie.** Dein eigenes Projekt.
14. **Dein Konto oder eine Organisation.** Die Zeichnung `zeichnung-ort`. Die Person entscheidet.
15. **Vier Fragen an deinen Ordner.** Wo liegt er, wie gross ist die grösste Datei, gibt es etwas, das niemand sonst sehen darf, gibt es einen versteckten Ordner `.git`. Eine Wiederholung: Die Fragen stehen auf der Seite «Dein eigenes Projekt vorbereiten» und sind vor dem Workshop beantwortet.
16. **Welche Dateien zeigt Git?** Textformate Zeile für Zeile (.md, .csv, Code), ganze Versionen bei Word, Excel und Bildern. Drei Minuten für die Folien 14 bis 16.
17. **Ich bin dran, erster Durchgang.** Eine Folie mit der Liste, was ich gleich mache: neues privates Repository, klonen, die Dateien hineinkopieren, den Tab Changes lesen, ignorieren, was nicht hineingehört, Commit, Push. Eine Minute, keine zweite Demo.
18. **Ich bin dran, zweiter Durchgang.** Die Demo mit dem vorbereiteten Ordner `ferienplanung` (zwei Textdateien, eine `.DS_Store`, eine `passwort.txt`, ein versteckter Ordner `.git`). Beim Ignorieren einer Datei im Tab Changes fällt der Name `.gitignore`. Sieben Minuten für die Folien 17 und 18.
19. **Ihr seid dran.** Zu zweit in den Breakout-Räumen der Review-Paare aus Block 1; jede Person arbeitet am eigenen Ordner, die andere hilft. Repository anlegen, klonen, Dateien kopieren, Changes lesen, Commit, Push, prüfen, dass beim Repository Private steht. 15 Minuten. Letzte Zeile: Wer Unterstützung möchte, fügt `larnsce` als Collaborator hinzu.

Notizen: Wer kein Projekt hat, legt den Übungsordner an. Die geschriebenen Schritte stehen auf der Seite «Dein eigenes Projekt vorbereiten»; sie braucht einen zweiten Teil für die Schritte im Workshop.

## Block 4: Aufgaben und Projekte (10:50 bis 11:05)

20. **Ein Projekt, ein Ordner.** Die Zeichnung `zeichnung-ordner`, Schritt 1.
21. **Aufgaben am Projekt.** Die Zeichnung, Schritt 2: Issues, an den Ordner geheftet. Drei Minuten für die Folien 20 und 21.
22. **Ich bin dran.** Issues, Labels und ein Projektboard an einem meiner echten Projekte. Sieben Minuten.
    1.  TODO: Muss hier etwas vorbereiten.
23. **Ihr seid dran.** Alle schreiben ein erstes Issue in ihrem neuen Repository: das Nächste, was sie im Projekt tun wollen. Fünf Minuten.

## Block 5: Wie es weitergeht (11:05 bis 11:15)

24. **Die Geschichte.** Die Zeichnung, Schritt 3: die Linie der Commits.
25. **Ein Prompt an einer Änderung.** Die Zeichnung, Schritt 4. Was ein Agent in einem Repository macht: die Befehle neben den Knöpfen aus Block 3 (`git init`, `git add`, `git commit`, `gh repo create --private --push`), als das, was ein Agent auf einen Satz hin ausführt. Dazu der Link zum Screencast und der Satz, dass gitklar kein KI-Kurs ist und Grundlagen für sicheres und nachvollziehbares Arbeiten gibt. Fünf Minuten für die Folien 24 und 25.
    1.  TODO: Der Screencast ist eigentlich erst gedacht für nach diesem Kurs, aber ich schaue es mir genau an.
26. **Wie du mit mir weiterarbeiten kannst.** Workshops zur Arbeit mit KI-Agenten, und Coaching für Einzelne und Teams. Wer Interesse hat, meldet sich bei mir. Zwei Minuten.
27. **Das Kochbuch wird öffentlich.** Das Datum und die Bitte: Wer den eigenen Ordner oder die eigene Adresse nicht im Buch haben möchte, schreibt es bis Mittwoch, 9. Dezember, ins eigene Issue. Drei Minuten.

## Block 6: Feedback (11:15 bis 11:30)

28. **Think.** Zwei Minuten allein. Vier Kategorien auf der Folie: Vorbereitung, Interaktion, Präsentation, Inhalt. Zu jeder: Was lief gut, was soll besser werden. Der ganze Kurs zählt: Vorbereitung, beide Workshops, die Zeit dazwischen.
29. **Pair.** Sechs Minuten zu zweit in Breakout-Räumen.
30. **Share.** Sieben Minuten: Jede Person füllt das Formular aus. Link und QR-Code auf der Folie.
31. **Danke.** Die Aufzeichnung kommt per E-Mail.

## Offene Punkte

1.  Welches meiner Projekte ich im «Ich bin dran» von Block 4 zeige (es braucht Issues, Labels und ein Board, die in einer aufgezeichneten Sitzung gezeigt werden dürfen).
2.  Die Suchliste für die Paare auf Folie 8: welche Elemente sie im Pull request der anderen Person finden sollen.
3.  Welchen offenen Pull request ich in der Demo auf Folie 7 zeige und merge.
4.  Das Datum auf Folie 27, an dem das Kochbuch öffentlich wird.
5.  Ob die Schritte des Reviews (Folie 8) eine geschriebene Seite auf der Website bekommen, wie die Schritte zum Einreichen des Rezepts.
6.  Der Wortlaut der acht Felder des Feedback-Formulars, und ob das Formular auch nach dem Interesse an den Angeboten fragt.

## Zu bauen vor dem 2. Dezember

- Das Feedback-Formular, als zweite Umfrage neben der zu Workshop 1: vier Kategorien, je zwei Felder, Benutzername freiwillig.
- Mindestens ein Screencast, bis Dienstag, 1. Dezember.
- Der Demo-Ordner `ferienplanung`.
- Das Bildschirmfoto des Commits für Folie 4, mit Markierungen.
- Der Konflikt in `inhalt.csv`, so vorbereitet, dass die Demo drei Minuten dauert.
- Das Kochbuch als Buch: Die Durchsicht bis Freitag, 27. November, entscheidet zwischen der Live-Folie und dem Ersatz.
- Ein zweiter Teil der Seite «Dein eigenes Projekt vorbereiten» mit den Schritten im Workshop.
- Der Probelauf mit dem Testkonto am Dienstag, 1. Dezember.
