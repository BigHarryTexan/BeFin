import type { NextConfig } from "next";

// Static export: the MVP is fully client-side (data stays in the browser),
// so it can be hosted on Azure Static Web Apps, GitHub Pages, etc.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
