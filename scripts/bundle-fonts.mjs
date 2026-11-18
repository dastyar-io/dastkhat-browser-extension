#!/usr/bin/env node
/**
 * Bundles all Dastkhat fonts into ./assets/fonts/ for offline Chrome extension use.
 * Re-run after adding fonts: node scripts/bundle-fonts.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FONTS_ROOT = path.join(ROOT, "assets", "fonts");
// Optional: folder holding commercial (non-redistributable) Persian fonts for LOCAL use only.
// Set DASTKHAT_FONT_SRC to enable; those fonts are never included in public builds.
const RESOURCE = process.env.DASTKHAT_FONT_SRC || "";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  ensureDir(path.dirname(dest));
  await pipeline(res.body, createWriteStream(dest));
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyWoff2Dir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) throw new Error(`Missing source dir: ${srcDir}`);
  ensureDir(destDir);
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith(".woff2")) {
      copyFile(path.join(srcDir, file), path.join(destDir, file));
    }
  }
}

function weightFromFilename(name) {
  const n = name.toLowerCase().replace(/\.woff2$/, "");
  if (n.includes("hairline")) return 10;
  if (n.includes("extrablack") || n.endsWith("fat")) return 950;
  if (n.includes("thin")) return 100;
  if (n.includes("extralight") || n.includes("ultralight")) return 200;
  if (n.includes("light")) return 300;
  if (n.includes("regular") || n.includes("normal")) return 400;
  if (n.includes("medium")) return 500;
  if (n.includes("semibold") || n.includes("demibold")) return 600;
  if (n.includes("ultrabold")) return 800;
  if (n.includes("extrabold")) return 800;
  if (n.includes("bold")) return 700;
  if (n.includes("black") || n.includes("heavy")) return 900;
  return 400;
}

function writeWoff2FamilyCss(destDir, family, subdir = "") {
  const dir = subdir ? path.join(destDir, subdir) : destDir;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".woff2"))
    .sort((a, b) => weightFromFilename(a) - weightFromFilename(b));

  const rules = files.map((file) => {
    const rel = subdir ? `${subdir}/${file}` : file;
    const weight = weightFromFilename(file);
    return `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('${rel}') format('woff2');
}`;
  });

  fs.writeFileSync(path.join(destDir, "font.css"), rules.join("\n\n") + "\n");
}

function writeVariableCss(destDir, family, file, weightRange = "100 900") {
  const css = `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weightRange};
  font-display: swap;
  src: url('${file}') format('woff2-variations'), url('${file}') format('woff2');
}
`;
  fs.writeFileSync(path.join(destDir, "font.css"), css);
}

function writeSingleFaceCss(destDir, family, file, weight = 400) {
  const css = `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('${file}') format('woff2');
}
`;
  fs.writeFileSync(path.join(destDir, "font.css"), css);
}

function copyCssAsFont(srcCss, destDir) {
  copyFile(srcCss, path.join(destDir, "font.css"));
}

async function bundleOpenSource() {
  const vazDir = path.join(FONTS_ROOT, "vazirmatn");
  ensureDir(vazDir);
  const vazWeights = [
    ["Thin", 100],
    ["Light", 300],
    ["Regular", 400],
    ["Medium", 500],
    ["Bold", 700],
    ["Black", 900],
  ];
  for (const [name] of vazWeights) {
    const file = `Vazirmatn-${name}.woff2`;
    await download(
      `https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/${file}`,
      path.join(vazDir, file)
    );
  }
  writeWoff2FamilyCss(vazDir, "Vazirmatn");

  for (const [id, repo, tag, family, files] of [
    [
      "sahel",
      "sahel-font",
      "v3.4.0",
      "Sahel",
      ["Sahel-Light", "Sahel", "Sahel-SemiBold", "Sahel-Bold", "Sahel-Black"],
    ],
    [
      "samim",
      "samim-font",
      "v4.0.5",
      "Samim",
      ["Samim", "Samim-Bold"],
    ],
    [
      "shabnam",
      "shabnam-font",
      "v5.0.1",
      "Shabnam",
      ["Shabnam", "Shabnam-Bold"],
    ],
  ]) {
    const dir = path.join(FONTS_ROOT, id);
    ensureDir(dir);
    for (const base of files) {
      const file = `${base}.woff2`;
      await download(`https://cdn.jsdelivr.net/gh/rastikerdar/${repo}@${tag}/dist/${file}`, path.join(dir, file));
    }
    writeWoff2FamilyCss(dir, family);
  }

  const estedadDir = path.join(FONTS_ROOT, "estedad");
  ensureDir(estedadDir);
  const estedadWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  for (const w of estedadWeights) {
    const file = `estedad-arabic-${w}-normal.woff2`;
    await download(
      `https://cdn.jsdelivr.net/npm/@fontsource/estedad@5.2.1/files/${file}`,
      path.join(estedadDir, file)
    );
  }
  const estedadRules = estedadWeights.map(
    (w) => `@font-face {
  font-family: 'Estedad';
  font-style: normal;
  font-weight: ${w};
  font-display: swap;
  src: url('estedad-arabic-${w}-normal.woff2') format('woff2');
}`
  );
  fs.writeFileSync(path.join(estedadDir, "font.css"), estedadRules.join("\n\n") + "\n");
}

function bundleProprietary() {
  const ariaDir = path.join(FONTS_ROOT, "aria");
  copyWoff2Dir(path.join(RESOURCE, "Aria(Pro)/Webfonts/woff2"), ariaDir);
  writeWoff2FamilyCss(ariaDir, "Aria");

  const danaDir = path.join(FONTS_ROOT, "dana");
  copyWoff2Dir(path.join(RESOURCE, "DanaPro(13Wt)/Webfonts/woff2"), danaDir);
  writeWoff2FamilyCss(danaDir, "dana");

  const farhangDir = path.join(FONTS_ROOT, "farhang");
  copyWoff2Dir(path.join(RESOURCE, "Farhang2Pro/Webfonts/fonts/woff2"), farhangDir);
  writeWoff2FamilyCss(farhangDir, "farhang2");

  const hamidehDir = path.join(FONTS_ROOT, "hamideh");
  ensureDir(hamidehDir);
  copyFile(
    path.join(RESOURCE, "Hamideh_Saeian/webfonts/ME hamidehsaeian.woff2"),
    path.join(hamidehDir, "hamideh.woff2")
  );
  writeSingleFaceCss(hamidehDir, "Hamideh Saeian", "hamideh.woff2");

  const iransansDir = path.join(FONTS_ROOT, "iransansx");
  copyWoff2Dir(path.join(RESOURCE, "IranSansX(Pro)/Webfonts/fonts/woff2"), iransansDir);
  writeWoff2FamilyCss(iransansDir, "IRANSansX");

  const yekanDir = path.join(FONTS_ROOT, "iranyekanx");
  copyWoff2Dir(path.join(RESOURCE, "IRANYekanX(Pro)/Webfonts/woff2"), yekanDir);
  writeWoff2FamilyCss(yekanDir, "IRANYekanX");

  const morabbaDir = path.join(FONTS_ROOT, "morabba");
  ensureDir(morabbaDir);
  copyFile(
    path.join(RESOURCE, "Morabba2_Pro/02 - Variable Font/webfonts/MorabbaVF.woff2"),
    path.join(morabbaDir, "MorabbaVF.woff2")
  );
  writeVariableCss(morabbaDir, "Morabba", "MorabbaVF.woff2");

  const peydaDir = path.join(FONTS_ROOT, "peyda");
  copyWoff2Dir(path.join(RESOURCE, "Peyda 4 (Pro)/02 Web Font/Font Family WebFont/woff2"), peydaDir);
  writeWoff2FamilyCss(peydaDir, "PeydaWeb");

  const raviDir = path.join(FONTS_ROOT, "ravi");
  copyWoff2Dir(path.join(RESOURCE, "Ravi Family/Webfonts/woff2"), raviDir);
  writeWoff2FamilyCss(raviDir, "Ravi");

  const azarDir = path.join(FONTS_ROOT, "azarmehr");
  ensureDir(azarDir);
  copyFile(
    path.join(RESOURCE, "AzarMehr[DSTY,KSHD,wght].ttf"),
    path.join(azarDir, "AzarMehr.ttf")
  );
  fs.writeFileSync(
    path.join(azarDir, "font.css"),
    `@font-face {
  font-family: 'AzarMehr';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('AzarMehr.ttf') format('truetype');
}
`
  );

  const azarFdDir = path.join(FONTS_ROOT, "azarmehr_fd");
  ensureDir(azarFdDir);
  copyFile(
    path.join(RESOURCE, "AzarMehr-FD[DSTY,KSHD,wght].ttf"),
    path.join(azarFdDir, "AzarMehr-FD.ttf")
  );
  fs.writeFileSync(
    path.join(azarFdDir, "font.css"),
    `@font-face {
  font-family: 'AzarMehr FD';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('AzarMehr-FD.ttf') format('truetype');
}
`
  );
}

async function main() {
  console.log("Bundling fonts into", FONTS_ROOT);
  // dastkhat* fonts are local-only (not downloadable / not in RESOURCE): keep them.
  ensureDir(FONTS_ROOT);
  for (const entry of fs.readdirSync(FONTS_ROOT)) {
    if (!entry.startsWith("dastkhat")) rmDir(path.join(FONTS_ROOT, entry));
  }
  await bundleOpenSource();
  if (RESOURCE) bundleProprietary();
  else console.log("DASTKHAT_FONT_SRC not set: skipping proprietary fonts (open-source fonts only).");
  const count = execSync(`find "${FONTS_ROOT}" -type f | wc -l`, { encoding: "utf8" }).trim();
  console.log(`Done. ${count} font files bundled.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
