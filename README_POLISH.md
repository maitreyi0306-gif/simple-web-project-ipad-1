# Deployment and polishing notes

This commit contains the "Do all" polishing work: canvas renderer that uses your uploaded art, enhanced WebAudio sound manager, and deployment notes for enabling the LLM proxy.

What changed
- src/animation/AnimatedSpriteCanvas.tsx — canvas renderer that loads the uploaded image (configured via THUMBI_CONFIG.avatarUrl) and synthesizes simple frame-based animations (idle bob, blink overlay, happy flash). This sits behind src/animation/AnimatedSprite.tsx as the main rendering component.
- src/sound/soundManager.ts — refined WebAudio helper with named sounds; used by behavior engine for event sounds.
- Deployment notes below and in README_ENHANCEMENTS.md describe how to enable the serverless API and how to set OPENAI_API_KEY in your deployment env.

Notes about assets
- I did not move the uploaded image file; the renderer uses the current uploaded filename (set in window.THUMBI_CONFIG.avatarUrl in index.html). If you'd like me to rename/move the file into /assets/thumbi-reference.png I can do that — but it requires the repo to contain the binary at that path (I can reference the raw URL without copying the bytes).

Next steps I can take for you on request
- Rename/move uploaded image into assets/thumbi-reference.png and update config. Reply "Move file".
- Create a real sprite-sheet (frame-by-frame) from the art (requires either vector/PSD layers or artist-supplied frames). Reply "Sprite sheet" if you will provide frames or want me to generate approximated frames.
- Add more SFX and tune animation curves. Reply "Polish visuals+sounds".
- Deploy serverless proxy and enable cloud LLM chat (I will provide a GitHub Actions workflow or Vercel instructions). Reply "Deploy LLM" and tell me whether you use Vercel/Netlify.
