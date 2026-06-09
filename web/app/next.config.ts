import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@databricks/sql'],
};

export default nextConfig;
