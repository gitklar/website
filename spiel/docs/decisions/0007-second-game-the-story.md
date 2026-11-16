# 0007 A second game, the story, in the same repository with a landing page

- Question: the second game (a visual story of two people, their branches and pull requests, with questions in the later modes) could be a page in this repository, a third page of the website, or a repository of its own. And how do two games share one address?
- Options: own repository (clean, but a second deploy and a second glossary copy); a page on the website (Quarto render, cohort snapshots); a second page here, with a landing page that offers both.
- Choice: a second page here, `geschichte.html`, next to `runden.html` (the exercise game, until now `index.html`). `index.html` is now the landing page with one card per game, and every page carries the same small navigation. The story's data lives in `data/geschichte.yml`, its model in `js/geschichte-modell.js`, so the validation replays every story the way the page does.
- Why: one address for "Üben" on the website, one deploy, one set of decisions (0002 to 0006 hold for both games), one glossary copy. The two games differ in form but share the audience, the language rules, the look and the storage rule. Moving the first game to `runden.html` costs nothing before the repository is public.
- Consequences: the browser check covers both pages. Issue #4 links the landing page, not a game. A third game would be a third page and a third card, nothing more.
- Date: 2026-11-01
