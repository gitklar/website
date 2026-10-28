-- glossar: renders begriffe.yml as a page.
--
--   {{< glossar liste >}}     definition list, grouped, for glossar.qmd
--   {{< glossar tabelle >}}   side-by-side table, grouped, for begriffe.qmd
--
-- Both read the same file, so the glossary and the table never drift apart.

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
      parts[#parts + 1] = "| " .. cell(link) .. " | " .. cell(ue) .. " | " .. cell(B.md(e.kurz)) .. " | " .. cell(wo) .. " |"
    end
    parts[#parts + 1] = "\n: {tbl-colwidths=\"[18,22,28,32]\"}\n"
  end
  return table.concat(parts, "\n")
end

return {
  ["glossar"] = function(args, kwargs, meta)
    local mode = args[1] and pandoc.utils.stringify(args[1]) or "liste"
    local md
    if mode == "tabelle" then md = tabelle() else md = liste() end
    return pandoc.read(md, "markdown").blocks
  end
}
