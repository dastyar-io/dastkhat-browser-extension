// Registry of AI / productivity sites where Persian (RTL) mode auto-enables.
// Loaded before defaults.js in every context (content script, options page,
// background service worker).
//
// `hosts` are matched as the exact hostname or any subdomain of it.
// `guess: true` marks hosts I could not verify and that may need adjusting in
// Settings, since AI products move domains often.
const DASTKHAT_PROVIDERS = [
  { id: "chatgpt", name: "ChatGPT", hosts: ["chatgpt.com", "chat.openai.com"] },
  { id: "deepseek", name: "DeepSeek", hosts: ["chat.deepseek.com"] },
  { id: "copilot", name: "Copilot", hosts: ["copilot.microsoft.com"] },
  { id: "m365copilot", name: "Microsoft 365 Copilot", hosts: ["m365.cloud.microsoft", "copilot.cloud.microsoft"], guess: true },
  { id: "claude", name: "Claude", hosts: ["claude.ai"] },
  { id: "gemini", name: "Gemini", hosts: ["gemini.google.com"] },
  { id: "businessgemini", name: "Business Gemini", hosts: ["business.gemini.google"], guess: true },
  { id: "aistudio", name: "Google AI Studio", hosts: ["aistudio.google.com"] },
  { id: "notebooklm", name: "Google NotebookLM", hosts: ["notebooklm.google.com", "notebooklm.google"] },
  { id: "flow", name: "Google Labs (Flow)", hosts: ["labs.google"], isNew: true },
  { id: "gdrive", name: "Google Drive", hosts: ["drive.google.com"], isNew: true },
  { id: "jules", name: "Google Jules", hosts: ["jules.google.com", "jules.google"] },
  { id: "metaai", name: "Meta AI", hosts: ["meta.ai"] },
  { id: "grok", name: "Grok", hosts: ["grok.com"] },
  { id: "qwen", name: "Qwen Chat", hosts: ["chat.qwen.ai"], isNew: true },
  { id: "qwencoder", name: "Qwen Coder", hosts: ["qwenlm.ai", "chat.qwenlm.ai"], isNew: true, guess: true },
  { id: "kimi", name: "Kimi", hosts: ["kimi.com", "kimi.moonshot.cn"] },
  { id: "openrouter", name: "OpenRouter", hosts: ["openrouter.ai"] },
  { id: "perplexity", name: "Perplexity", hosts: ["perplexity.ai"] },
  { id: "lmarena", name: "LMArena", hosts: ["lmarena.ai"] },
  { id: "arena", name: "Arena", hosts: ["arena.ai"], guess: true },
  { id: "zai", name: "Z.ai", hosts: ["z.ai", "chat.z.ai"] },
  { id: "githubcopilot", name: "GitHub Copilot", hosts: ["github.com"] },
  { id: "minimax", name: "Minimax", hosts: ["minimax.io", "minimaxi.com"] },
  { id: "youcom", name: "you.com", hosts: ["you.com"] },
  { id: "poe", name: "poe.com", hosts: ["poe.com"] },
  { id: "monica", name: "Monica", hosts: ["monica.im"] },
  { id: "mistral", name: "Mistral", hosts: ["chat.mistral.ai"] },
  { id: "manus", name: "Manus", hosts: ["manus.im", "manus.ai"] },
  { id: "blackbox", name: "Black Box", hosts: ["blackbox.ai"] },
  { id: "1minai", name: "1min.AI", hosts: ["1min.ai"] },
  { id: "digen", name: "Digen", hosts: ["digen.ai"], guess: true },
  { id: "writesonic", name: "Writesonic (Chatsonic)", hosts: ["writesonic.com"] },
  { id: "lovable", name: "Lovable", hosts: ["lovable.dev"] },
  { id: "ernie", name: "Ernie (Baidu)", hosts: ["ernie.baidu.com"] },
  { id: "gamma", name: "Gamma", hosts: ["gamma.app"] },
  { id: "synaps", name: "Synaps", hosts: ["synaps.ai"], guess: true },
  { id: "notion", name: "Notion", hosts: ["notion.so", "notion.com"] },
  { id: "genspark", name: "Genspark", hosts: ["genspark.ai"] },
  { id: "duckai", name: "Duck AI", hosts: ["duck.ai", "duckduckgo.com"] },
  { id: "clickup", name: "ClickUp", hosts: ["clickup.com"] },
  { id: "t3chat", name: "T3 Chat", hosts: ["t3.chat"] },
  { id: "atxp", name: "ATXP Chat", hosts: ["chat.atxp.ai"], guess: true },
  { id: "consensus", name: "Consensus", hosts: ["consensus.app"] },
  { id: "scispace", name: "SciSpace", hosts: ["scispace.com", "typeset.io"] },
  { id: "chatbox", name: "Chatbox AI", hosts: ["chatboxai.app"] },
  { id: "lumo", name: "Lumo", hosts: ["lumo.proton.me"] },
  { id: "veo3", name: "Veo 3", hosts: ["veo3.ai"], isNew: true, guess: true },
  { id: "fal", name: "fal.ai", hosts: ["fal.ai"], isNew: true },
  { id: "bfl", name: "Black Forest Labs", hosts: ["bfl.ai", "playground.bfl.ai"], isNew: true },
  { id: "characterai", name: "Character.AI", hosts: ["character.ai"], isNew: true },
  { id: "pi", name: "Pi", hosts: ["pi.ai"], isNew: true },
  { id: "cursor", name: "Cursor", hosts: ["cursor.com"], isNew: true },
  { id: "typingmind", name: "TypingMind", hosts: ["typingmind.com"], isNew: true },
  { id: "huggingface", name: "Hugging Face", hosts: ["huggingface.co"], isNew: true },
  { id: "dash0", name: "Dash0", hosts: ["dash0.com"], isNew: true },
  { id: "zerve", name: "Zerve", hosts: ["zerve.ai"], isNew: true, guess: true },
  { id: "sakana", name: "Sakana Chat", hosts: ["chat.sakana.ai"], isNew: true, guess: true },
  // Vivado AMD: I don't know which host serves this; add it in Settings once you do.
];

const DASTKHAT_PROVIDERS_VERSION = 2;

// True if `host` equals one of `domains` or is a subdomain of one.
function dastkhatHostMatches(host, domains) {
  return (domains || []).some((d) => host === d || host.endsWith("." + d));
}
