<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { db } from '../../db'
import { nowIso, uid } from '../../utils/text'
import { useToastStore } from '../../stores/toastStore'

const props = defineProps({ bookId: { type: String, default: '' } })
const toast = useToastStore()
const samples = ref([])
const form = reactive({ id:'', name:'', text:'', note:'' })
async function load(){ samples.value = props.bookId ? await db.styleSamples.where('bookId').equals(props.bookId).toArray() : [] }
function edit(s){ Object.assign(form, { id:s.id, name:s.name, text:s.text||'', note:s.note||'' }) }
function reset(){ Object.assign(form, { id:'', name:'', text:'', note:'' }) }
async function save(){
  if (!props.bookId) return toast.show('请先选择小说')
  if (!form.name.trim() || !form.text.trim()) return toast.show('请输入样本名称和文本')
  await db.styleSamples.put({ ...form, id: form.id || uid('style'), bookId: props.bookId, updatedAt: nowIso(), createdAt: nowIso() })
  toast.show('风格样本已保存')
  reset(); await load()
}
async function remove(s){ await db.styleSamples.delete(s.id); toast.show('已删除样本'); await load() }
async function onFile(e){
  const file = e.target.files?.[0]
  if (!file) return
  form.name = file.name
  form.text = await file.text()
  e.target.value = ''
}
onMounted(load)
watch(() => props.bookId, async () => { reset(); await load() })
</script>

<template>
  <div class="split">
    <div class="panel">
      <h3>风格样本</h3>
      <p class="muted">续写时会抽取样本片段辅助保持文风，不会一次塞入全部文本。</p>
      <div class="field"><label>样本名</label><input v-model="form.name" class="input" placeholder="例如：暧昧对白样本 / 本书第1卷" /></div>
      <div class="field"><label>说明</label><input v-model="form.note" class="input" placeholder="这个样本适合什么场景" /></div>
      <div class="field"><label>样本文本</label><textarea v-model="form.text" class="textarea" rows="12"></textarea></div>
      <div class="seg"><label class="btn ghost"><input type="file" accept=".txt,.md,.text" style="display:none" @change="onFile" />上传 TXT 样本</label><button class="btn primary" @click="save">保存样本</button><button class="btn ghost" @click="reset">新建</button></div>
    </div>
    <div class="panel list-panel">
      <h3>已保存样本</h3>
      <article v-for="s in samples" :key="s.id" class="mini-card">
        <b>{{ s.name }}</b><span class="pill">{{ Math.round((s.text?.length || 0)/1000) }}k 字</span>
        <p>{{ s.note || s.text?.slice(0, 180) }}</p>
        <div class="seg"><button class="btn ghost" @click="edit(s)">编辑</button><button class="btn danger" @click="remove(s)">删除</button></div>
      </article>
      <div v-if="!samples.length" class="empty"><div><b>暂无风格样本</b><p>可以从你喜欢的章节或参考作品中截取片段。</p></div></div>
    </div>
  </div>
</template>

<style scoped>
.list-panel{min-height:0;overflow:auto}.mini-card{border:1px solid #dce7d5;border-radius:16px;background:#fbfff7;padding:12px;margin-bottom:10px}.mini-card p{white-space:pre-wrap;color:#687466;max-height:90px;overflow:auto}
</style>
