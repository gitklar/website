# CLAUDE.md

Guidance for agents working in the folder `spiel/` of `gitklar/website`, the one place where the games are edited (decision 0009). Org-wide conventions of Lars Schöbitz GmbH (brand bitz) apply as in `bitzgmbh/.github/CLAUDE-org.md`.

## What this is

The practice games of gitklar: static pages that teach the Git vocabulary and the Git workflows. Runden (`runden.html`) are short exercise rounds; Geschichte (`geschichte.html`) is a click-through story of two people on branches with an animated commit graph and questions. The learners are the course participants, most of whom have never programmed and never used Git. The game is a companion to the course website (`gitklar/website`), which holds the manual and the glossary.

## Hard rules

1. No personal data anywhere in this repository: no participant names, usernames, email addresses, no survey content. Example usernames in exercises are invented (`setup-kim`).
2. Content is German, in the du form, Swiss spelling (ss, never ß), gender colon forms (Teilnehmer:innen). English stays for the terms that stand on the screen (Commit, Push, Pull request), as the course website does.
3. No em dashes, no emojis, in content, code comments, commit messages and issues.
4. `data/begriffe.yml` is a copy of `begriffe.yml` at the root of the repository. Never edit it here; run `spiel/scripts/sync_begriffe.sh` instead (decision 0003).
5. No network calls from the page beyond its own files and the Plausible script of the website with its count events (decision 0009). No fonts from a CDN, no accounts. Answers and progress live in `localStorage` only (decision 0005).
6. Run `node spiel/scripts/validate.mjs` before every commit that touches `spiel/data/`.
7. Work on `dev`. Pull requests go from `dev` into `main`. Nothing is pushed to `main` directly.
8. The pages are public as part of the website. Raise the `?v=` number in the three HTML pages when `css/` or `js/` change.

## Before editing

- `docs/design.md` holds the design tree with the reasoning. Read it before changing how a level works.
- `docs/decisions/` holds the numbered decisions. A new decision is a new file, the next number, same format.
- The exercise model (fields, what a round is, how scoring works) is documented at the top of `data/uebungen.yml` and in `js/spiel.js` next to each level. The story model (scenes, actions, questions) is documented at the top of `data/geschichte.yml` and in `js/geschichte-modell.js`; the page `js/geschichte.js` only draws what the model says.
- A new story is data only: scenes with actions and questions in `data/geschichte.yml`. A new action type needs the model, the validation and the drawing code together.
- Match the look of the course website: plain, Bootstrap cosmo colours, no framework.

## Running

```
python3 -m http.server 8789      # then http://localhost:8789/
node scripts/validate.mjs        # data check
```
