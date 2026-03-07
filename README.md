# Bitcoin Is Better

A modern, educational single-page website that tells the complete story of Bitcoin — from the history of money to the future of a Bitcoin standard.

## Overview

This is a long-form vertical scrolling experience designed to educate readers on Bitcoin's origins, technology, and significance. The content draws from **"The Bitcoin Standard"** by Saifedean Ammous and insights from **Jack Mallers** (founder of Strike).

## Sections

1. **The Problem** — Why fiat money is broken
2. **History of Money** — From barter to gold to fiat to Bitcoin
3. **The 2008 Crisis** — The catalyst for Bitcoin's creation
4. **Satoshi Nakamoto** — The mysterious creator
5. **How Bitcoin Works** — Blockchain, mining, keys
6. **Sound Money** — Bitcoin vs. gold vs. fiat comparison
7. **Digital Scarcity** — The 21 million cap and halving schedule
8. **Lightning Network** — Scaling Bitcoin for everyday payments
9. **Global Adoption** — Nations, institutions, and milestones
10. **The Future** — Where Bitcoin is heading

## Bitcoin Defender AI Chat

A floating chat widget in the bottom-right corner where visitors can debate Bitcoin. The AI never concedes — it defends Bitcoin with real statistics, quotes from *The Bitcoin Standard*, and Jack Mallers' insights.

**How it works:**
- Frontend chat widget built into the page (`chat.js`)
- Serverless API function (`api/chat.js`) proxies messages to OpenAI
- Smart fallback responses work even without an API key
- Keyword detection routes to topic-specific rebuttals offline

## Tech Stack

- Pure HTML, CSS, and JavaScript — no frameworks, no build step
- Dark theme with Bitcoin-orange accents
- Scroll-triggered animations
- Fully responsive design
- Google Fonts: Inter, Space Grotesk, JetBrains Mono
- OpenAI GPT-4o-mini for the AI chat (via Vercel serverless function)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the environment variable `OPENAI_API_KEY` in the Vercel dashboard (Settings → Environment Variables)
4. Deploy — that's it

Get an OpenAI API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

## Run Locally

Open `index.html` in any modern browser, or serve it locally:

```bash
# Python
python3 -m http.server 8000

# Node.js (if npx available)
npx serve .
```

Then visit `http://localhost:8000`.

The chat widget works locally with built-in fallback responses. For full AI responses, deploy to Vercel with your OpenAI API key.
