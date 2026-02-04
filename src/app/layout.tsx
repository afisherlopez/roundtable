import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Roundtable",
  description: "Three AI models debate your prompt — one final answer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-spring-50 text-bark-800 font-mono">
        {children}
      </body>
    </html>
  );
}
