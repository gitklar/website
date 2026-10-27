# gitklar.github.io

The course website of gitklar, the Git and GitHub course of bitz (Lars Schöbitz GmbH). Quarto, German, published with GitHub Pages at <https://gitklar.github.io/>.

## One site, one snapshot per cohort

The shared pages under `vorbereitung/` are the manual. A cohort is a Quarto profile, `_quarto-<name>.yml`, with its label, sessions, due date and hosts, plus one line in the file `cohorts`. The Action renders the root into `_site/` and every cohort into `_site/<name>/`. An active cohort renders from `main`, so a fix reaches it. A frozen cohort renders from the git tag of the same name and never changes again. Nothing rendered is committed. The reasoning is decision 0001 in `gitklar-dev/admin`.

Cohort-specific text lives in three places only: the profile values (`{{< meta cohort.label >}}` and the like), blocks marked `when-profile="cohort"` on the front page, and the profile file itself. Shared pages are never edited for one cohort.

## Render locally

```
quarto render                                      # root
quarto render --profile cohort,2026-11-airetreat   # one cohort
```

Open `_site/index.html` and `_site/2026-11-airetreat/index.html`.

## Add a cohort

1. Copy `_quarto-2026-11-airetreat.yml` to `_quarto-<name>.yml` and fill in the values.
2. Add the line `<name> active` to `cohorts`.
3. Open the pull request from `dev` into `main`. The merge publishes it.
4. Put `https://gitklar.github.io/<name>/` into the cohort config of `gitklar-dev/admin`.

## Freeze a cohort

After the last workshop: `git tag <name>` on the commit the cohort last saw, push the tag, change its line in `cohorts` to `frozen`, merge. The pages stay as they were.

## Not yet

Screenshots. The pages describe the buttons by their English labels, as GitHub Desktop shows them.
