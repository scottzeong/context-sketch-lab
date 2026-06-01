import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Context Sketch Lab",
  description: "Phase 0 nonverbal sketch analysis spike"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
