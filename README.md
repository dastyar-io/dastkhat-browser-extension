# Dastkhat (دستخط)

Persian reading and writing helper for **Chrome, Edge and Firefox**. Open source, MIT licensed.

## Features
- **Persian mode:** automatic RTL, alignment and a Persian font on pages and inputs, per page or auto-enabled on chosen domains (ChatGPT, Claude, Gemini and many more).
- **Highlights:** select text, highlight it, and it is restored on reload.
- **AI writing helper:** Improve, Translate, Summarize, Grammar on selected text or in input fields, with your own API key (Anthropic, OpenAI, OpenRouter, Gemini, DeepSeek, Groq, Ollama or any OpenAI-compatible endpoint).
- **Private:** no telemetry, no accounts, no remote code. See [PRIVACY.md](PRIVACY.md).

## Install
- Chrome Web Store / Edge Add-ons / Firefox Add-ons: _links coming after store approval_.
- From source: `npm run build`, then load `dist/chrome` (Chrome/Edge, *Load unpacked*) or `dist/firefox/manifest.json` (Firefox, *Load Temporary Add-on*). Release zips are on the GitHub Releases page.

Then open the Dastkhat icon → Settings → AI to add a provider, base URL, API key and model.

## Development
```bash
npm run build            # all targets + zips in dist/
npm run build:firefox    # a single target
```
No dependencies (Node 18+ and `zip`). See [CONTRIBUTING.md](CONTRIBUTING.md) and [store/LISTING.md](store/LISTING.md) for publishing.

## How it works

- `background.js` calls the provider you picked in Settings directly
  (Anthropic `/v1/messages`, or any OpenAI-compatible `/chat/completions`)
  using the key you save there (`chrome.storage.local`). «Your key
  never leaves your browser, but it is visible in your own extension's
  local storage, this is normal for a personal-use extension, just don't
  share this build with your key already saved in it».
- `content.js` handles highlighting, the selection toolbar, live Persian
  detection in text fields (via a regex-based ratio check on the Persian
  Unicode block), and applies `direction: rtl`, `text-align: right`, and
  the chosen font to whichever elements or fields cross the Persian-text
  threshold, not the whole page.
- Fonts: bundled locally under `fonts/`. Public builds ship only open-licensed fonts (see [fonts/README.md](fonts/README.md)); commercial faces are stripped by the build.

## Re-bundling fonts

```bash
node scripts/bundle-fonts.mjs
```

Set `DASTKHAT_FONT_SRC` to a folder of commercial fonts to bundle them for local use only.

## Known limitations, worth iterating on next

- Highlight restore can still fail if the page text changed since the highlight
  was saved, or if the same text appears multiple times (only the first match
  is restored).
- Persian detection uses a simple character-ratio heuristic per element or
  field, not a real language model, so short or mixed-language text can be
  misclassified.
- No streaming on AI responses yet, the panel shows a placeholder until the
  full reply comes back.
