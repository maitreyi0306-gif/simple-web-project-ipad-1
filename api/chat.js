// api/chat.js
// Serverless endpoint (Vercel / Netlify-compatible) to proxy to OpenAI Chat API.
// Deploy this function and set OPENAI_API_KEY in your environment variables.

// Vercel (Node 18) exports default handler
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(501).json({ error: 'OPENAI_API_KEY not configured on server' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: body.model || 'gpt-4o-mini',
        messages: body.messages || [{ role: 'user', content: body.message || '' }],
        max_tokens: body.max_tokens || 300,
        temperature: body.temperature || 0.9
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('chat proxy error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
