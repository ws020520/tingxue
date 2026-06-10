import { db } from './index'
import { uid, nowIso, wordCount } from '../utils/text'

function normalizeChapter(chapter, index, bookId){
  return {
    id: chapter.id || uid('chapter'),
    bookId,
    index,
    title: chapter.title || `第${index + 1}章`,
    volume: chapter.volume || '正文',
    content: chapter.content || '',
    wordCount: wordCount(chapter.content || ''),
    createdAt: chapter.createdAt || nowIso(),
    updatedAt: chapter.updatedAt || nowIso()
  }
}

export async function importLegacyLibrary(legacyJson, { overwrite = false } = {}){
  const books = Array.isArray(legacyJson?.books) ? legacyJson.books : []
  if (!books.length) throw new Error('没有识别到 books 数组')
  if (overwrite) {
    await db.books.clear()
    await db.chapters.clear()
    await db.readingProgress.clear()
    await db.aiMemories.clear()
    await db.characterCards.clear()
    await db.styleSamples.clear()
  }
  const result = { books: 0, chapters: 0, skipped: 0 }
  for (const legacyBook of books) {
    const exists = await db.books.get(legacyBook.id)
    if (exists && !overwrite) { result.skipped++; continue }
    const bookId = legacyBook.id || uid('book')
    const chapters = (legacyBook.chapters || []).map((ch, index) => normalizeChapter(ch, index, bookId))
    const wordTotal = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    const summary = {
      id: bookId,
      title: legacyBook.title || '未命名小说',
      author: legacyBook.author || '佚名',
      category: legacyBook.category || '其他',
      status: legacyBook.status || '连载中',
      tags: legacyBook.tags || [],
      summary: legacyBook.summary || '',
      source: legacyBook.source || '旧版导入',
      cover: legacyBook.cover || '',
      chapterCount: chapters.length,
      wordCount: wordTotal,
      lastReadChapterId: chapters[legacyBook.progress?.chapterIndex || 0]?.id || chapters[0]?.id || '',
      lastReadPageIndex: legacyBook.progress?.pageIndex || 0,
      createdAt: legacyBook.createdAt || nowIso(),
      updatedAt: legacyBook.updatedAt || nowIso(),
      lastOpen: legacyBook.lastOpen || ''
    }
    await db.transaction('rw', db.books, db.chapters, db.readingProgress, db.aiMemories, db.styleSamples, async () => {
      await db.books.put(summary)
      if (chapters.length) await db.chapters.bulkPut(chapters)
      await db.readingProgress.put({
        bookId,
        chapterId: summary.lastReadChapterId,
        pageIndex: summary.lastReadPageIndex,
        updatedAt: nowIso()
      })
      await db.aiMemories.put({
        bookId,
        outline: legacyBook.outline || '',
        roles: legacyBook.roles || '',
        world: '',
        timeline: '',
        rules: '',
        forbidden: '',
        updatedAt: nowIso()
      })
      for (const ref of legacyBook.referenceTexts || []) {
        await db.styleSamples.put({
          id: uid('style'), bookId, name: ref.name || '旧版参考文本', text: ref.text || '', createdAt: nowIso(), updatedAt: nowIso()
        })
      }
    })
    result.books++
    result.chapters += chapters.length
  }
  return result
}

export async function exportLibrary(){
  const books = await db.books.orderBy('updatedAt').reverse().toArray()
  const packed = []
  for (const book of books) {
    const chapters = await db.chapters.where('bookId').equals(book.id).sortBy('index')
    const memory = await db.aiMemories.get(book.id)
    const styleSamples = await db.styleSamples.where('bookId').equals(book.id).toArray()
    packed.push({ ...book, chapters, outline: memory?.outline || '', roles: memory?.roles || '', referenceTexts: styleSamples })
  }
  return { version: 2, exportedAt: nowIso(), books: packed }
}
