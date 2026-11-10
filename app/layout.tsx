import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "BeFin",
  description: "Show how today's choices shape tomorrow's options.",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/icons/icon-192.png`,
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
  appleWebApp: { capable: true, title: "BeFin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
