import { marked } from "marked";
import { splitContent } from "./segments";

const imgName = (slot: number) => `image-${slot + 1}.png`;

export function toMarkdown(content: string): string {
  return splitContent(content)
    .map((s) => (s.type === "md" ? s.text : `\n![${s.alt}](${imgName(s.slot)})\n`))
    .join("")
    .trim();
}

export function toHtmlBody(content: string): string {
  return splitContent(content)
    .map((s) =>
      s.type === "md"
        ? (marked.parse(s.text, { async: false }) as string)
        : `<img src="${imgName(s.slot)}" alt="${s.alt.replace(/"/g, "&quot;")}" />`,
    )
    .join("\n")
    .trim();
}

export function toHtmlDocument(content: string): string {
  const body = toHtmlBody(content);
  const title = /<h1[^>]*>(.*?)<\/h1>/i.exec(body)?.[1].replace(/<[^>]+>/g, "") ?? "Article";
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
}
