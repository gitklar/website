-- gl: glossary term with a popover definition and a link to the full entry.
--
--   {{< gl commit >}}                       shows "commit"
--   {{< gl commit display="Commits" >}}     shows "Commits", defines "commit"
--
-- Definitions come from begriffe.yml at the project root (field bedeutung).
-- Hover or keyboard focus opens a Bootstrap popover with the definition; a
-- click follows the link to the entry on glossar.html.

local B = dofile(pandoc.path.join({pandoc.path.directory(PANDOC_SCRIPT_FILE), "begriffe.lua"}))

return {
  ["gl"] = function(args, kwargs, meta)
    local shown = pandoc.utils.stringify(args[1])
    local term = string.lower(shown)
    -- Quarto passes an absent keyword as an empty Inlines list, not as nil.
    if kwargs.display ~= nil then
      local d = pandoc.utils.stringify(kwargs.display)
      if d ~= "" then shown = d end
    end

    if not quarto.doc.isFormat("html:js") then
      return pandoc.Str(shown)
    end

    local entry = B.index()[term]
    if entry == nil then
      quarto.log.warning("gl: no entry in begriffe.yml for '" .. term .. "'")
      return pandoc.Str(shown)
    end

    quarto.doc.add_html_dependency({
      name = "gl",
      version = "1.1.0",
      stylesheets = {"gl.css"},
      scripts = {"gl.js"}
    })

    local key = B.str(entry.term)
    local _, rel = B.find_root()
    local href = pandoc.path.join({rel or ".", "glossar.html"}) .. "#gl-" .. B.slug(key)
    local attr = pandoc.Attr("", {"gl"}, {
      ["data-bs-toggle"] = "popover",
      ["data-bs-trigger"] = "hover focus",
      ["data-bs-html"] = "true",
      ["data-bs-placement"] = "top",
      ["data-bs-title"] = key,
      ["data-bs-content"] = B.html(entry.bedeutung)
    })
    return pandoc.Link({pandoc.Str(shown)}, href, "", attr)
  end
}
