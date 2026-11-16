/* gitklar üben: the game. One file, three levels, no framework.
 *
 * Data: data/begriffe.yml (the course glossary, a synced copy) and
 * data/uebungen.yml (the exercises). Both are parsed in the browser with the
 * vendored js-yaml. The field documentation sits at the top of each file.
 *
 * Progress: rounds played and best results per level in localStorage under
 * one key. Nothing leaves the browser (docs/decisions/0005).
 *
 * Every piece of text goes into the page through textContent, never through
 * innerHTML, so the data files cannot inject markup.
 */
(function () {
  "use strict";

  var STORE_KEY = "gitklar-spiel";
  var ROUND_PAIRS = 6;          // level 1: pairs per round
  var FADE_PLAN = [0, 1, 1, 2, 2, "alle"]; // level 2: blanks per item, in order
  var BANK_EXTRA = 3;           // level 2: distractor words per item
  var SHOW_SOLUTION_AFTER = 2;  // level 3: failed attempts before the solution is offered

  var data = { begriffe: [], uebungen: null };
  var state = {};               // the running round, exposed as window.spiel.state for checks

  /* ---------- small helpers ---------- */

  function $(id) { return document.getElementById(id); }

  // el("button", {class: "btn", onclick: fn}, "text", childNode, ...)
  function el(tag, attrs) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") throw new Error("innerHTML is not used");
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
      else node.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(arr, n) { return shuffle(arr).slice(0, n); }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // "`git branch`, `git switch`" -> "git branch, git switch"
  function plain(s) { return String(s || "").replace(/`/g, ""); }

  function unique(arr) {
    var seen = {};
    return arr.filter(function (x) { if (seen[x]) return false; seen[x] = true; return true; });
  }

  /* ---------- views ---------- */

  var views = { start: $("view-start"), level: $("view-level"), error: $("view-error") };

  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); });
    window.scrollTo(0, 0);
  }

  function setProgress(text) { $("progress").textContent = text || ""; }

  function setFeedback(kind, lines) {
    var box = $("feedback");
    clear(box);
    box.className = "feedback" + (kind ? " " + kind : "");
    if (!lines || !lines.length) { box.hidden = true; return; }
    lines.forEach(function (l) {
      if (typeof l === "string") box.appendChild(el("p", { text: l }));
      else box.appendChild(l);
    });
    box.hidden = false;
  }

  function setActions(buttons) {
    var box = $("actions");
    clear(box);
    (buttons || []).forEach(function (b) { box.appendChild(b); });
  }

  function btn(text, onclick, quiet, attrs) {
    var a = attrs || {};
    a.type = "button";
    a.class = "btn" + (quiet ? " btn-leise" : "");
    a.onclick = onclick;
    a.text = text;
    return el("button", a);
  }

  /* ---------- progress storage ---------- */

  function loadProgress() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveProgress(p) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* private window, nothing to do */ }
  }

  function updateProgress(fn) {
    var p = loadProgress();
    fn(p);
    saveProgress(p);
  }

  function resetProgress() {
    if (!window.confirm("Fortschritt in diesem Browser löschen?")) return;
    try { window.localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    renderStart();
  }

  /* ---------- glossary access ---------- */

  function begriff(term) {
    for (var i = 0; i < data.begriffe.length; i++) if (data.begriffe[i].term === term) return data.begriffe[i];
    return null;
  }

  /* ---------- start view ---------- */

  var LEVELS = [
    { id: "zuordnen", nummer: "Stufe 1", titel: "Zuordnen",
      kurz: "Begriffe und ihre Bedeutung, Befehle und ihre Begriffe. Sechs Paare pro Runde.",
      stand: function (p) {
        var s = p.zuordnen; if (!s || !s.runden) return "Noch keine Runde.";
        return s.runden + (s.runden === 1 ? " Runde" : " Runden") + ", Bestwert " + s.best + (s.best === 1 ? " Fehlversuch" : " Fehlversuche") + ".";
      },
      start: startZuordnen },
    { id: "luecken", nummer: "Stufe 2", titel: "Lückentext",
      kurz: "Befehle Wort für Wort ergänzen. Erst mit Vorlage, dann mit Lücken, am Ende ohne.",
      stand: function (p) {
        var s = p.luecken; if (!s || !s.runden) return "Noch keine Runde.";
        return s.runden + (s.runden === 1 ? " Runde" : " Runden") + ", Bestwert " + s.best + " von " + (FADE_PLAN.length - 1) + ".";
      },
      start: startLuecken },
    { id: "reihenfolge", nummer: "Stufe 3", titel: "Reihenfolge",
      kurz: "Die Schritte eines Ablaufs in die richtige Reihenfolge bringen.",
      stand: function (p) {
        var s = p.reihenfolge; var n = data.uebungen.reihenfolgen.length;
        var g = s && s.geloest ? Object.keys(s.geloest).length : 0;
        return g + " von " + n + (n === 1 ? " Ablauf" : " Abläufen") + " gelöst.";
      },
      start: startReihenfolge }
  ];

  function renderStart() {
    var p = loadProgress();
    var box = $("stufen");
    clear(box);
    LEVELS.forEach(function (L) {
      box.appendChild(el("button", { class: "stufe", type: "button", onclick: function () { startLevel(L.id); } },
        el("span", { class: "nummer", text: L.nummer }),
        el("h2", { text: L.titel }),
        el("p", { text: L.kurz }),
        el("span", { class: "stand", text: L.stand(p) })));
    });
    show("start");
  }

  function startLevel(id) {
    var L = LEVELS.filter(function (x) { return x.id === id; })[0];
    if (!L) return;
    $("level-title").textContent = L.titel;
    $("level-intro").textContent = "";
    clear($("stage"));
    setFeedback(null, []);
    setActions([]);
    setProgress("");
    show("level");
    L.start();
  }

  function endOfRound(againLabel, again) {
    setActions([btn(againLabel || "Noch eine Runde", again), btn("Zur Übersicht", renderStart, true)]);
  }

  /* ---------- level 1: Zuordnen (matching) ---------- */

  function startZuordnen() {
    var mode = pick(data.uebungen.zuordnen);
    var pool = data.begriffe.filter(function (b) {
      if (mode.nur_mit && !b[mode.nur_mit]) return false;
      return b[mode.links] && b[mode.rechts];
    });
    if (mode.je_gruppe) {
      var groups = {};
      pool.forEach(function (b) { (groups[b.gruppe] = groups[b.gruppe] || []).push(b); });
      var big = Object.keys(groups).filter(function (g) { return groups[g].length >= ROUND_PAIRS; });
      var g = big.length ? pick(big) : null;
      if (g) pool = groups[g];
    }
    var chosen = sample(pool, Math.min(ROUND_PAIRS, pool.length));
    var pairs = chosen.map(function (b, i) {
      return { id: "p" + i, left: plain(b[mode.links]), right: plain(b[mode.rechts]), term: b.term };
    });

    state = { level: "zuordnen", mode: mode.id, pairs: pairs, selected: { left: null, right: null }, done: {}, fehler: 0, finished: false };

    $("level-intro").textContent = mode.titel + ". Tippe links auf einen Eintrag und rechts auf den, der dazu passt.";
    var stage = $("stage");
    clear(stage);
    var grid = el("div", { class: "paare" });
    var colL = el("div", { class: "spalte" }, el("h2", { text: labelFor(mode.links) }));
    var colR = el("div", { class: "spalte" }, el("h2", { text: labelFor(mode.rechts) }));
    pairs.forEach(function (p) { colL.appendChild(pairButton(p, "left", mode.links === "befehl")); });
    shuffle(pairs).forEach(function (p) { colR.appendChild(pairButton(p, "right", mode.rechts === "befehl")); });
    grid.appendChild(colL); grid.appendChild(colR);
    stage.appendChild(grid);
    updateZuordnenProgress();
    setActions([]);
  }

  function labelFor(field) {
    return { term: "Begriff", kurz: "Bedeutung", befehl: "Befehl im Terminal", wo: "Wo auf dem Bildschirm" }[field] || field;
  }

  function pairButton(p, side, mono) {
    var text = side === "left" ? p.left : p.right;
    var b = el("button", { class: "paar" + (mono ? " mono" : ""), type: "button", "aria-pressed": "false",
      dataset: { id: p.id, side: side }, onclick: function () { tapPair(b); } }, text);
    return b;
  }

  function tapPair(node) {
    if (state.finished || node.classList.contains("ok")) return;
    var side = node.dataset.side, id = node.dataset.id;
    var col = node.parentNode;
    Array.prototype.forEach.call(col.querySelectorAll(".paar"), function (x) { x.setAttribute("aria-pressed", "false"); });
    if (state.selected[side] === id) { state.selected[side] = null; return; }
    state.selected[side] = id;
    node.setAttribute("aria-pressed", "true");
    if (state.selected.left && state.selected.right) {
      var l = $("stage").querySelector('.paar[data-side="left"][data-id="' + state.selected.left + '"]');
      var r = $("stage").querySelector('.paar[data-side="right"][data-id="' + state.selected.right + '"]');
      if (state.selected.left === state.selected.right) {
        [l, r].forEach(function (x) { x.classList.add("ok"); x.setAttribute("aria-pressed", "false"); x.disabled = true; });
        state.done[id] = true;
      } else {
        state.fehler++;
        [l, r].forEach(function (x) { x.classList.add("bad"); x.setAttribute("aria-pressed", "false"); });
        window.setTimeout(function () { [l, r].forEach(function (x) { x.classList.remove("bad"); }); }, 700);
      }
      state.selected = { left: null, right: null };
      updateZuordnenProgress();
    }
  }

  function updateZuordnenProgress() {
    var n = Object.keys(state.done).length, total = state.pairs.length;
    setProgress(n + " von " + total + " Paaren");
    if (n === total && !state.finished) {
      state.finished = true;
      var f = state.fehler;
      updateProgress(function (p) {
        p.zuordnen = p.zuordnen || { runden: 0, best: null };
        p.zuordnen.runden++;
        p.zuordnen.best = (p.zuordnen.best === null || f < p.zuordnen.best) ? f : p.zuordnen.best;
      });
      setFeedback("ok", ["Alle " + total + " Paare gefunden" + (f === 0 ? ", ohne Fehlversuch." : ", mit " + f + (f === 1 ? " Fehlversuch." : " Fehlversuchen."))]);
      endOfRound("Noch eine Runde", startZuordnen);
    }
  }

  /* ---------- level 2: Lückentext (faded examples) ---------- */

  function blankable(item) {
    var fest = item.fest || [];
    var idx = [];
    for (var i = 1; i < item.befehl.length; i++) if (fest.indexOf(i) < 0) idx.push(i);
    return idx;
  }

  function startLuecken() {
    var pool = shuffle(data.uebungen.luecken);
    var used = {};
    var items = FADE_PLAN.map(function (blanks) {
      var need = blanks === "alle" ? 1 : blanks;
      var cand = pool.filter(function (it) { return !used[it.id] && blankable(it).length >= need; });
      if (!cand.length) cand = pool.filter(function (it) { return !used[it.id]; });
      var it = cand[0];
      used[it.id] = true;
      var b = blankable(it);
      var blankIdx = blanks === "alle" ? b : blanks === 0 ? [] : sample(b, blanks);
      return { item: it, blanks: blankIdx.sort(function (a, c) { return a - c; }) };
    });
    state = { level: "luecken", items: items, pos: 0, richtig: 0, finished: false };
    $("level-intro").textContent = "Jeder Befehl gehört zu einer Aufgabe. Zuerst siehst du ihn ganz, dann fehlen Wörter. Tippe die Wörter aus der Auswahl in die Lücken.";
    renderLuecke();
  }

  function renderLuecke() {
    var cur = state.items[state.pos];
    var item = cur.item;
    var stage = $("stage");
    clear(stage);
    setFeedback(null, []);
    setProgress("Befehl " + (state.pos + 1) + " von " + state.items.length);

    stage.appendChild(el("p", { class: "aufgabe", text: item.aufgabe }));
    var line = el("div", { class: "befehl-zeile", "aria-label": "Befehl" }, el("span", { class: "prompt", text: "$" }));
    var slots = [];
    item.befehl.forEach(function (tok, i) {
      if (cur.blanks.indexOf(i) < 0) {
        line.appendChild(el("code", { class: "wort fest", text: tok }));
      } else {
        var s = el("button", { class: "slot", type: "button", dataset: { index: i }, "aria-label": "Lücke " + (slots.length + 1),
          onclick: function () { emptySlot(s); } });
        slots.push(s);
        line.appendChild(s);
      }
    });
    stage.appendChild(line);
    state.slots = slots;
    state.checked = false;

    if (!slots.length) {
      // the worked example: read, then continue
      stage.appendChild(explanation(item));
      setActions([btn("Weiter", nextLuecke)]);
      return;
    }

    var correct = cur.blanks.map(function (i) { return item.befehl[i]; });
    var others = [];
    data.uebungen.luecken.forEach(function (it) {
      if (it.id === item.id) return;
      blankable(it).forEach(function (i) { others.push(it.befehl[i]); });
    });
    others = others.concat(data.uebungen.ablenker_woerter || []);
    others = unique(others.filter(function (w) { return correct.indexOf(w) < 0; }));
    var words = shuffle(correct.concat(sample(others, BANK_EXTRA)));
    var bank = el("div", { class: "bank", "aria-label": "Wortauswahl" });
    words.forEach(function (w) {
      var b = el("button", { class: "wort", type: "button", dataset: { word: w }, onclick: function () { useWord(b); } }, w);
      bank.appendChild(b);
    });
    stage.appendChild(el("div", { class: "bereich" }, el("h2", { text: "Wortauswahl" }), bank));
    state.bank = bank;
    state.checkBtn = btn("Prüfen", checkLuecke, false, { disabled: true });
    setActions([state.checkBtn]);
  }

  function useWord(wordBtn) {
    if (state.checked) return;
    var empty = state.slots.filter(function (s) { return !s.dataset.word; })[0];
    if (!empty) return;
    empty.dataset.word = wordBtn.dataset.word;
    empty.textContent = wordBtn.dataset.word;
    empty.classList.add("gefuellt");
    wordBtn.disabled = true;
    state.checkBtn.disabled = state.slots.some(function (s) { return !s.dataset.word; });
  }

  function emptySlot(slot) {
    if (state.checked || !slot.dataset.word) return;
    var w = slot.dataset.word;
    var b = Array.prototype.filter.call(state.bank.querySelectorAll(".wort"), function (x) { return x.dataset.word === w && x.disabled; })[0];
    if (b) b.disabled = false;
    delete slot.dataset.word;
    slot.textContent = "";
    slot.classList.remove("gefuellt");
    state.checkBtn.disabled = true;
  }

  function checkLuecke() {
    var cur = state.items[state.pos], item = cur.item;
    state.checked = true;
    var allRight = true;
    state.slots.forEach(function (s) {
      var want = item.befehl[Number(s.dataset.index)];
      if (s.dataset.word === want) { s.classList.add("ok"); }
      else {
        allRight = false;
        s.classList.add("bad");
        clear(s);
        s.appendChild(el("span", { class: "falsch", text: s.dataset.word }));
        s.appendChild(document.createTextNode(want));
      }
    });
    Array.prototype.forEach.call(state.bank.querySelectorAll(".wort"), function (x) { x.disabled = true; });
    if (allRight) state.richtig++;
    var full = item.befehl.join(" ");
    setFeedback(allRight ? "ok" : "bad", [
      allRight ? "Richtig." : "Nicht ganz. So heisst der Befehl:",
      el("p", {}, el("code", { text: "$ " + full })),
      explanation(item)
    ]);
    setActions([btn("Weiter", nextLuecke)]);
  }

  function explanation(item) {
    var b = item.begriff ? begriff(item.begriff) : null;
    var box = el("div", { class: "erklaerung" });
    if (b) box.appendChild(el("p", {}, el("span", { class: "begriff", text: b.term + ": " }), b.bedeutung || b.kurz));
    if (item.hinweis) box.appendChild(el("p", { class: "klein", text: item.hinweis }));
    return box;
  }

  function nextLuecke() {
    state.pos++;
    if (state.pos < state.items.length) { renderLuecke(); return; }
    var total = state.items.length - 1; // the worked example does not count
    var r = state.richtig;
    state.finished = true;
    updateProgress(function (p) {
      p.luecken = p.luecken || { runden: 0, best: 0 };
      p.luecken.runden++;
      if (r > p.luecken.best) p.luecken.best = r;
    });
    clear($("stage"));
    setProgress("");
    setFeedback("ok", [r + " von " + total + " Befehlen beim ersten Versuch richtig."]);
    endOfRound("Noch eine Runde", startLuecken);
  }

  /* ---------- level 3: Reihenfolge (Parsons problems) ---------- */

  function startReihenfolge() {
    var p = loadProgress();
    var solved = (p.reihenfolge && p.reihenfolge.geloest) || {};
    state = { level: "reihenfolge", finished: false };
    $("level-intro").textContent = "Wähle einen Ablauf. Du bekommst seine Schritte durcheinander, dazu ein oder zwei Karten, die nicht dazugehören.";
    var stage = $("stage");
    clear(stage);
    var list = el("div", { class: "ablaeufe" });
    data.uebungen.reihenfolgen.forEach(function (r) {
      var done = solved[r.id];
      list.appendChild(el("button", { class: "ablauf", type: "button", onclick: function () { startAblauf(r); } },
        el("span", {}, el("strong", { text: r.titel }), el("span", { class: "klein", text: " " + r.schritte.length + " Schritte" })),
        el("span", { class: "badge" + (done ? " ok" : ""), text: done ? (done.versuche === null ? "mit Lösung" : "gelöst") : r.stufe })));
    });
    stage.appendChild(list);
    setProgress("");
    setActions([]);
  }

  function startAblauf(r) {
    var cards = r.schritte.map(function (s, i) { return { text: s.text, befehl: s.befehl || "", pos: i }; })
      .concat((r.ablenker || []).map(function (a) { return { text: a.text, befehl: "", pos: -1 }; }));
    state = { level: "reihenfolge", ablauf: r, versuche: 0, finished: false };
    $("level-intro").textContent = r.einleitung;
    setProgress(r.titel);
    var stage = $("stage");
    clear(stage);
    var loesung = el("ol", { class: "loesung", "aria-label": "Deine Reihenfolge" });
    var leer = el("li", { class: "leer", text: "Tippe unten auf die Karten, in der Reihenfolge, die du für richtig hältst. Ein Tipp auf eine Karte hier oben legt sie zurück." });
    loesung.appendChild(leer);
    var vorrat = el("ul", { class: "vorrat", "aria-label": "Karten" });
    shuffle(cards).forEach(function (c) {
      var li = el("li", {}, el("button", { class: "karte", type: "button", dataset: { pos: c.pos, befehl: c.befehl }, onclick: function (e) { moveCard(e.currentTarget.parentNode); } }, c.text));
      vorrat.appendChild(li);
    });
    stage.appendChild(el("div", { class: "bereich" }, el("h2", { text: "Deine Reihenfolge" }), loesung));
    stage.appendChild(el("div", { class: "bereich" }, el("h2", { text: "Karten" }), vorrat));
    state.loesung = loesung; state.vorrat = vorrat; state.leer = leer;
    state.checkBtn = btn("Prüfen", checkAblauf, false, { disabled: true });
    setActions([state.checkBtn, btn("Anderer Ablauf", startReihenfolge, true)]);
  }

  function moveCard(li) {
    if (state.finished) return;
    var card = li.querySelector(".karte");
    card.classList.remove("ok", "bad");
    var mark = card.querySelector(".marke-klein"); if (mark) mark.remove();
    if (li.parentNode === state.vorrat) state.loesung.appendChild(li); else state.vorrat.appendChild(li);
    var n = state.loesung.querySelectorAll(".karte").length;
    state.leer.hidden = n > 0;
    state.checkBtn.disabled = n === 0;
    setFeedback(null, []);
  }

  function checkAblauf() {
    var r = state.ablauf;
    state.versuche++;
    var cards = Array.prototype.slice.call(state.loesung.querySelectorAll(".karte"));
    var right = 0, distractors = 0;
    cards.forEach(function (c, i) {
      var pos = Number(c.dataset.pos);
      if (pos === -1) { c.classList.add("bad"); c.appendChild(el("span", { class: "marke-klein", text: "gehört nicht dazu" })); distractors++; }
      else if (pos === i) { c.classList.add("ok"); right++; }
      else c.classList.add("bad");
    });
    var total = r.schritte.length;
    if (right === total && cards.length === total) {
      finishAblauf(state.versuche);
      return;
    }
    var lines = [];
    var missing = total - (cards.length - distractors);
    lines.push(right + " von " + total + " Schritten " + (right === 1 ? "sitzt" : "sitzen") + ". Die roten Karten stimmen noch nicht.");
    if (missing > 0) lines.push("Es " + (missing === 1 ? "fehlt noch ein Schritt." : "fehlen noch " + missing + " Schritte."));
    if (distractors > 0) lines.push(distractors === 1 ? "Eine Karte gehört nicht in den Ablauf." : distractors + " Karten gehören nicht in den Ablauf.");
    setFeedback("bad", lines);
    var actions = [state.checkBtn, btn("Anderer Ablauf", startReihenfolge, true)];
    if (state.versuche >= SHOW_SOLUTION_AFTER) actions.splice(1, 0, btn("Lösung zeigen", showSolution, true));
    setActions(actions);
  }

  function showSolution() {
    var r = state.ablauf;
    var all = Array.prototype.slice.call($("stage").querySelectorAll("li")).filter(function (li) { return li.querySelector(".karte"); });
    var byPos = {};
    all.forEach(function (li) {
      var c = li.querySelector(".karte");
      c.classList.remove("ok", "bad");
      var mark = c.querySelector(".marke-klein"); if (mark) mark.remove();
      var pos = Number(c.dataset.pos);
      if (pos === -1) state.vorrat.appendChild(li); else byPos[pos] = li;
    });
    for (var i = 0; i < r.schritte.length; i++) { state.loesung.appendChild(byPos[i]); byPos[i].querySelector(".karte").classList.add("ok"); }
    state.leer.hidden = true;
    finishAblauf(null);
    setFeedback("info", ["Das ist die Lösung. Lies sie einmal durch, dann versuch es ein anderes Mal ohne Hilfe."].concat(befehleListe(r)));
  }

  function finishAblauf(versuche) {
    var r = state.ablauf;
    state.finished = true;
    updateProgress(function (p) {
      p.reihenfolge = p.reihenfolge || { geloest: {} };
      var prev = p.reihenfolge.geloest[r.id];
      if (versuche !== null && (!prev || prev.versuche === null || versuche < prev.versuche)) p.reihenfolge.geloest[r.id] = { versuche: versuche };
      else if (!prev) p.reihenfolge.geloest[r.id] = { versuche: null };
    });
    if (versuche !== null) {
      setFeedback("ok", ["Richtig, " + (versuche === 1 ? "beim ersten Versuch." : "nach " + versuche + " Versuchen.")].concat(befehleListe(r)));
    }
    setActions([btn("Anderer Ablauf", startReihenfolge), btn("Zur Übersicht", renderStart, true)]);
  }

  function befehleListe(r) {
    var ol = el("ol", { class: "befehle" });
    r.schritte.forEach(function (s) {
      ol.appendChild(el("li", {}, s.befehl ? el("code", { text: s.befehl }) : el("span", { class: "klein", text: "kein Befehl, das passiert in der Datei oder im Browser" })));
    });
    return [el("p", { text: "Im Terminal wäre das:" }), ol];
  }

  /* ---------- start ---------- */

  function fetchYaml(path) {
    return window.fetch(path, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(path + ": HTTP " + res.status);
      return res.text();
    }).then(function (txt) { return window.jsyaml.load(txt); });
  }

  function init() {
    $("btn-reset").addEventListener("click", resetProgress);
    $("btn-back").addEventListener("click", renderStart);
    Promise.all([fetchYaml("data/begriffe.yml"), fetchYaml("data/uebungen.yml")]).then(function (res) {
      data.begriffe = (res[0] && res[0].begriffe) || [];
      data.uebungen = res[1];
      if (!data.begriffe.length || !data.uebungen || !data.uebungen.luecken) throw new Error("Datendateien unvollständig");
      renderStart();
    }).catch(function (e) {
      $("error-detail").textContent = String(e && e.message || e);
      show("error");
    });
  }

  window.spiel = { data: data, get state() { return state; }, startLevel: startLevel, renderStart: renderStart };
  init();
})();
