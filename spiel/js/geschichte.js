/* gitklar üben, the story game: two people, one repository.
 *
 * The scenes of data/geschichte.yml are played one by one. For every scene
 * the model (js/geschichte-modell.js) is rebuilt from the actions so far and
 * drawn as an SVG commit graph: time runs downwards, main is the middle
 * lane, a branch is a lane to the left or right. A commit that is not on
 * GitHub yet is dashed. The label of a commit stands beside its own lane:
 * to the left for the left lane, to the right otherwise. Above the graph the
 * picture of the places shows GitHub and each person's laptop as boxes with
 * the commits each of them holds, and an arrow for a clone, push or pull of
 * the current scene. In the mode "mitmachen" a scene can carry a question
 * that has to be answered before the story continues.
 *
 * Address parameters, for stills in slides: g (story id), szene (number from
 * 1), modus, bild=1 (pictures only), teil=orte or teil=graph (one picture).
 *
 * Progress per story and mode lives in localStorage only (decision 0005).
 * All text enters the page through textContent, never through innerHTML.
 */
(function () {
  "use strict";

  var STORE_KEY = "gitklar-geschichte";
  var M = window.GitModell;
  var SVG = "http://www.w3.org/2000/svg";
  var LANE_X = { "-1": 196, "0": 264, "1": 332 };
  var LABEL_X = 364, LABEL_LINKS_X = 168, LABEL_MAX = 24, ROW = 56, TOP = 54, R = 15, WIDTH = 540, MAIN_FARBE = "#3fb618", GITHUB_FARBE = "#24292f";
  var ORT_B = 140, ORT_ABSTAND = 40, ORT_TOP = 26, ORT_ROW = 16, ORT_SPUR = 24, ORT_R = 5.5;
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var data = null;
  var state = {};

  /* ---------- helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
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

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG, tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") node.textContent = v;
      else if (k === "class") node.setAttribute("class", v);
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) node.appendChild(arguments[i]);
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function btn(text, onclick, quiet, attrs) {
    var a = attrs || {};
    a.type = "button"; a.class = "btn" + (quiet ? " btn-leise" : ""); a.onclick = onclick; a.text = text;
    return el("button", a);
  }

  var views = { start: $("view-start"), spiel: $("view-spiel"), error: $("view-error") };
  function show(name) { Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); }); window.scrollTo(0, 0); }

  function setFeedback(kind, lines) {
    var box = $("feedback"); clear(box);
    box.className = "feedback" + (kind ? " " + kind : "");
    if (!lines || !lines.length) { box.hidden = true; return; }
    lines.forEach(function (l) { box.appendChild(typeof l === "string" ? el("p", { text: l }) : l); });
    box.hidden = false;
  }

  function setActions(buttons) { var box = $("actions"); clear(box); buttons.forEach(function (b) { box.appendChild(b); }); }

  /* ---------- storage ---------- */

  function loadProgress() { try { var raw = window.localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } }
  function saveProgress(p) { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } }
  function resetProgress() {
    if (!window.confirm("Fortschritt in diesem Browser löschen?")) return;
    try { window.localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    renderStart();
  }

  /* ---------- people and colours ---------- */

  function person(k) { return (state.geschichte && state.geschichte.personen.filter(function (p) { return p.kuerzel === k; })[0]) || { kuerzel: k, name: k, farbe: "#888888" }; }
  function farbeFor(commit, model) {
    if (commit.branch === "main") return MAIN_FARBE;
    var b = model.branches[commit.branch];
    return b && b.autor ? person(b.autor).farbe : "#888888";
  }
  function branchFarbe(name, model) {
    if (name === "main") return MAIN_FARBE;
    var b = model.branches[name];
    return b && b.autor ? person(b.autor).farbe : "#888888";
  }

  /* ---------- start view ---------- */

  function modusLabel(m) { return m === "zuschauen" ? "Zuschauen" : "Mitmachen"; }

  function standText(g, modus, p) {
    var s = p[g.id + ":" + modus];
    var fragen = g.szenen.filter(function (x) { return x.frage; }).length;
    if (modus === "zuschauen") return !s || !s.runden ? g.szenen.length + " Schritte, noch nicht angeschaut." : s.runden + " mal angeschaut.";
    if (!s || !s.runden) return fragen + " Fragen, noch keine Runde.";
    return s.runden + (s.runden === 1 ? " Runde" : " Runden") + ", Bestwert " + s.best + " von " + fragen + ".";
  }

  function renderStart() {
    var p = loadProgress();
    var box = $("karten"); clear(box);
    data.geschichten.forEach(function (g, gi) {
      g.modi.forEach(function (modus) {
        box.appendChild(el("button", { class: "stufe", type: "button", onclick: function () { startGeschichte(g, modus); } },
          el("span", { class: "nummer", text: "Geschichte " + (gi + 1) + ", " + modusLabel(modus) }),
          el("h2", { text: g.titel }),
          el("p", { text: g.kurz }),
          el("span", { class: "stand", text: standText(g, modus, p) })));
      });
    });
    show("start");
  }

  /* ---------- playing a story ---------- */

  function startGeschichte(g, modus) {
    state = { geschichte: g, modus: modus, index: 0, seen: {}, beantwortet: {}, fragen: { gesamt: 0, richtig: 0 }, ersterVersuchFalsch: false, fertig: false };
    $("titel").textContent = g.titel + (modus === "mitmachen" ? ", mit Fragen" : "");
    show("spiel");
    renderSzene(true);
  }

  function renderSzene(animate) {
    var g = state.geschichte, i = state.index, szene = g.szenen[i];
    var model = M.aufbauen(g, i);
    state.model = model;
    state.ersterVersuchFalsch = false;
    $("progress").textContent = "Schritt " + (i + 1) + " von " + g.szenen.length;
    $("szene-text").textContent = szene.text;
    setFeedback(null, []);
    drawOrte(model, szene);
    drawGraph(model, animate ? state.seen : null, szene);
    model.commits.forEach(function (c) { state.seen[c.id] = true; });
    renderZeigt(szene);
    renderPrs(model);
    renderLaptops(model);

    var frageBox = $("frage"); clear(frageBox); frageBox.hidden = true;
    var needsAnswer = state.modus === "mitmachen" && szene.frage && !state.beantwortet[i];
    if (needsAnswer) renderFrage(szene.frage, frageBox);

    if (szene.ende) { renderEnde(); return; }
    var weiter = btn("Weiter", nextSzene, false, { disabled: !!needsAnswer });
    state.weiterBtn = weiter;
    var zurueck = btn("Zurück", prevSzene, true, { disabled: i === 0 });
    setActions([weiter, zurueck]);
  }

  function nextSzene() { if (state.index < state.geschichte.szenen.length - 1) { state.index++; renderSzene(true); } }
  function prevSzene() { if (state.index > 0) { state.index--; renderSzene(false); } }

  function renderEnde() {
    var g = state.geschichte, modus = state.modus;
    var fragen = g.szenen.filter(function (x) { return x.frage; }).length;
    if (!state.fertig) {
      state.fertig = true;
      var p = loadProgress();
      var key = g.id + ":" + modus;
      p[key] = p[key] || { runden: 0, best: 0 };
      p[key].runden++;
      if (modus === "mitmachen" && state.fragen.richtig > p[key].best) p[key].best = state.fragen.richtig;
      saveProgress(p);
    }
    var lines = ["Ende der Geschichte."];
    if (modus === "mitmachen") lines.push(state.fragen.richtig + " von " + fragen + " Fragen beim ersten Versuch richtig.");
    else lines.push("Noch einmal mit Fragen? Wähle in der Übersicht Mitmachen.");
    setFeedback("ok", lines);
    setActions([btn("Noch einmal", function () { startGeschichte(g, modus); }), btn("Zurück", prevSzene, true), btn("Zur Übersicht", renderStart, true)]);
  }

  /* ---------- the graph ---------- */

  var PR_WORT = { offen: "offen", aenderung: "Kommentar", konflikt: "Konflikt", gemergt: "gemergt" };

  // The newest pull request of a branch, or null.
  function prFuer(model, branch) {
    var hit = null;
    model.prs.forEach(function (x) { if (x.branch === branch) hit = x; });
    return hit;
  }

  function drawGraph(model, seenBefore, szene) {
    var wrap = $("graph"); clear(wrap);
    var n = model.commits.length;
    var height = TOP + Math.max(n, 1) * ROW + 16;
    var svg = svgEl("svg", { viewBox: "0 0 " + WIDTH + " " + height, width: "100%", role: "img", "aria-label": graphLabel(model) });
    svg.style.maxWidth = WIDTH + "px";
    var pos = {};
    model.commits.forEach(function (c) { pos[c.id] = { x: LANE_X[String(c.spur)], y: TOP + c.index * ROW + 20 }; });

    // column headers: the branches per lane
    var lanes = { "-1": [], "0": ["main"], "1": [] };
    Object.keys(model.branches).forEach(function (name) { if (name !== "main") lanes[String(model.branches[name].spur)].push(name); });
    Object.keys(lanes).forEach(function (spur) {
      if (!lanes[spur].length) return;
      var name = lanes[spur][lanes[spur].length - 1];
      var t = svgEl("text", { x: LANE_X[spur], y: 22, class: "spalte-titel", "text-anchor": "middle", fill: branchFarbe(name, model), text: name });
      svg.appendChild(t);
      var b = model.branches[name];
      if (b && b.autor) svg.appendChild(svgEl("text", { x: LANE_X[spur], y: 38, class: "spalte-unter", "text-anchor": "middle", text: person(b.autor).name }));
    });

    // connections first, so the circles sit on top
    model.commits.forEach(function (c) {
      c.parents.forEach(function (pid) {
        var a = pos[pid], b = pos[c.id];
        if (!a || !b) return;
        var d = a.x === b.x ? "M " + a.x + " " + a.y + " L " + b.x + " " + b.y
          : "M " + a.x + " " + a.y + " C " + a.x + " " + (a.y + ROW * 0.55) + ", " + b.x + " " + (b.y - ROW * 0.55) + ", " + b.x + " " + b.y;
        var neu = seenBefore && !seenBefore[c.id] && !reduced;
        svg.appendChild(svgEl("path", { d: d, class: "pfad" + (c.aufGitHub ? "" : " lokal") + (neu ? " neu" : ""), stroke: farbeFor(c, model), pathLength: "1", fill: "none" }));
      });
    });

    var tips = {};
    Object.keys(model.branches).forEach(function (name) { if (model.branches[name].tip) tips[model.branches[name].tip] = name; });
    var waehlbar = szene && szene.frage && szene.frage.typ === "tipp" && state.modus === "mitmachen" && !state.beantwortet[state.index];

    model.commits.forEach(function (c) {
      var p = pos[c.id];
      var neu = seenBefore && !seenBefore[c.id] && !reduced;
      var g = svgEl("g", { class: "commit" + (c.aufGitHub ? "" : " lokal") + (tips[c.id] ? " tip" : "") + (c.merge ? " merge" : ""), transform: "translate(" + p.x + " " + p.y + ")", "data-id": c.id });
      var inner = svgEl("g", { class: "pop" + (neu ? " neu" : "") });
      inner.appendChild(svgEl("circle", { r: R, fill: farbeFor(c, model), class: "kreis" }));
      if (c.merge) inner.appendChild(svgEl("circle", { r: R - 5, fill: "none", class: "merge-ring" }));
      inner.appendChild(svgEl("text", { x: 0, y: 5, "text-anchor": "middle", class: "initial", text: c.autor }));
      g.appendChild(inner);
      var links = c.spur === -1;
      var label = svgEl("text", { x: links ? LABEL_LINKS_X : LABEL_X, y: p.y + 5, class: "commit-text", "text-anchor": links ? "end" : "start", text: c.text.length > LABEL_MAX ? c.text.slice(0, LABEL_MAX - 1) + "…" : c.text });
      svg.appendChild(label);
      // the pull request of a branch stands under the label of its newest commit
      var pr = tips[c.id] ? prFuer(model, tips[c.id]) : null;
      if (pr) svg.appendChild(svgEl("text", { x: links ? LABEL_LINKS_X : LABEL_X, y: p.y + 21, class: "pr-marke pr-" + pr.status, "text-anchor": links ? "end" : "start", text: "Pull request: " + PR_WORT[pr.status] }));
      if (waehlbar) {
        g.setAttribute("class", g.getAttribute("class") + " waehlbar");
        g.setAttribute("role", "button"); g.setAttribute("tabindex", "0");
        g.setAttribute("aria-label", "Commit: " + c.text);
        g.addEventListener("click", function () { tapCommit(c.id, g); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapCommit(c.id, g); } });
      }
      svg.appendChild(g);
    });
    wrap.appendChild(svg);

    // a small celebration on a fresh merge commit
    if (seenBefore && !reduced) {
      model.commits.forEach(function (c) {
        if (c.merge && c.branch === "main" && !seenBefore[c.id]) konfetti(svg, pos[c.id]);
      });
    }
  }

  /* ---------- the places: GitHub and the laptops ---------- */

  // Every commit reachable from the given commit ids, as a set of ids.
  function vorfahren(model, ids) {
    var seen = {}, stack = ids.slice();
    while (stack.length) {
      var id = stack.pop();
      if (!id || seen[id] || !model.byId[id]) continue;
      seen[id] = true;
      model.byId[id].parents.forEach(function (p) { stack.push(p); });
    }
    return seen;
  }

  // What a laptop holds: main as far as it was cloned or pulled, and the
  // person's own branches. null while there is no copy.
  function aufLaptop(model, kuerzel) {
    var l = model.laptops[kuerzel];
    if (!l) return null;
    var ids = [l.main];
    Object.keys(model.branches).forEach(function (name) {
      var b = model.branches[name];
      if (b.autor === kuerzel && b.tip) ids.push(b.tip);
    });
    return vorfahren(model, ids);
  }

  function drawOrte(model, szene) {
    var wrap = $("orte"); if (!wrap) return;
    clear(wrap);
    var personen = state.geschichte.personen;
    // left to right like the lanes of the graph: the second person's
    // branches run on the left, the first person's on the right.
    var orte = [];
    if (personen[1]) orte.push({ k: personen[1].kuerzel, name: personen[1].name + "s Laptop", farbe: personen[1].farbe });
    orte.push({ k: null, name: "GitHub", farbe: GITHUB_FARBE });
    if (personen[0]) orte.push({ k: personen[0].kuerzel, name: personen[0].name + "s Laptop", farbe: personen[0].farbe });
    var n = Math.max(model.commits.length, 3);
    var boxH = 14 + n * ORT_ROW + 6;
    var breite = orte.length * ORT_B + (orte.length - 1) * ORT_ABSTAND;
    var x0 = (WIDTH - breite) / 2;
    var height = ORT_TOP + boxH + 24;
    var svg = svgEl("svg", { viewBox: "0 0 " + WIDTH + " " + height, width: "100%", role: "img", "aria-label": orteLabel(model, orte) });
    svg.style.maxWidth = WIDTH + "px";
    var defs = svgEl("defs", {});
    var marker = svgEl("marker", { id: "pfeilspitze", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "5", markerHeight: "5", orient: "auto-start-reverse" });
    marker.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", class: "pfeil-spitze" }));
    defs.appendChild(marker); svg.appendChild(defs);

    var mitte = {};
    orte.forEach(function (o, i) {
      var x = x0 + i * (ORT_B + ORT_ABSTAND);
      o.x = x; mitte[o.k === null ? "github" : o.k] = o;
      var hat = o.k === null ? null : aufLaptop(model, o.k);
      var leer = o.k !== null && !hat;
      svg.appendChild(svgEl("text", { x: x + ORT_B / 2, y: 15, class: "ort-titel", "text-anchor": "middle", fill: o.farbe, text: o.name }));
      svg.appendChild(svgEl("rect", { x: x + 1, y: ORT_TOP, width: ORT_B - 2, height: boxH, rx: 10, class: "ort-kasten" + (leer ? " leer" : "") }));
      svg.appendChild(svgEl("text", { x: x + ORT_B / 2, y: ORT_TOP + boxH + 16, class: "ort-unter", "text-anchor": "middle", text: o.k === null ? "remote" : "lokal" }));
      if (leer) {
        svg.appendChild(svgEl("text", { x: x + ORT_B / 2, y: ORT_TOP + boxH / 2 + 4, class: "ort-leer", "text-anchor": "middle", text: "noch keine Kopie" }));
        return;
      }
      var da = function (c) { return o.k === null ? c.aufGitHub : !!hat[c.id]; };
      var pos = {};
      model.commits.forEach(function (c) { pos[c.id] = { x: x + ORT_B / 2 + c.spur * ORT_SPUR, y: ORT_TOP + 14 + c.index * ORT_ROW }; });
      model.commits.forEach(function (c) {
        if (!da(c)) return;
        c.parents.forEach(function (pid) {
          var pc = model.byId[pid];
          if (!pc || !da(pc)) return;
          svg.appendChild(svgEl("line", { x1: pos[pid].x, y1: pos[pid].y, x2: pos[c.id].x, y2: pos[c.id].y, class: "ort-linie", stroke: farbeFor(c, model) }));
        });
      });
      model.commits.forEach(function (c) {
        var q = pos[c.id];
        if (da(c)) svg.appendChild(svgEl("circle", { cx: q.x, cy: q.y, r: ORT_R, fill: farbeFor(c, model), class: "ort-punkt" + (o.k !== null && !c.aufGitHub ? " lokal" : "") }));
        else svg.appendChild(svgEl("circle", { cx: q.x, cy: q.y, r: ORT_R - 1.5, class: "ort-punkt fehlt" }));
      });
    });

    // arrows for what moves in this scene
    var pfeile = [];
    (szene.aktionen || []).forEach(function (a) {
      if (a.typ === "clone") pfeile.push({ von: "github", nach: a.autor, text: "clone" });
      else if (a.typ === "pull") pfeile.push({ von: "github", nach: a.autor, text: "pull" });
      else if (a.typ === "push") { var b = model.branches[a.branch]; if (b && b.autor) pfeile.push({ von: b.autor, nach: "github", text: "push" }); }
    });
    var gesehen = {};
    pfeile.forEach(function (pf) {
      var key = pf.von + ">" + pf.nach + ":" + pf.text;
      if (gesehen[key]) return; gesehen[key] = true;
      var a = mitte[pf.von], b = mitte[pf.nach];
      if (!a || !b) return;
      var nachRechts = b.x > a.x;
      var x1 = nachRechts ? a.x + ORT_B + 3 : a.x - 3;
      var x2 = nachRechts ? b.x - 3 : b.x + ORT_B + 3;
      var y = ORT_TOP + Math.min(boxH / 2, 34) + 6;
      svg.appendChild(svgEl("line", { x1: x1, y1: y, x2: x2, y2: y, class: "pfeil", "marker-end": "url(#pfeilspitze)" }));
      svg.appendChild(svgEl("text", { x: (x1 + x2) / 2, y: y - 12, class: "pfeil-text", "text-anchor": "middle", text: pf.text }));
    });
    wrap.appendChild(svg);
  }

  function orteLabel(model, orte) {
    var parts = orte.map(function (o) {
      if (o.k === null) return "GitHub: " + model.commits.filter(function (c) { return c.aufGitHub; }).length + " Commits";
      var hat = aufLaptop(model, o.k);
      return o.name + ": " + (hat ? Object.keys(hat).length + " Commits" : "noch keine Kopie");
    });
    return "Wo das Repository liegt. " + parts.join(". ") + ".";
  }

  function konfetti(svg, p) {
    var g = svgEl("g", { class: "konfetti", transform: "translate(" + p.x + " " + p.y + ")" });
    var colours = [MAIN_FARBE, "#ff7518", "#2780e3", "#ffd500", "#8250df"];
    for (var i = 0; i < 14; i++) {
      var ang = (Math.PI * 2 * i) / 14, dist = 34 + Math.random() * 26;
      var c = svgEl("circle", { r: 3 + Math.random() * 2, fill: colours[i % colours.length], class: "stueck" });
      c.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      c.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
      g.appendChild(c);
    }
    svg.appendChild(g);
    window.setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 1300);
  }

  function graphLabel(model) {
    var parts = [model.commits.length + (model.commits.length === 1 ? " Commit" : " Commits")];
    Object.keys(model.branches).forEach(function (name) {
      var own = model.commits.filter(function (c) { return c.branch === name; });
      var lokal = own.filter(function (c) { return !c.aufGitHub; }).length;
      parts.push(name + ": " + own.length + (lokal ? " (" + lokal + " nur auf dem Laptop)" : ""));
    });
    return "Commit-Graph. " + parts.join(". ") + ".";
  }

  /* ---------- panels ---------- */

  function panel(id, titel, children) {
    var box = $(id); clear(box);
    if (!children || !children.length) { box.hidden = true; return; }
    box.appendChild(el("h2", { text: titel }));
    children.forEach(function (c) { box.appendChild(c); });
    box.hidden = false;
  }

  function renderZeigt(szene) {
    var z = szene.zeigt || {};
    var rows = [];
    [["desktop", "GitHub Desktop"], ["terminal", "Terminal"], ["github", "github.com"]].forEach(function (pair) {
      if (z[pair[0]]) rows.push(el("p", {}, el("span", { class: "wo", text: pair[1] + ": " }), pair[0] === "terminal" ? el("code", { text: z[pair[0]] }) : z[pair[0]]));
    });
    panel("zeigt", "So geht das", rows);
  }

  function statusText(s) { return { offen: "offen", aenderung: "Kommentar", konflikt: "Konflikt", gemergt: "gemergt" }[s] || s; }

  function renderPrs(model) {
    var cards = model.prs.map(function (pr) {
      var card = el("div", { class: "pr-karte status-" + pr.status },
        el("div", { class: "pr-kopf" },
          el("strong", { text: "Pull request #" + pr.id + ": " + pr.titel }),
          el("span", { class: "badge pr-status", text: statusText(pr.status) })),
        el("p", { class: "klein", text: pr.branch + " nach main, von " + person(pr.autor).name }));
      pr.kommentare.forEach(function (k) { card.appendChild(el("p", { class: "kommentar", text: person(k.von).name + ": " + k.text })); });
      return card;
    });
    panel("prs", "Pull requests", cards);
  }

  function renderLaptops(model) {
    var rows = [];
    var tip = model.byId[model.branches.main.tip];
    rows.push(laptopRow("GitHub", GITHUB_FARBE, tip ? "main steht bei: " + tip.text : "noch leer"));
    state.geschichte.personen.forEach(function (p) {
      var l = model.laptops[p.kuerzel];
      var text;
      if (!l) text = "noch keine Kopie";
      else {
        var at = model.byId[l.main];
        var behind = M.hinterher(model, p.kuerzel);
        text = "main steht bei: " + (at ? at.text : "?") + (behind ? " (" + behind + (behind === 1 ? " Commit" : " Commits") + " hinter GitHub)" : "");
      }
      rows.push(laptopRow(p.name + "s Laptop", p.farbe, text));
    });
    panel("laptops", "Wo main steht", rows);
  }

  function laptopRow(name, farbe, text) {
    var dot = el("span", { class: "punkt" }); dot.style.background = farbe;
    return el("p", { class: "laptop-zeile" }, dot, el("strong", { text: name + ": " }), text);
  }

  /* ---------- questions ---------- */

  function renderFrage(f, box) {
    box.hidden = false;
    box.appendChild(el("h2", { text: "Frage" }));
    box.appendChild(el("p", { class: "frage-text", text: f.text }));
    if (f.typ === "wahl") {
      var list = el("div", { class: "optionen" });
      shuffle(f.optionen.map(function (o, i) { return { text: o, i: i }; })).forEach(function (o) {
        var b = el("button", { class: "option", type: "button", dataset: { index: o.i }, onclick: function () { antwortWahl(f, o.i, b); } }, o.text);
        list.appendChild(b);
      });
      box.appendChild(list);
    } else if (f.typ === "tipp") {
      box.appendChild(el("p", { class: "klein", text: "Tippe im Bild auf den Commit." }));
    }
    box.appendChild(el("div", { class: "frage-feedback", id: "frage-feedback" }));
  }

  function antwortWahl(f, index, node) {
    if (state.beantwortet[state.index]) return;
    var fb = $("frage-feedback"); clear(fb);
    if (index === f.richtig) {
      node.classList.add("ok");
      Array.prototype.forEach.call(document.querySelectorAll(".option"), function (x) { x.disabled = true; });
      fb.appendChild(el("p", { class: "ok-text", text: "Richtig." }));
      fb.appendChild(el("p", { text: f.erklaerung }));
      beantwortet();
    } else {
      node.classList.add("bad"); node.disabled = true;
      state.ersterVersuchFalsch = true;
      fb.appendChild(el("p", { class: "bad-text", text: "Nicht ganz. Versuch es nochmal." }));
    }
  }

  function tapCommit(id, g) {
    var f = state.geschichte.szenen[state.index].frage;
    if (!f || f.typ !== "tipp" || state.beantwortet[state.index]) return;
    var fb = $("frage-feedback"); clear(fb);
    if (id === f.ziel) {
      g.setAttribute("class", g.getAttribute("class").replace(" waehlbar", "") + " ziel");
      Array.prototype.forEach.call(document.querySelectorAll(".commit.waehlbar"), function (x) { x.setAttribute("class", x.getAttribute("class").replace(" waehlbar", "")); });
      fb.appendChild(el("p", { class: "ok-text", text: "Richtig." }));
      fb.appendChild(el("p", { text: f.erklaerung }));
      beantwortet();
    } else {
      state.ersterVersuchFalsch = true;
      g.setAttribute("class", g.getAttribute("class") + " falsch");
      window.setTimeout(function () { g.setAttribute("class", g.getAttribute("class").replace(" falsch", "")); }, 600);
      fb.appendChild(el("p", { class: "bad-text", text: "Der ist es nicht. Schau auf die Linien: Wo laufen sie zusammen oder auseinander?" }));
    }
  }

  function beantwortet() {
    state.beantwortet[state.index] = true;
    state.fragen.gesamt++;
    if (!state.ersterVersuchFalsch) state.fragen.richtig++;
    if (state.weiterBtn) { state.weiterBtn.disabled = false; state.weiterBtn.focus(); }
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
    fetchYaml("data/geschichte.yml").then(function (d) {
      if (!d || !Array.isArray(d.geschichten) || !d.geschichten.length) throw new Error("keine Geschichten");
      data = d;
      var q = new window.URLSearchParams(window.location.search);
      if (q.get("bild") === "1") document.body.classList.add("nur-bild");
      if (q.get("teil")) document.body.classList.add("teil-" + (q.get("teil") === "orte" ? "orte" : "graph"));
      var gewaehlt = q.get("g") && d.geschichten.filter(function (x) { return x.id === q.get("g"); })[0];
      if (!gewaehlt) { renderStart(); return; }
      startGeschichte(gewaehlt, q.get("modus") === "mitmachen" ? "mitmachen" : "zuschauen");
      var nr = parseInt(q.get("szene"), 10);
      if (nr >= 1 && nr <= gewaehlt.szenen.length) { state.index = nr - 1; renderSzene(false); }
    }).catch(function (e) {
      $("error-detail").textContent = String(e && e.message || e);
      show("error");
    });
  }

  window.geschichte = { get data() { return data; }, get state() { return state; }, start: startGeschichte, renderStart: renderStart };
  init();
})();
