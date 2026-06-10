const pageCache = new Map()
const MAX_CACHE = 120

function cacheKey({ chapterId, content, fontSize, lineHeight, widthKey = 'reader' }){
  return [chapterId, fontSize, lineHeight, widthKey, content.length].join('|')
}

export function clearPageCache(){ pageCache.clear() }

export function paginateChapter({ chapterId, content = '', fontSize = 18, lineHeight = 1.9, widthKey = 'reader' }){
  const key = cacheKey({ chapterId, content, fontSize, lineHeight, widthKey })
  if (pageCache.has(key)) return pageCache.get(key)
  const charsPerPage = estimateCharsPerPage(fontSize, lineHeight)
  const paragraphs = String(content || '').split(/\n+/).filter(Boolean)
  const pages = []
  let buf = ''
  for (const p of paragraphs) {
    const next = buf ? `${buf}\n\n${p}` : p
    if (next.length > charsPerPage && buf) {
      pages.push(buf)
      buf = p
    } else {
      buf = next
    }
    while (buf.length > charsPerPage * 1.25) {
      pages.push(buf.slice(0, charsPerPage))
      buf = buf.slice(charsPerPage)
    }
  }
  if (buf) pages.push(buf)
  const result = pages.length ? pages : ['']
  pageCache.set(key, result)
  if (pageCache.size > MAX_CACHE) pageCache.delete(pageCache.keys().next().value)
  return result
}

function estimateCharsPerPage(fontSize, lineHeight){
  const linePx = fontSize * lineHeight
  const availableHeight = 620
  const availableWidth = 820
  const charsPerLine = Math.max(18, Math.floor(availableWidth / (fontSize * 1.08)))
  const lines = Math.max(8, Math.floor(availableHeight / linePx))
  return Math.max(360, Math.floor(charsPerLine * lines * 0.82))
}
