<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { db } from '../../db'
import { nowIso, uid } from '../../utils/text'
import { useToastStore } from '../../stores/toastStore'

const props = defineProps({ bookId: { type: String, default: '' } })
const toast = useToastStore()
const cards = ref([])
const form = reactive({ id:'', name:'', profile:'', voice:'', relationship:'', limits:'' })
async function load(){ cards.value = props.bookId ? await db.characterCards.where('bookId').equals(props.bookId).toArray() : [] }
function edit(card){ Object.assign(form, { id:card.id, name:card.name, profile:card.profile||'', voice:card.voice||'', relationship:card.relationship||'', limits:card.limits||'' }) }
function reset(){ Object.assign(form, { id:'', name:'', profile:'', voice:'', relationship:'', limits:'' }) }
async function save(){
  if (!props.bookId) return toast.show('请先选择小说')
  if (!form.name.trim()) return toast.show('请输入人物名')
  await db.characterCards.put({ ...form, id: form.id || uid('char'), bookId: props.bookId, updatedAt: nowIso(), createdAt: form.createdAt || nowIso() })
  toast.show('人物卡已保存')
  reset(); await load()
}
async function remove(card){ await db.characterCards.delete(card.id); toast.show('已删除人物卡'); await load() }
onMounted(load)
watch(() => props.bookId, async () => { reset(); await load() })
</script>

<template>
  <div class="split">
    <div class="panel">
      <h3>人物卡</h3>
      <div class="field"><label>人物名</label><input v-model="form.name" class="input" placeholder="顾棠 / 沈砚辞" /></div>
      <div class="field"><label>人物画像</label><textarea v-model="form.profile" class="textarea" rows="6" placeholder="身份、性格、欲望、缺点、成长线"></textarea></div>
      <div class="field"><label>说话方式</label><textarea v-model="form.voice" class="textarea" rows="4" placeholder="口癖、语气、常用表达、不会说的话"></textarea></div>
      <div class="field"><label>关系网</label><textarea v-model="form.relationship" class="textarea" rows="4" placeholder="与主角、配角、家庭、宿舍等关系"></textarea></div>
      <div class="field"><label>不能违背的设定</label><textarea v-model="form.limits" class="textarea" rows="4"></textarea></div>
      <div class="seg"><button class="btn primary" @click="save">保存人物卡</button><button class="btn ghost" @click="reset">新建</button></div>
    </div>
    <div class="panel list-panel">
      <h3>已有人物</h3>
      <article v-for="card in cards" :key="card.id" class="mini-card">
        <b>{{ card.name }}</b>
        <p>{{ card.profile }}</p>
        <div class="seg"><button class="btn ghost" @click="edit(card)">编辑</button><button class="btn danger" @click="remove(card)">删除</button></div>
      </article>
      <div v-if="!cards.length" class="empty"><div><b>还没有人物卡</b><p>人物卡会参与续写上下文，防止人设跑偏。</p></div></div>
    </div>
  </div>
</template>

<style scoped>
.list-panel{min-height:0;overflow:auto}.mini-card{border:1px solid #dce7d5;border-radius:16px;background:#fbfff7;padding:12px;margin-bottom:10px}.mini-card p{white-space:pre-wrap;color:#687466;max-height:110px;overflow:auto}
</style>
