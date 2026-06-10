<script setup>
import { computed, reactive, watch } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToastStore } from '../../stores/toastStore'
import { getModels } from '../../ai/providers/models'

const settings = useSettingsStore()
const toast = useToastStore()
const form = reactive({ ...settings.ai })
const models = computed(() => getModels(form.provider))
watch(() => form.provider, () => { if (!models.value.includes(form.model)) form.model = models.value[0] })
async function save(){ await settings.saveAi(form); toast.show('AI 设置已保存') }
</script>

<template>
  <div class="panel ai-settings">
    <h3>API 设置</h3>
    <div class="form-grid">
      <div class="field"><label>服务商</label><select v-model="form.provider" class="select"><option value="deepseek">DeepSeek</option><option value="openai">OpenAI</option><option value="mimo">MiMo</option><option value="custom">自定义兼容接口</option></select></div>
      <div class="field"><label>模型</label><select v-model="form.model" class="select"><option v-for="m in models" :key="m" :value="m">{{ m }}</option></select></div>
      <div class="field"><label>DeepSeek Key</label><input v-model="form.deepseekKey" class="input" type="password" placeholder="sk-..." /></div>
      <div class="field"><label>OpenAI Key</label><input v-model="form.openaiKey" class="input" type="password" placeholder="sk-..." /></div>
      <div class="field"><label>MiMo Key</label><input v-model="form.mimoKey" class="input" type="password" /></div>
      <div class="field"><label>自定义 Key</label><input v-model="form.customKey" class="input" type="password" /></div>
      <div class="field"><label>自定义 API Base URL</label><input v-model="form.apiBaseUrl" class="input" placeholder="https://.../v1/chat/completions" /></div>
      <div class="field"><label>每章目标字数</label><input v-model.number="form.wordCount" class="input" type="number" min="500" max="12000" step="500" /></div>
    </div>
    <div class="field" style="margin-top:12px"><label>续写默认系统提示词</label><textarea v-model="form.promptTemplate" class="textarea" rows="5" placeholder="留空使用内置模板"></textarea></div>
    <button class="btn primary" style="margin-top:12px" @click="save">保存 AI 设置</button>
  </div>
</template>
