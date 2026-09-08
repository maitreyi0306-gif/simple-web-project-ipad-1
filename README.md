Updated prototype: Thumbi the AI pet (rule-based, iPad-first)

This commit adds a working local prototype that runs in the browser on your iPad. Highlights:
- Canvas-based placeholder pixel-art Thumbi with small frame animations
- Touch interactions: tap, drag-to-pet, repeated tap behavior
- Pet state saved in localStorage (happiness, energy, affection, playfulness)
- Simple TALK chat with rule-based short replies and Text-to-Speech
- Memory UI to view / delete (saved intentionally via Remember button)
- Simple generated sound effects (WebAudio)
- PWA manifest and service worker skeleton

Next steps you can ask me to do:
- Replace the placeholder sprite with your provided pixel-art frames (supply the sprite sheet image)
- Add polished pixel animations and extra sounds
- Add cloud LLM integration for richer chat (requires API key and serverless function)
