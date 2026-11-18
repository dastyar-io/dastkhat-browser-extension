const STORAGE_KEY = "dastkhat_highlights";
const $ = (id) => document.getElementById(id);
const fa = (n) => Number(n).toLocaleString("fa-IR");

function getPageKey(url) {
  return url.split("#")[0];
}

// ---------- Theme + settings (shared with the dashboard) ----------
function applyTheme(choice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function loadSettingsUi() {
  dastkhatGetSettings((s) => {
    applyTheme(s.dashboardTheme || "light");
    const color = /^#[0-9a-f]{6}$/i.test(s.highlightColor || "") ? s.highlightColor : "#ffe066";
    document.documentElement.style.setProperty("--hl", color);
  });
}

// ---------- Highlights ----------
function render(pageKey) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const all = result[STORAGE_KEY] || {};
    const entries = all[pageKey] || [];
    const list = $("list");
    list.innerHTML = "";
    $("count").textContent = fa(entries.length);
    $("clearBtn").hidden = entries.length === 0;

    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4l6 6-8 8-6-6z"/><path d="M4 20h6"/></svg><p>هنوز هایلایتی در این صفحه نیست.</p>';
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "item";

      const text = document.createElement("div");
      text.className = "t";
      text.dir = "auto";
      text.textContent = entry.text;

      const btn = document.createElement("button");
      btn.title = "حذف";
      btn.setAttribute("aria-label", "حذف هایلایت");
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      btn.addEventListener("click", () => {
        all[pageKey] = entries.filter((e) => e.id !== entry.id);
        chrome.storage.local.set({ [STORAGE_KEY]: all }, () => render(pageKey));
      });

      item.append(text, btn);
      list.appendChild(item);
    });
  });
}

$("settingsLink").addEventListener("click", () => chrome.runtime.openOptionsPage());

loadSettingsUi();

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab) return;
  const pageKey = getPageKey(tab.url || "");
  const faSwitch = $("faSwitch");

  let host = "";
  try {
    host = new URL(tab.url).hostname.replace(/^www\./, "");
  } catch (e) {}
  const site = $("siteName");
  site.textContent = host || "این صفحه";

  render(pageKey);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) render(pageKey);
  });

  $("clearBtn").addEventListener("click", () => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const all = result[STORAGE_KEY] || {};
      delete all[pageKey];
      chrome.storage.local.set({ [STORAGE_KEY]: all }, () => render(pageKey));
    });
  });

  chrome.tabs.sendMessage(tab.id, { type: "dastkhat_get_state" }, (resp) => {
    if (chrome.runtime.lastError) {
      // Content script not present on this page (e.g. chrome:// pages).
      faSwitch.disabled = true;
      site.classList.add("fa");
      site.dir = "rtl";
      site.textContent = "در این صفحه در دسترس نیست";
      return;
    }
    faSwitch.checked = !!(resp && resp.active);
  });
  faSwitch.addEventListener("change", () => {
    chrome.tabs.sendMessage(tab.id, { type: "dastkhat_toggle_persian" }, () => {
      if (chrome.runtime.lastError) return;
    });
  });
});
