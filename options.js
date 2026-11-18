const HIGHLIGHT_KEY = "dastkhat_highlights";
const HL_DEFAULT = "#ffe066";
const HL_PRESETS = [
  { color: "#ffe066", name: "زرد" },
  { color: "#b2f2bb", name: "سبز" },
  { color: "#a5d8ff", name: "آبی" },
  { color: "#ffc9de", name: "صورتی" },
  { color: "#ffd8a8", name: "نارنجی" },
  { color: "#d0bfff", name: "بنفش" },
  { color: "#ffa8a8", name: "قرمز" },
  { color: "#99e9f2", name: "فیروزه‌ای" },
];
const THEME_LABELS = { light: "روشن", dark: "تیره", system: "مطابق سیستم" };

let currentSettings = {
  aiProviders: [],
  aiActiveProvider: "",
  aiActiveModel: "",
  font: "dastkhat_bar",
  algorithm: DASTKHAT_DEFAULT_ALGORITHM,
  autoDomains: [],
  dashboardTheme: "light",
  highlightColor: HL_DEFAULT,
  customCss: "",
};

const $ = (id) => document.getElementById(id);
const fa = (n) => Number(n).toLocaleString("fa-IR");

// ---------- Theme ----------
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
function applyTheme(choice) {
  const resolved = choice === "system" ? (darkQuery.matches ? "dark" : "light") : choice === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = resolved;
}
function selectedTheme() {
  const r = document.querySelector('input[name="theme"]:checked');
  return r ? r.value : "light";
}
darkQuery.addEventListener("change", () => applyTheme(selectedTheme()));

// ---------- Providers / fonts / domains ----------
function providerEnabled(p) {
  return p.hosts.every((h) => currentSettings.autoDomains.includes(h));
}

function siteLogo(host, name) {
  const box = document.createElement("span");
  box.className = "logo-box";
  const letter = () => {
    box.textContent = (name || host).replace(/^www\./, "")[0].toUpperCase();
    box.classList.add("letter");
    box.style.setProperty("--c", hashColor(host));
  };
  const img = document.createElement("img");
  img.alt = "";
  img.src = faviconUrl("https://" + host + "/");
  img.addEventListener("error", () => { img.remove(); letter(); });
  box.appendChild(img);
  return box;
}

function tileText(name, host) {
  const box = document.createElement("span");
  box.className = "tile-text";
  const n = document.createElement("b");
  n.textContent = name;
  const h = document.createElement("small");
  h.textContent = host;
  box.append(n, h);
  box.title = name + " — " + host;
  return box;
}

// One merged list: known services (toggle on/off) + any custom domains (removable), no duplicates.
function renderProviders() {
  const grid = $("providerGrid");
  grid.innerHTML = "";
  const known = new Set();
  DASTKHAT_PROVIDERS.forEach((p) => {
    p.hosts.forEach((h) => known.add(h));
    const label = document.createElement("label");
    label.className = "tile";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = providerEnabled(p);
    cb.addEventListener("change", () => {
      if (cb.checked) {
        currentSettings.autoDomains = Array.from(new Set([...currentSettings.autoDomains, ...p.hosts]));
      } else {
        currentSettings.autoDomains = currentSettings.autoDomains.filter((d) => !p.hosts.includes(d));
      }
    });
    cb.className = "tile-cb";
    label.append(siteLogo(p.hosts[0], p.name), tileText(p.name, p.hosts[0]), cb);
    grid.appendChild(label);
  });
  currentSettings.autoDomains.filter((d) => !known.has(d)).forEach((domain) => {
    const tile = document.createElement("div");
    tile.className = "tile custom";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile-x";
    btn.textContent = "✕";
    btn.setAttribute("aria-label", "حذف " + domain);
    btn.addEventListener("click", () => {
      currentSettings.autoDomains = currentSettings.autoDomains.filter((d) => d !== domain);
      renderProviders();
    });
    tile.append(siteLogo(domain, domain), tileText(domain, domain), btn);
    grid.appendChild(tile);
  });
}

