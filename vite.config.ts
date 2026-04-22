import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = env.VITE_API_BASE_URL ?? "http://localhost:4000";
  const apiOrigin = new URL(apiBase).origin.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        strategies: "generateSW",
        devOptions: {
          enabled: true,
          type: "module",
        },
        includeAssets: ["favicon.svg", "icons/*.png"],
        manifest: {
          name: "PWA Todo",
          short_name: "Todo",
          description: "Offline-first full-stack Todo Progressive Web App.",
          start_url: "/",
          display: "standalone",
          background_color: "#f3efe6",
          theme_color: "#20463f",
          shortcuts: [
            {
              name: "View Todos",
              short_name: "View Todos",
              url: "/",
              icons: [
                {
                  src: "icons/icon-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
              ],
            },
          ],
          icons: [
            {
              src: "icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          navigationPreload: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${apiOrigin}/todos(?:/.*)?$`, "i"),
              method: "GET",
              handler: "NetworkFirst",
              options: {
                cacheName: "api-get-cache-v1",
                networkTimeoutSeconds: 5,
                cacheableResponse: {
                  statuses: [0, 200],
                },
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: new RegExp(`^${apiOrigin}/todos(?:/.*)?$`, "i"),
              method: "POST",
              handler: "NetworkOnly",
              options: {
                backgroundSync: {
                  name: "todo-post-queue-v1",
                  options: {
                    maxRetentionTime: 24 * 60,
                  },
                },
              },
            },
            {
              urlPattern: new RegExp(`^${apiOrigin}/todos(?:/.*)?$`, "i"),
              method: "PUT",
              handler: "NetworkOnly",
              options: {
                backgroundSync: {
                  name: "todo-put-queue-v1",
                  options: {
                    maxRetentionTime: 24 * 60,
                  },
                },
              },
            },
            {
              urlPattern: new RegExp(`^${apiOrigin}/todos(?:/.*)?$`, "i"),
              method: "DELETE",
              handler: "NetworkOnly",
              options: {
                backgroundSync: {
                  name: "todo-delete-queue-v1",
                  options: {
                    maxRetentionTime: 24 * 60,
                  },
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache-v1",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "asset-cache-v1",
              },
            },
          ],
        },
      }),
    ],
  };
});
