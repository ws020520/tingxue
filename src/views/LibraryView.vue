<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from '../components/BookCard.vue'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'

const router = useRouter()
const library = useLibraryStore()
const toast = useToastStore()
const search = ref('')
const filter = ref('全部')
const viewMode = ref('grid')
const batch = ref(false)
const selected = ref(new Set())
const cats = computed(() => ['全部', ...Array.from(new Set(library.books.flatMap(b => [b.category || '其他', ...(b.tags || [])]).filter(Boolean))).slice(0, 10)])
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return library.sortedBooks.filter(b => {
    const catOk = filter.value === '全部' || b.category === filter.value || (b.tags || []).includes(filter.value)
    const qOk = !q || [b.title,b.author,b.category,b.summary,(b.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)
    return catOk && qOk
  })
})
function open(book){ if(batch.value){ toggle(book); return } router.push(`/reader/${book.id}/${book.lastReadChapterId || ''}`) }
function ai(book){ router.push(`/ai/${book.id}`) }
function catalog(book){ router.push(`/catalog/${book.id}`) }
async function del(book){ if (!confirm(`删除《${book.title}》？此操作会删除章节正文和 AI 草稿。`)) return; await library.deleteBook(book.id); toast.show('已删除') }
function toggle(book){ const s = new Set(selected.value); s.has(book.id) ? s.delete(book.id) : s.add(book.id); selected.value = s }
async function batchDelete(){ if(!selected.value.size) return toast.show('还没有选择书籍'); if(!confirm(`删除选中的 ${selected.value.size} 本书？`)) return; for(const id of selected.value) await library.deleteBook(id); selected.value = new Set(); batch.value = false; toast.show('批量删除完成') }
async function exportBook(book){ await library.exportBookTxt(book.id); toast.show('已导出 TXT') }
</script>

<template>
  <section class="page library-page">
    <div class="hero-card">
      <div><h2>归棠书架</h2><p>浅绿色本地阅读器 · 长篇小说创作工作台 · AI 草稿不覆盖正文</p></div>
      <div class="hero-stats"><span>{{ library.books.length }} 本</span><span>{{ library.totalWords.toLocaleString('zh-CN') }} 字</span><span>IndexedDB</span></div>
    </div>
    <div class="page-head compact">
      <div class="toolbar">
        <input v-model="search" class="input search" placeholder="搜索书名 / 作者 / 分类 / 标签" />
        <RouterLink to="/import" class="btn primary">导入小说</RouterLink>
        <button class="btn ghost" @click="batch=!batch">{{ batch ? '退出批量' : '批量管理' }}</button>
        <button v-if="batch" class="btn danger" @click="batchDelete">删除选中 {{ selected.size }}</button>
      </div>
      <div class="toolbar"><button class="btn" :class="{primary:viewMode==='grid'}" @click="viewMode='grid'">宫格</button><button class="btn" :class="{primary:viewMode==='list'}" @click="viewMode='list'">列表</button></div>
    </div>
    <div class="chips"><button v-for="c in cats" :key="c" class="chip" :class="{active:filter===c}" @click="filter=c">{{ c }}</button></div>
    <div v-if="!filtered.length" class="empty panel"><div><b>书架还是空的</b><p>进入导入页，可以导入 TXT、DOCX、文件夹或旧版 library.json。</p></div></div>
    <div v-else class="cards-scroll">
      <div v-if="viewMode==='grid'" class="grid">
        <BookCard v-for="book in filtered" :key="book.id" :book="book" :selected="selected.has(book.id)" :batch="batch" @open="open" @ai="ai" @catalog="catalog" @delete="del" @export="exportBook" />
      </div>
      <div v-else class="list-view">
        <article v-for="book in filtered" :key="book.id" class="list-row" @click="open(book)">
          <img :src="book.cover" /><div><b>{{ book.title }}</b><p>{{ book.author || '佚名' }} · {{ book.chapterCount || 0 }} 章 · {{ (book.wordCount||0).toLocaleString('zh-CN') }} 字</p></div>
          <span class="pill">{{ book.category || '其他' }}</span><button class="btn ghost" @click.stop="ai(book)">AI</button><button class="btn ghost" @click.stop="catalog(book)">目录</button>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-card{display:flex;justify-content:space-between;gap:16px;align-items:center;border:1px solid #dce8d6;border-radius:26px;padding:20px 22px;margin-bottom:16px;background:linear-gradient(135deg,rgba(238,248,232,.95),rgba(255,254,248,.9) 50%,rgba(224,241,218,.65));box-shadow:0 16px 36px rgba(46,84,42,.10)}.hero-card h2{margin:0 0 6px;font-size:28px}.hero-card p{margin:0;color:#60705d}.hero-stats{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.hero-stats span{height:36px;border-radius:999px;background:#fffef8;border:1px solid #d5e4cd;color:#2f6f35;font-weight:900;padding:0 14px;display:flex;align-items:center}.compact{margin-bottom:10px}.chips{display:flex;gap:8px;overflow:auto;padding-bottom:10px;margin-bottom:10px}.chip{height:36px;border:1px solid #dce7d5;background:#fffef8;border-radius:999px;padding:0 16px;font-weight:800;color:#40513f;white-space:nowrap}.chip.active{background:#2f7437;color:#fff}.list-view{display:flex;flex-direction:column;gap:10px}.list-row{display:grid;grid-template-columns:54px minmax(0,1fr) auto auto auto;gap:12px;align-items:center;border:1px solid #dce7d5;border-radius:18px;background:#fffef8;padding:10px;cursor:pointer}.list-row img{width:54px;height:72px;border-radius:10px;object-fit:cover}.list-row p{margin:5px 0 0;color:#687466}.library-page{gap:0}
</style>
