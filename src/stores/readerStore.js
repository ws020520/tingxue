import { defineStore } from 'pinia'
import { db } from '../db'
import { nowIso } from '../utils/text'
import { paginateChapter } from '../utils/pagination'

export const useReaderStore = defineStore('reader', {
  state: () => ({ book: null, chapters: [], chapter: null, pageIndex: 0, pages: [], loading: false }),
  getters: {
    chapterIndex: state => state.chapters.findIndex(ch => ch.id === state.chapter?.id),
    progressText: state => `${Math.min(state.pageIndex + 1, state.pages.length || 1)} / ${state.pages.length || 1}`
  },
  actions: {
    async open(bookId, chapterId, readerSettings){
      this.loading = true
      try {
        this.book = await db.books.get(bookId)
        this.chapters = await db.chapters.where('bookId').equals(bookId).sortBy('index')
        const progress = await db.readingProgress.get(bookId)
        const targetId = chapterId || progress?.chapterId || this.book?.lastReadChapterId || this.chapters[0]?.id
        await this.openChapter(targetId, readerSettings, progress?.pageIndex || this.book?.lastReadPageIndex || 0)
        if (this.book) await db.books.update(bookId, { lastOpen: nowIso() })
      } finally { this.loading = false }
    },
    async openChapter(chapterId, readerSettings, pageIndex = 0){
      this.chapter = await db.chapters.get(chapterId)
      this.pages = paginateChapter({ chapterId, content: this.chapter?.content || '', fontSize: readerSettings.fontSize, lineHeight: readerSettings.lineHeight })
      this.pageIndex = Math.min(Math.max(0, pageIndex), Math.max(0, this.pages.length - 1))
      await this.saveProgress()
    },
    async nextPage(readerSettings){
      if (this.pageIndex < this.pages.length - 1) { this.pageIndex++; await this.saveProgress(); return }
      await this.nextChapter(readerSettings)
    },
    async prevPage(readerSettings){
      if (this.pageIndex > 0) { this.pageIndex--; await this.saveProgress(); return }
      await this.prevChapter(readerSettings)
    },
    async nextChapter(readerSettings){
      const idx = this.chapterIndex
      const next = this.chapters[idx + 1]
      if (next) await this.openChapter(next.id, readerSettings, 0)
    },
    async prevChapter(readerSettings){
      const idx = this.chapterIndex
      const prev = this.chapters[idx - 1]
      if (prev) await this.openChapter(prev.id, readerSettings, 0)
    },
    async repaginate(readerSettings){
      if (!this.chapter) return
      const old = this.pageIndex
      this.pages = paginateChapter({ chapterId: this.chapter.id, content: this.chapter.content || '', fontSize: readerSettings.fontSize, lineHeight: readerSettings.lineHeight })
      this.pageIndex = Math.min(old, this.pages.length - 1)
      await this.saveProgress()
    },
    async saveProgress(){
      if (!this.book || !this.chapter) return
      await db.readingProgress.put({ bookId: this.book.id, chapterId: this.chapter.id, pageIndex: this.pageIndex, updatedAt: nowIso() })
      await db.books.update(this.book.id, { lastReadChapterId: this.chapter.id, lastReadPageIndex: this.pageIndex, updatedAt: nowIso() })
    }
  }
})
