-- Shared loader for the glossary shortcodes. Reads begriffe.yml at the
-- project root through pandoc's YAML parser, so the file needs no other
-- tool. Every entry is a map with the fields documented in begriffe.yml.

local M = {}

local entries = nil
local root = nil
local offset = nil

-- Inside a project render Quarto tells us where the project is. A single
-- file render or preview from an editor does not, so walk up from the
-- document until begriffe.yml is found.
function M.find_root()
  if root ~= nil then return root, offset end
  if quarto.project ~= nil and quarto.project.directory ~= nil then
    root, offset = quarto.project.directory, quarto.project.offset or "."
    return root, offset
  end
  local dir = pandoc.path.directory(quarto.doc.input_file)
  local rel = "."
  for _ = 1, 8 do
    local f = io.open(pandoc.path.join({dir, "begriffe.yml"}), "r")
    if f then
      f:close()
      root, offset = dir, rel
      return root, offset
    end
    local parent = pandoc.path.directory(dir)
    if parent == dir then break end
    dir = parent
    rel = (rel == ".") and ".." or (rel .. "/..")
  end
  return nil, nil
end

function M.load()
  if entries ~= nil then return entries end
  entries = {}
  local dir = M.find_root()
  if dir == nil then
    quarto.log.warning("gl: begriffe.yml not found above " .. tostring(quarto.doc.input_file))
    return entries
  end
  local path = pandoc.path.join({dir, "begriffe.yml"})
  local f = io.open(path, "r")
  if not f then
    quarto.log.warning("gl: cannot open " .. path)
    return entries
  end
  local content = "---\n" .. f:read("*a") .. "\n---\n"
  f:close()
  local meta = pandoc.read(content, "markdown").meta
  local list = meta.begriffe
  if list == nil then
    quarto.log.warning("gl: begriffe.yml has no top-level key 'begriffe'")
    return entries
  end
  for _, item in ipairs(list) do
    entries[#entries + 1] = item
  end
  return entries
end

function M.str(v)
  if v == nil then return "" end
  return pandoc.utils.stringify(v)
end

-- Markdown source of a metadata value, so formatting such as `code` or
-- **bold** written in begriffe.yml survives into the generated pages.
function M.md(v)
  if v == nil then return "" end
  local doc
  if v.t == "MetaBlocks" then
    doc = pandoc.Pandoc(v)
  elseif v.t == "MetaInlines" then
    doc = pandoc.Pandoc({pandoc.Para(v)})
  else
    doc = pandoc.Pandoc({pandoc.Para({pandoc.Str(pandoc.utils.stringify(v))})})
  end
  local out = pandoc.write(doc, "markdown", {wrap_text = "none"})
  return (out:gsub("%s+$", ""))
end

function M.html(v)
  if v == nil then return "" end
  local doc
  if v.t == "MetaBlocks" then
    doc = pandoc.Pandoc(v)
  elseif v.t == "MetaInlines" then
    doc = pandoc.Pandoc({pandoc.Para(v)})
  else
    doc = pandoc.Pandoc({pandoc.Para({pandoc.Str(pandoc.utils.stringify(v))})})
  end
  local out = pandoc.write(doc, "html")
  return (out:gsub("%s+$", ""))
end

function M.slug(term)
  local s = string.lower(term)
  s = s:gsub("[^%w]+", "-"):gsub("^%-+", ""):gsub("%-+$", "")
  return s
end

-- term (lowercase) -> entry, with aliases resolved to the same entry.
function M.index()
  local idx = {}
  for _, e in ipairs(M.load()) do
    local term = string.lower(M.str(e.term))
    idx[term] = e
    if e.aliases ~= nil then
      for _, a in ipairs(e.aliases) do
        idx[string.lower(M.str(a))] = e
      end
    end
  end
  return idx
end

return M
