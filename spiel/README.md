# spiel

Two small browser games for Git and GitHub, part of gitklar, the Git and GitHub course of bitz (Lars Schöbitz GmbH). German, phone friendly, no login. Answers and progress stay in the browser. The games live in this folder of `gitklar/website` and are published with the website at <https://gitklar.ch/spiel/> (decision 0009); the former repository `gitklar/spiel` is archived.

- **Runden** (`runden.html`): short exercise rounds on the Git commands. Matching terms, filling in commands, putting the steps of a workflow in order.
- **Geschichte** (`geschichte.html`): two people, one repository. Kim and Robin work on branches and pull requests while an animated commit graph shows what happens; the mode "Mitmachen" asks short questions along the way.

`index.html` is the landing page with one card per game.

The design questions and their answers are in `docs/design.md`; the decisions that came out of them are in `docs/decisions/`. The spec and the tickets are issues of the archived repository `gitklar/spiel`.

## Run locally

The page loads its data with `fetch`, so it needs a web server, not a `file://` URL:

```
cd spiel
python3 -m http.server 8789
```

Then open <http://localhost:8789/>. There is no build step: the three HTML pages, `css/`, `js/` and `data/` are the site.

## Edit the exercises and the stories

The exercise text of Runden lives in `data/uebungen.yml`, the stories of Geschichte in `data/geschichte.yml`. The fields are documented at the top of the file. After an edit, run the check:

```
node spiel/scripts/validate.mjs
```

It loads the data files with the same parser the browser uses and reports missing fields, unknown terms and impossible solutions. For the stories it replays every scene through `js/geschichte-modell.js`, the same model the page draws, so a merge of an unpushed branch or a question about a commit that does not exist yet fails here and not in front of a learner. The GitHub Action `spiel-check` runs the same check on every push that touches `spiel/` or the glossary.

Level 1 (Zuordnen) has no items of its own: it draws the pairs from `data/begriffe.yml`, a copy of `begriffe.yml` at the root of this repository. The copy is never edited (decision 0003). To refresh it after a glossary change:

```
spiel/scripts/sync_begriffe.sh
```

## Layout

```
index.html            landing page, one card per game
runden.html           the exercise game, all views are sections toggled by the script
geschichte.html       the story game
css/spiel.css         styles for all pages, light and dark through prefers-color-scheme
js/spiel.js           Runden: data loading, the three levels, scoring, progress
js/geschichte-modell.js  the repository model of the story (commits, branches, pull requests, laptops)
js/geschichte.js      Geschichte: scene playback, the SVG commit graph, panels, questions
js/vendor/            js-yaml 4.1.0 (MIT), the YAML parser the pages use
data/begriffe.yml     copy of the course glossary (website repository), synced by script
data/uebungen.yml     the exercises of levels 2 and 3 and the modes of level 1
data/geschichte.yml   the stories: scenes with text, actions on the graph, questions
scripts/              validate.mjs (data check), sync_begriffe.sh (glossary copy)
docs/                 design.md (the design tree) and decisions/ (numbered records)
```

## Publishing and counts

The website build copies the pages, `css/`, `js/` and `data/` as they are (`resources` in `_quarto.yml`); `docs/`, `scripts/` and this file are not published. A change goes live like any change to the website: `dev`, then a pull request into `main`. Raise the `?v=` number in the three HTML pages when `css/` or `js/` change.

The pages load the Plausible script of the website and report the events "Runde beendet", "Geschichte Szene" and "Geschichte beendet" as sums, without personal data. The stills for the slides (`geschichte.html?...&bild=1`) report no scene events.

## Licences

Code (`js/`, `css/`, `scripts/`, the HTML pages) under the MIT licence, see `LICENSE`. Exercise texts and the data files under `data/` under CC BY 4.0, attribution "gitklar von bitz, Lars Schöbitz GmbH". `js/vendor/js-yaml.min.js` is js-yaml by Vitaly Puzrin, MIT, see `js/vendor/LICENSE-js-yaml`. The glossary explanations follow Glosario (The Carpentries, CC BY 4.0) in their substance, in their own German words.
