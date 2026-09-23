/**
 * 密码哈希 —— bcryptjs
 * 纯 JS 实现，Windows 本地 + Vercel 部署均无需原生编译
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
