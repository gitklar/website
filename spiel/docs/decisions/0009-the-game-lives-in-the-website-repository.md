# 0009: The game lives in the website repository, with counts in Plausible

Date: 16 November 2026

## Decision

The practice games live in the folder `spiel/` of `gitklar/website` and are published with the website at gitklar.ch/spiel/. This is the one place to edit them. The repository `gitklar/spiel` is archived and stays private.

The pages load the Plausible script of the website and report four events: "Runde beendet" (with the level), "Geschichte Szene" (story, mode, scene number), and "Geschichte beendet" (story, mode). The events carry no personal data, and answers and progress still stay in the browser.

## Why

- gitklar.ch is attached to `gitklar/website`. A separate public repository with its own Pages would sit at another address.
- A copy in two places had to be carried over by hand after every change.
- Lars wants to see how much the games are used and how far people get. Sums are enough; who played is not recorded.

## Replaces

- 0001 (own repository in the course organisation).
- The part of 0002 and 0005 that rules out analytics. No accounts and progress in the browser only still hold.
- 0003 in one detail: the glossary source is `begriffe.yml` at the root of this repository, and `spiel/scripts/sync_begriffe.sh` copies it without an argument.
