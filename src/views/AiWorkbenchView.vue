<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../db'
import { useLibraryStore } from '../stores/libraryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useToastStore } from '../stores/toastStore'
import AiSettingsPanel from '../components/ai/AiSettingsPanel.vue'
import MemoryPanel from '../components/ai/MemoryPanel.vue'
import DraftsPanel from '../components/ai/DraftsPanel.vue'
import CharacterCardsPanel from '../components/ai/CharacterCardsPanel.vue'
import StyleSamplesPanel from '../components/ai/StyleSamplesPanel.vue'
import PlotThreadsPanel from '../components/ai/PlotThreadsPanel.vue'
import { generateContinuation, editTextWithAI, chatWithAI } from '../ai/services/aiTaskService'

const route = useRoute(); const library = useLibraryStore(); const settings = useSettingsStore(); const toast = useToastStore()
const tab = ref('continue'); const selectedBookId = ref(route.params.bookId || ''); const selectedChapterId = ref(route.query.chapterId || '')
const busy = ref(false); const draftsRef = ref(null); const chapters = ref([])
const continueForm = reactive({ mode:'下一章续写', instruction:'', targetWords:3000 })
const editType = ref('polish'); const editForm = reactive({ instruction:'', text:'' })
const chatMessages = ref([]); const chatInput = ref('')
const quickPrompts = ['慢热一点，少解释多动作','强化对白潜台词','减少AI腔和模板句','增加暧昧拉扯','检查人物是否跑偏','下一章写冲突升级']
const currentBook = computed(() => library.books.find(b => b.id === selectedBookId.value))
const selectedChapter = computed(() => chapters.value.find(ch => ch.id === selectedChapterId.value))
const modeList = ['下一章续写','当前段落续写','桥段补写','对话续写','情绪场续写','高潮扩写','番外生成','按大纲节点续写']
const editTypes = [['polish','润色'],['correct','订正'],['rewrite','改写'],['expand','扩写'],['compress','缩写'],['dialogue','对白增强'],['diagnose','章节诊断'],['outline','大纲提炼'],['timeline','时间线检查']]
async function loadChapters(){ chapters.value = selectedBookId.value ? await db.chapters.where('bookId').equals(selectedBookId.value).sortBy('index') : []; if (!selectedChapterId.value && chapters.value.length) selectedChapterId.value = chapters.value.at(-1).id; await loadChapterText() }
async function loadChapterText(){ if (!selectedChapterId.value) return; const ch = await db.chapters.get(selectedChapterId.value); editForm.text = ch?.content || '' }
function addQuick(q){ continueForm.instruction = continueForm.instruction ? `${continueForm.instruction}；${q}` : q; editForm.instruction = editForm.instruction ? `${editForm.instruction}；${q}` : q }
async function runContinue(){ if (!selectedBookId.value) return toast.show('请先选择小说'); busy.value = true; try { const draft = await generateContinuation({ bookId: selectedBookId.value, settings: settings.ai, mode: continueForm.mode, instruction: continueForm.instruction, targetWords: continueForm.targetWords || settings.ai.wordCount }); toast.show(`已生成草稿：${draft.title}`); tab.value = 'drafts'; await draftsRef.value?.load?.() } catch(err) { toast.show(err.message) } finally { busy.value = false } }
async function runEdit(type = editType.value){ if (!editForm.text.trim()) return toast.show('请输入要处理的正文'); busy.value = true; try { const draft = await editTextWithAI({ type, bookId: selectedBookId.value, chapterId: selectedChapterId.value, text: editForm.text, instruction: editForm.instruction, settings: settings.ai }); toast.show(`已生成：${draft.title}`); tab.value = 'drafts'; await draftsRef.value?.load?.() } catch(err) { toast.show(err.message) } finally { busy.value = false } }
async function sendChat(){ const content = chatInput.value.trim(); if (!content) return; chatMessages.value.push({ role:'user', content }); chatInput.value = ''; busy.value = true; try { const out = await chatWithAI({ settings: settings.ai, messages: chatMessages.value }); chatMessages.value.push({ role:'assistant', content: out }) } catch(err) { toast.show(err.message) } finally { busy.value = false } }
onMounted(async () => { if (!library.books.length) await library.loadBooks(); if(!selectedBookId.value && library.sortedBooks[0]) selectedBookId.value=library.sortedBooks[0].id; await loadChapters(); continueForm.targetWords = settings.ai.wordCount })
watch(selectedBookId, async () => { selectedChapterId.value = ''; await loadChapters() })
watch(selectedChapterId, loadChapterText)
</script>

