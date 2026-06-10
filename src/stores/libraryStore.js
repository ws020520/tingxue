import { defineStore } from 'pinia'
import { db } from '../db'
import { importLegacyLibrary, exportLibrary } from '../db/migration'
import { parseNovelText } from '../utils/parser'
import { extractDocxText } from '../utils/docx'
import { uid, nowIso, wordCount, downloadText } from '../utils/text'
import { svgCover } from '../utils/covers'
import { clearPageCache } from '../utils/pagination'

async function readTextFile(file){
  const buf = await file.arrayBuffer()
  try { return new TextDecoder('utf-8', { fatal:true }).decode(buf) }
  catch { return new TextDecoder('gbk').decode(buf) }
}
async function fileToDataURL(file){
  return new Promise((res, rej) => { const r = new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(r.error); r.readAsDataURL(file) })
}

export const useLibraryStore = defineStore('library', {
  state: () => ({ books: [], loading: false, currentBook: null, chapters: [] }),
  getters: {
    sortedBooks: state => [...state.books].sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    totalWords: state => state.books.reduce((s,b)=>s+(b.wordCount||0),0)
  },
  actions: {
    async loadBooks(){ this.loading = true; try { this.books = await db.books.orderBy('updatedAt').reverse().toArray() } finally { this.loading = false } },
    async loadBook(bookId){ this.currentBook = await db.books.get(bookId); this.chapters = await db.chapters.where('bookId').equals(bookId).sortBy('index'); return this.currentBook },
    async getChapter(chapterId){ return db.chapters.get(chapterId) },
    async touchBook(bookId, updates = {}){ const book = await db.books.get(bookId); if (!book) return; const next = { ...book, ...updates, updatedAt: nowIso() }; await db.books.put(next); const i = this.books.findIndex(b => b.id === bookId); if (i >= 0) this.books[i] = next; if (this.currentBook?.id === bookId) this.currentBook = next },
    async updateBook(bookId, updates = {}){ await this.touchBook(bookId, updates); await this.loadBooks() },
    async updateChapter(chapterId, content, title){ const chapter = await db.chapters.get(chapterId); if (!chapter) return; const next = { ...chapter, content, title: title ?? chapter.title, wordCount: wordCount(content), updatedAt: nowIso() }; await db.chapters.put(next); await this.recountBook(chapter.bookId); clearPageCache(); return next },
    async appendChapter(bookId, { title, content, volume = '正文' }){ const count = await db.chapters.where('bookId').equals(bookId).count(); const chapter = { id: uid('chapter'), bookId, index: count, title: title || `第${count + 1}章`, volume, content, wordCount: wordCount(content), createdAt: nowIso(), updatedAt: nowIso() }; await db.chapters.put(chapter); await this.recountBook(bookId); clearPageCache(); return chapter },
    async deleteChapter(chapterId){ const ch = await db.chapters.get(chapterId); if(!ch) return; await db.chapters.delete(chapterId); const rows = await db.chapters.where('bookId').equals(ch.bookId).sortBy('index'); for(let i=0;i<rows.length;i++){ if(rows[i].index!==i) await db.chapters.update(rows[i].id,{ index:i }) } await this.recountBook(ch.bookId); clearPageCache() },
    async recountBook(bookId){ const chapters = await db.chapters.where('bookId').equals(bookId).toArray(); const sorted=[...chapters].sort((a,b)=>(a.index||0)-(b.index||0)); const wordTotal = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0); await this.touchBook(bookId, { chapterCount: chapters.length, wordCount: wordTotal, lastReadChapterId: sorted[0]?.id || '' }); if (this.currentBook?.id === bookId) await this.loadBook(bookId); else await this.loadBooks() },
    async createBookFromParsed(fileName, parsed, meta = {}){
      if(!parsed.chapters?.length) throw new Error(`${fileName} 没有解析到正文`)
      const bookId = uid('book')
      const chapters = parsed.chapters.map((ch, index) => ({ ...ch, id: ch.id || uid('chapter'), bookId, index, wordCount: ch.wordCount ?? wordCount(ch.content||''), createdAt: ch.createdAt || nowIso(), updatedAt: nowIso() }))
      const title = meta.title || parsed.title || fileName.replace(/\.(txt|md|text|docx)$/i, '')
      const tags = Array.isArray(meta.tags) ? meta.tags : String(meta.tags || '').split(/[，,\s]+/).filter(Boolean)
      const book = { id: bookId, title, author: meta.author || parsed.author || '本地作者', category: meta.category || '其他', status: meta.status || '连载中', tags: tags.length ? tags : [meta.category || '本地导入'], summary: meta.summary || '', source: meta.source || fileName, cover: meta.cover || svgCover(title, this.books.length), chapterCount: chapters.length, wordCount: chapters.reduce((s,c)=>s+(c.wordCount||0),0), lastReadChapterId: chapters[0]?.id || '', lastReadPageIndex: 0, createdAt: nowIso(), updatedAt: nowIso(), lastOpen: '' }
      await db.transaction('rw', db.books, db.chapters, async () => { await db.books.put(book); if (chapters.length) await db.chapters.bulkPut(chapters) })
      await this.loadBooks(); return book
    },
    async importTextFile(file, meta = {}){ if(!file) throw new Error('没有选择文件'); if(!/\.(txt|md|text)$/i.test(file.name)) throw new Error(`不支持的文件类型：${file.name}`); const text=(await readTextFile(file)).replace(/\uFEFF/g,'').trim(); if(!text) throw new Error(`${file.name} 是空文件`); return this.createBookFromParsed(file.name, parseNovelText(text, file.name), meta) },
    async importDocxFile(file, meta = {}){ if(!file) throw new Error('没有选择文件'); if(!/\.docx$/i.test(file.name)) throw new Error(`不是 DOCX 文件：${file.name}`); const text=(await extractDocxText(file)).trim(); if(!text) throw new Error(`${file.name} 没有解析到正文`); return this.createBookFromParsed(file.name, parseNovelText(text, file.name), meta) },
    async importFiles(files, meta = {}){ const result={books:0, chapters:0, errors:[]}; for(const file of files){ try{ const book = /\.docx$/i.test(file.name) ? await this.importDocxFile(file, meta) : await this.importTextFile(file, meta); result.books++; result.chapters += book.chapterCount||0 }catch(err){ result.errors.push(`${file.name}: ${err.message}`) } } return result },
    async appendFiles(bookId, files){ const result={chapters:0, errors:[]}; for(const file of files){ try{ const text = /\.docx$/i.test(file.name) ? await extractDocxText(file) : await readTextFile(file); const parsed=parseNovelText(text, file.name); for(const ch of parsed.chapters) { await this.appendChapter(bookId, { title: ch.title, content: ch.content, volume: ch.volume }) ; result.chapters++ } } catch(err){ result.errors.push(`${file.name}: ${err.message}`) } } return result },
    async createBlankBook(meta = {}){ return this.createBookFromParsed(meta.title || '未命名小说.txt', { title: meta.title || '未命名小说', author: meta.author || '本地作者', chapters: [{ id: uid('chapter'), title:'正文', volume:'正文', content:'', wordCount:0, createdAt:nowIso(), updatedAt:nowIso() }] }, meta) },
    async setBookCover(bookId, file){ const cover = typeof file === 'string' ? file : await fileToDataURL(file); await this.touchBook(bookId, { cover }); await this.loadBooks() },
    async resetBookCover(bookId){ const book = await db.books.get(bookId); await this.touchBook(bookId, { cover: svgCover(book?.title || '归棠', Math.floor(Math.random()*5)) }); await this.loadBooks() },
    async importLegacyFile(file, opts = {}){ const json = JSON.parse(await file.text()); const result = await importLegacyLibrary(json, opts); await this.loadBooks(); return result },
    async importBundledLegacy(opts = {}){ const res = await fetch('./library.json'); if (!res.ok) throw new Error('没有找到 public/library.json'); const result = await importLegacyLibrary(await res.json(), opts); await this.loadBooks(); return result },
    async importBackupFile(file, opts = { overwrite: true }){ const json = JSON.parse(await file.text()); const result = await importLegacyLibrary(json, opts); await this.loadBooks(); return result },
    async exportBackup(){ const data = await exportLibrary(); downloadText(`guitang-v3-backup-${Date.now()}.json`, JSON.stringify(data, null, 2)) },
    async exportBookTxt(bookId){ const book = await db.books.get(bookId); if(!book) throw new Error('未找到小说'); const chapters = await db.chapters.where('bookId').equals(bookId).sortBy('index'); let txt = `${book.title}\n`; if(book.author) txt += `作者：${book.author}\n`; txt += '\n'; for(const ch of chapters){ txt += `${ch.title}\n\n${(ch.content||'').trim()}\n\n` } downloadText(`${book.title}.txt`, '\uFEFF'+txt, 'text/plain;charset=utf-8') },
    async deleteBook(bookId){ await db.transaction('rw', db.books, db.chapters, db.readingProgress, db.aiMemories, db.aiDrafts, db.aiHistory, db.notes, db.bookmarks, async () => { await db.books.delete(bookId); await db.chapters.where('bookId').equals(bookId).delete(); await db.readingProgress.delete(bookId); await db.aiMemories.delete(bookId); await db.aiDrafts.where('bookId').equals(bookId).delete(); await db.aiHistory.where('bookId').equals(bookId).delete(); await db.notes.where('bookId').equals(bookId).delete(); await db.bookmarks.where('bookId').equals(bookId).delete() }); await this.loadBooks() }
  }
})
