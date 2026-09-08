Enhancements and deployment notes

What I added
- Serverless proxy: api/chat.js — Vercel-compatible endpoint to forward chat requests to OpenAI. Set OPENAI_API_KEY in environment to enable.
- Upgraded client-side interactions and animations inside script.js (pushed) — better breathing, blinking, follow-finger, peek, sleepy/sleep behaviors, richer reaction triggers.
- WebAudio-based SFX synthesized programmatically (no external audio files needed) — small squeaks, chirps, and sleepy sounds.

How to enable cloud LLM (optional)
1. Deploy the repo to Vercel or Netlify. The api/chat.js file works on Vercel as a Serverless Function. On Netlify you may need to adapt to Netlify function handler shape.
2. In your deployment settings, set an environment variable OPENAI_API_KEY with your OpenAI API key.
3. From the client, the app will POST to /api/chat with { message: 'hi' } — see script.js for client integration.

Privacy & security
- The serverless proxy allows you to avoid embedding keys in the client. Do not commit API keys to the repository.

If you'd like, I can also add a GitHub Actions workflow to automatically deploy to Vercel (requires Vercel token) or a simple GitHub Pages-only flow for static assets.

Next steps I can take immediately
- Create a sprite sheet and replace canvas-drawing with frame-based animation (if you want pixel-perfect frames). Requires deciding on frame layout.
- Add more expressive sounds and tune timings.
- Add a small UI toggle that lets you select between "Local" rule-based chat and "Cloud" LLM chat.

Tell me which of those you want next and I will proceed to implement it.
