<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'

const route = useRoute(); const router = useRouter(); const library = useLibraryStore(); const toast = useToastStore()
const bookId = ref(route.params.bookId || '')
const chapters = ref([])
const book = computed(()=> library.books.find(b=>b.id===bookId.value))
async function load(){ if(!library.books.length) await library.loadBooks(); if(!bookId.value && library.sortedBooks[0]) bookId.value=library.sortedBooks[0].id; chapters.value = bookId.value ? await db.chapters.where('bookId').equals(bookId.value).sortBy('index') : [] }
async function open(ch){ router.push(`/reader/${bookId.value}/${ch.id}`) }
async function edit(ch){ const title=prompt('章节标题', ch.title); if(title==null) return; const content=prompt('章节正文', ch.content); if(content==null) return; await library.updateChapter(ch.id, content, title); toast.show('章节已保存'); await load() }
async function remove(ch){ if(!confirm(`删除 ${ch.title}？`)) return; await library.deleteChapter(ch.id); toast.show('已删除章节'); await load() }
async function add(){ const title=prompt('新章节标题','新章节'); if(!title) return; const content=prompt('正文','') ?? ''; const ch=await library.appendChapter(bookId.value,{title,content}); toast.show('已新增章节'); await load(); open(ch) }
onMounted(load); watch(bookId, load); watch(()=>route.params.bookId, v=>{bookId.value=v||bookId.value; load()})
</script>
<template>
<section class="page">
  <div class="page-head"><div><div class="page-title">目录分卷</div><p class="muted">查看、打开、编辑、删除章节。正文仍按需读取。</p></div><div class="toolbar"><select v-model="bookId" class="select" style="width:260px"><option v-for="b in library.sortedBooks" :value="b.id" :key="b.id">{{ b.title }}</option></select><button class="btn primary" :disabled="!bookId" @click="add">新增章节</button></div></div>
  <div v-if="!bookId" class="empty panel"><div><b>暂无小说</b><p>请先导入或新建小说。</p></div></div>
  <div v-else class="catalog-layout">
    <div class="panel stats"><h3>{{ book?.title }}</h3><p>{{ chapters.length }} 章 · {{ (book?.wordCount||0).toLocaleString('zh-CN') }} 字</p><RouterLink class="btn primary" :to="`/reader/${bookId}/${book?.lastReadChapterId||''}`">继续阅读</RouterLink></div>
    <div class="panel chapter-list">
      <article v-for="ch in chapters" :key="ch.id" class="chapter-row">
        <span class="muted">{{ ch.index + 1 }}</span><div><b>{{ ch.title }}</b><p>{{ ch.volume || '正文' }} · {{ (ch.wordCount||0).toLocaleString('zh-CN') }} 字</p></div>
        <button class="btn ghost" @click="open(ch)">打开</button><button class="btn ghost" @click="edit(ch)">编辑</button><button class="btn danger" @click="remove(ch)">删除</button>
      </article>
    </div>
  </div>
</section>
</template>
<style scoped>
.catalog-layout{display:grid;grid-template-columns:280px minmax(0,1fr);gap:14px;min-height:0}.stats{height:max-content;background:linear-gradient(180deg,#fbfff7,#eef8e8)}.chapter-list{min-height:0;overflow:auto;padding:10px}.chapter-row{display:grid;grid-template-columns:52px minmax(0,1fr) 80px 80px 80px;gap:10px;align-items:center;border-bottom:1px dashed #dfe8d7;padding:10px}.chapter-row p{margin:4px 0 0;color:#687466;font-size:13px}@media(max-width:900px){.catalog-layout{grid-template-columns:1fr}.chapter-row{grid-template-columns:36px minmax(0,1fr);}.chapter-row button{grid-column:auto}}
</style>
