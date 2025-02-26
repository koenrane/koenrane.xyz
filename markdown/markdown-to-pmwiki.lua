-- markdown-to-pmwiki.lua
local stringify = pandoc.utils.stringify


-- HEADING-----------------------------------------------------------------
--function Header(elem)
--  local level = elem.level
--  local content = stringify(elem.content)
--  return pandoc.RawBlock('html', string.rep('!', level) .. ' ' .. content)
--end

function Header(el)
    local prefix = ""
    if el.level == 1 then
      prefix = "!"
    elseif el.level == 2 then
      prefix = "!!"
    elseif el.level == 3 then
      prefix = "!!!"
    else
      return el -- Keep other headers unchanged
    end

  -- Prepend the new prefix to the header text
  table.insert(el.content, 1, pandoc.Str(prefix .. " "))

  return el
end
--------------------------------------------------------------------



-- BOLD
function Strong(elem)
  return pandoc.Plain("'''" .. stringify(elem.content) .. "'''")
end

---ITALICS
function Emph(elem)
  return pandoc.Plain("''" .. stringify(elem.content) .. "''")
end

function Link(elem)
  local url = elem.target
  local text = stringify(elem.content)
  
  if url:match('^https?://') then
    return pandoc.Str('[[' .. url .. ' | ' .. text .. ']]')
  else
    return pandoc.Str('[[' .. url .. ' | ' .. text .. ']]')
  end
end

function Image(elem)
  local src = elem.src
  local alt = stringify(elem.caption)
  return pandoc.RawInline('[[Attach:' .. src .. ' | alt=' .. alt .. ']]')
end

function CodeBlock(elem)
  return pandoc.RawBlock('[@\n' .. elem.text .. '\n@]')
end

function Code(elem)
  return pandoc.RawInline('@@' .. elem.text .. '@@')
end


---ORDERED LIST-----------------------------------------------------

--function OrderedList(items)
--  local converted = {}
--  for _, item in ipairs(items) do
--    table.insert(converted, {pandoc.Plain('# ' .. stringify(item))})
--  end
--  return converted
--end

function OrderedList(items)
    local result = {}
    for _, item in ipairs(items) do
        local text = stringify(item) -- Convert list item to plain text
        table.insert(result, "# " .. text)
    end
    return { pandoc.Plain(table.concat(result, "\n")) } -- Return as plain text
end
--------------------------------------------------------------------




---BULLETED LIST-----------------------------------------------------

function BulletList(items)
  local converted = {}
  for _, item in ipairs(items) do
    table.insert(converted, {pandoc.Plain('* ' .. stringify(item))})
  end
  return converted
end

--------------------------------------------------------------------



function HorizontalRule()
  return pandoc.Plain('----')
end

function Table()
  -- Basic table conversion (PMWiki uses || separators)
  return function(elem)
    local rows = {}
    
    -- Header row
    local header = elem.headers[1]
    if header then
      local cells = {}
      for _, cell in ipairs(header) do
        table.insert(cells, stringify(cell.content))
      end
      table.insert(rows, '|| ' .. table.concat(cells, ' || ') .. ' ||')
    end
    
    -- Body rows
    for _, row in ipairs(elem.bodies) do
      local cells = {}
      for _, cell in ipairs(row[1].cells) do
        table.insert(cells, stringify(cell.content))
      end
      table.insert(rows, '|| ' .. table.concat(cells, ' || ') .. ' ||')
    end
    
    return pandoc.RawBlock('html', table.concat(rows, '\n'))
  end
end