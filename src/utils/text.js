export function uid(prefix = 'id'){
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function nowIso(){ return new Date().toISOString() }

export function wordCount(text = ''){
  return (String(text).match(/[\u4e00-\u9fa5]|[A-Za-z0-9]+/g) || []).length
}

export function escapeHtml(text = ''){
  return String(text).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
}

export function clampText(text = '', max = 8000){
  const s = String(text || '')
  return s.length > max ? s.slice(0, max) + '\n……（已截断）' : s
}

export function downloadText(filename, text, type = 'application/json'){
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatDate(iso){
  if(!iso) return '从未打开'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '未知时间'
  return d.toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
}
