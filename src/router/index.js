import { createRouter, createWebHashHistory } from 'vue-router'
import LibraryView from '../views/LibraryView.vue'
import ImportView from '../views/ImportView.vue'
import ReaderView from '../views/ReaderView.vue'
import AiWorkbenchView from '../views/AiWorkbenchView.vue'
import SettingsView from '../views/SettingsView.vue'
import CatalogView from '../views/CatalogView.vue'
import CoverWorkshopView from '../views/CoverWorkshopView.vue'

const routes = [
  { path: '/', name: 'library', component: LibraryView, meta: { title: '我的书架' } },
  { path: '/import', name: 'import', component: ImportView, meta: { title: '导入小说' } },
  { path: '/reader/:bookId?/:chapterId?', name: 'reader', component: ReaderView, meta: { title: '阅读器' } },
  { path: '/catalog/:bookId?', name: 'catalog', component: CatalogView, meta: { title: '目录分卷' } },
  { path: '/covers', name: 'covers', component: CoverWorkshopView, meta: { title: '封面工坊' } },
  { path: '/ai/:bookId?', name: 'ai', component: AiWorkbenchView, meta: { title: 'AI 创作' } },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '设置' } }
]

export default createRouter({ history: createWebHashHistory(), routes })
