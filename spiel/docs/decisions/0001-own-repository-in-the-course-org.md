# 0001 Own repository in the organisation gitklar

- Question: does the game live inside `gitklar/website` as a page, or in a repository of its own, and in which organisation?
- Options: a page in the website (one repository, one deploy); its own repository in gitklar-dev (where development work lives); its own repository in gitklar (where the course lives).
- Choice: its own repository, `gitklar/spiel`.
- Why: the website is one site with a frozen snapshot per cohort (admin decision 0001). The game is the same for every cohort and must not be frozen with one; a separate repository keeps the website's render and its snapshots untouched. It belongs in gitklar rather than gitklar-dev because participants use it directly, like the website, and its Pages address carries the course name.
- Consequences: `spiel` is added to `org_repos` in the cohort config of `gitklar-dev/admin`, so the readiness report ignores it. The website links to the game under "Üben" once the repository is public (issue #4). The glossary is copied, not shared (0003).
- Date: 2026-11-01
