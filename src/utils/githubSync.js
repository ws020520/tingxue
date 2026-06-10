import { exportLibrary, importLegacyLibrary } from '../db/migration'
import { db } from '../db'
import { uid, nowIso } from './text'

function apiBase(sync){ return `https://api.github.com/repos/${sync.owner}/${sync.repo}/contents/${sync.file}` }
function rawUrl(sync){ return `https://raw.githubusercontent.com/${sync.owner}/${sync.repo}/${sync.branch}/${sync.file}` }

export async function pullLibraryFromGitHub(sync, { overwrite = true } = {}){
  if(!sync?.owner || !sync?.repo) throw new Error('请先填写 GitHub 仓库信息')
  const res = await fetch(rawUrl(sync), { cache:'no-store' })
  if(!res.ok) throw new Error(`拉取失败：${res.status}`)
  const json = await res.json()
  const result = await importLegacyLibrary(json, { overwrite })
  await db.syncLogs.put({ id: uid('sync'), type:'pull', message:`拉取 ${result.books} 本`, createdAt: nowIso() })
  return result
}

export async function pushLibraryToGitHub(sync){
  if(!sync?.token) throw new Error('请先填写 GitHub Token')
  const data = await exportLibrary()
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
  let sha = ''
  const check = await fetch(apiBase(sync), { headers: { Authorization: `Bearer ${sync.token}`, Accept:'application/vnd.github+json' } }).catch(() => null)
  if(check?.ok){ const row = await check.json(); sha = row.sha || '' }
  const body = { message: '同步归棠数据', content, branch: sync.branch || 'main' }
  if(sha) body.sha = sha
  const res = await fetch(apiBase(sync), { method:'PUT', headers:{ Authorization:`Bearer ${sync.token}`, Accept:'application/vnd.github+json', 'Content-Type':'application/json' }, body: JSON.stringify(body) })
  if(!res.ok){ const text = await res.text().catch(()=> ''); throw new Error(`推送失败：${res.status} ${text.slice(0,120)}`) }
  await db.syncLogs.put({ id: uid('sync'), type:'push', message:`推送 ${data.books.length} 本`, createdAt: nowIso() })
  return await res.json()
}
