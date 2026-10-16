// Assistant messages may contain image slots on their own line:
//   [[IMAGE: <image generation prompt> | ALT: <alt text>]]
export type Segment =
  | { type: "md"; text: string }
  | { type: "image"; slot: number; prompt: string; alt: string };

export function splitContent(content: string): Segment[] {
  const re = /\[\[IMAGE:\s*([\s\S]*?)\s*\|\s*ALT:\s*([\s\S]*?)\s*\]\]/g;
  const out: Segment[] = [];
  let last = 0;
  let slot = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    if (m.index > last) out.push({ type: "md", text: content.slice(last, m.index) });
    out.push({ type: "image", slot: slot++, prompt: m[1].trim(), alt: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < content.length) out.push({ type: "md", text: content.slice(last) });
  return out;
}
