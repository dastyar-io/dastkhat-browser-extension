# Store listing copy (Chrome Web Store, Edge Add-ons, AMO)

**Name:** Dastkhat (دستخط)
**Category:** Productivity (Chrome/Edge) · Language Support (AMO)
**Summary (≤132 chars):** Persian reading & writing helper: RTL + Persian fonts on any site, highlights, and AI rewrite/translate.

**Description:**
Dastkhat makes the web comfortable for Persian readers and writers.
- Persian mode: automatic RTL direction and a Persian font for Persian text, per page or for auto-enabled domains (ChatGPT, Claude, Gemini and more).
- Highlights: select text, highlight it, and it is restored when you return.
- AI helper: improve, translate, summarize or fix grammar of selected text, using YOUR own API key and provider (Anthropic, OpenAI, OpenRouter, Gemini, DeepSeek, Groq, Ollama, or any OpenAI-compatible endpoint).
- Private: no accounts, no analytics, no servers of ours. Open source (MIT).

Source: https://github.com/dastyar-io/dastkhat-browser-extension

## Permission justifications (paste into the store forms)
- **storage:** saves settings, highlights and the user's AI provider config locally.
- **activeTab:** lets the popup read/toggle Persian mode on the current tab.
- **favicon (Chromium only):** shows site icons in the settings page.
- **Host access `<all_urls>`:** content script must run on any site to apply RTL/fonts/highlights; background worker calls the AI endpoint the user configures (arbitrary user-chosen host).
- **Remote code:** none. All code and fonts are bundled.
- **Data usage:** selected text is sent only to the user-configured AI provider on explicit click. Declare "Website content" collection, not sold, not used for unrelated purposes; link PRIVACY.md.

## Required assets (you must create)
- Screenshots: 1280×800 (min 1, up to 5) · Small promo tile 440×280 (Chrome) · Marquee 1400×560 (optional)
- Icon 128×128: already in `assets/icons/`.

## Submission steps
1. `npm run build`
2. Chrome: https://chrome.google.com/webstore/devconsole → upload `dist/dastkhat-<ver>-chrome.zip` ($5 one-time developer fee).
3. Edge: https://partner.microsoft.com/dashboard/microsoftedge → upload `dist/dastkhat-<ver>-edge.zip`.
4. Firefox: https://addons.mozilla.org/developers/ → upload `dist/dastkhat-<ver>-firefox.zip`; when asked for source, upload `dist/dastkhat-<ver>-source.zip` and note "run `npm run build`" (no minification, so source equals package).
