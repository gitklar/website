# 0002 A static page with a vendored YAML parser and no network calls

- Question: how is the game built and what does the page load?
- Options: a Quarto project with an embedded widget; a JavaScript framework with a build step; one static page with plain HTML, CSS and JavaScript.
- Choice: one static page, no build step. The exercise data is YAML, parsed in the browser by js-yaml 4.1.0, vendored into `js/vendor/` with its MIT licence; the file's hash was checked against cdnjs on 1 November 2026. The page loads nothing from outside its own files.
- Why: the game is one page with three interactions; a toolchain would be the largest part of the repository. YAML keeps the exercise data in the format Lars already edits on the website. Vendoring the parser keeps the page offline-capable and free of third party requests, which 0005 needs.
- Consequences: `python3 -m http.server` is enough to run it; the page needs a web server because it fetches its data. A later framework migration would keep the data files unchanged.
- Date: 2026-11-01
