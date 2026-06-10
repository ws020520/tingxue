import { db } from '../../db'
import { nowIso, uid } from '../../utils/text'
import { callChatCompletion } from './aiClient'
import { buildBookContext } from '../context/buildBookContext'
import { buildContinueMessages } from '../prompts/continuePrompt'
import { buildEditMessages } from '../prompts/editPrompts'
import { CHAT_SYSTEM } from '../prompts/chatPrompt'
import { parseChapter, splitResult } from '../utils/parseAIResult'

export async function generateContinuation({ bookId, settings, mode, instruction, targetWords, saveDraft = true }){
  const ctx = await buildBookContext(bookId, { recentCount: 4 })
  const messages = buildContinueMessages({
    ...ctx,
    mode,
    userInstruction: instruction,
    targetWords: targetWords || settings.wordCount,
    template: settings.promptTemplate
  })
  const output = await callChatCompletion({ settings, messages })
  const parsed = parseChapter(output)
  const draft = {
    id: uid('draft'), bookId, chapterId: '', type: 'continue', title: parsed.title, input: instruction || '', output: parsed.content, rawOutput: output, status: 'draft', createdAt: nowIso(), updatedAt: nowIso()
  }
  if (saveDraft) await db.aiDrafts.put(draft)
  await db.aiHistory.put({ id: uid('hist'), bookId, chapterId: '', type: 'continue', input: instruction || '', output, createdAt: nowIso() })
  return draft
}

export async function editTextWithAI({ type, bookId, chapterId, text, instruction, settings }){
  const book = await db.books.get(bookId)
  const memory = bookId ? await db.aiMemories.get(bookId) : null
  const messages = buildEditMessages({ type, text, book, memory, instruction })
  const output = await callChatCompletion({ settings, messages })
  const parsed = splitResult(output)
  const draft = { id: uid('draft'), bookId, chapterId, type, title: typeLabel(type), input: text, output: parsed.result, analysis: parsed.analysis, rawOutput: output, status: 'draft', createdAt: nowIso(), updatedAt: nowIso() }
  await db.aiDrafts.put(draft)
  await db.aiHistory.put({ id: uid('hist'), bookId, chapterId, type, input: text, output, createdAt: nowIso() })
  return draft
}

export async function chatWithAI({ settings, messages }){
  const output = await callChatCompletion({ settings, messages: [{ role: 'system', content: CHAT_SYSTEM }, ...messages] })
  await db.aiHistory.put({ id: uid('hist'), type: 'chat', input: JSON.stringify(messages), output, createdAt: nowIso() })
  return output
}

function typeLabel(type){
  if (type === 'polish') return '润色结果'
  if (type === 'correct') return '订正结果'
  if (type === 'diagnose') return '章节诊断'
  if (type === 'rewrite') return '改写结果'
  if (type === 'expand') return '扩写结果'
  if (type === 'compress') return '缩写结果'
  if (type === 'dialogue') return '对白增强'
  if (type === 'outline') return '大纲提炼'
  if (type === 'timeline') return '时间线检查'
  return 'AI 草稿'
}
