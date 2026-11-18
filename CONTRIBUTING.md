# Contributing to Dastkhat

Thanks for helping! Issues and pull requests are welcome, in English or Persian.

## Dev setup
```bash
git clone https://github.com/dastyar-io/dastkhat-browser-extension.git && cd dastkhat-browser-extension
npm run build          # no dependencies; needs Node 18+ and the `zip` CLI
```
- **Chrome / Edge:** `chrome://extensions` (or `edge://extensions`) → Developer mode → *Load unpacked* → `dist/chrome`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → `dist/firefox/manifest.json`.

The source is plain JavaScript with no bundler. Edit files under `src/` (see the layout in the [README](README.en.md#project-layout)), rebuild, and reload the extension.

## Guidelines
- Keep it dependency-free and Manifest V3 compatible with both Chromium and Firefox (use the `chrome.*` namespace).
- Never add remote code, analytics or telemetry.
- Don't commit commercial fonts. New fonts need an open license (SIL OFL or similar) listed in `assets/fonts/README.md`.
- Build with `npm run build` and test the unpacked build in at least one Chromium browser and Firefox before opening a PR.
- Keep PRs focused; describe what changed and how you tested it.

## Reporting security issues
See [SECURITY.md](SECURITY.md); don't open public issues for vulnerabilities.
