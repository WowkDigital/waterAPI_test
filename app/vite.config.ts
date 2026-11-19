import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "HydroZgoda · WodoStrażnik Pola",
        short_name: "HydroZgoda",
        description: "Zgoda buduje, woda ratuje! PWA dla rolników i KOWR: Sentinel-2, Landsat Thermal, NMT, symulator zastawki, Pakt Sąsiedzki i raport ARiMR.",
        theme_color: "#15382e",
        background_color: "#f4f6f2",
        display: "standalone",
        lang: "pl",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(api\.open-meteo\.com|danepubliczne\.imgw\.pl|uldk\.gugik\.gov\.pl)\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "agro-apis",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
});
