# 0003 The glossary copy is synced from the website

- Question: level 1 needs the course terms. Does the game keep its own list, reference the website at run time, or copy the website file?
- Options: an own list (drifts); a fetch from gitklar.ch at run time (a network call, and the website does not serve the file); a byte-identical copy refreshed by a script.
- Choice: `data/begriffe.yml` is a copy of `begriffe.yml` in `gitklar/website`, refreshed with `scripts/sync_begriffe.sh`, never edited in this repository. Level 1 derives its pairs from the copy at run time.
- Why: the glossary is maintained in one place, and the website is that place. A copy that only ever changes through the sync script cannot drift silently, and a check can compare the two files (issue #5).
- Consequences: a glossary change on the website reaches the game only after a sync and a commit here. The game depends on the fields `term`, `gruppe`, `kurz`, `bedeutung` and `befehl`; a rename on the website breaks level 1 and the validation reports it.
- Date: 2026-11-01
