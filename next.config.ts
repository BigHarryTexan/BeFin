import type { NextConfig } from "next";

// Static export: the MVP is fully client-side (data stays in the browser),
// so it can be hosted on Azure Static Web Apps, GitHub Pages, etc.
// For GitHub Pages project sites the app lives under /<repo>, so CI builds with
// NEXT_PUBLIC_BASE_PATH=/BeFin. Locally it is empty (served from the root).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
