<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VirtualTocList from '../components/VirtualTocList.vue'
import { useReaderStore } from '../stores/readerStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'
import { db } from '../db'
import { uid, nowIso } from '../utils/text'

const route = useRoute(); const router = useRouter(); const reader = useReaderStore(); const settings = useSettingsStore(); const library = useLibraryStore(); const toast = useToastStore()
const notes = ref([]); const bookmarks = ref([]); const editing = ref(false); const editTitle = ref(''); const editContent = ref('')
const pageText = computed(() => reader.pages[reader.pageIndex] || '')
const contentStyle = computed(() => ({ fontSize: settings.reader.fontSize + 'px', lineHeight: settings.reader.lineHeight }))
async function loadSide(){ if(!reader.book) return; notes.value = await db.notes.where('bookId').equals(reader.book.id).reverse().toArray().catch(()=>[]); bookmarks.value = await db.bookmarks.where('bookId').equals(reader.book.id).reverse().toArray().catch(()=>[]) }
async function openChapter(ch){ await reader.openChapter(ch.id, settings.reader, 0); router.replace(`/reader/${reader.book.id}/${ch.id}`); await loadSide() }
async function keyHandler(e){ if (e.key === 'ArrowRight') await next(); if (e.key === 'ArrowLeft') await prev() }
async function next(){ await reader.nextPage(settings.reader); router.replace(`/reader/${reader.book.id}/${reader.chapter.id}`) }
async function prev(){ await reader.prevPage(settings.reader); router.replace(`/reader/${reader.book.id}/${reader.chapter.id}`) }
async function sendToAI(){ router.push(`/ai/${reader.book.id}?chapterId=${reader.chapter.id}`) }
async function saveFont(delta){ await settings.saveReader({ fontSize: Math.min(28, Math.max(14, settings.reader.fontSize + delta)) }); await reader.repaginate(settings.reader) }
function startEdit(){ editing.value=true; editTitle.value=reader.chapter.title; editContent.value=reader.chapter.content }
async function saveEdit(){ await library.updateChapter(reader.chapter.id, editContent.value, editTitle.value); await reader.open(reader.book.id, reader.chapter.id, settings.reader); editing.value=false; toast.show('章节已保存') }
async function addNote(){ const text=prompt('笔记内容'); if(!text) return; await db.notes.put({ id:uid('note'), bookId:reader.book.id, chapterId:reader.chapter.id, chapterTitle:reader.chapter.title, pageIndex:reader.pageIndex, text, createdAt:nowIso() }); toast.show('已添加笔记'); await loadSide() }
async function addBookmark(){ await db.bookmarks.put({ id:uid('bm'), bookId:reader.book.id, chapterId:reader.chapter.id, chapterTitle:reader.chapter.title, pageIndex:reader.pageIndex, text:`第 ${reader.pageIndex+1} 页`, createdAt:nowIso() }); toast.show('已加入书签'); await loadSide() }
async function exportTxt(){ await library.exportBookTxt(reader.book.id); toast.show('已导出 TXT') }
onMounted(async () => { const id = route.params.bookId || library.sortedBooks[0]?.id; if(!id){ if(!library.books.length) await library.loadBooks() } if(id) await reader.open(id, route.params.chapterId, settings.reader); await loadSide(); window.addEventListener('keydown', keyHandler) })
onBeforeUnmount(() => window.removeEventListener('keydown', keyHandler))
watch(() => route.params.chapterId, async id => { if (id && id !== reader.chapter?.id) { await reader.open(route.params.bookId, id, settings.reader); await loadSide() } })
</script>
<template>
  <section class="reader-layout" v-if="reader.book">
    <aside class="reader-toc panel"><h3>{{ reader.book.title }}</h3><p class="muted">{{ reader.chapters.length }} 章 · 虚拟目录</p><VirtualTocList :chapters="reader.chapters" :active-id="reader.chapter?.id" @select="openChapter" /><button class="btn ghost" @click="router.push(`/catalog/${reader.book.id}`)">完整目录</button></aside>
    <article class="reader-main panel">
      <div class="reader-head"><button class="btn ghost" @click="router.push('/')">返回书架</button><b>{{ reader.chapter?.title }}</b><span class="pill">{{ reader.progressText }}</span></div>
      <div v-if="editing" class="edit-box"><input v-model="editTitle" class="input" /><textarea v-model="editContent" class="textarea" rows="18"></textarea><div class="seg"><button class="btn primary" @click="saveEdit">保存修改</button><button class="btn ghost" @click="editing=false">取消</button></div></div>
      <div v-else class="reader-paper"><button class="page-side left" @click.stop="prev">‹</button><div class="reader-scroll" :style="contentStyle" @click="next">{{ pageText }}</div><button class="page-side right" @click.stop="next">›</button></div>
      <div class="reader-tools"><button class="btn ghost" @click="prev">上一页</button><input class="range" type="range" min="0" :max="Math.max(0, reader.pages.length-1)" v-model.number="reader.pageIndex" @change="reader.saveProgress" /><button class="btn ghost" @click="next">下一页</button><button class="btn" @click="saveFont(-1)">A-</button><button class="btn" @click="saveFont(1)">A+</button><button class="btn ghost" @click="addBookmark">书签</button><button class="btn ghost" @click="addNote">笔记</button><button class="btn primary" @click="sendToAI">发给 AI</button><button class="btn ghost" @click="startEdit">编辑章</button><button class="btn ghost" @click="exportTxt">导出</button></div>
    </article>
    <aside class="reader-side panel"><h3>笔记与书签</h3><div class="side-list"><article v-for="n in notes" :key="n.id" class="side-card"><b>笔记</b><p>{{ n.text }}</p><small>{{ n.chapterTitle }}</small></article><article v-for="b in bookmarks" :key="b.id" class="side-card green"><b>书签</b><p>{{ b.text }}</p><small>{{ b.chapterTitle }}</small></article><p v-if="!notes.length && !bookmarks.length" class="muted">暂无笔记或书签。</p></div></aside>
  </section>
  <section v-else class="empty panel"><div><b>暂无可阅读小说</b><p>请先导入 TXT / DOCX 或新建小说。</p><RouterLink class="btn primary" to="/import">去导入</RouterLink></div></section>
