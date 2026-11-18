// Shared Persian font catalog, used by content.js and options.js.
// Fonts are bundled locally under assets/fonts/ (flattened to fonts/ in the built package). Entries flagged `proprietary: true` are
// commercial faces that are NOT redistributable; scripts/build.mjs strips them (and
// their files) from every public/store build. See assets/fonts/README.md.
const DASTKHAT_FONTS = {
  dastkhat_bar: {
    label: "Dastkhat Bar",
    family: "Dastkhat Bar FaNum",
    css: "fonts/dastkhat_bar/font.css",
  },
  dastkhat: {
    label: "Dastkhat",
    family: "Dastkhat FaNum",
    css: "fonts/dastkhat/font.css",
  },
  dastkhat_diamond: {
    label: "Dastkhat Diamond",
    family: "Dastkhat Diamond FaNum",
    css: "fonts/dastkhat_diamond/font.css",
  },
  vazirmatn: {
    label: "Vazirmatn",
    family: "Vazirmatn",
    css: "fonts/vazirmatn/font.css",
  },
  sahel: {
    label: "Sahel",
    family: "Sahel",
    css: "fonts/sahel/font.css",
  },
  samim: {
    label: "Samim",
    family: "Samim",
    css: "fonts/samim/font.css",
  },
  shabnam: {
    label: "Shabnam",
    family: "Shabnam",
    css: "fonts/shabnam/font.css",
  },
  estedad: {
    label: "Estedad",
    family: "Estedad",
    css: "fonts/estedad/font.css",
  },
  peyda: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Peyda",
    family: "PeydaWeb",
    css: "fonts/peyda/font.css",
  },
  aria: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Aria",
    family: "Aria",
    css: "fonts/aria/font.css",
  },
  dana: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Dana",
    family: "dana",
    css: "fonts/dana/font.css",
  },
  farhang: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Farhang",
    family: "farhang2",
    css: "fonts/farhang/font.css",
  },
  hamideh: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Hamideh Saeian",
    family: "Hamideh Saeian",
    css: "fonts/hamideh/font.css",
  },
  iransansx: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "IRANSansX",
    family: "IRANSansX",
    css: "fonts/iransansx/font.css",
  },
  iranyekanx: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "IRANYekanX",
    family: "IRANYekanX",
    css: "fonts/iranyekanx/font.css",
  },
  morabba: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Morabba",
    family: "Morabba",
    css: "fonts/morabba/font.css",
  },
  ravi: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "Ravi",
    family: "Ravi",
    css: "fonts/ravi/font.css",
  },
  azarmehr: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "AzarMehr",
    family: "AzarMehr",
    css: "fonts/azarmehr/font.css",
  },
  azarmehr_fd: {
    proprietary: true, // not redistributable: stripped from public builds
    label: "AzarMehr FD",
    family: "AzarMehr FD",
    css: "fonts/azarmehr_fd/font.css",
  },
};

function dastkhatFontUrl(relativePath) {
  return chrome.runtime.getURL(relativePath);
}
