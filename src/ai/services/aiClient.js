import { getEndpoint } from '../providers/models'

export async function callChatCompletion({ settings, messages, temperature, maxTokens }){
  const provider = settings.provider || 'deepseek'
  const key = getKey(settings, provider)
  if (!key) throw new Error('请先在 AI 设置里填写 API Key')
  const endpoint = getEndpoint(provider, settings.apiBaseUrl)
  const headers = { 'Content-Type': 'application/json' }
  if (provider === 'mimo') headers['api-key'] = key
  else headers.Authorization = `Bearer ${key}`
  const body = {
    model: settings.model || defaultModel(provider),
    messages,
    temperature: Number(temperature ?? settings.temperature ?? 0.75),
    max_tokens: Number(maxTokens ?? settings.maxTokens ?? 4096)
  }
  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI 请求失败：${res.status} ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content || json.output_text || ''
  if (!content) throw new Error('AI 没有返回文本')
  return content
}

function getKey(settings, provider){
  if (provider === 'deepseek') return settings.deepseekKey
  if (provider === 'openai') return settings.openaiKey
  if (provider === 'mimo') return settings.mimoKey
  return settings.customKey
}

function defaultModel(provider){
  if (provider === 'openai') return 'gpt-4o-mini'
  if (provider === 'mimo') return 'mimo-v2.5-pro'
  return 'deepseek-chat'
}
