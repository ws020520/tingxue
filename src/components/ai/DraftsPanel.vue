<script setup>
import { onMounted, ref, watch } from 'vue'
import { db } from '../../db'
import { useLibraryStore } from '../../stores/libraryStore'
import { useToastStore } from '../../stores/toastStore'

const props = defineProps({ bookId: { type: String, default: '' } })
const drafts = ref([])
const library = useLibraryStore()
const toast = useToastStore()
async function load(){
  const rows = props.bookId ? await db.aiDrafts.where('bookId').equals(props.bookId).toArray() : await db.aiDrafts.toArray()
  drafts.value = rows.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}
async function append(d){
  const ch = await library.appendChapter(d.bookId, { title: d.title, content: d.output })
  await db.aiDrafts.update(d.id, { status:'applied', chapterId: ch.id })
  toast.show('已追加为新章节')
  await load()
}
async function copy(d){ await navigator.clipboard.writeText(d.output || ''); toast.show('已复制') }
async function remove(d){ await db.aiDrafts.delete(d.id); toast.show('已删除草稿'); await load() }
onMounted(load)
watch(() => props.bookId, load)
defineExpose({ load })
</script>

<template>
  <div class="draft-list">
    <div v-if="!drafts.length" class="empty panel"><div><b>暂无 AI 草稿</b><p>续写、润色、订正的结果都会先保存到这里。</p></div></div>
    <article v-for="d in drafts" :key="d.id" class="panel draft-card">
      <div class="draft-head"><b>{{ d.title || d.type }}</b><span class="pill">{{ d.status }}</span></div>
      <p v-if="d.analysis" class="analysis">{{ d.analysis }}</p>
      <pre>{{ d.output }}</pre>
      <div class="seg">
        <button v-if="d.type === 'continue'" class="btn primary" @click="append(d)">追加为新章节</button>
        <button class="btn ghost" @click="copy(d)">复制</button>
        <button class="btn danger" @click="remove(d)">删除</button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.draft-list{display:flex;flex-direction:column;gap:12px}.draft-card pre{white-space:pre-wrap;line-height:1.8;max-height:280px;overflow:auto;background:#fbfff7;border:1px solid #dce7d5;border-radius:14px;padding:12px}.draft-head{display:flex;justify-content:space-between;gap:12px}.analysis{white-space:pre-wrap;color:#687466;background:#f6fbf1;border-radius:12px;padding:10px;max-height:160px;overflow:auto}
</style>
