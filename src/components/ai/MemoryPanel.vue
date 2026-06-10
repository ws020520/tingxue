<script setup>
import { onMounted, reactive, watch } from 'vue'
import { db } from '../../db'
import { nowIso } from '../../utils/text'
import { useToastStore } from '../../stores/toastStore'

const props = defineProps({ bookId: { type: String, default: '' } })
const toast = useToastStore()
const memory = reactive({ outline:'', roles:'', world:'', timeline:'', rules:'', forbidden:'' })
async function load(){
  if (!props.bookId) return
  const row = await db.aiMemories.get(props.bookId)
  Object.assign(memory, { outline:'', roles:'', world:'', timeline:'', rules:'', forbidden:'', ...(row || {}) })
}
async function save(){
  if (!props.bookId) return toast.show('请先选择小说')
  await db.aiMemories.put({ bookId: props.bookId, ...memory, updatedAt: nowIso() })
  toast.show('创作记忆已保存')
}
onMounted(load)
watch(() => props.bookId, load)
</script>

<template>
  <div class="memory-grid">
    <div class="field"><label>小说大纲</label><textarea v-model="memory.outline" class="textarea" rows="10" placeholder="主线、卷纲、章节提示"></textarea></div>
    <div class="field"><label>角色设定</label><textarea v-model="memory.roles" class="textarea" rows="10" placeholder="人物性格、说话方式、关系"></textarea></div>
    <div class="field"><label>世界观 / 背景</label><textarea v-model="memory.world" class="textarea" rows="6"></textarea></div>
    <div class="field"><label>时间线</label><textarea v-model="memory.timeline" class="textarea" rows="6"></textarea></div>
    <div class="field"><label>写作规则</label><textarea v-model="memory.rules" class="textarea" rows="6" placeholder="文风偏好、节奏要求"></textarea></div>
    <div class="field"><label>禁止事项</label><textarea v-model="memory.forbidden" class="textarea" rows="6" placeholder="不要写崩的人设、不要使用的表达"></textarea></div>
    <button class="btn primary" @click="save">保存创作记忆</button>
  </div>
</template>

<style scoped>
.memory-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.memory-grid .btn{justify-self:start}@media(max-width:900px){.memory-grid{grid-template-columns:1fr}}
</style>
