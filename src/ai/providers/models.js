export const PROVIDERS = {
  deepseek: {
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  openai: {
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini']
  },
  mimo: {
    label: 'MiMo',
    endpoint: 'https://api.xiaomimimo.com/v1/chat/completions',
    models: ['mimo-v2.5-pro', 'mimo-v2.5-flash']
  },
  custom: {
    label: '自定义 OpenAI-Compatible',
    endpoint: '',
    models: ['custom-model']
  }
}

export function getModels(provider){ return PROVIDERS[provider]?.models || PROVIDERS.deepseek.models }
export function getEndpoint(provider, apiBaseUrl){ return apiBaseUrl || PROVIDERS[provider]?.endpoint || PROVIDERS.deepseek.endpoint }
