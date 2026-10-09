import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "HealthVault";
const base = process.env.VITE_BASE_PATH ?? (process.env.NODE_ENV === "production" ? `/${repositoryName}/` : "/");

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
