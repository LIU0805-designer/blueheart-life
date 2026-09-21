/**
 * 用户状态信号 → AI 提示
 *
 * 把前端采集的行为信号（极简回复、消息趋势、打字行为）
 * 翻译成一段简短的提示，让 AI 真正「看见」用户的状态。
 *
 * 关键边界：
 *  - 文本信号（极简回复、消息趋势）是 AI 本就能从对话里观察到的，可以反映、可温和点破。
 *  - 打字行为信号（犹豫、反复删改、放弃）是用户无法控制的真实痕迹，
 *    绝不能点破（会让人不安），只转化为「更耐心、放慢、给空间」的态度。
 */

export interface InputBehaviorSignals {
  hesitating: boolean;
  hasRewritten: boolean;
  hasAbandoned: boolean;
}

export interface UserStateSignals {
  lastMinimalResponse: {
    type: "dismissive" | "speechless" | "minimal";
    intensity: "medium" | "high";
  } | null;
  messageTrend: "stable" | "shortening" | "lengthening" | "first_message";
  inputBehavior: InputBehaviorSignals;
}

export function buildUserStateHint(
  signals: UserStateSignals | null | undefined
): string | null {
  if (!signals) return null;

  const visible: string[] = [];
  const hidden: string[] = [];

  const m = signals.lastMinimalResponse;
  if (m?.type === "speechless") {
    visible.push("只回了标点或省略号，似乎说不出来");
  } else if (m?.type === "dismissive") {
    visible.push("回复很敷衍（如「哦」「算了」），多半在退缩或不想说");
  } else if (m?.type === "minimal") {
    visible.push("只回了很短的回复（如「嗯」「好」）——结合你刚才的提问判断是同意还是退缩");
  }

  if (signals.messageTrend === "shortening") {
    visible.push("最近几条消息越来越短，可能在退缩");
  }
  if (signals.messageTrend === "lengthening") {
    visible.push("最近越说越长，正在打开心扉、愿意倾诉");
  }

  const b = signals.inputBehavior;
  if (b?.hasAbandoned) hidden.push("打了一段话又全部删掉了");
  if (b?.hasRewritten) hidden.push("反复删改、难以表达");
  if (b?.hesitating) hidden.push("犹豫了很久才发出这条消息");

  if (!visible.length && !hidden.length) return null;

  const parts: string[] = [];
  if (visible.length) {
    parts.push("你能从对话里直接观察到的：用户" + visible.join("；") + "。");
  }
  if (hidden.length) {
    parts.push(
      "来自打字行为的信号（用户" +
        hidden.join("；") +
        "）——不要点破这些细节，只需因此更耐心、放慢节奏、给足空间、别追问。"
    );
  }

  return "【用户状态提示】" + parts.join("");
}
