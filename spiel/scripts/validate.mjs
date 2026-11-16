// Data check for the gitklar game. Loads data/begriffe.yml and
// data/uebungen.yml with the same parser the page uses (js/vendor/js-yaml)
// and reports structural problems. Exit code 1 on any error.
//
//   node scripts/validate.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const yaml = require(join(root, "js/vendor/js-yaml.min.js"));

const errors = [];
const warn = [];
const fail = (msg) => errors.push(msg);

function load(rel) {
  try {
    return yaml.load(readFileSync(join(root, rel), "utf8"));
  } catch (e) {
    fail(`${rel}: cannot parse (${e.message})`);
    return null;
  }
}

const glossar = load("data/begriffe.yml");
const uebungen = load("data/uebungen.yml");
const geschichten = load("data/geschichte.yml");
const GitModell = require(join(root, "js/geschichte-modell.js"));

const terms = new Map();
if (glossar && Array.isArray(glossar.begriffe)) {
  glossar.begriffe.forEach((b, i) => {
    for (const f of ["term", "gruppe", "kurz", "bedeutung"]) {
      if (!b || typeof b[f] !== "string" || !b[f].trim()) fail(`begriffe[${i}]: missing field ${f}`);
    }
    if (b && b.term) {
      if (terms.has(b.term)) fail(`begriffe: duplicate term ${b.term}`);
      terms.set(b.term, b);
    }
  });
  const withBefehl = glossar.begriffe.filter((b) => b && b.befehl).length;
  if (withBefehl < 6) fail(`begriffe: only ${withBefehl} entries with a befehl, level 1 mode befehl needs at least 6`);
} else {
  fail("data/begriffe.yml: no list `begriffe`");
}

if (uebungen) {
  // zuordnen
  if (!Array.isArray(uebungen.zuordnen) || uebungen.zuordnen.length === 0) fail("uebungen: no `zuordnen` modes");
  else uebungen.zuordnen.forEach((m, i) => {
    for (const f of ["id", "titel", "links", "rechts"]) if (!m[f]) fail(`zuordnen[${i}]: missing ${f}`);
    for (const f of ["links", "rechts", "nur_mit"]) {
      if (m[f] && !["term", "kurz", "befehl", "wo", "gruppe"].includes(m[f])) fail(`zuordnen[${i}]: ${f} names unknown field ${m[f]}`);
    }
  });

  // luecken
  if (!Array.isArray(uebungen.luecken) || uebungen.luecken.length < 6) fail("uebungen: `luecken` needs at least 6 items for one round");
  else {
    const ids = new Set();
    let twoBlankable = 0;
    uebungen.luecken.forEach((it, i) => {
      const where = `luecken[${i}] (${it.id || "?"})`;
      if (!it.id) fail(`${where}: missing id`);
      if (ids.has(it.id)) fail(`${where}: duplicate id`);
      ids.add(it.id);
      if (!it.aufgabe) fail(`${where}: missing aufgabe`);
      if (!Array.isArray(it.befehl) || it.befehl.length < 2) fail(`${where}: befehl must be a list of at least two words`);
      else {
        if (it.befehl[0] !== "git") fail(`${where}: befehl must start with git`);
        const fest = Array.isArray(it.fest) ? it.fest : [];
        fest.forEach((k) => { if (!Number.isInteger(k) || k < 1 || k >= it.befehl.length) fail(`${where}: fest index ${k} out of range`); });
        const blankable = it.befehl.length - 1 - fest.length;
        if (blankable < 1) fail(`${where}: no word left to blank`);
        if (blankable >= 2) twoBlankable++;
      }
      if (it.begriff && terms.size && !terms.has(it.begriff)) fail(`${where}: begriff ${it.begriff} not in begriffe.yml`);
      if (!it.begriff) warn.push(`${where}: no begriff, the round shows no explanation`);
    });
    if (twoBlankable < 2) fail("luecken: the faded round needs at least two items with two blankable words");
  }
  if (!Array.isArray(uebungen.ablenker_woerter) || uebungen.ablenker_woerter.length < 4) fail("uebungen: `ablenker_woerter` needs at least 4 words");

  // reihenfolgen
  if (!Array.isArray(uebungen.reihenfolgen) || uebungen.reihenfolgen.length === 0) fail("uebungen: no `reihenfolgen`");
  else uebungen.reihenfolgen.forEach((r, i) => {
    const where = `reihenfolgen[${i}] (${r.id || "?"})`;
    for (const f of ["id", "titel", "stufe", "einleitung"]) if (!r[f]) fail(`${where}: missing ${f}`);
    if (r.stufe && !["leicht", "mittel", "schwer"].includes(r.stufe)) fail(`${where}: stufe must be leicht, mittel or schwer`);
    if (!Array.isArray(r.schritte) || r.schritte.length < 3) fail(`${where}: needs at least 3 schritte`);
    else {
      const texts = new Set();
      r.schritte.forEach((s, k) => {
        if (!s || !s.text) fail(`${where}: schritte[${k}] has no text`);
        else if (texts.has(s.text)) fail(`${where}: step text repeated: ${s.text}`);
        else texts.add(s.text);
      });
      (r.ablenker || []).forEach((a, k) => {
        if (!a || !a.text) fail(`${where}: ablenker[${k}] has no text`);
        else if (texts.has(a.text)) fail(`${where}: distractor repeats a step: ${a.text}`);
      });
      const n = (r.ablenker || []).length;
      const said = /Zwei Karten/.test(r.einleitung || "") ? 2 : /Eine Karte/.test(r.einleitung || "") ? 1 : null;
      if (said !== null && said !== n) fail(`${where}: einleitung announces ${said} distractor(s), data has ${n}`);
    }
  });
}

