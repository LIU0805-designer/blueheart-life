# 蓝心人生 · BlueHeart Life

A 24/7 AI mental-companionship web app. BlueHeart is "someone who walks a stretch of the road with you" — not a therapist. It doesn't diagnose, prescribe, or replace professionals. It listens, keeps you company, and when it detects crisis signals it switches to a protective mode and surfaces helplines.

**Live:** https://blueheartlife.cloud

## Features

- Real-time AI chat with a warm, companion-style persona
- Emotion & user-state tracking that adapts the tone of replies
- Crisis-keyword detection → protective mode + helpline suggestions
- Voice replies (TTS), journal, and chat history
- Auth (register/login) and rate-limiting to protect the AI quota

## Tech stack

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **Backend:** Next.js API routes · Prisma 5 · PostgreSQL
- **AI:** DeepSeek (chat) · Doubao Seed-TTS / Baidu (voice)
- **Other:** Zustand · Framer Motion · Zod · bcryptjs

## Run locally

```bash
npm install
npx prisma db push
npm run dev
```

Then open http://localhost:3000.

> Requires a `.env` with `DATABASE_URL` and `DEEPSEEK_API_KEY` (see `.env.example`).
