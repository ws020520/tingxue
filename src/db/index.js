import Dexie from 'dexie'

export const db = new Dexie('guitang_reader_v3_clean')

const schemaV1 = {
  books: 'id, title, author, category, status, updatedAt, lastOpen, createdAt',
  chapters: 'id, bookId, [bookId+index], index, title, updatedAt',
  readingProgress: 'bookId, chapterId, updatedAt',
  settings: 'key',
  aiSettings: 'key',
  aiHistory: 'id, bookId, chapterId, type, createdAt',
  aiDrafts: 'id, bookId, chapterId, type, status, createdAt',
  aiMemories: 'bookId, updatedAt',
  characterCards: 'id, bookId, name, updatedAt',
  styleSamples: 'id, bookId, name, updatedAt',
  plotThreads: 'id, bookId, status, updatedAt'
}

db.version(1).stores(schemaV1)

db.version(2).stores({
  ...schemaV1,
  notes: 'id, bookId, chapterId, createdAt',
  bookmarks: 'id, bookId, chapterId, createdAt',
  syncLogs: 'id, type, createdAt'
})

export async function clearAllData(){
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear()
  })
}
