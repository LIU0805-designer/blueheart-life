/**
 * GET /api/auth/me
 * 查询当前登录用户；未登录返回 { user: null }
 */
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user });
}
