<script setup>
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'

const library = useLibraryStore(); const toast = useToastStore()
async function onCover(book, e){ const file=e.target.files?.[0]; if(!file) return; await library.setBookCover(book.id, file); toast.show('封面已更新'); e.target.value='' }
async function reset(book){ await library.resetBookCover(book.id); toast.show('已生成默认封面') }
</script>
<template>
<section class="page">
  <div class="page-head"><div><div class="page-title">封面工坊</div><p class="muted">更换封面、生成浅绿色默认封面。封面只保存在本地浏览器。</p></div></div>
  <div v-if="!library.books.length" class="empty panel"><div><b>还没有书</b><p>导入小说后即可管理封面。</p></div></div>
  <div v-else class="cards-scroll"><div class="cover-grid">
    <article v-for="b in library.sortedBooks" :key="b.id" class="panel cover-card">
      <img :src="b.cover" /><h3>{{ b.title }}</h3><p class="muted">{{ b.author || '佚名' }} · {{ b.chapterCount || 0 }} 章</p>
      <div class="seg"><label class="btn primary file-btn"><input type="file" accept="image/*" @change="onCover(b,$event)" />更换封面</label><button class="btn ghost" @click="reset(b)">默认封面</button></div>
    </article>
  </div></div>
</section>
</template>
<style scoped>
.cover-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}.cover-card img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:16px;border:1px solid #dce7d5;background:#eef7e8}.cover-card h3{margin:12px 0 4px}.file-btn input{display:none}
</style>
