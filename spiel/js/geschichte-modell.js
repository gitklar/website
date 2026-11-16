/* The model behind the story game: a small Git repository built from the
 * actions of the scenes in data/geschichte.yml. Pure data, no DOM, so the
 * validation script can replay a story the same way the page does.
 *
 * A model holds commits (with parents, lane, author, whether on GitHub),
 * branches (lane and tip), pull requests, and the position of main on each
 * person's laptop. Lanes: main is 0, a branch is +1 (right) or -1 (left).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GitModell = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function neu(personen) {
    var m = { commits: [], byId: {}, branches: { main: { spur: 0, tip: null, autor: null } }, prs: [], laptops: {}, personen: {}, fehler: [] };
    (personen || []).forEach(function (p) { m.personen[p.kuerzel] = p; });
    return m;
  }

  function addCommit(m, c) {
    if (m.byId[c.id]) { m.fehler.push("commit id doppelt: " + c.id); return null; }
    c.index = m.commits.length;
    m.commits.push(c); m.byId[c.id] = c;
    return c;
  }

  function pr(m, id) {
    for (var i = 0; i < m.prs.length; i++) if (m.prs[i].id === id) return m.prs[i];
    return null;
  }

  var mergeCounter = 0;

  function anwenden(m, a) {
    var b, c, p;
    var wer = a.typ === "branch" ? a.autor : (a.autor || a.von);
    if (a.typ !== "push" && a.typ !== "konflikt" && a.typ !== "pr" && wer && Object.keys(m.personen).length && !m.personen[wer]) {
      m.fehler.push(a.typ + ": Person unbekannt: " + wer);
    }
    if (a.typ === "pr" && Object.keys(m.personen).length && !m.personen[a.autor]) m.fehler.push("pr " + a.id + ": Person unbekannt: " + a.autor);
    switch (a.typ) {
      case "commit":
        b = m.branches[a.branch];
        if (!b) { m.fehler.push("commit " + a.id + ": Branch unbekannt: " + a.branch); return; }
        c = addCommit(m, { id: a.id, parents: b.tip ? [b.tip] : [], branch: a.branch, spur: b.spur, autor: a.autor, text: a.text, aufGitHub: !!a.aufGitHub, merge: false });
        if (!c) return;
        b.tip = c.id;
        if (a.branch === "main" && !a.aufGitHub && m.laptops[a.autor]) m.laptops[a.autor].main = c.id;
        if (a.branch === "main" && a.aufGitHub) Object.keys(m.laptops).forEach(function (k) { /* GitHub moved, laptops stay */ });
        return;
      case "clone":
        if (!m.branches.main.tip) { m.fehler.push("clone: noch kein Commit auf main"); return; }
        m.laptops[a.autor] = { main: m.branches.main.tip };
        return;
      case "branch":
        if (m.branches[a.name]) { m.fehler.push("branch doppelt: " + a.name); return; }
        b = m.branches[a.von];
        if (!b || !b.tip) { m.fehler.push("branch " + a.name + ": von unbekannt oder leer: " + a.von); return; }
        m.branches[a.name] = { spur: a.spur === -1 ? -1 : 1, tip: b.tip, autor: a.autor, von: b.tip };
        return;
      case "push":
        b = m.branches[a.branch];
        if (!b) { m.fehler.push("push: Branch unbekannt: " + a.branch); return; }
        m.commits.forEach(function (x) { if (x.branch === a.branch) x.aufGitHub = true; });
        b.aufGitHub = true;
        return;
      case "pr":
        if (pr(m, a.id)) { m.fehler.push("pr doppelt: " + a.id); return; }
        b = m.branches[a.branch];
        if (!b) { m.fehler.push("pr " + a.id + ": Branch unbekannt: " + a.branch); return; }
        if (!b.aufGitHub) m.fehler.push("pr " + a.id + ": Branch " + a.branch + " ist noch nicht gepusht");
        m.prs.push({ id: a.id, branch: a.branch, autor: a.autor, titel: a.titel, status: "offen", kommentare: [] });
        return;
      case "review":
        p = pr(m, a.pr);
        if (!p) { m.fehler.push("review: pr unbekannt: " + a.pr); return; }
        p.kommentare.push({ von: a.von, text: a.text });
        if (a.status === "aenderung") p.status = "aenderung";
        return;
      case "konflikt":
        p = pr(m, a.pr);
        if (!p) { m.fehler.push("konflikt: pr unbekannt: " + a.pr); return; }
        p.status = "konflikt";
        return;
      case "mergeIn":
        b = m.branches[a.in];
        if (!b) { m.fehler.push("mergeIn: Branch unbekannt: " + a.in); return; }
        mergeCounter++;
        c = addCommit(m, { id: a.id || ("m" + mergeCounter), parents: [b.tip, m.branches.main.tip], branch: a.in, spur: b.spur, autor: a.autor, text: a.text, aufGitHub: false, merge: true });
        if (!c) return;
        b.tip = c.id;
        m.prs.forEach(function (x) { if (x.branch === a.in && x.status === "konflikt") x.status = "offen"; });
        return;
      case "merge":
        p = pr(m, a.pr);
        if (!p) { m.fehler.push("merge: pr unbekannt: " + a.pr); return; }
        if (p.status === "gemergt") { m.fehler.push("merge: pr " + a.pr + " ist schon gemergt"); return; }
        if (p.status === "konflikt") { m.fehler.push("merge: pr " + a.pr + " hat einen Konflikt"); return; }
        b = m.branches[p.branch];
        var unpushed = m.commits.some(function (x) { return x.branch === p.branch && !x.aufGitHub; });
        if (unpushed) m.fehler.push("merge: pr " + a.pr + " hat Commits, die nicht auf GitHub sind");
        c = addCommit(m, { id: a.id || ("c" + (m.commits.length + 1)), parents: [m.branches.main.tip, b.tip], branch: "main", spur: 0, autor: a.von, text: a.text, aufGitHub: true, merge: true });
        if (!c) return;
        m.branches.main.tip = c.id;
        p.status = "gemergt";
        return;
      case "pull":
        if (!m.laptops[a.autor]) { m.fehler.push("pull: " + a.autor + " hat keine Kopie"); return; }
        m.laptops[a.autor].main = m.branches.main.tip;
        return;
      default:
        m.fehler.push("Aktion unbekannt: " + a.typ);
    }
  }

  // The model after the scenes 0..bis (inclusive).
  function aufbauen(geschichte, bis) {
    mergeCounter = 0;
    var m = neu(geschichte.personen);
    for (var i = 0; i <= bis && i < geschichte.szenen.length; i++) {
      (geschichte.szenen[i].aktionen || []).forEach(function (a) { anwenden(m, a); });
    }
    return m;
  }

  // How many commits on main a laptop is behind GitHub.
  function hinterher(m, kuerzel) {
    var l = m.laptops[kuerzel];
    if (!l) return null;
    var at = m.byId[l.main], tip = m.byId[m.branches.main.tip];
    if (!at || !tip) return 0;
    return m.commits.filter(function (c) { return c.branch === "main" && c.index > at.index; }).length;
  }

  // Replay a story and report every problem, including the questions.
  function pruefen(geschichte) {
    var errs = [];
    if (!geschichte.szenen || !geschichte.szenen.length) return ["keine Szenen"];
    for (var i = 0; i < geschichte.szenen.length; i++) {
      var s = geschichte.szenen[i];
      var m = aufbauen(geschichte, i);
      m.fehler.forEach(function (e) { errs.push("Szene " + (i + 1) + ": " + e); });
      if (!s.text) errs.push("Szene " + (i + 1) + ": kein text");
      if (s.frage) {
        var f = s.frage;
        if (f.typ === "wahl") {
          if (!Array.isArray(f.optionen) || f.optionen.length < 2) errs.push("Szene " + (i + 1) + ": Frage braucht mindestens zwei Optionen");
          else if (typeof f.richtig !== "number" || f.richtig < 0 || f.richtig >= f.optionen.length) errs.push("Szene " + (i + 1) + ": richtig zeigt auf keine Option");
        } else if (f.typ === "tipp") {
          if (!m.byId[f.ziel]) errs.push("Szene " + (i + 1) + ": Ziel-Commit " + f.ziel + " gibt es zu dem Zeitpunkt nicht");
        } else errs.push("Szene " + (i + 1) + ": Fragetyp unbekannt: " + f.typ);
        if (!f.text || !f.erklaerung) errs.push("Szene " + (i + 1) + ": Frage braucht text und erklaerung");
      }
      if (i === geschichte.szenen.length - 1 && !s.ende) errs.push("letzte Szene braucht ende: true");
    }
    return errs;
  }

  return { neu: neu, anwenden: anwenden, aufbauen: aufbauen, hinterher: hinterher, pruefen: pruefen };
});
