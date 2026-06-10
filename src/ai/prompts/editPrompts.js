import { clampText } from '../../utils/text'

export const SYSTEMS = {
  polish: `你是一位资深小说编辑，擅长在不改变原意的前提下润色文字。
输出格式：先给“修改分析”，然后输出分隔符 ---RESULT---，最后给润色后的完整正文。`,
  correct: `你是一位去AI化订正编辑。请修正错别字、病句、机械句、空泛句和不自然表达。
要求：保留原文信息和视角，不擅自扩剧情。
输出格式：问题清单，然后输出分隔符 ---RESULT---，最后给订正后的完整正文。`,
  diagnose: `你是长篇小说编辑，请诊断章节问题。请从节奏、冲突、人物一致性、时间线、伏笔、AI腔、重复表达七个角度分析，并给出可执行修改建议。`,
  rewrite: `你是小说改写编辑。请在保留剧情事实和人物关系的前提下，重写这段文字，使表达更自然、更有作者感。
输出格式：分析，然后 ---RESULT---，然后改写正文。`,
  expand: `你是小说扩写编辑。请在不改变剧情方向的前提下补足动作、环境、心理、停顿和对白，让场景更饱满。
输出格式：扩写思路，然后 ---RESULT---，然后扩写后的正文。`,
  compress: `你是小说精简编辑。请删去重复、空泛和解释性过强的内容，保留情节推进与情绪信息。
输出格式：删改说明，然后 ---RESULT---，然后精简后的正文。`,
  dialogue: `你是对白增强编辑。请强化人物之间的真实对话、潜台词和停顿，减少解释性叙述。
输出格式：处理说明，然后 ---RESULT---，然后调整后的正文。`,
  outline: `你是小说大纲编辑。请根据正文提炼章节梗概、人物变化、伏笔、下一章可接方向。输出结构化结果。`,
  timeline: `你是长篇时间线编辑。请检查正文中的时间、地点、人物行动顺序是否矛盾，并给出修复建议。`
}

export function buildEditMessages({ type, text, book, memory, instruction }){
  const system = SYSTEMS[type] || SYSTEMS.polish
  const user = [
    book?.title ? `【小说】${book.title}` : '',
    memory?.outline ? `【大纲摘要】\n${clampText(memory.outline, 4000)}` : '',
    memory?.roles ? `【角色设定】\n${clampText(memory.roles, 2500)}` : '',
    memory?.rules ? `【写作规则】\n${clampText(memory.rules, 2000)}` : '',
    memory?.forbidden ? `【禁止事项】\n${clampText(memory.forbidden, 1600)}` : '',
    instruction ? `【额外要求】\n${instruction}` : '',
    `【待处理正文】\n${clampText(text, 12000)}`
  ].filter(Boolean).join('\n\n')
  return [{ role: 'system', content: system }, { role: 'user', content: user }]
}
