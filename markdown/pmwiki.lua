-- pmwiki.lua
function Header(e)
    local level = e.level
    local content = pandoc.utils.stringify(e.content)
    return pandoc.RawBlock('html', string.rep('!', level) .. ' ' .. content)
  end
  
  function Strong(e)
    return pandoc.RawInline('html', '__' .. pandoc.utils.stringify(e.content) .. '__')
  end
  
  function Emph(e)
    return pandoc.RawInline('html', '_' .. pandoc.utils.stringify(e.content) .. '_')
  end
  
  function Link(e)
    local url = e.target
    local text = pandoc.utils.stringify(e.content)
    if string.match(url, '^https?://') then
      -- External link: [url text]
      return pandoc.RawInline('html', '[' .. url .. ' ' .. text .. ']')
    else
      -- Internal link: [[pagename | text]]
      return pandoc.RawInline('html', '[[' .. url .. ' | ' .. text .. ']]')
    end
  end
  
  function Image(e)
    local src = e.src
    local alt = pandoc.utils.stringify(e.caption)
    return pandoc.RawInline('html', '[[Attach:' .. src .. ' | alt=' .. alt .. ']]')
  end
  
  function CodeBlock(e)
    return pandoc.RawBlock('html', '[@\n' .. e.text .. '\n@]')
  end
  
  function OrderedList(items)
    local converted = {}
    for _, item in ipairs(items) do
      table.insert(converted, { pandoc.RawBlock('html', '# ' .. pandoc.utils.stringify(item)) })
    end
    return converted
  end
  
  function BulletList(items)
    local converted = {}
    for _, item in ipairs(items) do
      table.insert(converted, { pandoc.RawBlock('html', '* ' .. pandoc.utils.stringify(item)) })
    end
    return converted
  end
  
  function Table()
    -- Tables require more complex handling; this is a simplified version.
    -- You may need to extend this for your use case.
    return pandoc.RawBlock('html', '|| Replace with PMWiki table syntax ||')
  end