import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register PWA service workers after render
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    // Register notification worker under its own scope to avoid conflicts
    try {
      const notificationSW = await navigator.serviceWorker.register(
        "/notifications/sw-notifications.js",
        { scope: "/notifications/" }
      );
      console.log(
        "[SW] Notification service worker registered:",
        notificationSW.scope
      );
    } catch (error) {
      console.error("[SW] Notification service worker registration failed:", error);
    }

    // Register PWA service worker
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            console.log("New content available");
          },
          onOfflineReady() {
            console.log("App ready offline");
          },
        });
      })
      .catch(() => {
        // PWA registration failed silently
      });
  });
}
