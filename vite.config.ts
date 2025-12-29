import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icon-512.png", "icon-1024.png", "icons/icon-192.png"],
      manifest: {
        name: "HoraMed - Gestão de Saúde",
        short_name: "HoraMed",
        description: "Gerencie seus medicamentos, exames e saúde em um só lugar",
        theme_color: "#7c3aed",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/hoje",
        id: "/",
        lang: "pt-BR",
        dir: "ltr",
        icons: [
          {
            src: "/favicon.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-1024.png",
            sizes: "1024x1024",
            type: "image/png",
          },
        ],
        categories: ["health", "medical", "lifestyle"],
        prefer_related_applications: false,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/zmsuqdwleyqpdthaqvbi\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-core': ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
          'ui-forms': ['@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-switch', '@radix-ui/react-slider'],
          'ui-display': ['@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-accordion', '@radix-ui/react-collapsible'],
          'ui-menu': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-context-menu', '@radix-ui/react-menubar'],
          'charts': ['recharts'],
          'motion': ['framer-motion'],
          'date': ['date-fns', 'date-fns-tz'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'supabase': ['@supabase/supabase-js'],
          'pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["@capacitor/core", "@capacitor/app"],
  },
}));
