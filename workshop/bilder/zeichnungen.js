// Zeichnungen für Workshop 2, aus einer Liste von Formen je Zeichnung.
// Schreibt je Zeichnung: SVG (pro Aufbauschritt eines), und eine Excalidraw-Datei
// zum Bearbeiten von Hand. Die PNG entstehen danach aus den SVG (siehe unten).
//
// Aufruf, in einem Ordner mit `npm install roughjs`:
//   node zeichnungen.js <Zielordner>
//
// Die Geschichte läuft von oben nach unten, wie im Spiel und in den Folien
// von Workshop 1.
const rough = require("roughjs");
const fs = require("fs");
const path = require("path");

const out = process.argv[2];
const ink = "#1a1a1a", green = "#1e5a46", yellow = "#f0b85c", white = "#ffffff";
const soft = "#5a5a5a", pale = "#e6f0ec";
const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const rect = (x, y, w, h, o = {}) => ({ t: "rect", x, y, w, h, ...o });
const ell = (cx, cy, w, h, o = {}) => ({ t: "ellipse", cx, cy, w, h, ...o });
const line = (points, o = {}) => ({ t: "line", points, ...o });
const text = (x, y, s, o = {}) => ({ t: "text", x, y, s, ...o });

// Zeichnung 1: der Ordner, seine Aufgaben, seine Geschichte ---------------
// Jede Form trägt den Schritt, ab dem sie zu sehen ist.
const ordner = [];
const add = (step, shape) => ordner.push({ step, ...shape });
// Schritt 1: ein Projekt, ein Ordner
add(1, line([[40, 110], [40, 72], [190, 72], [218, 110]], { sw: 3 }));
add(1, rect(40, 110, 400, 250, { sw: 3 }));
add(1, text(62, 128, "mein-projekt/", { size: 34, bold: true }));
add(1, text(62, 176, "ein Projekt, ein Ordner", { size: 23, color: soft }));
// Schritt 2: Aufgaben hängen am Ordner
for (const [x, y, a] of [[90, 230, -0.06], [250, 205, 0.05], [370, 275, -0.04]]) {
  add(2, rect(x, y, 150, 90, { fill: white, fillStyle: "solid", angle: a, sw: 2.5 }));
  add(2, text(x + 75, y + 30, "Issue", { size: 28, anchor: "middle", angle: a }));
  add(2, ell(x + 75, y + 5, 20, 20, { fill: green, fillStyle: "solid", stroke: green }));
}
// Schritt 3: die Geschichte, von oben nach unten
add(3, text(620, 28, "Geschichte", { size: 26, bold: true, anchor: "middle" }));
add(3, line([[620, 75], [620, 570]], { sw: 3 }));
for (const cy of [120, 215, 310, 500]) add(3, ell(620, cy, 30, 30, { fill: white, fillStyle: "solid", sw: 3 }));
add(3, ell(620, 405, 30, 30, { fill: white, fillStyle: "solid", sw: 3, until: 3 }));
add(3, text(650, 104, "Commit", { size: 23, color: soft }));
// Schritt 4: ein Prompt bleibt bei seiner Änderung
add(4, ell(620, 405, 40, 40, { fill: green, fillStyle: "solid", stroke: green, sw: 3 }));
add(4, text(652, 388, "Änderung", { size: 26, bold: true, color: green }));
add(4, rect(415, 420, 150, 62, { fill: yellow, fillStyle: "solid", angle: -0.05, sw: 2.5 }));
add(4, text(490, 435, "Prompt", { size: 28, bold: true, anchor: "middle", angle: -0.05 }));
add(4, line([[566, 436], [600, 414]], { sw: 2.5 }));

// Zeichnung 2: wo das Repository liegt ------------------------------------
const ort = [];
const haus = (x, w, titel, unter, tische) => {
  ort.push(line([[x - 15, 200], [x + w / 2, 110], [x + w + 15, 200]], { sw: 3 }));
  ort.push(rect(x, 200, w, 250, { sw: 3 }));
  ort.push(text(x + w / 2, 40, titel, { size: 32, bold: true, anchor: "middle" }));
  // der Ordner im Haus
  ort.push(line([[x + 25, 245], [x + 25, 228], [x + 80, 228], [x + 92, 245]], { sw: 2.5 }));
  ort.push(rect(x + 25, 245, 130, 70, { sw: 2.5, fill: pale, fillStyle: "solid" }));
  ort.push(text(x + 90, 266, "Projekt", { size: 22, anchor: "middle" }));
  // die Tische
  tische.forEach(([dx, du]) => {
    if (du) {
      ort.push(rect(x + dx, 360, 76, 48, { fill: green, fillStyle: "solid", stroke: green }));
      ort.push(text(x + dx + 38, 371, "du", { size: 24, bold: true, color: white, anchor: "middle" }));
    } else {
      ort.push(rect(x + dx, 360, 76, 48, { fill: "#b9b9b9", fillStyle: "hachure" }));
    }
  });
  ort.push(text(x + w / 2, 480, unter, { size: 26, color: soft, anchor: "middle" }));
};
haus(60, 220, "dein Konto", "gehört dir", [[72, true]]);
haus(400, 350, "eine Organisation", "gehört der Gruppe", [[30, true], [137, false], [244, false]]);

