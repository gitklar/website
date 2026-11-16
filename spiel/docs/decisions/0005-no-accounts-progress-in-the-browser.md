# 0005 Data protection: no accounts, progress in the browser only

- Question: does the game know who plays, and where does progress go?
- Options: accounts with a leaderboard; anonymous analytics; nothing beyond the browser.
- Choice: nothing beyond the browser. No accounts, no analytics, no scripts or fonts from outside the page. Rounds played and best results are stored in `localStorage` on the learner's device and can be cleared on the page.
- Why: the course handles participant data under the data protection note in `gitklar-dev/admin`; the game adds no data at all, which is the only setting that needs no note and no consent. A leaderboard would also work against the course's tone, which treats mistakes as the point of practice.
- Consequences: no instructor view of who practised; the post-course survey asks instead (issue #6). A workshop mode with a shared screen (issue #7) must keep this: answers on the phones, nothing collected.
- Date: 2026-11-01
