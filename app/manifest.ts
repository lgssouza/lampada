import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lâmpada",
    short_name: "Lâmpada",
    description: "Companheira de discipulado: Bíblia, oração e aconselhamento.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    background_color: "#F3F5F2",
    theme_color: "#14213D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