const FONT_FA_NAMES = {
  dastkhat_bar: "دست‌خط بار",
  dastkhat: "دست‌خط",
  dastkhat_diamond: "دست‌خط الماس",
  vazirmatn: "وزیرمتن",
  sahel: "ساحل",
  samim: "صمیم",
  shabnam: "شبنم",
  estedad: "استعداد",
  peyda: "پیدا",
  aria: "آریا",
  dana: "دانا",
  farhang: "فرهنگ",
  hamideh: "حمیده سائیان",
  iransansx: "ایران‌سنس ایکس",
  iranyekanx: "ایران‌یکان ایکس",
  morabba: "مربا",
  ravi: "راوی",
  azarmehr: "آذرمهر",
  azarmehr_fd: "آذرمهر اف‌دی",
};

function populateFontSelect() {
  const select = $("font");
  select.innerHTML = "";
  Object.entries(DASTKHAT_FONTS).forEach(([key, font]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = FONT_FA_NAMES[key] || font.label;
    select.appendChild(opt);
  });
}

function normalizeDomain(input) {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return d;
}

$("addDomainBtn").addEventListener("click", () => {
  const input = $("newDomain");
  const domain = normalizeDomain(input.value);
  if (!domain) return;
  if (!currentSettings.autoDomains.includes(domain)) {
    currentSettings.autoDomains.push(domain);
    renderProviders();
  }
  input.value = "";
});

// ---------- Highlight colour ----------
function setHighlightColor(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) color = HL_DEFAULT;
  color = color.toLowerCase();
  $("hlColor").value = color;
  $("hlPreview").style.setProperty("--hl", color);
  document.documentElement.style.setProperty("--hl", color);
  document.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-pressed", String(s.dataset.color === color)));
}

function renderSwatches() {
  const wrap = $("swatches");
  wrap.innerHTML = "";
  HL_PRESETS.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.background = p.color;
    b.dataset.color = p.color;
    b.title = p.name;
    b.setAttribute("aria-label", p.name);
    b.addEventListener("click", () => setHighlightColor(p.color));
    wrap.appendChild(b);
  });
}
$("hlColor").addEventListener("input", (e) => setHighlightColor(e.target.value));


// ---------- Highlight manager ----------
let hlData = {};

function loadHighlights() {
  chrome.storage.local.get([HIGHLIGHT_KEY], (result) => {
    hlData = result[HIGHLIGHT_KEY] || {};
    renderHighlights();
  });
}

function persistHighlights() {
  chrome.storage.local.set({ [HIGHLIGHT_KEY]: hlData });
  renderHighlights();
}

function totalHighlights() {
  return Object.values(hlData).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
}

function safeHref(url) {
  return /^https?:\/\//i.test(url) ? url : "";
}

