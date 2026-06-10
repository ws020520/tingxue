import { db } from '../../db'

export async function buildBookContext(bookId, { recentCount = 3 } = {}){
  const book = await db.books.get(bookId)
  const chapters = await db.chapters.where('bookId').equals(bookId).sortBy('index')
  const memory = await db.aiMemories.get(bookId)
  const styleSamples = await db.styleSamples.where('bookId').equals(bookId).toArray()
  const characterCards = await db.characterCards.where('bookId').equals(bookId).toArray()
  const plotThreads = await db.plotThreads.where('bookId').equals(bookId).toArray()
  const recentChapters = chapters.slice(Math.max(0, chapters.length - recentCount))
  return { book, chapters, memory, styleSamples, characterCards, plotThreads, recentChapters }
}
