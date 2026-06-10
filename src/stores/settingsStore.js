import { defineStore } from 'pinia'
import { db } from '../db'

const DEFAULT_READER = { fontSize: 18, lineHeight: 1.9, theme: 'paper' }
const DEFAULT_PROFILE = { name: '归棠', subtitle: 'Guitang Reader v3', avatar: '' }
const DEFAULT_SYNC = { owner: 'ws020520', repo: 'tingxue', branch: 'main', file: 'library.json', token: '' }
const DEFAULT_AI = {
  provider: 'deepseek', apiBaseUrl: '', deepseekKey: '', openaiKey: '', mimoKey: '', customKey: '',
  model: 'deepseek-chat', temperature: 0.75, maxTokens: 4096, wordCount: 3000, promptTemplate: '',
  defaultStyle: '自然作者感，克制，少解释，多动作和对话', safety: '不覆盖正文，先进入草稿箱'
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({ reader: { ...DEFAULT_READER }, ai: { ...DEFAULT_AI }, profile: { ...DEFAULT_PROFILE }, sync: { ...DEFAULT_SYNC }, loaded: false }),
  actions: {
    async load(){
      const reader = await db.settings.get('reader')
      const profile = await db.settings.get('profile')
      const sync = await db.settings.get('sync')
      const ai = await db.aiSettings.get('default')
      this.reader = { ...DEFAULT_READER, ...(reader?.value || {}) }
      this.profile = { ...DEFAULT_PROFILE, ...(profile?.value || {}) }
      this.sync = { ...DEFAULT_SYNC, ...(sync?.value || {}) }
      this.ai = { ...DEFAULT_AI, ...(ai || {}) }
      this.loaded = true
    },
    async saveReader(partial = {}){
      this.reader = { ...this.reader, ...partial }
      await db.settings.put({ key: 'reader', value: this.reader })
    },
    async saveProfile(partial = {}){
      this.profile = { ...this.profile, ...partial }
      await db.settings.put({ key: 'profile', value: this.profile })
    },
    async saveSync(partial = {}){
      this.sync = { ...this.sync, ...partial }
      await db.settings.put({ key: 'sync', value: this.sync })
    },
    async saveAi(partial = {}){
      this.ai = { ...this.ai, ...partial, key: 'default' }
      await db.aiSettings.put(this.ai)
    },
    getApiKey(provider = this.ai.provider){
      if (provider === 'deepseek') return this.ai.deepseekKey
      if (provider === 'openai') return this.ai.openaiKey
      if (provider === 'mimo') return this.ai.mimoKey
      return this.ai.customKey
    }
  }
})
