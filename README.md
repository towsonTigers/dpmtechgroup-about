# DPM Tech Group — Website

Marketing site for **DPM Tech Group**, an enterprise architecture, cloud and DevOps consulting firm led by David P. Morris Jr.

**Live site:** https://dpmtechgroup.com

The site is a static HTML/CSS/JS page hosted on **Cloudflare Workers (static assets)**, with a small serverless API that powers an **AI chat assistant**.

---

## Features

- **Single-page site**: hero, Services, About, "See how I work", How we work and Contact sections
- **Background and section videos**, all original renders, so there's no third-party licensing:
  - `hero.mp4`: a drifting network animation behind the hero section
  - `datacenter.mp4`: a dolly shot down a server aisle, used as a banner above Services
  - `how-i-work.mp4`: Python code typed in an editor and run in the terminal
- **AI chat assistant** (`/api/chat`) answers questions about the firm's services and background
  - Uses Cloudflare Workers AI by default; switches to Claude if an Anthropic API key is set
  - Rate-limited per visitor, accepts requests only from the site's own domain, and validates input
- **Back-to-top button** that appears after scrolling down one screen
- **Responsive** down to phone width
- **Accessible**: keyboard and screen-reader friendly, and honors `prefers-reduced-motion` (videos are replaced by still images)
- **Fast**: no frameworks and no build step; videos are small and lazy-loaded where possible

---

## Tech stack

| Layer | Technology |
|---|---|
| Front end | HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript |
| Hosting | Cloudflare Workers with static assets |
| API | Cloudflare Worker (`src/index.js`) |
| AI | Cloudflare Workers AI (`@cf/meta/llama-4-scout-17b-16e-instruct`), or Claude (`claude-haiku-5-5`) |
| Protection | Workers Rate Limiting binding, Origin check |
| Tooling | Wrangler CLI |

---

## Project structure

```
dpmtechgroup/
├── wrangler.jsonc            # Cloudflare config: assets, bindings, routes
├── README.md
├── src/
│   └── index.js              # Worker: POST /api/chat (AI assistant)
└── public/                   # Everything served as static files
    ├── index.html            # The page
    ├── index.css             # All site styles
    ├── chat.js               # Chat widget (front end)
    ├── 404.html              # Custom not-found page
    ├── hero.mp4              # Hero background video
    ├── hero-poster.jpg
    ├── datacenter.mp4        # Data center banner video
    ├── datacenter-poster.jpg
    ├── how-i-work.mp4        # "See how I work" coding video
    └── how-i-work-poster.jpg
```

Request routing:

- `/api/*` goes to the Worker (`src/index.js`), configured with `run_worker_first`.
- Everything else is served straight from `public/`. The Worker doesn't run, so there's no compute cost.

---

## Prerequisites

