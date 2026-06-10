import { clampText } from '../../utils/text'

export const DEFAULT_CONTINUE_PROMPT = `你是一位擅长长篇小说创作、真人情绪表达和去AI化写作的创作者。
请根据小说大纲、人物设定、最近章节和风格样本，续写新的章节。
要求：
1. 人物行为要符合既有关系与性格，不要突然跳变。
2. 情绪通过动作、停顿、物件和对话体现，不要直接喊口号。
3. 避免模板句、空泛句、机械对照句。
4. 不要复述资料，直接写正文。
5. 输出格式：第一行章节标题，空一行后输出正文。`

export function buildContinueMessages({ book, memory, recentChapters, styleSamples, characterCards, plotThreads, mode, userInstruction, targetWords, template }){
  const system = template || DEFAULT_CONTINUE_PROMPT
  const context = [
    `【小说】${book?.title || '未命名'}`,
    `【目标字数】约 ${targetWords || 3000} 字`,
    `【续写模式】${mode || '下一章续写'}`,
    memory?.outline ? `【大纲】\n${clampText(memory.outline, 9000)}` : '',
    memory?.roles ? `【角色设定】\n${clampText(memory.roles, 5000)}` : '',
    memory?.world ? `【世界观】\n${clampText(memory.world, 3000)}` : '',
    characterCards?.length ? `【人物卡】\n${characterCards.map(c => `${c.name}：${c.profile || c.description || ''}`).join('\n')}` : '',
    plotThreads?.length ? `【伏笔与线索】\n${plotThreads.map(p => `${p.title}：${p.description || ''}（状态：${p.status || '未处理'}）`).join('\n')}` : '',
    styleSamples?.length ? `【风格样本】\n${styleSamples.map(s => `《${s.name}》\n${clampText(s.text, 2500)}`).join('\n\n')}` : '',
    recentChapters?.length ? `【最近章节】\n${recentChapters.map(ch => `### ${ch.title}\n${clampText(ch.content, 4200)}`).join('\n\n')}` : '',
    userInstruction ? `【本次额外要求】\n${userInstruction}` : ''
  ].filter(Boolean).join('\n\n')
  return [
    { role: 'system', content: system },
    { role: 'user', content: context }
  ]
}
