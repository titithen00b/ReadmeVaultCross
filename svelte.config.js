import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
export default {
  preprocess: vitePreprocess(),
  onwarn: (warning, handler) => {
    // Suppress A11y warnings for this desktop app
    if (warning.code.startsWith("a11y")) return;
    handler(warning);
  },
};
