/**
 * 豆包方舟平台 (ARK) 客户端
 *
 * 图片生成（Seedream 5.0 Lite）→ 同步 /images/generations
 * 视频生成（Seedance 1.5 Pro）→ 异步 /contents/generations/tasks
 *
 * 同一个 API Key，免费额度。
 */

/* ──── 常量 ──── */

const ARK_BASE = "https://ark.cn-beijing.volces.com/api/v3";
const IMAGE_URL = `${ARK_BASE}/images/generations`;
const TASKS_URL = `${ARK_BASE}/contents/generations/tasks`;

/** 视频任务轮询间隔（毫秒） */
const POLL_INTERVAL = 3000;

/** 视频任务最大等待时间 */
const MAX_WAIT = 10 * 60 * 1000; // 10 分钟

/* ──── 模型 ID ──── */

export const MODELS = {
  /** Seedream 5.0 Lite — 支持联网检索、精准指令遵循 */
  image: "doubao-seedream-5-0-lite-260128",
  /** Seedance 1.5 Pro — 原生音视频联合生成 */
  video: "doubao-seedance-1-5-pro-251215",
} as const;

/* ──── 图片尺寸（需 ≥ 3,686,400 px） ──── */

export const IMAGE_SIZES = {
  square: "1920x1920",   // 3,686,400 px — 正方形头像
  wide: "2560x1440",     // 3,686,400 px — 横版
  tall: "1440x2560",     // 3,686,400 px — 竖版
  large: "2048x2048",    // 4,194,304 px — 大正方形
} as const;

/* ──── 类型 ──── */

export interface ImageGenOptions {
  size?: string;
  /** 是否开启联网检索（5.0 Lite 特有） */
  webSearch?: boolean;
}

export type TaskStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled";

export interface ImageResult {
  url: string;
}

export interface TaskResult {
  taskId?: string;
  status: TaskStatus;
  images?: ImageResult[];
  videoUrl?: string;
  error?: string;
}

/* ──── 内部工具 ──── */

function getApiKey(): string {
  const key = process.env.ARK_API_KEY || "";
  if (!key) throw new Error("未配置 ARK_API_KEY，请在 .env 中设置");
  return key;
}

const AUTH_HEADERS = () => ({
  Authorization: `Bearer ${getApiKey()}`,
  "Content-Type": "application/json",
});

/* ──── 图片生成（同步） ──── */

/**
 * 生成图片 — 同步返回图片 URL
 *
 * Seedream 5.0 Lite，/images/generations 端点，
 * 响应即含图片 URL，无需轮询。
 */
export async function generateImage(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<TaskResult> {
  const { size = IMAGE_SIZES.square, webSearch = false } = options;

  const body: Record<string, unknown> = {
    model: MODELS.image,
    prompt,
    size,
    n: 1,
    response_format: "url",
  };

  if (webSearch) {
    body.tools = [{ type: "web_search" }];
  }

  console.log(`[ARK] 图片生成中... "${prompt.slice(0, 50)}..."`);

  const res = await fetch(IMAGE_URL, {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ARK 图片生成失败 [${res.status}]: ${err}`);
  }

  const data = await res.json();

  const images: ImageResult[] = (data.data || [])
    .filter((d: { url?: string }) => d.url)
    .map((d: { url: string }) => ({ url: d.url }));

  if (!images.length) {
    throw new Error(`ARK 未返回图片: ${JSON.stringify(data).slice(0, 300)}`);
  }

  console.log(`[ARK] 图片已生成 (${images.length} 张)`);
  return { status: "succeeded", images };
}

/* ──── 视频生成（异步） ──── */

/**
 * 生成视频 — 提交任务，返回任务 ID
 *
 * Seedance 1.5 Pro，异步任务模式，需用 pollTask 等待。
 */
export async function createVideoTask(
  prompt: string,
  imageUrl?: string
): Promise<string> {
  const content: Array<Record<string, unknown>> = [
    { type: "text", text: prompt },
  ];

  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  const body = {
    model: MODELS.video,
    content,
    parameters: { duration: 5, audio: true },
  };

  console.log(`[ARK] 视频任务提交中... "${prompt.slice(0, 50)}..."`);

  const res = await fetch(TASKS_URL, {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ARK 视频任务失败 [${res.status}]: ${err}`);
  }

  const { id } = await res.json();
  console.log(`[ARK] 视频任务已提交: ${id}`);
  return id;
}

/**
 * 轮询等待视频任务完成
 */
export async function pollTask(taskId: string): Promise<TaskResult> {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT) {
    const res = await fetch(`${TASKS_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ARK 查询失败 [${res.status}]: ${err}`);
    }

    const data = await res.json();
    const status = data.status as TaskStatus;

    switch (status) {
      case "succeeded": {
        const images: ImageResult[] = [];
        let videoUrl: string | undefined;

        for (const item of data.content || []) {
          if (item.type === "image_url" && item.image_url?.url) {
            images.push({ url: item.image_url.url });
          }
          if (item.type === "video_url" && item.video_url?.url) {
            videoUrl = item.video_url.url;
          }
        }

        console.log(`[ARK] 视频生成完成: ${taskId}`);
        return { taskId, status: "succeeded", images, videoUrl };
      }

      case "failed":
        console.error(`[ARK] 视频任务失败: ${data.error?.message}`);
        return { taskId, status: "failed", error: data.error?.message };

      case "cancelled":
        return { taskId, status: "cancelled" };

      default:
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  }

  throw new Error(`视频任务超时: ${taskId}（超过 ${MAX_WAIT / 60000} 分钟）`);
}

/**
 * 生成视频（一步到位：提交 + 等待）
 */
export async function generateVideo(
  prompt: string,
  imageUrl?: string
): Promise<TaskResult> {
  const taskId = await createVideoTask(prompt, imageUrl);
  return pollTask(taskId);
}