- A Cloudflare account with the `dpmtechgroup.com` zone added
- [Node.js](https://nodejs.org/), current LTS
- Wrangler (run with `npx`, no global install needed)

```bash
npx wrangler login
```

---

## Local development

**Static pages only.** To preview the page without the chat, open `public/index.html` in a browser, or serve the folder:

```bash
npx serve public
```

**Full site including the chat API:**

```bash
npx wrangler dev
```

Then open http://localhost:8787.

> **Note:** Workers AI runs on Cloudflare's network even during local development. You must be logged in, and chat messages count toward your Workers AI usage.

---

## Deployment

```bash
npx wrangler deploy
```

This uploads `public/` and `src/index.js` and attaches the custom domains `dpmtechgroup.com` and `www.dpmtechgroup.com`; their DNS records are created automatically. The `*.workers.dev` URL is disabled (`"workers_dev": false`) so search engines only index the real domain.

To check the configuration without deploying:

```bash
npx wrangler deploy --dry-run
```

---

## Chat assistant

### How it works

1. `public/chat.js` adds a chat button and window to the page.
2. Each message, along with the last 12 messages of the conversation, is sent to `POST /api/chat`.
3. `src/index.js` validates the request, applies the rate limit, and sends the conversation to the model along with a system prompt describing DPM Tech Group.
4. The reply is returned as JSON and shown in the chat window as plain text.

### Request and response

```http
POST /api/chat
Content-Type: application/json

{ "messages": [ { "role": "user", "content": "What services do you offer?" } ] }
```

```json
{ "reply": "DPM Tech Group offers four core services: ..." }
```

| Status | Meaning |
|---|---|
| `200` | Success: `{ "reply": "..." }` |
| `400` | Invalid JSON or messages |
| `403` | Request came from another website |
| `405` | Method other than `POST` |
| `429` | Rate limit reached (10 messages per minute per IP) |
| `502` | The AI provider failed |

### Updating what the assistant knows

Edit the `SYSTEM_PROMPT` constant at the top of `src/index.js`. It holds the firm's services, David's background, contact details, and the rules the assistant follows: no pricing or commitments, no invented facts, stay on topic. Redeploy after editing.

### Switching to Claude

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

When `ANTHROPIC_API_KEY` is set, the Worker uses Claude; otherwise it uses Workers AI. To change models, edit `vars` in `wrangler.jsonc`:

```jsonc
"vars": {
  "WORKERS_AI_MODEL": "@cf/meta/llama-4-scout-17b-16e-instruct",
  "CLAUDE_MODEL": "claude-haiku-5-5"
}
```

### Limits (in `src/index.js` and `wrangler.jsonc`)

| Setting | Value | Where |
|---|---|---|
| Messages per IP | 10 per 60 s | `ratelimits` in `wrangler.jsonc` |
| Conversation history sent | last 12 messages | `MAX_TURNS` |
| Max message length | 1,000 characters | `MAX_CHARS` |
| Max reply length | 400 tokens | `max_tokens` |
| Allowed origins | `dpmtechgroup.com`, `www.dpmtechgroup.com`, `localhost` | `ALLOWED_HOSTS` |

---

## Customization

**Colors and fonts.** These are defined as CSS variables at the top of `public/index.css`:

```css
:root {
  --ink: #0f2a3d;      /* navy: text, dark sections */
  --accent: #c8902a;   /* gold: highlights, buttons */
  --paper: #f7f5f0;    /* page background */
  ...
}
```

**Content.** All text is in `public/index.html`. The page is organized into sections with these ids:

| Section | Selector |
|---|---|
| Hero | `.hero` |
| Data center banner | `.banner` |
| Services | `#services` |
| About | `#about` |
| See how I work | `#how-i-work` |
| How we work | `#approach` |
| Contact | `#contact` |

**Contact email.** Search for `contact@dpmtechgroup.com` in `index.html`, `chat.js` and `src/index.js`. Set up the address with **Cloudflare Email Routing**, which forwards it to your inbox.

**Videos.** To replace a video, keep the same file name, or update the `src` and `poster` attributes in `index.html`. Keep background videos small (around 1–2 MB), muted, and H.264 MP4 so they play everywhere.

---

## Monitoring

| What | Where in the Cloudflare dashboard |
|---|---|
| Site traffic: requests, unique visitors | Domain → **Analytics & Logs** → Traffic |
| Real visitors and page views (privacy-friendly) | **Analytics & Logs** → **Web Analytics** |
| Chat API usage, errors, logs | **Workers & Pages** → `dpmtechgroup` → Metrics / Logs |
| AI usage and cost | **AI** → **Workers AI** |

Logs are enabled through `"observability": { "enabled": true }` in `wrangler.jsonc`.

---

## Security notes

- API keys are stored as Wrangler **secrets** and never appear in front-end code.
- Chat replies are inserted with `textContent`, so model output can't inject HTML or scripts.
- The Worker accepts only `user` and `assistant` messages; system-prompt injection through the API is rejected.
- Requests from other origins are rejected with `403`.

Possible next step: add **Cloudflare Turnstile** to the chat for stronger bot protection.

---

## License

© 2026 DPM Tech Group. All rights reserved.