// Schreiber ---------------------------------------------------------------
const gen = rough.generator();

function svgOf(shapes, w, h) {
  const parts = shapes.map((s) => {
    const o = {
      seed: s.seed, roughness: 1.3, bowing: 1.2,
      stroke: s.stroke || ink, strokeWidth: s.sw || 2,
      fill: s.fill, fillStyle: s.fillStyle || "hachure", hachureGap: 7, fillWeight: 1.5,
    };
    let body = "";
    if (s.t === "text") {
      body = `<text x="${s.x}" y="${s.y + s.size * 0.85}" font-family="${font}" font-size="${s.size}" font-weight="${s.bold ? 700 : 400}" fill="${s.color || ink}" text-anchor="${s.anchor || "start"}">${s.s}</text>`;
    } else {
      let d;
      if (s.t === "rect") d = gen.rectangle(s.x, s.y, s.w, s.h, o);
      if (s.t === "ellipse") d = gen.ellipse(s.cx, s.cy, s.w, s.h, o);
      if (s.t === "line") d = gen.linearPath(s.points, o);
      for (const p of gen.toPaths(d)) {
        body += `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || "none"}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
    if (s.angle) {
      const cx = s.t === "text" ? s.x : s.x + s.w / 2;
      const cy = s.t === "text" ? s.y + s.size / 2 : s.y + s.h / 2;
      body = `<g transform="rotate(${(s.angle * 180 / Math.PI).toFixed(2)} ${cx} ${cy})">${body}</g>`;
    }
    return body;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" role="img">\n<rect width="${w}" height="${h}" fill="${white}"/>\n${parts.join("\n")}\n</svg>\n`;
}

function excalidrawOf(shapes) {
  const els = shapes.map((s, i) => {
    const n = i + 1;
    const base = {
      id: `el${n}`, angle: s.angle || 0, strokeColor: s.stroke || s.color || ink,
      backgroundColor: s.fill || "transparent", fillStyle: s.fillStyle || "hachure",
      strokeWidth: s.sw && s.sw > 2.4 ? 2 : 1, strokeStyle: "solid",
      roughness: 1, opacity: 100, groupIds: [], frameId: null, roundness: null,
      seed: 1000 + n, version: 1, versionNonce: 5000 + n, isDeleted: false,
      boundElements: null, updated: 1, link: null, locked: false,
    };
    if (s.t === "rect") return { ...base, type: "rectangle", x: s.x, y: s.y, width: s.w, height: s.h };
    if (s.t === "ellipse") return { ...base, type: "ellipse", x: s.cx - s.w / 2, y: s.cy - s.h / 2, width: s.w, height: s.h };
    if (s.t === "line") {
      const [x0, y0] = s.points[0];
      const pts = s.points.map(([x, y]) => [x - x0, y - y0]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      return {
        ...base, type: "line", x: x0, y: y0,
        width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys),
        points: pts, lastCommittedPoint: null, startBinding: null, endBinding: null,
        startArrowhead: null, endArrowhead: null,
      };
    }
    const width = s.s.length * s.size * 0.55, height = s.size * 1.25;
    return {
      ...base, type: "text", x: s.anchor === "middle" ? s.x - width / 2 : s.x, y: s.y, width, height,
      text: s.s, originalText: s.s, fontSize: s.size, fontFamily: 1,
      textAlign: s.anchor === "middle" ? "center" : "left", verticalAlign: "top",
      containerId: null, lineHeight: 1.25, backgroundColor: "transparent",
    };
  });
  return JSON.stringify({
    type: "excalidraw", version: 2, source: "gitklar",
    elements: els, appState: { viewBackgroundColor: white, gridSize: null }, files: {},
  }, null, 2);
}

// Jede Form bekommt ihren Zufallswert aus ihrer Stelle in der Liste,
// damit sie in jedem Aufbauschritt gleich gezeichnet ist.
ordner.forEach((s, i) => { s.seed = 200 + i * 7; });
ort.forEach((s, i) => { s.seed = 900 + i * 7; });

for (let step = 1; step <= 4; step += 1) {
  const shown = ordner.filter((s) => s.step <= step && !(s.until && step > s.until));
  fs.writeFileSync(path.join(out, `zeichnung-ordner-${step}.svg`), svgOf(shown, 800, 600));
}
fs.writeFileSync(path.join(out, "zeichnung-ordner.excalidraw"), excalidrawOf(ordner.filter((s) => !s.until)));
fs.writeFileSync(path.join(out, "zeichnung-ort.svg"), svgOf(ort, 800, 520));
fs.writeFileSync(path.join(out, "zeichnung-ort.excalidraw"), excalidrawOf(ort));
console.log("geschrieben");
