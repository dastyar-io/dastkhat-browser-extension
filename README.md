<div align="center">

<img src="assets/icons/icon128.png" width="96" alt="Dastkhat logo" />

# Dastkhat (دستخط)

**Persian reading & writing helper for Chrome, Edge and Firefox.**
RTL and Persian fonts on any site, highlights, and AI rewrite/translate with your own API key.

[![CI](https://github.com/dastyar-io/dastkhat-browser-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/dastyar-io/dastkhat-browser-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-green.svg)](src/manifest.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[فارسی](README.fa.md) · [Privacy](PRIVACY.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

</div>

## Features

- **Persian mode:** automatic RTL, alignment and a Persian font on pages and inputs, per page or auto-enabled on chosen domains (ChatGPT, Claude, Gemini and many more).
- **Highlights:** select text, highlight it, and it is restored when you come back.
- **AI writing helper:** Improve, Translate, Summarize and Grammar on selected text or in input fields, using your own key (Anthropic, OpenAI, OpenRouter, Gemini, DeepSeek, Groq, Ollama or any OpenAI-compatible endpoint).
- **Private by design:** no telemetry, no accounts, no remote code. See [PRIVACY.md](PRIVACY.md).

## Install

- Chrome Web Store / Edge Add-ons / Firefox Add-ons: _links coming after store approval_.
- From a release: download the zip for your browser from [Releases](https://github.com/dastyar-io/dastkhat-browser-extension/releases).
- From source: see [Development](#development).

After installing, open the Dastkhat icon → Settings → AI and add a provider, base URL, API key and model.

## Development

```bash
git clone https://github.com/dastyar-io/dastkhat-browser-extension.git
cd dastkhat-browser-extension
npm run build            # all targets + zips in dist/
npm run build:firefox    # a single target
```

No dependencies (Node 18+ and the `zip` CLI). Load `dist/chrome` as an unpacked extension in Chrome/Edge, or `dist/firefox/manifest.json` as a temporary add-on in Firefox.

### Project layout

```
src/
  manifest.json      extension manifest (source of truth for all targets)
  background/        service worker: calls the AI provider you configured
  content/           content script and styles: Persian mode, highlights, selection toolbar
  popup/             toolbar popup
  options/           settings page
  shared/            code used by several parts: providers, defaults, font catalog
assets/
  icons/             extension icons and logo
  fonts/             bundled open-licensed fonts (see assets/fonts/README.md)
scripts/             build and font-bundling scripts
store/               store listing copy, screenshots and promo tiles
docs/                architecture notes
.github/             CI, release workflow, issue and PR templates
```

The build flattens `src/` and `assets/` into a single package per browser in `dist/`. More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Publishing steps are in [store/LISTING.md](store/LISTING.md).

## Contributing

Issues and pull requests are welcome, in English or Persian. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) first. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

Code is released under the [MIT License](LICENSE). Bundled fonts keep their own open licenses, listed in [assets/fonts/README.md](assets/fonts/README.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
