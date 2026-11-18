// Dastkhat background service worker
// Talks to the user's chosen AI provider on behalf of the content script, so the API
// key never has to sit inside a page's own JS context.

// Chromium runs this as a service worker (needs importScripts); Firefox runs it as an
// event page with the scripts listed in manifest.background.scripts.
if (typeof importScripts === "function") importScripts("providers.js", "defaults.js");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "dastkhat_ai_request") {
    handleAiRequest(msg.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message || String(err) }));
    return true; // keep the message channel open for the async response
  }
  if (msg.type === "dastkhat_ai_test") {
    // Used by the settings page to check a provider before saving it.
    callProvider(msg.provider, msg.model, "Reply with the single word: OK")
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message || String(err) }));
    return true;
  }
  if (msg.type === "dastkhat_open_options") {
    chrome.runtime.openOptionsPage();
  }
});

async function handleAiRequest({ action, text }) {
  const settings = await getSettings();
  const active = dastkhatActiveAi(settings);
  if (!active) return { error: "no_api_key" };
  const { provider, model } = active;
  if (!provider.apiKey && !isLocalUrl(provider.baseUrl)) return { error: "no_api_key" };
  if (!model) return { error: "هیچ مدلی برای «" + provider.name + "» تعریف نشده است. نام مدل را در تنظیمات هوش مصنوعی اضافه کنید." };
  return callProvider(provider, model, buildPrompt(action, text));
}

function isLocalUrl(url) {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch (e) {
    return false;
  }
}

// Sends one prompt to a provider ({ format, baseUrl, apiKey }) and returns { result } or { error }.
async function callProvider(provider, model, prompt) {
  const base = String(provider.baseUrl || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return { error: "آدرس پایه (Base URL) معتبر نیست: " + base };

  let url, headers, body;
  if (provider.format === "anthropic") {
    url = base + "/v1/messages";
    headers = {
      "content-type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
      // Required by Anthropic to allow a direct call from a browser context.
      "anthropic-dangerous-direct-browser-access": "true",
    };
    body = { model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] };
  } else {
    url = base + "/chat/completions";
    headers = { "content-type": "application/json" };
    if (provider.apiKey) headers.authorization = "Bearer " + provider.apiKey;
    body = { model, messages: [{ role: "user", content: prompt }] };
  }

  let res;
  try {
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (err) {
    return { error: `خطای شبکه در اتصال به ${provider.name}: ${err.message}` };
  }

  if (!res.ok) {
    const errText = await res.text();
    return { error: `خطای API (${res.status}): ${errText.slice(0, 200)}` };
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    return { error: "پاسخ ارائه‌دهنده JSON معتبر نبود." };
  }
  let out = "";
  if (provider.format === "anthropic") {
    const block = (data.content || []).find((b) => b.type === "text");
    out = block ? block.text : "";
  } else {
    const c = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    out = typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text || "").join("") : "";
  }
  return { result: out.trim() };
}

function buildPrompt(action, text) {
  switch (action) {
    case "improve":
      return `Rewrite the following text so it reads more clearly and naturally, keep it in the same language it is written in, do not add any commentary, return only the rewritten text:\n\n${text}`;
    case "translate":
      return `If the following text is Persian, translate it to natural English. If it is not Persian, translate it to natural Persian. Return only the translation, no commentary, no notes:\n\n${text}`;
    case "summarize":
      return `Summarize the following text in 2-3 sentences, in the same language it is written in, no commentary, return only the summary:\n\n${text}`;
    case "grammar":
      return `Fix grammar and spelling mistakes in the following text, keep the same language and meaning, return only the corrected text, no commentary:\n\n${text}`;
    default:
      return text;
  }
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      resolve(result[SETTINGS_KEY] || {});
    });
  });
}
