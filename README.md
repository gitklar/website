# website

The course website of gitklar, the Git and GitHub course of bitz (Lars Schöbitz GmbH). Quarto, German, published with GitHub Pages at <https://gitklar.ch/>.

## One site, one snapshot per cohort

The shared pages under `vorbereitung/` are the manual. A cohort is a Quarto profile, `_quarto-<name>.yml`, with its label, sessions, due date and hosts, plus one line in the file `cohorts`. The Action renders the root into `_site/` and every cohort into `_site/<name>/`. An active cohort renders from `main`, so a fix reaches it. A frozen cohort renders from the git tag of the same name and never changes again. Nothing rendered is committed. The reasoning is decision 0001 in `gitklar-dev/admin`.

Cohort-specific text lives in three places only: the profile values (`{{< meta cohort.label >}}` and the like), blocks marked `when-profile="cohort"` on the front page, and the profile file itself. Shared pages are never edited for one cohort.

## The recipe pre-work and the catch-up page

Since 2 November 2026 (decisions 0006 to 0012 in `gitklar-dev/admin`) the pre-work has each participant create a private repository `rezept-<username>` in the organisation (`vorbereitung/repository-anlegen.qmd`), write a recipe there in the browser (`vorbereitung/rezept-dokumentieren.qmd`: `rezept/zutaten.csv` with the fixed columns `zutat,menge,einheit,hinweis`, `rezept/rezept.md`, photos without people and without location data), clone it and commit from the laptop. The per-person issue lives in the shared repository `gitklar/vorbereitung`. In the workshops the recipes go into `gitklar/kochbuch` by pull request; `rezept-einreichen.qmd` (sidebar section "Workshop verpasst?") is the written version of workshop 1 for anyone who missed it. Steps that have not been tried with a test account carry an HTML comment `zu prüfen` at the top of the page source.

## Reference pages and the glossary

`werkzeuge.qmd` (which tool does what), `ki-werkzeuge.qmd` (what Claude Code, Cowork, Codex and ChatGPT Work see of the folder and the repository, from the vendors' documentation, with the date of the last check), `glossar.qmd` and `begriffe.qmd` (the terms side by side in English and German) form the sidebar section "Nachschlagen". The glossary and the table are generated at render time from one file, `begriffe.yml`, by the shortcodes in `_extensions/ghe/gl` (copied from agentsforsci-ghe/website and adapted): `{{< glossar liste >}}` renders the entries, `{{< glossar tabelle >}}` the table, and `{{< gl commit >}}` marks a term on any page with a hover popover and a link to its entry. Edit `begriffe.yml` only; the fields are documented at the top of the file. Pandoc parses the file, so no extra tool is needed in the Action.

The course keeps the English terms of github.com and GitHub Desktop, which have no German interface. German on a participant's screen comes from browser translation or from the operating system's own dialogs; `begriffe.qmd` explains both and shows how to switch translation off for github.com.

## Render locally

```
quarto render                                      # root
quarto render --profile cohort,airetreat-01   # one cohort
```

Open `_site/index.html` and `_site/airetreat-01/index.html`.

## Add a cohort

1. Copy `_quarto-airetreat-01.yml` to `_quarto-<name>.yml` and fill in the values. Names are audience plus a two-digit counter (airetreat-02, a new audience gets its own prefix).
2. Add the line `<name> active` to `cohorts`.
3. Open the pull request from `dev` into `main`. The merge publishes it.
4. Put `https://gitklar.ch/<name>/` into the cohort config of `gitklar-dev/admin`.

## Freeze a cohort

After the last workshop: `git tag <name>` on the commit the cohort last saw, push the tag, change its line in `cohorts` to `frozen`, merge. The pages stay as they were.

## Domain

gitklar.ch, decision 0004 in `gitklar-dev/admin`. At the registrar: four A records for the apex to GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153), four AAAA records (2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153), and `www` as a CNAME to `gitklar.github.io`. In the repository settings under Pages: custom domain `gitklar.ch`, then Enforce HTTPS once the certificate exists. Under the organisation settings, Pages, Verified domains: verify `gitklar.ch`, so nobody else can bind it to a Pages site.

## Screenshots

The pages describe the buttons by their English labels, as GitHub Desktop shows them. The screenshots are data: the list `bildschirme` in `begriffe.yml` names each screen (key, title, page, what it shows), and a term points at its screen through the `bild` field. `{{< glossar bildschirme >}}` renders every screen of the current page under a heading, `{{< glossar bild <key> >}}` one screen anywhere. Until the file exists under `bilder/<key>.png` (or the `datei` the entry names), the page shows a dashed placeholder box with the key and the expected file name; drop the file in and the box becomes the image, no page edit needed. The screens of the first repository setup render on `begriffe.qmd`, those of the AI tools on `ki-werkzeuge.qmd`.

## Not yet

The screenshot files themselves (see above). A check of `ki-werkzeuge.qmd` against the vendors' pages before each cohort; the page carries its date and marks open points with "zu prüfen".
