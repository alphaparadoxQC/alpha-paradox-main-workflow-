import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpha ParadoxQC — Immersive Quantum Deep-Tech",
  description: "Alpha ParadoxQC — Immersive Quantum Deep-Tech Scrollytelling Experience",
  icons: {
    icon: "/images/brand-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#050505] text-white antialiased selection:bg-[#3B0A6B] selection:text-[#00E5FF]">
        {children}
      </body>
    </html>
  );
}

