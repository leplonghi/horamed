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
      includeAssets: [
        "favicon.png", 
        "icon-512.png", 
        "icon-1024.png", 
        "icons/icon-192.png",
        "icons/icon-192-maskable.png",
        "icons/icon-512-maskable.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "HoraMed - Gestão Completa da Sua Saúde",
        short_name: "HoraMed",
        description: "Gerencie medicamentos, exames e consultas. Receba lembretes inteligentes direto no celular.",
        theme_color: "#7c3aed",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/hoje?source=pwa",
        id: "horamed-pwa",
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
            src: "/icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512-maskable.png",
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
        display_override: ["standalone", "minimal-ui"],
        handle_links: "preferred",
        launch_handler: {
          client_mode: "navigate-existing",
        },
        screenshots: [
          {
            src: "/screenshots/home.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Tela inicial do HoraMed",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,jpg,jpeg}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/supabase/],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/zmsuqdwleyqpdthaqvbi\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 200,
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
                maxEntries: 100,
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
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: mode === "development",
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
