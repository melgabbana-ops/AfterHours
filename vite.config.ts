import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replace(/\\\\/g, "/");

          if (
            path.includes("/node_modules/react/") ||
            path.includes("/node_modules/react-dom/") ||
            path.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }
          if (path.includes("/node_modules/@supabase/")) return "vendor-supabase";
          if (path.includes("/node_modules/lucide-react/")) return "vendor-icons";

          const featureChunks: Record<string, string> = {
            "/src/PromptLibrary.tsx": "feature-prompts",
            "/src/MediaVault.tsx": "feature-media",
            "/src/Insights.tsx": "feature-insights",
            "/src/AdminDashboard.tsx": "feature-admin",
            "/src/SocialStudio.tsx": "feature-social",
            "/src/CharacterStudio.tsx": "feature-character",
            "/src/LovenseControl.tsx": "feature-device-controls",
            "/src/DailyAfterHours.tsx": "feature-daily",
          };

          for (const [modulePath, chunkName] of Object.entries(featureChunks)) {
            if (path.endsWith(modulePath)) return chunkName;
          }
        },
      },
    },
  },
});
