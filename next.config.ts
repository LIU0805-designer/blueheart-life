import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许手机通过局域网 IP 访问开发服务器（否则手机端脚本会被安全开关拦截，页面点了没反应）
  allowedDevOrigins: ["100.122.137.142"],
};

export default nextConfig;
