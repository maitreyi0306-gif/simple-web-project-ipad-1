// api/chat.js — Vercel serverless function proxying to Anthropic
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });

  try {
    const body = await (async () => {
      try { return await req.json(); } catch (e) { return {}; }
    })();
    const userMessage = (body.message || body.prompt || '').toString().slice(0, 2000);

    const payload = {
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: userMessage }],
      max_tokens_to_sample: 80
    };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: 'Anthropic API error', detail: text });
      return;
    }

    const data = await r.json();
    const reply = (data?.choices?.[0]?.message?.content) || data?.result || JSON.stringify(data);
    res.status(200).json({ choices: [{ message: { content: reply } }], raw: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
