# Design tree

The plan for the game was grilled on 1 November 2026 against the course documents, with the decisions taken by the agent on Lars's instruction ("go with your recommendations"). Each question names its answer, the reason and the source. Settled questions opened the next round. Facts came from the repositories `gitklar/website` and `gitklar-dev/admin`, the survey tallies of the first cohort (23 answers, aggregates only), the voice note that started the idea, and two texts: Greg Wilson, *Teaching Tech Together*, chapter 4 (cognitive load), and Simon Willison, "The October inflection point for vibe game development" (28 October 2026).

## Round 1: what and where

**Q1 Purpose.** Is the game homework, a workshop activity, or a reference?
Answer: practice between the pre-work and workshop 2, and the warm-up of workshop 2. It is optional and never a condition for taking part. Reason: the pre-work ends with a first commit in GitHub Desktop; workshop 1 adds a 15 minute terminal block (git status, git log, one commit by command) and the Claude Code screencast; workshop 2 teaches branch and pull request. The game rehearses the vocabulary and the order of steps for all three moments. Source: the run of show notes in the course para page (28 October 2026), `vorbereitung/erster-commit.qmd`.

**Q2 Audience.** Who plays?
Answer: the course participants, and anyone who finds the page. Of the 23 answers of the first cohort, 15 have never programmed, 14 have never used Git, 12 use the terminal occasionally and 7 never. The game therefore teaches recognition and ordering, not typing. Source: survey tallies of 1 November 2026 (aggregates).

**Q3 Place.** Inside the website repository or its own?
Answer: its own repository, `gitklar/spiel`, in the organisation gitklar (decision 0001). Reason: the website is one site with a snapshot per cohort; the game is the same for every cohort and should never be frozen with one. A separate repository also keeps the website's Quarto render untouched. Later, the website links to the game under "Üben". Source: admin decision 0001 (one site, cohort snapshots), 0003 (one course org).

**Q4 Hosting.** Where does it run?
Answer: GitHub Pages of the repository, `gitklar.github.io/spiel/`, once the repository is public. Until then local only. Going public and switching Pages on is Lars's step (issue #4). Reason: the free plan serves Pages from public repositories only, and nothing of the course goes public before Lars has seen it. Source: the course's standing rule, admin `CLAUDE.md`.

## Round 2: how it is built

**Q5 Technology.** Quarto, a framework, or plain HTML?
Answer: one static page with plain HTML, CSS and JavaScript, no build step, no framework (decision 0002). Reason: the game is one page with three interactions; a framework adds a toolchain Lars would have to maintain; Quarto would wrap a JavaScript widget anyway. Willison's lesson applies in reverse: he recommends three.js or Phaser for 3D and 2D games because the models know them, but this game has no scene to render.

**Q6 Data format.** Where do the exercises live?
Answer: in `data/uebungen.yml`, with the field documentation at the top of the file, like `begriffe.yml` on the website. The page parses it in the browser with js-yaml 4.1.0, vendored into `js/vendor/` with its MIT licence (hash checked against cdnjs on 1 November 2026). Reason: Lars edits YAML on the website already; one format for both repositories. Vendoring keeps the page free of network calls (Q11).

**Q7 Glossary.** Level 1 needs the terms. Copy them or reference them?
Answer: `data/begriffe.yml` is a byte-identical copy of the website file, refreshed by `scripts/sync_begriffe.sh`, never edited here (decision 0003). Level 1 derives its pairs from it at run time. Reason: the glossary is maintained in one place; a copy that is only ever synced cannot drift silently, and a later check can compare the two files.

**Q8 Language.** German or bilingual?
Answer: German, du form, Swiss spelling (ss), gender colon forms. The English terms of github.com and GitHub Desktop stay English, as on the website. Reason: the course decided this for the website and the glossary explains why (no German interface exists for the tools).

**Q9 Look.** Brand, theme?
Answer: plain, with the Bootstrap cosmo colours the website uses, system fonts, light and dark through `prefers-color-scheme`, a maximum width that reads well on a phone. Reason: the website has no brand file yet (`_brand.yml` does not exist); the game should look like a page of the same course and nothing more.

## Round 3: the exercises

**Q10 Exercise types.** Which types, and why these?
Answer: matching (Zuordnen), faded examples with fill-in-the-blank (Lückentext), Parsons problems (Reihenfolge). A fourth type, "Drei Wege" (button, command, sentence to the agent), is issue #3. Reason: *Teaching Tech Together*, chapter 4, on cognitive load: Parsons problems let novices concentrate on the order of steps without recalling syntax; faded examples introduce the solution piece by piece, so each item adds one new thing. Both fit an audience that has never typed a command. Matching is the entry level for the vocabulary, which the glossary already holds.

**Q11 Data protection.** Accounts, tracking, scores?
Answer: none of it (decision 0005). No accounts, no analytics, no fonts or scripts from outside the page. Progress (rounds played, best results) stays in `localStorage` in the learner's browser. Reason: the course handles participant data under a data protection note in the admin repository; the game adds no data at all, which is the only setting that needs no note.

**Q12 Round shape.** How long is a round, how is it scored?
Answer: one round is two to four minutes. Zuordnen: six pairs from one glossary group, counted by wrong taps. Lückentext: six items, the first fully worked (read only), then one blank, two blanks, and finally every word but `git`; counted by items right at the first check. Reihenfolge: one workflow per round, counted by attempts, with the solution offered after two failed attempts. Reason: short rounds fit an evening on the phone; the counts are the simplest honest measures of each interaction.

