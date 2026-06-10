<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'

const router = useRouter()
const library = useLibraryStore()
const toast = useToastStore()
const importing = ref(false)
const meta = reactive({ title:'', author:'', category:'其他', status:'连载中', tags:'', source:'本地导入', summary:'' })
const last = reactive({ books:0, chapters:0, errors:[] })
function buildMeta(){ return { ...meta, tags: String(meta.tags||'').split(/[，,\s]+/).filter(Boolean) } }
async function importFiles(files){
  if(!files.length) return
  importing.value = true; last.books=0; last.chapters=0; last.errors=[]
  try{
    const result = await library.importFiles(files, buildMeta())
    Object.assign(last, result)
    if(result.errors.length) toast.show(`部分导入完成：${result.books} 本，失败 ${result.errors.length} 个`)
    else toast.show(`已导入 ${result.books} 本，${result.chapters} 章`)
    if(result.books) router.push('/')
  }catch(err){ toast.show(err.message || '导入失败') }
  finally{ importing.value=false }
}
async function onFiles(e){ const files=[...(e.target.files||[])].filter(f=>/\.(txt|md|text|docx)$/i.test(f.name)); await importFiles(files); e.target.value='' }
async function onDrop(e){ e.preventDefault(); const files=[...(e.dataTransfer?.files||[])].filter(f=>/\.(txt|md|text|docx)$/i.test(f.name)); await importFiles(files) }
async function createBlank(){ if(!meta.title.trim()) meta.title='未命名小说'; const b=await library.createBlankBook(buildMeta()); toast.show('已新建空白小说'); router.push(`/reader/${b.id}/${b.lastReadChapterId}`) }
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div><div class="page-title">导入小说</div><p class="muted">TXT / DOCX / 文件夹都支持。正文会拆进 chapters 表，书架只读摘要。</p></div>
      <button class="btn ghost" @click="createBlank">新建空白小说</button>
    </div>
    <div class="import-grid">
      <div class="panel import-hero" @dragover.prevent @drop="onDrop">
        <h2>拖拽导入</h2>
        <p>把 TXT、DOCX 或文件夹里的文件拖到这里。系统会自动识别章节标题、分卷和正文。</p>
        <div class="import-buttons">
          <label class="btn primary file-btn"><input type="file" multiple accept=".txt,.md,.text" @change="onFiles" />选择 TXT</label>
          <label class="btn primary file-btn"><input type="file" multiple accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change="onFiles" />选择 DOCX</label>
          <label class="btn ghost file-btn"><input type="file" multiple webkitdirectory @change="onFiles" />选择文件夹</label>
        </div>
        <p v-if="importing" class="muted">正在导入，请稍候……</p>
      </div>
      <div class="panel">
        <h3>导入信息</h3>
        <div class="form-grid one">
          <div class="field"><label>书名（留空自动识别）</label><input v-model="meta.title" class="input" /></div>
          <div class="field"><label>作者</label><input v-model="meta.author" class="input" placeholder="本地作者" /></div>
          <div class="field"><label>分类</label><select v-model="meta.category" class="select"><option>玄幻</option><option>科幻</option><option>都市</option><option>历史</option><option>言情</option><option>其他</option></select></div>
          <div class="field"><label>状态</label><select v-model="meta.status" class="select"><option>连载中</option><option>完结</option><option>资料</option></select></div>
          <div class="field"><label>标签</label><input v-model="meta.tags" class="input" placeholder="慢热, 甜文, 悬疑" /></div>
          <div class="field"><label>来源</label><input v-model="meta.source" class="input" /></div>
          <div class="field"><label>简介</label><textarea v-model="meta.summary" class="textarea" rows="4"></textarea></div>
        </div>
      </div>
    </div>
    <div class="feature-grid">
      <div class="panel feature"><b>TXT 导入</b><span>GBK / UTF-8 自动兼容</span></div>
      <div class="panel feature"><b>DOCX 导入</b><span>前端本地解析，不上传文件</span></div>
      <div class="panel feature"><b>文件夹导入</b><span>适合多本小说或分章文件</span></div>
      <div class="panel feature"><b>新建空白</b><span>手动创建书名和章节</span></div>
    </div>
    <div v-if="last.errors.length" class="panel error-box"><b>导入错误</b><pre>{{ last.errors.join('\n') }}</pre></div>
  </section>
</template>

<style scoped>
.import-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.import-hero{min-height:300px;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 20% 20%,rgba(72,135,72,.16),transparent 28%),linear-gradient(135deg,#fbfff7,#edf8e8)}.import-hero h2{font-size:30px}.import-hero p{color:#60705d;line-height:1.8}.import-buttons{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.file-btn input{display:none}.one{grid-template-columns:1fr}.feature-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.feature{padding:14px;background:linear-gradient(180deg,#fffef8,#f4fbef)}.feature b{display:block;color:#2f6f35}.feature span{display:block;color:#687466;font-size:13px;margin-top:6px}.legacy-title{width:100%;display:flex;justify-content:space-between;align-items:center}.legacy-body{margin-top:12px}.check{display:flex;gap:8px;align-items:center;margin:10px 0}.error-box pre{white-space:pre-wrap;color:#9b3428;background:#fff7f4;border-radius:12px;padding:10px}@media(max-width:900px){.import-grid,.feature-grid{grid-template-columns:1fr}}
</style>