function renderHighlights() {
  const total = totalHighlights();

  const q = $("hlSearch").value.trim().toLowerCase();
  const wrap = $("hlGroups");
  wrap.innerHTML = "";
  wrap.className = "";

  const groups = Object.entries(hlData)
    .map(([url, arr]) => {
      const items = (Array.isArray(arr) ? arr : []).filter(
        (e) => !q || [e.text, e.title, url].some((v) => String(v || "").toLowerCase().includes(q))
      );
      return { url, all: arr || [], items };
    })
    .filter((g) => g.items.length)
    .sort((a, b) => Math.max(...b.items.map((e) => e.createdAt || 0)) - Math.max(...a.items.map((e) => e.createdAt || 0)));

  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  if (!groups.length) {
    const card = document.createElement("div");
    card.className = "card";
    const e = document.createElement("div");
    e.className = "empty";
    e.style.textAlign = "center";
    e.textContent = total ? "نتیجه‌ای پیدا نشد." : "متنی را در یک صفحه انتخاب کنید و دکمه «Highlight» را بزنید تا اینجا نمایش داده شود.";
    card.appendChild(e);
    wrap.appendChild(card);
    return;
  }

  wrap.className = "hl-grid";
  groups.forEach((g) => {
    const latest = Math.max(...g.all.map((e) => e.createdAt || 0));
    let host = g.url;
    try { host = new URL(g.url).hostname; } catch (err) {}
    const card = document.createElement("article");
    card.className = "hl-card";
    card.style.setProperty("--site", hashColor(host));
    siteColor(g.url, host).then((c) => card.style.setProperty("--site", c));

    const head = document.createElement("div");
    head.className = "hl-card-head";
    const href = safeHref(g.url);
    const ico = document.createElement("img");
    ico.className = "fav";
    ico.alt = "";
    ico.src = faviconUrl(g.url);
    const letter = document.createElement("span");
    letter.className = "fav fav-letter";
    letter.textContent = (host.replace(/^www\./, "")[0] || "?").toUpperCase();
    letter.hidden = true;
    ico.addEventListener("error", () => { ico.hidden = true; letter.hidden = false; });
    const meta = document.createElement("div");
    meta.className = "meta";
    const title = document.createElement("h3");
    title.dir = "auto";
    const titleText = (g.items[0] && g.items[0].title) || host;
    if (href) {
      const tl = document.createElement("a");
      tl.textContent = titleText;
      tl.href = href; tl.target = "_blank"; tl.rel = "noopener noreferrer";
      title.appendChild(tl);
    } else title.textContent = titleText;
    const link = document.createElement("span");
    link.className = "host";
    link.textContent = host;
    meta.append(title, link);
    head.append(ico, letter, meta);

    card.appendChild(head);

    const list = document.createElement("div");
    list.className = "hl-snips";
    g.items.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "snip";
      const p = document.createElement("p");
      p.dir = "auto";
      p.textContent = entry.text;
      row.append(p);
      list.appendChild(row);
    });
    card.appendChild(list);

    const foot = document.createElement("div");
    foot.className = "hl-card-foot";
    const when = document.createElement("time");
    if (latest) {
      when.textContent = relTime(latest);
      when.title = new Date(latest).toLocaleString("fa-IR");
    }
    const acts = document.createElement("div");
    acts.className = "foot-acts";
    if (href) {
      const open = document.createElement("a");
      open.className = "mini-btn";
      open.textContent = "باز کردن";
      open.href = href; open.target = "_blank"; open.rel = "noopener noreferrer";
      acts.appendChild(open);
    }
    const copyAll = document.createElement("button");
    copyAll.className = "mini-btn";
    copyAll.textContent = "کپی";
    copyAll.addEventListener("click", () => {
      navigator.clipboard.writeText(g.items.map((e) => e.text).join("\n\n")).then(
        () => { copyAll.textContent = "کپی شد"; setTimeout(() => (copyAll.textContent = "کپی"), 1200); },
        () => { copyAll.textContent = "ناموفق"; setTimeout(() => (copyAll.textContent = "کپی"), 1200); }
      );
    });
    const delPage = document.createElement("button");
    delPage.className = "mini-btn del";
    delPage.textContent = "حذف";
    delPage.addEventListener("click", () => {
      if (!confirm(`همه هایلایت‌های این صفحه (${fa(g.all.length)}) حذف شود؟`)) return;
      delete hlData[g.url];
      persistHighlights();
    });
    acts.append(copyAll, delPage);
    foot.append(when, acts);
    card.appendChild(foot);
    wrap.appendChild(card);
  });
}

function faviconUrl(pageUrl) {
  // The _favicon API (and its permission) is Chromium-only; elsewhere fall back
  // to an invalid image so the callers' error handlers show a letter avatar.
  const perms = chrome.runtime.getManifest().permissions || [];
  if (!perms.includes("favicon")) return "data:,";
  return chrome.runtime.getURL("/_favicon/") + "?pageUrl=" + encodeURIComponent(pageUrl) + "&size=32";
}

