import { uid, nowIso, wordCount } from './text'

function isVolumeTitle(line){
  return /^([第卷]\s*[零〇一二三四五六七八九十百千万两\d]+\s*[卷部集篇]|卷\s*[零〇一二三四五六七八九十百千万两\d]+|正文|上卷|下卷|番外卷)/.test(line) && line.length < 50
}
function isChapterTitle(line){
  return /^(第\s*[零〇一二三四五六七八九十百千万两\d]+\s*[章节回集篇]\s*.{0,55}|Chapter\s*\d+\s*.{0,55}|CHAPTER\s*\d+\s*.{0,55}|\d+[\.、]\s*.{0,55}|序章|楔子|引子|番外.{0,40}|后记.{0,40})$/i.test(line) && line.length < 75
}

export function parseNovelText(raw, filename = '未命名.txt'){
  let text = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/[\t\u00A0]+/g, ' ').replace(/\n{4,}/g, '\n\n').trim()
  if(!text) return { title: filename.replace(/\.(txt|md|text|docx)$/i,''), chapters: [] }
  const lines = text.split('\n').map(x=>x.trim()).filter(Boolean)
  let title = filename.replace(/\.(txt|md|text|docx)$/i,'') || '未命名小说'
  for (const l of lines.slice(0, 20)) {
    if (l.length > 1 && l.length < 30 && !isChapterTitle(l) && !isVolumeTitle(l)) { title = l; break }
  }
  let volume='正文'; let cur=null; const chapters=[]
  function push(){
    if(cur){
      cur.content = cur.content.trim()
      cur.wordCount = wordCount(cur.content)
      cur.updatedAt = cur.updatedAt || nowIso()
      cur.createdAt = cur.createdAt || nowIso()
      if(cur.content || cur.title) chapters.push(cur)
      cur=null
    }
  }
  for(const line of lines){
    if(isVolumeTitle(line)){ push(); volume=line; continue }
    if(isChapterTitle(line)){ push(); cur={ id:uid('chapter'), title:line, volume, content:'' }; continue }
    if(!cur) cur={ id:uid('chapter'), title:'正文', volume, content:'' }
    cur.content += (cur.content?'\n':'') + line
  }
  push()
  if(chapters.length <= 1 && text.length > 7000){
    const chunks=[]
    for(let i=0;i<text.length;i+=4200){
      const content=text.slice(i,i+4200).trim()
      chunks.push({ id:uid('chapter'), title:`第 ${chunks.length+1} 章`, volume:'正文', content, wordCount:wordCount(content), createdAt:nowIso(), updatedAt:nowIso() })
    }
    return { title, author:'未知作者', chapters:chunks }
  }
  return { title, author:'未知作者', chapters: chapters.length ? chapters : [{ id:uid('chapter'), title:'正文', volume:'正文', content:text, wordCount:wordCount(text), createdAt:nowIso(), updatedAt:nowIso() }] }
}
