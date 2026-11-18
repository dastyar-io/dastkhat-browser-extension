#!/usr/bin/env node
/**
 * Builds store-ready packages into ./dist:
 *   dist/dastkhat-<version>-chrome.zip   (Chrome Web Store)
 *   dist/dastkhat-<version>-edge.zip     (Microsoft Edge Add-ons; same MV3 build as Chrome)
 *   dist/dastkhat-<version>-firefox.zip  (addons.mozilla.org)
 *   dist/dastkhat-<version>-source.zip   (source archive; AMO reviewers may ask for it)
 * Unpacked copies live in dist/chrome, dist/edge, dist/firefox for "Load unpacked".
 *
 * Usage: node scripts/build.mjs [chrome|edge|firefox|all]
 * Source lives in src/ (by feature) and assets/ (icons, fonts); the build flattens it.
 * Requires Node 18+ and the `zip` CLI. Non-redistributable (proprietary) fonts
 * flagged in fonts.js are always stripped.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");
const ASSETS = path.join(ROOT, "assets");
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, "manifest.json"), "utf8"));
const VERSION = manifest.version;
// Source files (relative to src/). The built extension is flat: each file is copied to the package root,
// so manifest.json, the HTML pages and the scripts keep simple relative paths.
const FILES = [
  "background/background.js",
  "content/content.js", "content/content.css",
  "shared/defaults.js", "shared/fonts.js", "shared/providers.js",
  "options/options.html", "options/options.js",
  "popup/popup.html", "popup/popup.js",
];

// Work out which font keys/dirs are proprietary by evaluating the catalog.
const fontsSrc = fs.readFileSync(path.join(SRC, "shared", "fonts.js"), "utf8");
const catalog = vm.runInNewContext(fontsSrc + "\nDASTKHAT_FONTS", { chrome: {} });
const strippedKeys = Object.keys(catalog).filter((k) => catalog[k].proprietary);
const strippedDirs = new Set(strippedKeys.map((k) => catalog[k].css.split("/")[1]));

function stripFontsJs(src) {
  let out = src;
  for (const key of strippedKeys) {
    const re = new RegExp(`\\n  ${key}: \\{[\\s\\S]*?\\n  \\},`);
    if (!re.test(out)) throw new Error("Could not strip font entry: " + key);
    out = out.replace(re, "");
  }
  return out;
}

function copyFonts(dest) {
  const src = path.join(ASSETS, "fonts");
  for (const dir of fs.readdirSync(src, { withFileTypes: true })) {
    if (!dir.isDirectory() || strippedDirs.has(dir.name)) continue;
    fs.cpSync(path.join(src, dir.name), path.join(dest, "fonts", dir.name), {
      recursive: true,
      filter: (p) => !p.endsWith(".DS_Store"),
    });
  }
}

function targetManifest(target) {
  const m = JSON.parse(JSON.stringify(manifest));
  if (target === "firefox") {
    m.permissions = m.permissions.filter((p) => p !== "favicon"); // Chromium-only
    delete m.minimum_chrome_version;
    m.background = { scripts: ["providers.js", "defaults.js", "background.js"] };
    m.browser_specific_settings = {
      gecko: {
        id: "dastkhat@dastkhat.app",
        strict_min_version: "142.0",
        data_collection_permissions: { required: ["websiteContent"] },
      },
      gecko_android: { strict_min_version: "142.0" },
    };
  }
  return m;
}

function build(target) {
  const dir = path.join(DIST, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FILES) fs.copyFileSync(path.join(SRC, f), path.join(dir, path.basename(f)));
  fs.writeFileSync(path.join(dir, "fonts.js"), stripFontsJs(fontsSrc));
  fs.cpSync(path.join(ASSETS, "icons"), path.join(dir, "icons"), { recursive: true, filter: (p) => !p.endsWith(".DS_Store") });
  copyFonts(dir);
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(targetManifest(target), null, 2) + "\n");
  const zip = path.join(DIST, `dastkhat-${VERSION}-${target}.zip`);
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", zip, "."], { cwd: dir });
  console.log(`✓ ${path.relative(ROOT, zip)} (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)`);
}

function buildSource() {
  const zip = path.join(DIST, `dastkhat-${VERSION}-source.zip`);
  fs.rmSync(zip, { force: true });
  const skip = ["dist/*", "node_modules/*", ".git/*", "*.DS_Store", "local-fonts/*", ...[...strippedDirs].map((d) => `assets/fonts/${d}/*`)];
  execFileSync("zip", ["-r", "-X", "-q", zip, ".", "-x", ...skip], { cwd: ROOT });
  console.log(`✓ ${path.relative(ROOT, zip)}`);
}

const arg = process.argv[2] || "all";
fs.mkdirSync(DIST, { recursive: true });
const targets = arg === "all" ? ["chrome", "edge", "firefox"] : [arg];
for (const t of targets) {
  if (!["chrome", "edge", "firefox"].includes(t)) throw new Error("Unknown target: " + t);
  build(t);
}
if (arg === "all") buildSource();
console.log(`Stripped proprietary fonts: ${strippedKeys.join(", ")}`);
