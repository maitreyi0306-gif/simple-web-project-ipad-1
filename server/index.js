import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { mood, behavior, memories, message } = req.body;

    const systemPrompt = `You are Thumbi, a tiny AI pet. Personality: affectionate, playful, mischievous, dramatic, funny. Current mood: ${mood || "content"}. Current behavior: ${behavior || "idle"}. Keep replies SHORT (under 20 words), playful, conversational. No long paragraphs. ${memories ? `Known memories: ${memories}` : ""}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 80,
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "...";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Thumbi is napping and can't chat right now." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Thumbi chat server running on port ${PORT}`));