## Deploying the serverless chat proxy (Vercel)

This repo includes `api/chat.js`, a Vercel-compatible serverless endpoint that proxies chat to OpenAI.

Steps to enable:
1. Create a Vercel account and link this repo.
2. In the Vercel Project Settings -> Environment Variables, add `OPENAI_API_KEY` with your key.
3. Deploy the project. The endpoint will be available at `/api/chat` on your deployed domain.
4. The client will POST `{ message: '...' }` to `/api/chat` and receive standard OpenAI Chat response JSON.

Notes:
- Keep your keys secret; do not commit them to the repo.
- If you prefer Netlify or Cloudflare Workers, adapt `api/chat.js` to their handler format.
