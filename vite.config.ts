import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const manifest = defineManifest({
    manifest_version: 3,
    name: "OfferBound – Job Application Tracker",
    version: "0.1.0",
    description:
      "Automatically tracks your job applications from email, building timelines and deadline reminders.",
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
    background: {
      service_worker: "src/background/serviceWorker.ts",
      type: "module",
    },
    action: {
      default_icon: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
      },
      default_title: "OfferBound",
    },
    web_accessible_resources: [
      {
        resources: ["src/window/window.html"],
        matches: ["<all_urls>"],
      },
    ],
    options_ui: {
      page: "src/options/options.html",
      open_in_tab: true,
    },
    permissions: ["storage", "alarms", "identity", "identity.email", "notifications"],
    host_permissions: [
      "https://www.googleapis.com/*",
      "https://gmail.googleapis.com/*",
      "https://oauth2.googleapis.com/*",
    ],
    oauth2: {
      client_id: env.VITE_GOOGLE_CLIENT_ID,
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    },
  });

  return {
    plugins: [react(), crx({ manifest })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      target: "esnext",
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          window: path.resolve(__dirname, "src/window/window.html"),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: { port: 5173 },
    },
  };
});
