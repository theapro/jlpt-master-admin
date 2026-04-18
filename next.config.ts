import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/dashboard", destination: "/admin/dashboard" },
      { source: "/dashboard/:path*", destination: "/admin/dashboard/:path*" },

      { source: "/users/:path*", destination: "/admin/users/:path*" },
      { source: "/admins/:path*", destination: "/admin/admins/:path*" },
      { source: "/courses/:path*", destination: "/admin/courses/:path*" },
      { source: "/messages/:path*", destination: "/admin/messages/:path*" },
      { source: "/goals/:path*", destination: "/admin/goals/:path*" },
      { source: "/bot-texts", destination: "/admin/bot-texts" },
      { source: "/bot-texts/:path*", destination: "/admin/bot-texts/:path*" },

      { source: "/bot-buttons", destination: "/admin/bot-buttons" },
      {
        source: "/bot-buttons/:path*",
        destination: "/admin/bot-buttons/:path*",
      },
    ];
  },
};

export default nextConfig;