</template>
<style scoped>
.reader-layout{height:100%;display:grid;grid-template-columns:260px minmax(0,1fr) 260px;gap:14px;min-height:0}.reader-toc,.reader-side{display:flex;flex-direction:column;min-height:0;padding:14px}.reader-toc h3{margin-bottom:4px}.reader-main{display:flex;flex-direction:column;min-height:0;padding:0}.reader-head{height:58px;display:grid;grid-template-columns:130px minmax(0,1fr) auto;gap:12px;align-items:center;padding:0 16px;border-bottom:1px solid #e3ecdd}.reader-head b{text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.reader-paper{position:relative;flex:1;min-height:0;margin:18px 42px 12px;padding:34px 56px;border-radius:20px;background:#fffef4;border:1px solid #ecebdc;overflow:hidden}.reader-scroll{height:100%;white-space:pre-wrap;letter-spacing:.08em;overflow:auto;cursor:pointer}.reader-tools{min-height:72px;display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #e3ecdd;overflow:auto}.range{flex:1;accent-color:#2f7437}.page-side{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:74px;border-radius:14px;background:rgba(238,247,232,.8);border:1px solid #d8e5d0;color:#2f6f35;font-size:34px;z-index:3}.page-side.left{left:8px}.page-side.right{right:8px}.edit-box{flex:1;display:flex;flex-direction:column;gap:10px;padding:18px;min-height:0}.edit-box textarea{flex:1}.side-list{overflow:auto;min-height:0}.side-card{border:1px solid #e5dfc6;border-left:5px solid #c9a64d;border-radius:14px;background:#fffdf4;padding:10px;margin-bottom:10px}.side-card.green{border-left-color:#6ba35f}.side-card p{white-space:pre-wrap;margin:6px 0;color:#4b5a48}.side-card small{color:#687466}@media(max-width:1100px){.reader-layout{grid-template-columns:230px 1fr}.reader-side{display:none}}@media(max-width:900px){.reader-layout{grid-template-columns:1fr}.reader-toc{display:none}.reader-paper{margin:10px;padding:22px}.reader-tools{overflow:auto}.reader-head{grid-template-columns:100px 1fr auto}}
</style>
