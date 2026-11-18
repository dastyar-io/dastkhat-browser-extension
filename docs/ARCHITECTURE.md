# Architecture

Dastkhat is a dependency-free Manifest V3 extension written in plain JavaScript. There is no bundler: `scripts/build.mjs` copies files from `src/` and `assets/` into a flat package per browser under `dist/`.

## Components

| Path | Role |
| --- | --- |
| `src/background/background.js` | Service worker. Calls the provider you picked in Settings directly (Anthropic `/v1/messages`, or any OpenAI-compatible `/chat/completions`) using the key stored in `chrome.storage.local`. |
| `src/content/content.js`, `content.css` | Highlighting, the selection toolbar, live Persian detection in text fields (a character-ratio check on the Persian Unicode block), and applying `direction: rtl`, `text-align: right` and the chosen font to elements or fields that cross the Persian-text threshold, not the whole page. |
| `src/popup/` | Toolbar popup: toggle Persian mode on the current tab. |
| `src/options/` | Settings page: fonts, auto-enabled domains, AI providers, highlights. |
| `src/shared/` | `providers.js` (provider presets), `defaults.js` (default settings), `fonts.js` (font catalog). |
| `assets/fonts/` | Bundled fonts. Proprietary faces are flagged `proprietary: true` in `fonts.js` and stripped from every public build. |

## Build output

`npm run build` produces `dist/<target>/` plus `dist/dastkhat-<version>-<target>.zip` for `chrome`, `edge` and `firefox`, and a source archive. The Firefox build swaps in a background-scripts manifest and Gecko settings, and drops the Chromium-only `favicon` permission.

## Security notes

API keys are stored unencrypted in the extension's local storage of your own browser profile and sent only to the endpoint you configure. This is normal for a personal-use extension; do not share a profile with a key saved in it.

## Known limitations

- Highlight restore can fail if the page text changed since saving, or if the same text appears several times (only the first match is restored).
- Persian detection is a simple heuristic, so short or mixed-language text can be misclassified.
- AI responses are not streamed yet; the panel shows a placeholder until the full reply arrives.