// geschichte.yml: replay every story with the page's own model
let storyCount = 0;
if (geschichten) {
  if (!Array.isArray(geschichten.geschichten) || !geschichten.geschichten.length) fail("geschichte.yml: no list `geschichten`");
  else {
    const ids = new Set();
    geschichten.geschichten.forEach((g, i) => {
      const where = `geschichten[${i}] (${g.id || "?"})`;
      for (const f of ["id", "titel", "kurz"]) if (!g[f]) fail(`${where}: missing ${f}`);
      if (ids.has(g.id)) fail(`${where}: duplicate id`); ids.add(g.id);
      if (!Array.isArray(g.modi) || !g.modi.length) fail(`${where}: modi missing`);
      else g.modi.forEach((mo) => { if (!["zuschauen", "mitmachen"].includes(mo)) fail(`${where}: unknown mode ${mo}`); });
      if (!Array.isArray(g.personen) || g.personen.length < 1) fail(`${where}: personen missing`);
      else g.personen.forEach((p, k) => { if (!p.kuerzel || p.kuerzel.length !== 1 || !p.name || !/^#[0-9a-f]{6}$/i.test(p.farbe || "")) fail(`${where}: personen[${k}] needs kuerzel (one letter), name, farbe (#rrggbb)`); });
      if (!Array.isArray(g.szenen) || g.szenen.length < 2) fail(`${where}: needs at least two szenen`);
      else {
        GitModell.pruefen(g).forEach((e) => fail(`${where}: ${e}`));
        const quizzes = g.szenen.filter((s) => s.frage).length;
        if ((g.modi || []).includes("mitmachen") && quizzes < 1) fail(`${where}: mode mitmachen needs at least one frage`);
        g.szenen.forEach((s, k) => {
          if (s.zeigt) for (const key of Object.keys(s.zeigt)) if (!["desktop", "terminal", "github"].includes(key)) fail(`${where}: Szene ${k + 1}: zeigt has unknown key ${key}`);
        });
      }
      storyCount++;
    });
  }
}

for (const w of warn) console.log("warning:", w);
if (errors.length) {
  for (const e of errors) console.error("error:", e);
  console.error(`${errors.length} error(s)`);
  process.exit(1);
}
console.log(`ok: ${terms.size} terms, ${uebungen.luecken.length} commands, ${uebungen.reihenfolgen.length} workflows, ${uebungen.zuordnen.length} matching modes, ${storyCount} stories`);
