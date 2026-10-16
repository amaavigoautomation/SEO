// Content workflows (presets). Client-safe: used by the New chat form (fields) and the server (rules).
export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
};

export type Workflow = {
  key: string;
  label: string;
  description: string;
  fields: Field[];
  rules: string; // appended to the system message for every message in the chat
  buildMessage: (v: Record<string, string>) => string;
  title: (v: Record<string, string>) => string;
};

const line = (label: string, value?: string) => (value && value.trim() ? `${label}: ${value.trim()}\n` : "");

const WORKFLOW_LIST: Workflow[] = [
  {
    key: "seo_blog",
    label: "SEO blog post",
    description: "Publish-ready blog with SEO title, meta, FAQ, CTA and image slots.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g. How Hajj agencies can manage pilgrim documents with software" },
      { name: "keywords", label: "Target keywords", type: "text", placeholder: "primary keyword, related keywords" },
      { name: "market", label: "Market / city", type: "text", defaultValue: "India" },
      { name: "audience", label: "Audience", type: "text", placeholder: "defaults to the brand's main audience" },
      { name: "length", label: "Length", type: "select", options: ["800-1000 words", "1200-1500 words", "1800-2200 words"], defaultValue: "1200-1500 words" },
      { name: "notes", label: "Extra notes", type: "textarea", placeholder: "angle, points to include, things to avoid (optional)" },
    ],
    rules: `Deliver a complete, publish-ready blog post following the blog structure from the output rules.
- The H1 contains the primary keyword naturally. Use the primary keyword in the first 100 words and in at least one H2. Never stuff keywords; use related terms and natural variations.
- Include the "SEO title:", "Meta description:" and "Slug:" lines first.
- Include 1 hero image slot plus roughly one image slot per 2-3 sections.
- After the closing CTA add a horizontal rule and a short section titled "Notes for editor (not for publishing)" with: 3-5 internal link ideas (page topic + suggested anchor text) and any [VERIFY] items you used.`,
    buildMessage: (v) =>
      `Write a publish-ready SEO blog post.\n${line("Topic", v.topic)}${line("Target keywords", v.keywords)}${line("Market", v.market)}${line("Audience", v.audience)}${line("Length", v.length)}${line("Extra notes", v.notes)}`.trim(),
    title: (v) => `SEO blog: ${v.topic}`,
  },
  {
    key: "seo_brief",
    label: "SEO content brief",
    description: "Search intent, keyword hypotheses, outline, FAQs and evidence gaps for a writer.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true },
      { name: "keywords", label: "Target keywords", type: "text", placeholder: "optional, otherwise suggest hypotheses" },
      { name: "market", label: "Market / country", type: "text", defaultValue: "India" },
      { name: "audience", label: "Audience", type: "text" },
      { name: "notes", label: "Extra notes", type: "textarea" },
    ],
    rules: `Deliver a content brief a writer can start from immediately (this workflow is the one place a brief is wanted, so a structured brief is correct here). Include:
1. Search intent and funnel stage.
2. Primary keyword and related keywords, clearly labelled as hypotheses. Never invent search volumes or rankings.
3. Two title options and two meta description options.
4. A detailed outline with H2/H3 headings and a one-line note on what each section must cover.
5. FAQ questions to answer directly (with the answer angle).
6. Internal link suggestions, evidence gaps and claims to verify, and a short reviewer checklist.`,
    buildMessage: (v) =>
      `Prepare an SEO content brief.\n${line("Topic", v.topic)}${line("Target keywords", v.keywords)}${line("Market", v.market)}${line("Audience", v.audience)}${line("Extra notes", v.notes)}`.trim(),
    title: (v) => `SEO brief: ${v.topic}`,
  },
  {
    key: "aeo_faq",
    label: "AEO FAQ",
    description: "Direct question-and-answer set built for answer engines, with FAQ schema.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true },
      { name: "count", label: "Number of questions", type: "select", options: ["6", "8", "10", "12"], defaultValue: "8" },
      { name: "market", label: "Market / city", type: "text", defaultValue: "India" },
      { name: "audience", label: "Audience", type: "text" },
      { name: "notes", label: "Extra notes", type: "textarea" },
    ],
    rules: `Deliver an answer-engine-optimised FAQ ready to publish.
- Questions are phrased the way real people ask or search them (what / how / why / cost / difference / is it suitable). Mix informational and decision-stage questions.
- Each question is a Markdown H3. Each answer starts with a direct one-sentence answer, then 1-2 supporting sentences, 40-60 words in total, plain language, no marketing fluff.
- Use only facts from the brand context or the user's message. If an answer needs an unknown fact (price, regulation, feature), write the most useful safe answer and add a short [VERIFY: ...] note.
- After the Q&A, add a section "FAQPage schema" containing valid FAQPage JSON-LD in a json code block that mirrors the answers exactly.
- No image slots in this workflow.`,
    buildMessage: (v) =>
      `Create an AEO FAQ with ${v.count || "8"} questions.\n${line("Topic", v.topic)}${line("Market", v.market)}${line("Audience", v.audience)}${line("Extra notes", v.notes)}`.trim(),
    title: (v) => `AEO FAQ: ${v.topic}`,
  },
  {
    key: "geo_content",
    label: "GEO content",
    description: "Entity statements, citation-worthy facts, schema and an AI-visibility test plan.",
    fields: [
      { name: "subject", label: "Product / service / topic", type: "text", required: true },
      { name: "market", label: "Market", type: "text", defaultValue: "India" },
      { name: "audience", label: "Audience", type: "text" },
      { name: "notes", label: "Extra notes", type: "textarea" },
    ],
    rules: `Deliver content that helps AI answer engines understand and cite the brand. Output these sections in order:
1. "Entity statements": the brand described in one sentence, in about 50 words and in about 120 words. Precise, factual, quotable, same wording for the name, category and audience each time.
2. "Citation-worthy facts": a list of specific factual statements about the brand and subject. After each add [from brand context] if it comes from the brand context or the user's message, otherwise [VERIFY]. Never invent facts.
3. "Page copy": publish-ready copy for an About / "What is <subject>" page, with clear H2 headings and definitions an AI could quote.
4. "Structured data": Organization (and Product or Service where relevant) JSON-LD in a json code block, using only confirmed facts and leaving unknown fields out.
5. "AI visibility test plan": 10 realistic prompts to test monthly in ChatGPT, Gemini and Perplexity, and what to record each time (mentioned or not, cited or not, accuracy, competitors named).
Never promise or imply guaranteed citations or rankings. No image slots in this workflow.`,
    buildMessage: (v) =>
      `Create GEO (generative engine optimisation) content.\n${line("Subject", v.subject)}${line("Market", v.market)}${line("Audience", v.audience)}${line("Extra notes", v.notes)}`.trim(),
    title: (v) => `GEO: ${v.subject}`,
  },
  {
    key: "social",
    label: "Social content",
    description: "Platform-native posts or a content calendar with captions, CTAs and image slots.",
    fields: [
      { name: "platform", label: "Platform", type: "select", required: true, options: ["LinkedIn", "Instagram", "Facebook", "X (Twitter)", "YouTube Shorts / Reels", "WhatsApp broadcast"], defaultValue: "LinkedIn" },
      { name: "format", label: "Format", type: "select", options: ["Single post", "1-week plan (5 posts)", "2-week calendar (10 posts)"], defaultValue: "Single post" },
      { name: "topic", label: "Topic / goal", type: "text", required: true },
      { name: "audience", label: "Audience", type: "text" },
      { name: "notes", label: "Extra notes", type: "textarea" },
    ],
    rules: `Deliver ready-to-post social content for the chosen platform.
- Write in the platform's native style and length. Hook in the first line. A clear single CTA that matches the brand's preferred CTA.
- For each post give: Post title (for internal use), the caption / copy ready to paste, hashtags (3-8 relevant ones; 3-5 on LinkedIn), CTA, and a one-line creative direction.
- For visual platforms (Instagram, Facebook, LinkedIn) add one image slot per post. For short video (YouTube Shorts / Reels) add a 30-second script with scenes instead of an image slot.
- For a plan or calendar, number the posts, suggest a day and time slot for each, and vary the formats and angles so the feed does not repeat itself.
- Emojis only if the brand voice uses them, and sparingly.`,
    buildMessage: (v) =>
      `Create social media content.\n${line("Platform", v.platform)}${line("Format", v.format)}${line("Topic / goal", v.topic)}${line("Audience", v.audience)}${line("Extra notes", v.notes)}`.trim(),
    title: (v) => `${v.platform || "Social"}: ${v.topic}`,
  },
];

export const FREE_WORKFLOW: Workflow = {
  key: "free",
  label: "Free chat",
  description: "Ask for anything in your own words.",
  fields: [{ name: "message", label: "What do you want written?", type: "textarea", required: true, placeholder: "e.g. Write a LinkedIn post announcing our new feature..." }],
  rules: "",
  buildMessage: (v) => (v.message ?? "").trim(),
  title: (v) => (v.message ?? "").replace(/\s+/g, " ").trim(),
};

export const WORKFLOWS: Workflow[] = [...WORKFLOW_LIST, FREE_WORKFLOW];

export function getWorkflow(key: string | null | undefined): Workflow | undefined {
  return WORKFLOWS.find((w) => w.key === (key || "free"));
}

export const WORKFLOW_LABEL: Record<string, string> = Object.fromEntries(WORKFLOWS.map((w) => [w.key, w.label]));