**Q13 Interaction.** Drag and drop or tap?
Answer: tap only. Tap a word to fill the next blank, tap a filled blank to empty it, tap a card to append it to the order, tap it again to remove it. Reason: one interaction model works on phones, desktops and with a keyboard; drag and drop is a second model with its own failure cases. It can be added later without changing the data.

**Q14 Command set.** Which commands appear?
Answer: the commands the glossary lists in its `befehl` fields and the two workshops use: clone, status, log, add, commit, push, pull, branch, switch, merge, diff, remote. Nothing else, so that every command in the game has an explanation on the website.

**Q15 Workflows for Parsons problems.** Which sequences?
Answer: three in the first version. "Dein erster Commit" (the pre-work path with GitHub Desktop), "Eine Änderung sichern" (status, add, commit, push), "Branch und Pull Request" (the workshop 2 path). Each has one or two distractor steps marked as such in the data. A fourth, the Claude Code path, is part of issue #3.

## Round 4: quality and process

**Q16 Checks.** What is tested?
Answer: `scripts/validate.mjs` loads both data files with the vendored parser and checks structure, references (every `begriff` exists in the glossary, every `fest` index is valid), and solvability (a Parsons workflow has at least three steps and no distractor repeats a step). The GitHub Action runs it on every push. A browser check of the three levels at phone width is done by hand or through the DevTools protocol before a release (issue #8).

**Q17 Branches and tickets.** How does work flow?
Answer: `dev` is the integration branch, pull requests go from `dev` into `main`. The spec is issue #1; tickets follow as separate issues, labelled `ready-for-agent` when an agent can take them without Lars, `needs-lars` when only he can act. Source: the Git workflow rules of the owner and the org conventions.

**Q18 Licences.** Under what terms?
Answer: MIT for the code, CC BY 4.0 for the exercise texts and data (decision 0006). Reason: the course material of the owner's earlier workshops is open educational material, and the glossary copy follows Glosario (CC BY 4.0) in substance.

## Open and deferred

- Level 4 "Drei Wege" and the Claude Code workflow (issue #3).
- Public repository, Pages, link from the website navbar, the "Fertig" page and the pre-work issue (issue #4, Lars).
- Glossary sync check against the website once that repository is on GitHub (issue #5).
- Playtest with three participants before workshop 2 and one question in the post-course survey (issue #6).
- Workshop mode: a round on the shared screen, everyone answers on their phone (issue #7).
- Phone and accessibility pass (issue #8).
- Spaced repetition: repeat the items a learner got wrong (issue #9).

## Round 5: the story game (added 1 November 2026, afternoon)

Lars asked for a second game, "more fun, more visual, like Simon's examples", built on the branch concept: commits that build up, a branch for each of two people, a pull request each; people click through steps and solve short quizzes at a later stage. The grilling against the docs:

**Q19 Form.** A 3D scene like Willison's games, or a diagram that moves?
Answer: an animated commit graph in SVG: time runs downwards, main in the middle lane, each person's branch in a lane beside it, commits as circles with the author's initial, dashed while they exist only on a laptop, column headers with the branch names, a small burst of colour on every merge. Reason: the graph is the mental model the course wants people to carry (GitHub Desktop's history view, `git log --graph`); a 3D scene would be fun for its own sake and hide the model. Willison's lesson that applies is the other one: iterate on "more fun" with real players (issue #12).

**Q20 Story.** What do the two people do?
Answer: Anna and Ben, invented, write a shared recipe book. Story 1: both branch from the same commit, commit locally, push, open a pull request each, one review with a change request, two merges, both pull. Story 2: both change the same line, the second pull request conflicts, Ben merges main into his branch and resolves it. Reason: recipes are concrete and neutral for an audience that does not programme; the second story covers the first of the three walls (merge conflicts) named in the course notes.

**Q21 Modes.** Click-through first, quizzes later?
Answer: two modes per story. "Zuschauen" plays every scene with "Weiter" and "Zurück" and no questions. "Mitmachen" asks a question on about every third scene and does not continue until it is answered. Reason: Lars's instruction, and the faded-example logic of round 3: the first pass is the worked example, the second pass hands over.

**Q22 Question types.** Which, and why not more?
Answer: "wahl" (three options, one right, shuffled; a wrong tap says so and the learner tries again, the first try counts) and "tipp" (tap the right commit in the graph; the graph itself is the answer sheet). Reason: both can be answered on a phone with one tap, and "tipp" uses the picture the game draws, which a plain quiz would not. A third type, choosing between two pictures of what the graph will look like next, is issue #13.

**Q23 Model and checks.** How does the page know what the graph looks like after scene 12?
Answer: `js/geschichte-modell.js` replays the actions of the scenes (commit, clone, branch, push, pr, review, konflikt, mergeIn, merge, pull) into a small repository model: commits with parents and lanes, branches with tips, pull requests with states, where main stands on each laptop. The page draws the model; `scripts/validate.mjs` replays every story with the same code and reports an unknown branch, a merge of an unpushed branch, a quiz target that does not exist yet, and the like.

**Q24 Place.** Same repository?
Answer: yes, as a second page with a landing page for both games (decision 0007).

## Round 6, 15 November 2026

After Lars played the story: a picture of the places (GitHub and the laptops) above the commit graph, labels beside their own lane, the people renamed to Kim and Robin, and a still mode for slides. Decision 0008.
