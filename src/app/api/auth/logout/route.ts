/**
 * POST /api/auth/logout
 * 登出；删除会话并清空 cookie（幂等）
 */
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  await destroySession();
  return Response.json({ ok: true });
}
