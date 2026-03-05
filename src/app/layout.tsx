import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ads Dashboard — Vicus",
  description: "AI-powered advertising performance dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
