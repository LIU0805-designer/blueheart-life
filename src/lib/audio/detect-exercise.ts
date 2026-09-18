/**
 * 从 AI 回复中检测正在引导的练习
 *
 * 匹配规则：扫描文本中是否出现了练习的特征短语。
 * 优先匹配长特征 → 短特征，避免误判。
 */

import { EXERCISES, type Exercise } from "@/lib/exercises";

/** 每个练习的检测特征（按优先级排序） */
const SIGNATURES: Record<string, string[]> = {
  "breathing-space": [
    "三分钟呼吸空间",
    "呼吸空间",
    "聚焦呼吸",
    "【第一步：觉察当下】",
    "4秒吸气",
    "觉察当下",
  ],
  "emotion-naming": [
    "情绪命名",
    "【第一步：停一下】",
    "把模糊的感受拆解",
    "把它们拆开",
    "给它一个名字",
  ],
  "thought-reframing": [
    "思维转换",
    "CBT三问",
    "【第一步：听见那个想法】",
    "听见那个想法",
    "第一个问题：这个想法",
    "它不是唯一的真相",
  ],
  "three-good-things": [
    "三件好事",
    "【第一步",
    "三件微小",
    "今天任何一个小小的",
    "你看，即使在不容易的一天里",
  ],
};

/**
 * 从文本中检测练习，返回匹配的 Exercise 或 null
 */
export function detectExercise(text: string): Exercise | null {
  for (const exercise of EXERCISES) {
    const sigs = SIGNATURES[exercise.id];
    if (!sigs) continue;
    for (const sig of sigs) {
      if (text.includes(sig)) {
        return exercise;
      }
    }
  }
  return null;
}
