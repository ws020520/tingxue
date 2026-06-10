<script setup>
import { reactive, watch } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'
import { clearAllData } from '../db'
import { pullLibraryFromGitHub, pushLibraryToGitHub } from '../utils/githubSync'
import { avatarFallback } from '../utils/covers'

const settings = useSettingsStore(); const library = useLibraryStore(); const toast = useToastStore()
const reader = reactive({ ...settings.reader })
const profile = reactive({ ...settings.profile })
const sync = reactive({ ...settings.sync })
watch(()=>settings.profile, v=>Object.assign(profile,v), { deep:true })
async function saveReader(){ await settings.saveReader(reader); toast.show('阅读设置已保存') }
async function saveProfile(){ await settings.saveProfile(profile); toast.show('个人资料已保存') }
function onAvatar(e){ const file=e.target.files?.[0]; if(!file) return; const r=new FileReader(); r.onload=()=>{ profile.avatar=r.result }; r.readAsDataURL(file); e.target.value='' }
async function saveSync(){ await settings.saveSync(sync); toast.show('同步设置已保存') }
async function githubPull(){ await saveSync(); const res=await pullLibraryFromGitHub(settings.sync, { overwrite: true }); await library.loadBooks(); toast.show(`已从 GitHub 拉取 ${res.books} 本`) }
async function githubPush(){ await saveSync(); await pushLibraryToGitHub(settings.sync); toast.show('已推送到 GitHub') }
async function exportData(){ await library.exportBackup(); toast.show('已导出备份') }
async function importBackup(e){ const file=e.target.files?.[0]; if(!file) return; try{ const res=await library.importBackupFile(file,{ overwrite:true }); toast.show(`已导入 ${res.books} 本，${res.chapters} 章`) }catch(err){ toast.show(err.message) } finally{ e.target.value='' } }
async function clearData(){ if (!confirm('确定清空所有本地数据？')) return; await clearAllData(); await library.loadBooks(); toast.show('已清空') }
</script>

<template>
<section class="page">
  <div class="page-head"><div><div class="page-title">设置</div><p class="muted">个人资料、阅读偏好、AI、备份和 GitHub 同步。</p></div></div>
  <div class="settings-grid">
    <div class="panel profile-card">
      <h3>个人资料</h3>
      <div class="profile-row"><img :src="profile.avatar || avatarFallback()" /><div class="field"><label>昵称</label><input v-model="profile.name" class="input" /></div></div>
      <div class="field"><label>副标题</label><input v-model="profile.subtitle" class="input" /></div>
      <div class="seg"><label class="btn ghost file-btn"><input type="file" accept="image/*" @change="onAvatar" />上传头像</label><button class="btn ghost" @click="profile.avatar=''">移除头像</button><button class="btn primary" @click="saveProfile">保存资料</button></div>
    </div>
    <div class="panel">
      <h3>阅读偏好</h3>
      <div class="field"><label>字号 {{ reader.fontSize }}px</label><input type="range" min="14" max="28" v-model.number="reader.fontSize" /></div>
      <div class="field"><label>行距 {{ reader.lineHeight }}</label><input type="range" min="1.4" max="2.4" step="0.1" v-model.number="reader.lineHeight" /></div>
      <button class="btn primary" @click="saveReader">保存阅读设置</button>
    </div>
    <div class="panel">
      <h3>本地数据</h3>
      <p class="muted">当前 {{ library.books.length }} 本书，{{ library.totalWords.toLocaleString('zh-CN') }} 字。正文、AI 草稿和设置都保存在当前浏览器 IndexedDB。</p>
      <div class="seg"><button class="btn primary" @click="exportData">导出 v3 备份</button><label class="btn ghost file-btn"><input type="file" accept=".json,application/json" @change="importBackup" />导入备份</label><button class="btn danger" @click="clearData">清空本地数据</button></div>
    </div>
    <div class="panel">
      <h3>GitHub 云同步</h3>
      <p class="muted">个人自用可使用 Token 推送 library.json。Token 只保存在浏览器本地，不写入代码。</p>
      <div class="form-grid">
        <div class="field"><label>Owner</label><input v-model="sync.owner" class="input" /></div>
        <div class="field"><label>Repo</label><input v-model="sync.repo" class="input" /></div>
        <div class="field"><label>Branch</label><input v-model="sync.branch" class="input" /></div>
        <div class="field"><label>文件名</label><input v-model="sync.file" class="input" /></div>
        <div class="field full-span"><label>GitHub Token</label><input v-model="sync.token" class="input" type="password" placeholder="ghp_..." /></div>
      </div>
      <div class="seg" style="margin-top:12px"><button class="btn ghost" @click="saveSync">保存同步设置</button><button class="btn primary" @click="githubPush">推送到云端</button><button class="btn ghost" @click="githubPull">从云端拉取</button></div>
    </div>
  </div>
  <div class="panel" style="margin-top:16px"><h3>隐私提醒</h3><p class="muted">GitHub Pages 是纯前端环境，AI Key 与 GitHub Token 不要写进源码。公开多人使用时，建议改成后端代理。</p></div>
</section>
</template>
<style scoped>
.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;overflow:auto}.profile-row{display:grid;grid-template-columns:78px 1fr;gap:12px;align-items:center;margin-bottom:12px}.profile-row img{width:78px;height:78px;border-radius:22px;object-fit:cover;background:#e8f3e4}.file-btn input{display:none}.full-span{grid-column:1/-1}@media(max-width:900px){.settings-grid{grid-template-columns:1fr}}
</style>