<template>
<section class="page ai-page">
  <div class="ai-hero">
    <div><h2>AI 创作工作台</h2><p>续写、润色、订正、改写、扩写、诊断、人物卡、风格样本、伏笔和草稿箱集中管理。</p></div>
    <select v-model="selectedBookId" class="select"><option value="">选择小说</option><option v-for="b in library.sortedBooks" :key="b.id" :value="b.id">{{ b.title }}</option></select>
  </div>
  <div class="tabs"><button v-for="t in [['continue','续写'],['edit','文本处理'],['chat','对话'],['memory','记忆'],['characters','人物卡'],['style','风格'],['threads','伏笔'],['drafts','草稿箱'],['settings','设置']]" :key="t[0]" class="tab" :class="{active:tab===t[0]}" @click="tab=t[0]">{{ t[1] }}</button></div>
  <div class="quick-row"><button v-for="q in quickPrompts" :key="q" class="chip mini" @click="addQuick(q)">{{ q }}</button></div>
  <div class="ai-scroll">
    <div v-if="tab==='continue'" class="split">
      <div class="panel fancy"><h3>续写设置</h3><div class="field"><label>模式</label><select v-model="continueForm.mode" class="select"><option v-for="m in modeList" :key="m">{{ m }}</option></select></div><div class="field"><label>目标字数</label><input v-model.number="continueForm.targetWords" class="input" type="number" min="500" max="12000" step="500" /></div><div class="field"><label>本次要求</label><textarea v-model="continueForm.instruction" class="textarea" rows="10" placeholder="例如：这一章写两人冷战后的试探，保持慢热，不要直接和好。"></textarea></div><button class="btn primary" :disabled="busy" @click="runContinue">生成续写草稿</button></div>
      <div class="panel context-panel"><h3>上下文说明</h3><p class="muted">系统会自动取当前小说的大纲、角色设定、人物卡、风格样本、伏笔线索和最近章节。不会把整本书都塞给 AI。</p><div class="context-list"><span class="pill">{{ currentBook?.title || '未选择小说' }}</span><span class="pill">{{ chapters.length }} 章</span><span class="pill">最近章节</span><span class="pill">草稿箱保护正文</span></div><div class="ai-card-grid"><div>人物一致性</div><div>伏笔检查</div><div>风格约束</div><div>去 AI 腔</div></div></div>
    </div>
    <div v-if="tab==='edit'" class="split">
      <div class="panel"><h3>文本处理</h3><div class="field"><label>工具</label><select v-model="editType" class="select"><option v-for="t in editTypes" :key="t[0]" :value="t[0]">{{ t[1] }}</option></select></div><div class="field"><label>章节</label><select v-model="selectedChapterId" class="select"><option v-for="ch in chapters" :key="ch.id" :value="ch.id">{{ ch.index+1 }}. {{ ch.title }}</option></select></div><div class="field"><label>额外要求</label><input v-model="editForm.instruction" class="input" placeholder="可选，例如：保留原句式、减少解释、增强对白" /></div><div class="field"><label>正文 / 选中文本</label><textarea v-model="editForm.text" class="textarea" rows="16"></textarea></div><button class="btn primary" :disabled="busy" @click="runEdit()">开始处理</button></div>
      <div class="panel tips"><h3>工具说明</h3><p><b>润色</b>：保持原意，增强自然度。</p><p><b>订正</b>：修错别字、病句、AI腔。</p><p><b>改写</b>：重组表达但不改剧情。</p><p><b>扩写</b>：补动作、环境、心理和停顿。</p><p><b>诊断</b>：只分析，不改正文。</p><p class="muted">所有结果都会进入草稿箱，确认后再应用或复制。</p></div>
    </div>
    <div v-if="tab==='chat'" class="panel chat-panel"><div class="chat-list"><div v-for="(m,i) in chatMessages" :key="i" class="chat-msg" :class="m.role"><b>{{ m.role==='user'?'你':'AI' }}</b><p>{{ m.content }}</p></div><div v-if="!chatMessages.length" class="empty"><div><b>开始讨论你的小说</b><p>可以问剧情、人物、设定、大纲、章节规划，也可以让它生成 HTML 大纲。</p></div></div></div><div class="chat-input"><textarea v-model="chatInput" class="textarea" rows="3" placeholder="输入你的问题或灵感，Ctrl+Enter 发送" @keydown.ctrl.enter.prevent="sendChat"></textarea><button class="btn primary" :disabled="busy" @click="sendChat">发送</button></div></div>
    <MemoryPanel v-if="tab==='memory'" :book-id="selectedBookId" /><CharacterCardsPanel v-if="tab==='characters'" :book-id="selectedBookId" /><StyleSamplesPanel v-if="tab==='style'" :book-id="selectedBookId" /><PlotThreadsPanel v-if="tab==='threads'" :book-id="selectedBookId" /><DraftsPanel v-if="tab==='drafts'" ref="draftsRef" :book-id="selectedBookId" /><AiSettingsPanel v-if="tab==='settings'" />
  </div>
</section>
</template>
<style scoped>
.ai-page{min-height:0}.ai-hero{display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid #dce8d6;border-radius:26px;padding:18px 20px;margin-bottom:12px;background:radial-gradient(circle at 15% 20%,rgba(72,135,72,.15),transparent 30%),linear-gradient(135deg,#fbfff7,#edf8e8)}.ai-hero h2{margin:0 0 6px;font-size:28px}.ai-hero p{margin:0;color:#60705d}.ai-hero .select{max-width:280px}.ai-scroll{min-height:0;overflow:auto;padding-right:4px}.quick-row{display:flex;gap:8px;overflow:auto;padding-bottom:10px}.chip.mini{height:32px;font-size:12px;background:#fffef8}.fancy{background:linear-gradient(180deg,#fffef8,#f4fbef)}.context-list{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.ai-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ai-card-grid div{border:1px solid #dce7d5;border-radius:16px;padding:16px;background:#fbfff7;color:#2f6f35;font-weight:900}.chat-panel{height:calc(100vh - 300px);display:flex;flex-direction:column}.chat-list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px}.chat-msg{max-width:80%;border:1px solid #dce7d5;border-radius:16px;padding:12px;background:#fbfff7}.chat-msg.user{margin-left:auto;background:#eef7e8}.chat-msg p{white-space:pre-wrap;line-height:1.8;margin:8px 0 0}.chat-input{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:10px;margin-top:12px}.tips p{line-height:1.8;margin:8px 0}@media(max-width:900px){.ai-hero{flex-direction:column;align-items:stretch}.chat-panel{height:auto;min-height:480px}}
</style>