function hashColor(host) {
  let h = 0;
  for (const ch of host) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 62% 50%)`;
}

const colorCache = {};
function siteColor(url, host) {
  if (colorCache[host]) return colorCache[host];
  colorCache[host] = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 16;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(img, 0, 0, 16, 16);
        const d = x.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3] / 255;
          if (a < 0.5) continue;
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const sat = mx ? (mx - mn) / mx : 0;
          if (mx > 245 && sat < 0.1) continue; // skip white
          const wt = a * (0.05 + sat);
          r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
        }
        resolve(w > 0 ? `rgb(${Math.round(r / w)} ${Math.round(g / w)} ${Math.round(b / w)})` : hashColor(host));
      } catch (err) { resolve(hashColor(host)); }
    };
    img.onerror = () => resolve(hashColor(host));
    img.src = faviconUrl(url);
  });
  return colorCache[host];
}

function relTime(ts) {
  const diff = (ts - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, sec] of units) if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), u);
  return "همین الان";
}

$("hlSearch").addEventListener("input", renderHighlights);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[HIGHLIGHT_KEY]) {
    hlData = changes[HIGHLIGHT_KEY].newValue || {};
    renderHighlights();
  }
});

// ---------- AI (single model) ----------
const AI_PROVIDER_ID = "default";

function renderAi() {
  const p = currentSettings.aiProviders[0];
  $("aiBase").value = p ? p.baseUrl || "" : "";
  $("aiModel").value = p && p.models ? p.models[0] || "" : "";
  $("aiKey").value = p ? p.apiKey || "" : "";
}

// Wire format is inferred from the address: Anthropic's own API, else OpenAI-compatible.
function readAi() {
  const baseUrl = $("aiBase").value.trim();
  const model = $("aiModel").value.trim();
  return {
    id: AI_PROVIDER_ID,
    name: model || "AI",
    format: /anthropic\.com/i.test(baseUrl) ? "anthropic" : "openai",
    baseUrl,
    apiKey: $("aiKey").value.trim(),
    models: model ? [model] : [],
  };
}

$("aiSaveBtn").addEventListener("click", () => {
  const p = readAi();
  const st = $("aiStatus");
  if (!/^https?:\/\/[^\s/]+/i.test(p.baseUrl)) {
    st.textContent = "آدرس API باید با http:// یا https:// شروع شود.";
    return;
  }
  if (!p.models.length) {
    st.textContent = "نام مدل را وارد کنید.";
    return;
  }
  st.textContent = "";
  currentSettings.aiProviders = [p];
  // saveSettings runs via the document click handler.
});

// ---------- Load / save ----------
function loadSettings() {
  dastkhatGetSettings((merged) => {
    currentSettings = { ...currentSettings, ...merged };
    const act = dastkhatActiveAi(currentSettings);
    currentSettings.aiProviders = act ? [{ ...act.provider, models: act.model ? [act.model] : [] }] : [];
    currentSettings.aiActiveProvider = act ? act.provider.id : "";
    currentSettings.aiActiveModel = act ? act.model : "";
    renderAi();
    $("font").value = currentSettings.font;
    $("algorithm").value = currentSettings.algorithm;
    $("allSites").checked = !!currentSettings.allSites;
    $("customCss").value = currentSettings.customCss || "";
    const theme = THEME_LABELS[currentSettings.dashboardTheme] ? currentSettings.dashboardTheme : "light";
    document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
    applyTheme(theme);
    setHighlightColor(currentSettings.highlightColor || HL_DEFAULT);
    renderProviders();
    settingsLoaded = true;
  });
}

// Auto-save: any change in the form (or a click on a control that edits settings) is saved shortly after.
let settingsLoaded = false;
let saveTimer = null;
function scheduleSave() {
  if (!settingsLoaded) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 350);
}
document.addEventListener("input", (e) => { if (!e.target.closest("#hlSearch")) scheduleSave(); });
document.addEventListener("change", scheduleSave);
document.addEventListener("click", (e) => {
  if (e.target.closest("#nav, #hlGroups, .page-head")) return;
  if (e.target.closest("button, .swatch")) scheduleSave();
});

function saveSettings() {
  const ai = currentSettings.aiProviders[0];
  currentSettings.aiActiveProvider = ai ? ai.id : "";
  currentSettings.aiActiveModel = ai && ai.models[0] ? ai.models[0] : "";
  // Keep the legacy fields in step so older code paths still see the active Anthropic key.
  const anth = currentSettings.aiProviders.find((p) => p.format === "anthropic");
  currentSettings.apiKey = anth ? anth.apiKey : "";
  currentSettings.model = currentSettings.aiActiveModel || DASTKHAT_DEFAULT_MODEL;
  currentSettings.font = $("font").value;
  currentSettings.algorithm = $("algorithm").value;
  currentSettings.allSites = $("allSites").checked;
  currentSettings.dashboardTheme = selectedTheme();
  currentSettings.highlightColor = $("hlColor").value;
  currentSettings.customCss = $("customCss").value;
  currentSettings.defaultsApplied = true;
  currentSettings.providersVersion = DASTKHAT_PROVIDERS_VERSION;
  chrome.storage.local.set({ [SETTINGS_KEY]: currentSettings }, () => {
    const status = $("status");
    status.textContent = "ذخیره شد";
    status.classList.add("show");
    clearTimeout(status._t);
    status._t = setTimeout(() => status.classList.remove("show"), 1400);
  });
}

// ---------- Navigation ----------
function showPanel(name) {
  const panel = $("panel-" + name);
  if (!panel) return;
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p === panel));
  document.querySelectorAll("#nav button").forEach((b) => {
    const on = b.dataset.panel === name;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
}

document.querySelectorAll("#nav button").forEach((b) => b.addEventListener("click", () => showPanel(b.dataset.panel)));
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => showPanel(b.dataset.go)));

document.querySelectorAll('input[name="theme"]').forEach((r) =>
  r.addEventListener("change", () => {
    applyTheme(selectedTheme());
  })
);

$("ver").textContent = chrome.runtime.getManifest().version.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

populateFontSelect();
renderSwatches();
loadHighlights();
loadSettings();
showPanel(({ highlight: "appearance" })[location.hash.slice(1)] || location.hash.slice(1) || "overview");


// ---------- Custom dropdown component (wraps every native <select>, which stays as the source of truth) ----------
function enhanceSelect(sel) {
  const wrap = document.createElement("div");
  wrap.className = "dd";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dd-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  const lbl = sel.getAttribute("aria-label") || (sel.id && document.querySelector(`label[for="${sel.id}"]`)?.textContent);
  if (lbl) btn.setAttribute("aria-label", lbl);
  const text = document.createElement("span");
  text.className = "dd-text";
  const chev = document.createElement("span");
  chev.className = "dd-chev";
  chev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  btn.append(text, chev);
  const list = document.createElement("ul");
  list.className = "dd-list";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  wrap.append(btn, list);
  sel.after(wrap);
  sel.style.display = "none";

  let active = -1;
  const opts = () => Array.from(sel.options);

  function refresh() {
    const o = opts();
    list.innerHTML = "";
    o.forEach((opt, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.className = "dd-opt";
      li.textContent = opt.textContent;
      li.dataset.i = i;
      li.setAttribute("aria-selected", String(i === sel.selectedIndex));
      li.addEventListener("click", (e) => { e.stopPropagation(); choose(i); });
      list.appendChild(li);
    });
    const cur = o[sel.selectedIndex];
    text.textContent = cur ? cur.textContent : "—";
    btn.disabled = !o.length;
  }

  function setActive(i) {
    const items = list.children;
    if (!items.length) return;
    active = Math.max(0, Math.min(items.length - 1, i));
    Array.from(items).forEach((li, j) => li.classList.toggle("active", j === active));
    items[active].scrollIntoView({ block: "nearest" });
  }

  function open() {
    document.querySelectorAll(".dd-list").forEach((l) => { if (l !== list) l.hidden = true; });
    list.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    setActive(sel.selectedIndex);
  }
  function close() {
    list.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }
  function choose(i) {
    if (i !== sel.selectedIndex) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    refresh();
    close();
    btn.focus();
  }

  btn.addEventListener("click", (e) => { e.stopPropagation(); list.hidden ? open() : close(); });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (list.hidden) open();
      else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" || e.key === " ") {
      if (!list.hidden) { e.preventDefault(); choose(active); }
    } else if (e.key === "Escape" && !list.hidden) {
      e.preventDefault(); close();
    } else if (e.key === "Tab") close();
  });
  document.addEventListener("click", close);

  // Keep in sync with programmatic changes (options rebuilt or .value assigned).
  new MutationObserver(refresh).observe(sel, { childList: true });
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  Object.defineProperty(sel, "value", {
    configurable: true,
    get() { return desc.get.call(sel); },
    set(v) { desc.set.call(sel, v); refresh(); },
  });
  refresh();
}
document.querySelectorAll("select").forEach(enhanceSelect);

$("cssClear").addEventListener("click", () => {
  $("customCss").value = "";
  $("customCss").dispatchEvent(new Event("input", { bubbles: true }));
});

// Chrome Web Store listing; fill in after publishing.
const WEBSTORE_URL = "";
$("supportBtn").addEventListener("click", () => {
  if (WEBSTORE_URL) window.open(WEBSTORE_URL, "_blank", "noopener");
});
