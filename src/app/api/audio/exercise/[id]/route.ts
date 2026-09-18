/**
 * GET /api/audio/exercise/[id]
 *
 * 返回指定练习的疗愈引导音频（MP3）。
 * 首次访问自动生成并缓存，后续直接返回缓存文件。
 *
 * 例如：/api/audio/exercise/breathing-space → 三分钟呼吸空间引导音频
 */

import { NextRequest } from "next/server";
import { getExerciseAudio, getExerciseMeta } from "@/lib/audio/exercises";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const buffer = await getExerciseAudio(id);
    const bytes = new Uint8Array(buffer);
    return new Response(bytes, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err: any) {
    const meta = getExerciseMeta(id);
    if (!meta) {
      return Response.json({ error: `未找到练习: ${id}` }, { status: 404 });
    }
    console.error(`[API] 生成音频失败 [${id}]:`, err);
    return Response.json({ error: "音频生成失败，请稍后重试" }, { status: 500 });
  }
}
