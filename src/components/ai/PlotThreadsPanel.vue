<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { db } from '../../db'
import { nowIso, uid } from '../../utils/text'
import { useToastStore } from '../../stores/toastStore'

const props = defineProps({ bookId: { type: String, default: '' } })
const toast = useToastStore()
const threads = ref([])
const form = reactive({ id:'', title:'', description:'', status:'未处理', payoff:'', relatedCharacters:'' })
async function load(){ threads.value = props.bookId ? await db.plotThreads.where('bookId').equals(props.bookId).toArray() : [] }
function edit(t){ Object.assign(form, { id:t.id, title:t.title, description:t.description||'', status:t.status||'未处理', payoff:t.payoff||'', relatedCharacters:t.relatedCharacters||'' }) }
function reset(){ Object.assign(form, { id:'', title:'', description:'', status:'未处理', payoff:'', relatedCharacters:'' }) }
async function save(){
  if (!props.bookId) return toast.show('请先选择小说')
  if (!form.title.trim()) return toast.show('请输入线索标题')
  await db.plotThreads.put({ ...form, id: form.id || uid('plot'), bookId: props.bookId, updatedAt: nowIso(), createdAt: nowIso() })
  toast.show('伏笔线索已保存')
  reset(); await load()
}
async function remove(t){ await db.plotThreads.delete(t.id); toast.show('已删除线索'); await load() }
onMounted(load)
watch(() => props.bookId, async () => { reset(); await load() })
</script>

<template>
  <div class="split">
    <div class="panel">
      <h3>伏笔 / 时间线</h3>
      <div class="field"><label>标题</label><input v-model="form.title" class="input" placeholder="例如：第12章送出的围巾" /></div>
      <div class="field"><label>状态</label><select v-model="form.status" class="select"><option>未处理</option><option>发展中</option><option>已回收</option><option>废弃</option></select></div>
      <div class="field"><label>描述</label><textarea v-model="form.description" class="textarea" rows="6" placeholder="埋在何处、涉及谁、为什么重要"></textarea></div>
      <div class="field"><label>预计回收方式</label><textarea v-model="form.payoff" class="textarea" rows="4"></textarea></div>
      <div class="field"><label>相关人物</label><input v-model="form.relatedCharacters" class="input" /></div>
      <div class="seg"><button class="btn primary" @click="save">保存线索</button><button class="btn ghost" @click="reset">新建</button></div>
    </div>
    <div class="panel list-panel">
      <h3>线索列表</h3>
      <article v-for="t in threads" :key="t.id" class="mini-card">
        <div class="head"><b>{{ t.title }}</b><span class="pill">{{ t.status }}</span></div>
        <p>{{ t.description }}</p>
        <div class="seg"><button class="btn ghost" @click="edit(t)">编辑</button><button class="btn danger" @click="remove(t)">删除</button></div>
      </article>
      <div v-if="!threads.length" class="empty"><div><b>还没有线索</b><p>AI 续写和诊断会参考这里，避免忘伏笔。</p></div></div>
    </div>
  </div>
</template>

<style scoped>
.list-panel{min-height:0;overflow:auto}.mini-card{border:1px solid #dce7d5;border-radius:16px;background:#fbfff7;padding:12px;margin-bottom:10px}.head{display:flex;justify-content:space-between;gap:10px}.mini-card p{white-space:pre-wrap;color:#687466;max-height:110px;overflow:auto}
</style>
