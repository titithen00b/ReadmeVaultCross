import { marked, type MarkedExtension } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// Initialisation unique — ne jamais appeler marked.use() ailleurs
marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }) as MarkedExtension
);

marked.use({
  gfm: true,
  breaks: false,
  // Désactive le "mangling" des entités qui peut corrompre le texte Unicode
  mangle: false,
  headerIds: false,
} as any);

export function renderMarkdown(content: string): string {
  if (!content) return "";
  return marked.parse(content) as string;
}
