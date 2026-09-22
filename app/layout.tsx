import type { Metadata, Viewport } from "next";
import { Figtree, Literata } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const serifa = Literata({ subsets: ["latin", "latin-ext"], variable: "--fonte-serifa", display: "swap" });
const sans = Figtree({ subsets: ["latin", "latin-ext"], variable: "--fonte-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Lâmpada",
  description: "Companheira de discipulado: leitura da Bíblia, oração e aconselhamento na tradição reformada presbiteriana.",
  applicationName: "Lâmpada",
  appleWebApp: { capable: true, title: "Lâmpada", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1826" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serifa.variable} ${sans.variable}`}>
      <body>
        <div className="app">{children}</div>
        <RegisterSW />
      </body>
    </html>
  );
}
