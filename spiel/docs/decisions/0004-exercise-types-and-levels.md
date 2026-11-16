# 0004 Exercise types and the three levels of the first version

- Question: which exercise types does the game use, and how many in the first version?
- Options: a quiz with multiple choice; typing commands into a fake terminal; matching, faded examples and Parsons problems as the voice note proposed; all of these.
- Choice: three levels in the first version. Zuordnen (matching term to meaning, command to term), Lückentext (faded examples: a worked command first, then one blank, two blanks, then every word but `git`, filled from a word bank), Reihenfolge (Parsons problems: the steps of a workflow as shuffled cards, with one or two distractors). A fourth level, "Drei Wege" (GitHub Desktop button, terminal command, sentence to Claude Code for the same intent), is issue #3. No typing, no fake terminal.
- Why: *Teaching Tech Together*, chapter 4 (cognitive load): Parsons problems let novices concentrate on the order of steps without recalling syntax; faded examples introduce the solution piece by piece. Most participants of the first cohort have never programmed or used Git, so recognition and ordering come before typing. The workshop itself holds the typing (one commit by command in workshop 1).
- Consequences: every exercise is data in `data/uebungen.yml`; new items need no code. Tap is the only interaction (phones, desktops, keyboards alike). Scores are the simplest counts of each interaction: wrong taps, items right at the first check, attempts.
- Date: 2026-11-01
