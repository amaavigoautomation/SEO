# Growth OS

Brand context store + OpenAI chat that writes publish-ready content, with a shared team login.

## How it works
Brands (full context) -> New chat (pick brand, say what you want) -> server sends
`brand context + output rules + chat history` to OpenAI -> reply is shown as formatted text.
Keep chatting in the same thread: ask for changes (you get the full updated version) or move to a new topic.
Primary model `OPENAI_MODEL`, automatic fallback to `OPENAI_FALLBACK_MODEL`. If both fail you see the error and nothing is saved.

Blogs come with SEO title, meta description, slug, H1/H2 structure, an answer-first intro (AEO), FAQ, GEO-friendly
factual statements, CTA, and image slots. Each image slot has a **Generate image** button (needs OPENAI_IMAGE_MODEL).
Under every reply: Copy text / Copy Markdown / Copy HTML / Download .html. Generated images download as image-1.png, image-2.png...
and match the file names used in the exported HTML.

## Local setup
1. Create a free Postgres DB (Neon / Supabase) and copy its connection string.
2. `cp .env.example .env` and fill in: GROWTH_OS_DATABASE_URL, OPENAI_API_KEY, OPENAI_MODEL, OPENAI_FALLBACK_MODEL,
   OPENAI_IMAGE_MODEL, APP_PASSWORD, AUTH_SECRET (random 32+ chars).
3. `npm install`
4. `npx prisma db push --accept-data-loss`  (creates tables; drops the old task/review tables from the previous version)
5. `npm run db:reseed`  (loads Amaavigo, Umrah360, AscentAbility with cleaned-up contexts; use `npm run db:seed` to only add missing brands)
6. `npm run dev` -> http://localhost:3000

## Deploy on Vercel
Push to GitHub, import in Vercel, add the same env vars, deploy, and run steps 4-5 once against the production DB.
Chat and image routes allow up to 300s (Vercel Hobby maximum).

## Find which models work on your key
`npm run check:models` tests every chat model your key can use and prints your request/minute and token/minute limits.
The first line of its output lists the image models on your key; put one in OPENAI_IMAGE_MODEL.

## Workflows and approval (added)

**Content types** (pick on "New chat"): SEO blog, SEO brief, AEO FAQ, GEO content, Social posts, Free chat. Each has fixed input fields and fixed output rules on top of the brand context. Then keep chatting to request edits or new topics.

**Status flow:** Draft → In review → Approved → Ready to publish. A reviewer can send In review → Changes requested (comment required). Approved chats are locked until reopened. Editing a chat in review sends it back to Draft. Every step is stored in the chat's History with who and when.

**Dashboard:** the home page shows counts per status and filters by brand, status and content type.

**Upgrade an existing database:** after pulling this branch run

    npx prisma db push
    npx prisma generate

Existing chats become "Free chat" / "Draft". Then restart `npm run dev`.

**Vercel:** set every variable from `.env.example` in Project → Settings → Environment Variables, use a hosted Postgres, deploy.
