export function splitResult(text = ''){
  const [analysis, ...rest] = String(text).split('---RESULT---')
  return { analysis: rest.length ? analysis.trim() : '', result: (rest.length ? rest.join('---RESULT---') : text).trim() }
}

export function parseChapter(text = ''){
  const cleaned = String(text).trim()
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)
  const title = lines[0]?.slice(0, 80) || `AI续写 ${new Date().toLocaleTimeString('zh-CN')}`
  const content = cleaned.replace(lines[0] || '', '').trim() || cleaned
  return { title, content }
}
