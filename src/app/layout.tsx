import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://roterfaden.kr"),
  title: "Roter Faden",
  description: "Roter Faden reading, sketching, feedback, and portfolio workspace",
  icons: {
    icon: "/brand/favicon.svg",
    apple: "/brand/icon-192.png"
  },
  openGraph: {
    title: "Roter Faden",
    description: "Roter Faden reading, sketching, feedback, and portfolio workspace",
    images: ["/brand/og-image.png"]
  }
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

