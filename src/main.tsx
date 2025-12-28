import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register PWA service worker
import { registerSW } from "virtual:pwa-register";

// Auto-update service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Optional: Show a prompt to refresh for new content
    console.log("New content available, refresh to update.");
  },
  onOfflineReady() {
    console.log("App ready to work offline.");
  },
  onRegistered(r) {
    console.log("Service worker registered:", r);
  },
  onRegisterError(error) {
    console.error("Service worker registration error:", error);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
