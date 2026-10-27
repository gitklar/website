# website

The course website of gitklar, the Git and GitHub course of bitz (Lars Schöbitz GmbH). Quarto, German, published with GitHub Pages at <https://gitklar.ch/>.

## One site, one snapshot per cohort

The shared pages under `vorbereitung/` are the manual. A cohort is a Quarto profile, `_quarto-<name>.yml`, with its label, sessions, due date and hosts, plus one line in the file `cohorts`. The Action renders the root into `_site/` and every cohort into `_site/<name>/`. An active cohort renders from `main`, so a fix reaches it. A frozen cohort renders from the git tag of the same name and never changes again. Nothing rendered is committed. The reasoning is decision 0001 in `gitklar-dev/admin`.

Cohort-specific text lives in three places only: the profile values (`{{< meta cohort.label >}}` and the like), blocks marked `when-profile="cohort"` on the front page, and the profile file itself. Shared pages are never edited for one cohort.

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

## Not yet

Screenshots. The pages describe the buttons by their English labels, as GitHub Desktop shows them.
