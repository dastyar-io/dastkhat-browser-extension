// Shared settings defaults, loaded after providers.js and before content.js,
// options.js, and background.js.
const SETTINGS_KEY = "dastkhat_settings";
const DASTKHAT_DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// RTL detection algorithms (pick the one that behaves best on your machine):
//  - "ratio":  block is RTL when >= 25% of its letters are Persian/Arabic. Default.
//  - "first":  block is RTL when its first letter is Persian/Arabic (chat-style).
//  - "auto":   any Persian letter present; direction is delegated to the browser
//              via dir="auto" (cheapest, best for mixed-language lists).
const DASTKHAT_DEFAULT_ALGORITHM = "ratio";

// Default domain list: every host of every provider in providers.js.
const DASTKHAT_DEFAULT_DOMAINS = Array.from(
  new Set(DASTKHAT_PROVIDERS.flatMap((p) => p.hosts))
);

// Reads settings from storage. Domains are merged in once per
// DASTKHAT_PROVIDERS_VERSION bump, so new providers reach existing users but
// later removals are respected until the next bump.
function dastkhatGetSettings(callback) {
  chrome.storage.local.get([SETTINGS_KEY], (result) => {
    const saved = result[SETTINGS_KEY] || {};
    // One-time: make Dastkhat Bar the default font (bundled locally under fonts/).
    if (!saved.fontDefaultApplied) {
      saved.font = "dastkhat_bar";
      saved.fontDefaultApplied = true;
      chrome.storage.local.set({ [SETTINGS_KEY]: saved });
    }
    if (saved.defaultsApplied && saved.providersVersion === DASTKHAT_PROVIDERS_VERSION) {
      callback({ algorithm: DASTKHAT_DEFAULT_ALGORITHM, ...saved });
      return;
    }
    const merged = {
      ...saved,
      apiKey: saved.apiKey || "",
      model: saved.model || DASTKHAT_DEFAULT_MODEL,
      font: saved.font || "dastkhat_bar",
      algorithm: saved.algorithm || DASTKHAT_DEFAULT_ALGORITHM,
      autoDomains: Array.from(new Set([...(saved.autoDomains || []), ...DASTKHAT_DEFAULT_DOMAINS])),
      defaultsApplied: true,
      providersVersion: DASTKHAT_PROVIDERS_VERSION,
    };
    chrome.storage.local.set({ [SETTINGS_KEY]: merged }, () => callback(merged));
  });
}

// ---------------------------------------------------------------------------
// AI providers (user-configurable). Two wire formats cover almost everything:
//  - "anthropic": POST {baseUrl}/v1/messages (x-api-key header)
//  - "openai":    POST {baseUrl}/chat/completions (Bearer token), which most
//                 other services (OpenRouter, Gemini, DeepSeek, Groq, Ollama...)
//                 also speak.
// ---------------------------------------------------------------------------
const DASTKHAT_AI_PRESETS = [
  { key: "anthropic", name: "Anthropic (Claude)", format: "anthropic", baseUrl: "https://api.anthropic.com", models: ["claude-haiku-4-5-20251001", "claude-sonnet-5"] },
  { key: "openai", name: "OpenAI", format: "openai", baseUrl: "https://api.openai.com/v1", models: ["gpt-4o-mini"] },
  { key: "openrouter", name: "OpenRouter", format: "openai", baseUrl: "https://openrouter.ai/api/v1", models: [] },
  { key: "gemini", name: "Google Gemini", format: "openai", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", models: ["gemini-2.0-flash"] },
  { key: "deepseek", name: "DeepSeek", format: "openai", baseUrl: "https://api.deepseek.com/v1", models: ["deepseek-chat"] },
  { key: "groq", name: "Groq", format: "openai", baseUrl: "https://api.groq.com/openai/v1", models: [] },
  { key: "ollama", name: "Ollama (محلی)", format: "openai", baseUrl: "http://localhost:11434/v1", models: [] },
  { key: "custom", name: "سفارشی", format: "openai", baseUrl: "", models: [] },
];

// Returns the saved provider list, or a single Anthropic provider migrated
// from the legacy apiKey/model fields.
function dastkhatAiProviders(s) {
  if (Array.isArray(s.aiProviders)) return s.aiProviders;
  const legacy = DASTKHAT_AI_PRESETS[0];
  const models = [...legacy.models];
  if (s.model && !models.includes(s.model)) models.push(s.model);
  return [{ id: "anthropic-default", name: legacy.name, format: legacy.format, baseUrl: legacy.baseUrl, apiKey: s.apiKey || "", models }];
}

// Returns { provider, model } for the provider/model the user picked, or null.
function dastkhatActiveAi(s) {
  const providers = dastkhatAiProviders(s);
  const provider = providers.find((p) => p.id === s.aiActiveProvider) || providers[0];
  if (!provider) return null;
  const models = provider.models || [];
  let model = models.includes(s.aiActiveModel) ? s.aiActiveModel : "";
  if (!model && !s.aiActiveProvider && s.model && models.includes(s.model)) model = s.model;
  if (!model) model = models[0] || "";
  return { provider, model };
}
