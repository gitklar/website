-- glossar: renders begriffe.yml as a page.
--
--   {{< glossar liste >}}         definition list, grouped, for glossar.qmd
--   {{< glossar tabelle >}}       side-by-side table, grouped, for begriffe.qmd
--   {{< glossar bildschirme >}}   every screen whose `seite` is this page,
--                                 each with a heading, as screenshot or
--                                 placeholder
--   {{< glossar bild <key> >}}    one screen, without heading, anywhere
--
-- All read the same file, so the glossary, the table and the screenshot
-- keys never drift apart. A screen renders its `datei` when that file
-- exists under the project root, and a marked placeholder otherwise.

local B = dofile(pandoc.path.join({pandoc.path.directory(PANDOC_SCRIPT_FILE), "begriffe.lua"}))

local function groups()
  local order, by = {}, {}
  for _, e in ipairs(B.load()) do
    local g = B.str(e.gruppe)
    if g == "" then g = "Weitere Begriffe" end
    if by[g] == nil then
      by[g] = {}
      order[#order + 1] = g
    end
    table.insert(by[g], e)
  end
  return order, by
end

local function cell(s)
  return (s:gsub("|", "\\|"):gsub("\n", " "))
end

-- Link from a term to the screen its `bild` names, relative to this page.
local function bild_link(e)
  local key = B.str(e.bild)
  if key == "" then return nil end
  local s = B.screen_index()[key]
  if s == nil then
    quarto.log.warning("gl: term '" .. B.str(e.term) .. "' names unknown screen '" .. key .. "'")
    return nil
  end
  local _, rel = B.find_root()
  local seite = B.str(s.seite)
  local href
  if seite == B.page() then
    href = "#bild-" .. key
  else
    href = pandoc.path.join({rel or ".", seite}) .. "#bild-" .. key
  end
  return "[" .. B.str(s.titel) .. "](" .. href .. ")"
end

local function liste()
  local parts = {}
  local order, by = groups()
  for _, g in ipairs(order) do
    parts[#parts + 1] = "## " .. g .. "\n"
    for _, e in ipairs(by[g]) do
      local term = B.str(e.term)
      parts[#parts + 1] = "[" .. term .. "]{#gl-" .. B.slug(term) .. "}\n:   " .. B.md(e.bedeutung) .. "\n"
      local extra = {}
      if B.str(e.uebersetzt) ~= "" then
        extra[#extra + 1] = "**Übersetzt erscheint es als:** " .. B.md(e.uebersetzt) .. "."
      end
      if B.str(e.wo) ~= "" then
        extra[#extra + 1] = "**Wo:** " .. B.md(e.wo) .. "."
      end
      if B.str(e.befehl) ~= "" then
        extra[#extra + 1] = "**Befehl darunter:** " .. B.md(e.befehl) .. "."
      end
      local bild = bild_link(e)
      if bild ~= nil then
        extra[#extra + 1] = "**Bild:** " .. bild .. "."
      end
      if B.str(e.seite) ~= "" then
        extra[#extra + 1] = "**Seite:** " .. B.md(e.seite) .. "."
      end
      if #extra > 0 then
        parts[#parts + 1] = "\n    ::: {.gl-wo}\n    " .. table.concat(extra, " ") .. "\n    :::\n"
      end
      parts[#parts + 1] = ""
    end
  end
  return table.concat(parts, "\n")
end

local function tabelle()
  local parts = {}
  local order, by = groups()
  for _, g in ipairs(order) do
    parts[#parts + 1] = "## " .. g .. "\n"
    parts[#parts + 1] = "| Englisch | So kann es übersetzt erscheinen | Bedeutung | Wo du es siehst |"
    parts[#parts + 1] = "|---|---|---|---|"
    for _, e in ipairs(by[g]) do
      local term = B.str(e.term)
      local link = "[" .. term .. "](glossar.html#gl-" .. B.slug(term) .. ")"
      local ue = B.md(e.uebersetzt)
      if ue == "" then ue = "bleibt Englisch" end
      local wo = B.md(e.wo)
      if B.str(e.befehl) ~= "" then
        wo = (wo ~= "" and (wo .. ". ") or "") .. "Befehl: " .. B.md(e.befehl)
      end
      local bild = bild_link(e)
      if bild ~= nil then
        wo = (wo ~= "" and (wo .. ". ") or "") .. "Bild: " .. bild
      end
      parts[#parts + 1] = "| " .. cell(link) .. " | " .. cell(ue) .. " | " .. cell(B.md(e.kurz)) .. " | " .. cell(wo) .. " |"
    end
    parts[#parts + 1] = "\n: {tbl-colwidths=\"[18,22,28,32]\"}\n"
  end
  return table.concat(parts, "\n")
end

-- The screenshot of one screen, or its placeholder. The placeholder names
-- the file the screenshot is expected under, so it can be dropped in
-- without touching the page.
local function bild_block(s)
  local root, rel = B.find_root()
  local titel = B.str(s.titel)
  local datei = B.str(s.datei)
  if datei == "" then datei = "bilder/" .. B.str(s.key) .. ".png" end
  local exists = false
  if root ~= nil then
    local f = io.open(pandoc.path.join({root, datei}), "r")
    if f then
      f:close()
      exists = true
    end
  end
  if exists then
    local src = pandoc.path.join({rel or ".", datei})
    return "![" .. titel .. "](" .. src .. "){.bild-screenshot fig-alt=\"" .. titel:gsub('"', "'") .. "\"}\n"
  end
  return "::: {.bild-platzhalter}\n**Screenshot folgt:** " .. titel .. ". "
    .. B.md(s.beschreibung) .. " Datei: `" .. datei .. "`.\n:::\n"
end

local function bildschirme()
  local parts = {}
  local here = B.page()
  for _, s in ipairs(B.screens()) do
    if B.str(s.seite) == here then
      parts[#parts + 1] = "### " .. B.str(s.titel) .. " {#bild-" .. B.str(s.key) .. "}\n"
      parts[#parts + 1] = bild_block(s)
    end
  end
  if #parts == 0 then
    quarto.log.warning("gl: no screens in begriffe.yml for page " .. here)
  end
  return table.concat(parts, "\n")
end

local function bild(key)
  local s = B.screen_index()[key]
  if s == nil then
    quarto.log.warning("gl: no screen '" .. key .. "' in begriffe.yml")
    return ""
  end
  return "::: {#bild-" .. key .. " .bild}\n" .. bild_block(s) .. ":::\n"
end

return {
  ["glossar"] = function(args, kwargs, meta)
    local mode = args[1] and pandoc.utils.stringify(args[1]) or "liste"
    local md
    if mode == "tabelle" then
      md = tabelle()
    elseif mode == "bildschirme" then
      md = bildschirme()
    elseif mode == "bild" then
      md = bild(args[2] and pandoc.utils.stringify(args[2]) or "")
    else
      md = liste()
    end
    return pandoc.read(md, "markdown").blocks
  end
}
