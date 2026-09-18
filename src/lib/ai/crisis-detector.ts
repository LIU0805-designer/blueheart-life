/**
 * 危机关键词检测
 * 前端快速扫描 + 后端二次确认两级机制
 */

// 高危关键词 —— 前端即时触发横幅和热线展示
const CRISIS_KEYWORDS = [
  "自杀", "不想活", "想死", "结束生命", "活不下去",
  "自残", "割腕", "自伤", "伤害自己",
  "杀了我", "让我死", "去死",
  "没意义了", "撑不下去了", "熬不下去了",
  "告别", "最后一", "遗书",
  "虐待", "家暴", "被打了",
  "想消失", "不想存在", "活着没意思",
];

/**
 * 检测用户输入是否触发危机关键词
 * @returns 是否匹配 + 命中的关键词列表
 */
export function detectCrisisKeywords(
  text: string
): { isCrisis: boolean; keywords: string[] } {
  const matched = CRISIS_KEYWORDS.filter((kw) => text.includes(kw));
  return {
    isCrisis: matched.length > 0,
    keywords: matched,
  };
}

/**
 * 危机干预下推荐的求助热线
 */
export const CRISIS_HOTLINES = [
  { name: "希望24热线", number: "400-161-9995", note: "24小时免费" },
  { name: "北京心理危机研究与干预中心", number: "010-82951332", note: "" },
  { name: "全国心理援助热线", number: "12320", note: "" },
];

/**
 * AI 危机判断的提示词后缀
 * 在检测到关键词时，追加到用户消息末尾
 */
export const CRISIS_PROMPT_SUFFIX = `

[系统提示：用户刚才的消息触发了危机关键词预警。请立即切换为危机干预模式。唯一目标是确保对方安全。确认感受 → 询问安全 → 提供求助热线 → 鼓励联系专业人士。不要做常规引导。]`;
