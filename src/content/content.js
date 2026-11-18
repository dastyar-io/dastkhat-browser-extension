// Dastkhat content script
// Three features live here:
//  1. Highlighting: select text, click "Highlight", it's saved and restored on reload.
//  2. Persian mode: detect Persian text on any page (including live typing in
//     inputs/textareas) and fix direction, alignment and font for just that text.
//  3. AI helper: select text (in the page or in a field) and improve, translate,
//     summarize, or grammar-check it via the Anthropic API, with a Replace option.

(function () {
  const HIGHLIGHT_KEY = "dastkhat_highlights";
  const PERSIAN_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const PERSIAN_RATIO_THRESHOLD = 0.25;
  const SKIP_PARENT_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);
  // Code and math must stay LTR and untouched; our own UI handles itself.
  const SKIP_CONTENT_SELECTOR =
    "pre, code, kbd, samp, svg, math, mjx-container, .katex, .MathJax, .dastkhat-toolbar, .dastkhat-panel, .dastkhat-fa-toggle";

  let toolbarEl = null;
  let panelEl = null;
  let faToggleEl = null;
  let activeRemovePopover = null;
  let settings = {
    apiKey: "",
    model: DASTKHAT_DEFAULT_MODEL,
    font: "dastkhat_bar",
    algorithm: DASTKHAT_DEFAULT_ALGORITHM,
    autoDomains: [],
  };
  let persianModeActive = false;
  let fontInjected = null;
  let selectionTimer = null;
  let mutationTimer = null;
  const pendingRoots = new Set();
  const enhancedElements = new Set();

  function getPageKey() {
    return location.href.split("#")[0];
  }

  function getHostname() {
    return location.hostname.replace(/^www\./, "");
  }

  // ---------------------------------------------------------------------
  // Settings + init
  // ---------------------------------------------------------------------

  function loadSettings(callback) {
    dastkhatGetSettings((merged) => {
      settings = { ...settings, ...merged };
      applyUserStyle();
      if (callback) callback();
    });
  }

  function init() {
    loadSettings(() => {
      const host = getHostname();
      if (settings.allSites || dastkhatHostMatches(host, settings.autoDomains)) {
        setPersianMode(true);
      }
      loadAndRestoreHighlights();
      createFaToggle();
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[SETTINGS_KEY]) return;
    const prevFont = settings.font;
    const prevAlgorithm = settings.algorithm;
    loadSettings(() => {
      if (!persianModeActive) return;
      if (settings.font !== prevFont || settings.algorithm !== prevAlgorithm) {
        resetPersianEnhancements();
        scanAndEnhance(document.body);
      }
    });
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "dastkhat_toggle_persian") {
      setPersianMode(!persianModeActive);
      sendResponse({ active: persianModeActive });
    }
    if (msg.type === "dastkhat_get_state") {
      sendResponse({ active: persianModeActive });
    }
  });

  // ---------------------------------------------------------------------
  // Highlighting
  // ---------------------------------------------------------------------

  function saveHighlight(entry) {
    chrome.storage.local.get([HIGHLIGHT_KEY], (result) => {
      const all = result[HIGHLIGHT_KEY] || {};
      if (!all[entry.url]) all[entry.url] = [];
      all[entry.url].push(entry);
      chrome.storage.local.set({ [HIGHLIGHT_KEY]: all });
    });
  }

  function removeHighlightFromStorage(id) {
    chrome.storage.local.get([HIGHLIGHT_KEY], (result) => {
      const all = result[HIGHLIGHT_KEY] || {};
      const pageKey = getPageKey();
      all[pageKey] = (all[pageKey] || []).filter((h) => h.id !== id);
      chrome.storage.local.set({ [HIGHLIGHT_KEY]: all });
    });
  }

  // Highlights are restored by matching saved text against the page with ALL whitespace
  // ignored (selection.toString() adds newlines/spaces the DOM doesn't have), and are wrapped
  // one text node at a time so selections spanning several elements never break the page's DOM.
  // Pages that render late (SPAs, lazy content) are retried as the DOM changes.
  let pendingHighlights = [];
  let restoreObserver = null;
  let restoreTimer = null;
  let restoreDeadline = 0;
  let restoredKey = null;

  function loadAndRestoreHighlights() {
    chrome.storage.local.get([HIGHLIGHT_KEY], (result) => {
      const all = result[HIGHLIGHT_KEY] || {};
      restoredKey = getPageKey();
      pendingHighlights = (all[restoredKey] || []).filter((e) => e && e.text && e.id);
      tryRestorePending();
      if (!pendingHighlights.length) return;
      restoreDeadline = Date.now() + 30000;
      if (!restoreObserver && document.body) {
        restoreObserver = new MutationObserver(() => {
          if (!pendingHighlights.length || Date.now() > restoreDeadline) return;
          clearTimeout(restoreTimer);
          restoreTimer = setTimeout(tryRestorePending, 500);
        });
        restoreObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
      }
    });
  }

  function tryRestorePending() {
    pendingHighlights = pendingHighlights.filter((entry) => {
      if (document.querySelector('mark.dastkhat-highlight[data-dastkhat-id="' + entry.id + '"]')) return false;
      return !restoreHighlight(entry);
    });
  }

  // Single-page apps change the URL without reloading: restore that page's highlights too.
  setInterval(() => {
    if (restoredKey !== null && restoredKey !== getPageKey()) loadAndRestoreHighlights();
  }, 1000);

  function isHighlightableTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    if (parent.closest(".dastkhat-highlight")) return false;
    if (SKIP_PARENT_TAGS.has(parent.tagName)) return false;
    return true;
  }

  function findTextInDocument(searchText) {
    const needle = String(searchText || "").replace(/\s+/g, "");
    if (!needle || !document.body) return null;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return isHighlightableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    let haystack = "";
    const nodes = [];
    const offsets = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text[i])) continue;
        haystack += text[i];
        nodes.push(node);
        offsets.push(i);
      }
    }

    const idx = haystack.indexOf(needle);
    if (idx === -1) return null;
    const last = idx + needle.length - 1;
    return {
      startNode: nodes[idx],
      startOffset: offsets[idx],
      endNode: nodes[last],
      endOffset: offsets[last] + 1,
    };
  }

  function makeMark(id) {
    const mark = document.createElement("mark");
    mark.className = "dastkhat-highlight";
    mark.dataset.dastkhatId = id;
    return mark;
  }

  // Wrap every text node touched by `range` in its own <mark>, splitting edge nodes.
  function wrapRangeWithMarks(range, id) {
    const root =
      range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
    const targets = [];
    if (range.commonAncestorContainer.nodeType === 3) {
      targets.push(range.commonAncestorContainer);
    } else {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) if (range.intersectsNode(n)) targets.push(n);
    }
    let count = 0;
    targets.forEach((tn) => {
      if (!tn.textContent.trim() || !isHighlightableTextNode(tn)) return;
      const start = tn === range.startContainer ? range.startOffset : 0;
      const end = tn === range.endContainer ? range.endOffset : tn.length;
      if (end <= start) return;
      // A text node directly inside a flex/grid container is a layout item: a <mark> there would be
      // blockified and its background would fill the whole item. Wrap the text in a neutral span first.
      const host = tn.parentNode;
      if (host.nodeType === 1 && !host.classList.contains("dastkhat-hl-wrap") && /flex|grid/.test(getComputedStyle(host).display)) {
        const w = document.createElement("span");
        w.className = "dastkhat-hl-wrap";
        host.insertBefore(w, tn);
        w.appendChild(tn);
      }
      let target = tn;
      if (end < target.length) target.splitText(end);
      if (start > 0) target = target.splitText(start);
      if (!target.textContent.trim()) return;
      const mark = makeMark(id);
      target.parentNode.insertBefore(mark, target);
      mark.appendChild(target);
      count++;
    });
    if (!count) throw new Error("nothing to highlight");
  }

  function restoreHighlight(entry) {
    const pos = findTextInDocument(entry.text);
    if (!pos) return false;

    const range = document.createRange();
    range.setStart(pos.startNode, pos.startOffset);
    range.setEnd(pos.endNode, pos.endOffset);
    try {
      wrapRangeWithMarks(range, entry.id);
      return true;
    } catch (err) {
      console.warn("Dastkhat: could not restore a highlight", err);
      return false;
    }
  }

  function highlightRange(range, text) {
    const id = "dk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    try {
      wrapRangeWithMarks(range, id);
    } catch (err) {
      console.warn("Dastkhat: selection couldn't be wrapped", err);
      return;
    }
    saveHighlight({ id, text, url: getPageKey(), title: document.title, createdAt: Date.now() });
  }

  function unwrapHighlight(mark) {
    const id = mark.dataset.dastkhatId;
    document.querySelectorAll('mark.dastkhat-highlight[data-dastkhat-id="' + id + '"]').forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      m.querySelectorAll(".dastkhat-highlight-remove").forEach((p) => p.remove());
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      if (parent.classList && parent.classList.contains("dastkhat-hl-wrap") && !parent.querySelector(".dastkhat-highlight")) {
        const outer = parent.parentNode;
        while (parent.firstChild) outer.insertBefore(parent.firstChild, parent);
        outer.removeChild(parent);
        outer.normalize();
      } else parent.normalize();
    });
  }

  function dismissRemovePopover() {
    if (activeRemovePopover) {
      activeRemovePopover.remove();
      activeRemovePopover = null;
    }
  }

  document.addEventListener("click", (e) => {
    const mark = e.target.closest(".dastkhat-highlight");
    if (!mark) {
      dismissRemovePopover();
      return;
    }
    if (e.target.closest(".dastkhat-highlight-remove")) return;

    e.stopPropagation();
    if (activeRemovePopover && activeRemovePopover.parentElement === mark) return;
    dismissRemovePopover();

    const pop = document.createElement("span");
    pop.className = "dastkhat-highlight-remove";
    pop.innerHTML =
      'حذف شود؟ <button type="button" data-action="yes">بله</button> <button type="button" data-action="no">خیر</button>';
    pop.dir = "rtl";
    pop.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const action = ev.target.dataset?.action;
      if (action === "yes") {
        const id = mark.dataset.dastkhatId;
        unwrapHighlight(mark);
        removeHighlightFromStorage(id);
      }
      dismissRemovePopover();
    });
    mark.appendChild(pop);
    activeRemovePopover = pop;
  });

  // ---------------------------------------------------------------------
  // Persian mode: font injection + RTL/alignment enhancement
  // ---------------------------------------------------------------------

  function injectFont(fontKey) {
    const font = DASTKHAT_FONTS[fontKey] || DASTKHAT_FONTS.dastkhat_bar;
    if (fontInjected === fontKey) return font.family;
    const linkId = "dastkhat-font-link";
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = dastkhatFontUrl(font.css);
    fontInjected = fontKey;
    return font.family;
  }

  function persianRatio(str) {
    const letters = str.replace(/[^\p{L}]/gu, "");
    if (!letters) return 0;
    const persianLetters = letters.match(new RegExp(PERSIAN_RE, "g")) || [];
    return persianLetters.length / letters.length;
  }

  // Decides whether a block of text should be RTL, per the chosen algorithm.
  function isPersianBlock(text) {
    if (!text) return false;
    switch (settings.algorithm) {
      case "first": {
        const m = text.match(/\p{L}/u);
        return !!m && PERSIAN_RE.test(m[0]);
      }
      case "auto":
        return PERSIAN_RE.test(text);
      default:
        return persianRatio(text) >= PERSIAN_RATIO_THRESHOLD;
    }
  }

  // Direction/alignment only make sense on block boxes, so climb out of inline
  // wrappers (<strong>, <a>, <span>) to the paragraph-like element.
  function blockOf(el) {
    let cur = el;
    while (cur && cur.parentElement && cur !== document.body) {
      const display = getComputedStyle(cur).display;
      if (display !== "inline" && display !== "contents") break;
      cur = cur.parentElement;
    }
    return cur;
  }

  function rememberOriginals(el) {
    el.dataset.dastkhatFaOrigDir = el.style.direction;
    el.dataset.dastkhatFaOrigAlign = el.style.textAlign;
    el.dataset.dastkhatFaOrigFont = el.style.fontFamily;
  }

  // Sets direction only (used for list and table containers so bullets,
  // numbers and column order flip along with their Persian content).
  function enhanceContainerDir(el) {
    if (!el || el.dataset.dastkhatFaDone === "1") return;
    rememberOriginals(el);
    el.style.direction = "rtl";
    el.dataset.dastkhatFaDone = "1";
    enhancedElements.add(el);
  }

  function enhanceElement(el, fontFamily) {
    if (!el || el.dataset.dastkhatFaDone === "1") return;
    rememberOriginals(el);
    if (settings.algorithm === "auto") {
      el.dataset.dastkhatFaAuto = "1";
      el.dataset.dastkhatFaHadDirAttr = el.hasAttribute("dir") ? "1" : "0";
      el.dataset.dastkhatFaOrigDirAttr = el.getAttribute("dir") || "";
      el.setAttribute("dir", "auto");
      el.style.textAlign = "start";
    } else {
      el.style.direction = "rtl";
      el.style.textAlign = "right";
    }
    el.style.fontFamily = `'${fontFamily}', Tahoma, sans-serif`;
    el.dataset.dastkhatFaDone = "1";
    enhancedElements.add(el);

    if (el.tagName === "LI") {
      const list = el.parentElement;
      if (list && (list.tagName === "UL" || list.tagName === "OL")) enhanceContainerDir(list);
    } else if (el.tagName === "TD" || el.tagName === "TH") {
      enhanceContainerDir(el.closest("table"));
    }
  }

  function resetPersianEnhancements() {
    enhancedElements.forEach((el) => {
      if (!el.isConnected) return;
      el.style.direction = el.dataset.dastkhatFaOrigDir || "";
      el.style.textAlign = el.dataset.dastkhatFaOrigAlign || "";
      el.style.fontFamily = el.dataset.dastkhatFaOrigFont || "";
      if (el.dataset.dastkhatFaAuto === "1") {
        if (el.dataset.dastkhatFaHadDirAttr === "1") {
          el.setAttribute("dir", el.dataset.dastkhatFaOrigDirAttr);
        } else {
          el.removeAttribute("dir");
        }
      }
      delete el.dataset.dastkhatFaDone;
      delete el.dataset.dastkhatFaOrigDir;
      delete el.dataset.dastkhatFaOrigAlign;
      delete el.dataset.dastkhatFaOrigFont;
      delete el.dataset.dastkhatFaAuto;
      delete el.dataset.dastkhatFaHadDirAttr;
      delete el.dataset.dastkhatFaOrigDirAttr;
    });
    enhancedElements.clear();
    fontInjected = null;
  }

  function scanAndEnhance(root) {
    if (!persianModeActive || !root) return;
    const fontFamily = injectFont(settings.font);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_PARENT_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent || node.textContent.trim().length < 3) return NodeFilter.FILTER_SKIP;
        if (parent.closest(SKIP_CONTENT_SELECTOR)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    const seen = new Set();
    while ((node = walker.nextNode())) {
      const block = blockOf(node.parentElement);
      if (!block || block === document.body || block === document.documentElement) continue;
      if (seen.has(block) || block.dataset.dastkhatFaDone === "1") continue;
      seen.add(block);
      if (isPersianBlock(block.innerText || block.textContent)) {
        enhanceElement(block, fontFamily);
      }
    }
  }

  function enhanceField(el) {
    if (!persianModeActive) return;
    const fontFamily = injectFont(settings.font);
    const value = el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? el.value : el.textContent;
    if (isPersianBlock(value)) {
      el.style.direction = "rtl";
      el.style.textAlign = "right";
      el.style.fontFamily = `'${fontFamily}', Tahoma, sans-serif`;
    } else {
      el.style.direction = "";
      el.style.textAlign = "";
      el.style.fontFamily = "";
    }
  }

  document.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!el) return;
      const editable = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if (editable) enhanceField(el);
    },
    true
  );

  // Throttled (not debounced) so streaming chat replies, which mutate
  // continuously, still get enhanced while they are being written.
  const observer = new MutationObserver((mutations) => {
    if (!persianModeActive) return;
    mutations.forEach((m) => {
      if (m.type === "characterData") {
        if (m.target.parentElement) pendingRoots.add(m.target.parentElement);
      } else {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) pendingRoots.add(n);
          else if (n.nodeType === 3 && n.parentElement) pendingRoots.add(n.parentElement);
        });
      }
    });
    if (mutationTimer || !pendingRoots.size) return;
    mutationTimer = setTimeout(() => {
      mutationTimer = null;
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      roots.forEach((r) => r.isConnected && scanAndEnhance(r));
    }, 300);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  // Highlight colour (always) and the user's custom CSS (only while Persian mode is on).
  function applyUserStyle() {
    let el = document.getElementById("dastkhat-user-style");
    if (!el) {
      el = document.createElement("style");
      el.id = "dastkhat-user-style";
      (document.head || document.documentElement).appendChild(el);
    }
    const color = /^#[0-9a-f]{6}$/i.test(settings.highlightColor || "") ? settings.highlightColor : "#ffe066";
    el.textContent = ":root{--dastkhat-hl:" + color + ";}" + (persianModeActive ? (settings.customCss || "") : "");
  }

  function setPersianMode(active) {
    persianModeActive = active;
    applyUserStyle();
    if (faToggleEl) faToggleEl.classList.toggle("dastkhat-fa-active", active);
    if (active) {
      scanAndEnhance(document.body);
    } else {
      resetPersianEnhancements();
    }
  }

  function createFaToggle() {
    // With all_frames on, only the top page gets the floating button.
    if (window !== window.top) return;
    faToggleEl = document.createElement("div");
    faToggleEl.className = "dastkhat-fa-toggle";
    faToggleEl.textContent = "FA";
    faToggleEl.title = "Toggle Persian reading/writing mode on this page";
    faToggleEl.addEventListener("click", () => setPersianMode(!persianModeActive));
    document.documentElement.appendChild(faToggleEl);
  }

  // ---------------------------------------------------------------------
  // Selection toolbar: highlight + AI actions
  // ---------------------------------------------------------------------

  function getActiveSelectionInfo() {
    const active = document.activeElement;
    if (active && (active.tagName === "TEXTAREA" || (active.tagName === "INPUT" && /text|search/.test(active.type)))) {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (start !== null && end !== null && start !== end) {
        return { kind: "field", el: active, text: active.value.substring(start, end), rectEl: active };
      }
      return null;
    }

    const selection = window.getSelection();
    const text = selection && selection.toString().trim();
    if (!text || !selection || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    const editable =
      active && active.isContentEditable && active.contains(range.commonAncestorContainer) ? active : null;

    return { kind: editable ? "contenteditable" : "range", el: editable, range: range.cloneRange(), text, rect };
  }

  function replaceSelectionText(info, newText) {
    if (info.kind === "field") {
      const el = info.el;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      el.focus();
      el.setRangeText(newText, start, end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    const range = info.range;
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));

    const editable =
      info.el ||
      (range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer
      )?.closest?.("[contenteditable=true]");
    if (editable) editable.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function hideToolbar() {
    if (toolbarEl) {
      toolbarEl.remove();
      toolbarEl = null;
    }
    hidePanel();
  }

  function hidePanel() {
    if (panelEl) {
      panelEl.remove();
      panelEl = null;
    }
  }

  function anchorRectFor(info) {
    if (info.kind === "field") return info.rectEl.getBoundingClientRect();
    return info.rect;
  }

  function positionFloating(el, rect, placement) {
    const pad = 8;
    el.style.position = "fixed";
    el.style.visibility = "hidden";
    document.body.appendChild(el);

    const width = el.offsetWidth;
    const height = el.offsetHeight;
    let top = placement === "below" ? rect.bottom + 6 : rect.top - height - 6;
    let left = rect.left;

    if (left + width > window.innerWidth - pad) left = window.innerWidth - width - pad;
    if (left < pad) left = pad;
    if (top < pad) top = rect.bottom + 6;
    if (top + height > window.innerHeight - pad) top = Math.max(pad, rect.top - height - 6);

    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.visibility = "";
  }

  function aiIsActive() {
    try {
      const a = dastkhatActiveAi(settings);
      if (!a || !a.model || !a.provider.baseUrl) return false;
      return !!a.provider.apiKey || /localhost|127\.0\.0\.1/.test(a.provider.baseUrl);
    } catch (err) {
      return false;
    }
  }

  function copySelection(info, item) {
    const done = (msg) => {
      const old = item.firstChild.textContent;
      item.firstChild.textContent = msg;
      setTimeout(() => hideToolbar(), 700);
      return old;
    };
    navigator.clipboard.writeText(info.text).then(() => done("کپی شد ✓"), () => done("کپی نشد"));
  }

  function showToolbar(info) {
    hideToolbar();
    const rect = anchorRectFor(info);
    toolbarEl = document.createElement("div");
    toolbarEl.className = "dastkhat-toolbar";
    toolbarEl.dir = "rtl";

    function addItem(parent, label, opts) {
      const o = opts || {};
      const el = document.createElement("div");
      el.className = "dastkhat-toolbar-btn" + (o.disabled ? " dastkhat-disabled" : "");
      const t = document.createElement("span");
      t.textContent = label;
      el.appendChild(t);
      if (o.tag) {
        const tag = document.createElement("span");
        tag.className = "dastkhat-tag";
        tag.textContent = o.tag;
        el.appendChild(tag);
      }
      if (o.arrow) {
        const ar = document.createElement("span");
        ar.className = "dastkhat-arrow";
        ar.textContent = "‹";
        el.appendChild(ar);
      }
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (!o.disabled && o.onClick) o.onClick(el);
      });
      parent.appendChild(el);
      return el;
    }

    if (info.kind === "range") {
      addItem(toolbarEl, "هایلایت کردن", {
        onClick: () => {
          highlightRange(info.range, info.text);
          window.getSelection().removeAllRanges();
          hideToolbar();
        },
      });
    }
    addItem(toolbarEl, "کپی کردن", { onClick: (el) => copySelection(info, el) });
    addItem(toolbarEl, "ترجمه کردن", { disabled: true, tag: "به‌زودی" });
    if (aiIsActive()) {
      addItem(toolbarEl, "خلاصه کردن", { onClick: () => runAiAction("summarize", info) });
    }

    const more = document.createElement("div");
    more.className = "dastkhat-submenu";
    more.hidden = true;
    addItem(more, "بهتر کردن", { onClick: () => runAiAction("improve", info) });
    addItem(more, "ویرایش گرامر", { onClick: () => runAiAction("grammar", info) });
    addItem(toolbarEl, "سایر", {
      arrow: true,
      onClick: () => {
        more.hidden = !more.hidden;
        positionFloating(toolbarEl, rect, "above");
      },
    });
    toolbarEl.appendChild(more);

    positionFloating(toolbarEl, rect, "above");
  }

  function showPanel(info, content) {
    hidePanel();
    const rect = anchorRectFor(info);
    panelEl = document.createElement("div");
    panelEl.className = "dastkhat-panel";
    panelEl.appendChild(content);
    positionFloating(panelEl, rect, "below");
  }

  function runAiAction(action, info) {
    const loading = document.createElement("div");
    loading.className = "dastkhat-panel-text dastkhat-panel-loading";
    loading.textContent = "در حال پردازش…";
    showPanel(info, loading);

    chrome.runtime.sendMessage({ type: "dastkhat_ai_request", payload: { action, text: info.text } }, (resp) => {
      if (chrome.runtime.lastError || !panelEl) return;
      if (!resp || resp.error === "no_api_key") {
        renderNoKeyPanel(info);
        return;
      }
      if (resp.error) {
        renderErrorPanel(info, resp.error);
        return;
      }
      renderResultPanel(info, resp.result);
    });
  }

  function renderNoKeyPanel(info) {
    const wrap = document.createElement("div");
    wrap.className = "dastkhat-panel-text";
    wrap.textContent = "برای استفاده از هوش مصنوعی، آدرس API، مدل و کلید را در تنظیمات دست‌خط وارد کنید.";
    wrap.dir = "rtl";
    const openBtn = document.createElement("button");
    openBtn.className = "dastkhat-panel-btn";
    openBtn.textContent = "باز کردن تنظیمات";
    openBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: "dastkhat_open_options" });
      hideToolbar();
    });
    wrap.appendChild(document.createElement("br"));
    wrap.appendChild(openBtn);
    showPanel(info, wrap);
  }

  function renderErrorPanel(info, message) {
    const wrap = document.createElement("div");
    wrap.className = "dastkhat-panel-text dastkhat-panel-error";
    wrap.textContent = message;
    showPanel(info, wrap);
  }

  function renderResultPanel(info, resultText) {
    const wrap = document.createElement("div");
    wrap.className = "dastkhat-panel-text";
    if (persianRatio(resultText) >= PERSIAN_RATIO_THRESHOLD) {
      wrap.style.direction = "rtl";
      wrap.style.textAlign = "right";
    }
    wrap.textContent = resultText;

    const btnRow = document.createElement("div");
    btnRow.className = "dastkhat-panel-btn-row";

    const copyBtn = document.createElement("button");
    copyBtn.className = "dastkhat-panel-btn";
    copyBtn.textContent = "کپی";
    copyBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(resultText).then(
        () => {
          copyBtn.textContent = "کپی شد"
          setTimeout(() => (copyBtn.textContent = "کپی"), 1200);
        },
        () => {
          copyBtn.textContent = "ناموفق"
          setTimeout(() => (copyBtn.textContent = "کپی"), 1200);
        }
      );
    });
    btnRow.appendChild(copyBtn);

    const replaceBtn = document.createElement("button");
    replaceBtn.className = "dastkhat-panel-btn";
    replaceBtn.textContent = "جایگزین کن";
    replaceBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      replaceSelectionText(info, resultText);
      hideToolbar();
    });
    btnRow.appendChild(replaceBtn);

    const panel = document.createElement("div");
    panel.appendChild(wrap);
    panel.appendChild(btnRow);
    showPanel(info, panel);
  }

  function handleSelectionEvent() {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      const info = getActiveSelectionInfo();
      if (!info) {
        hideToolbar();
        return;
      }
      showToolbar(info);
    }, 80);
  }

  document.addEventListener("mouseup", (e) => {
    // A click inside our own menu must not rebuild it (that would close the «سایر» submenu).
    if ((toolbarEl && toolbarEl.contains(e.target)) || (panelEl && panelEl.contains(e.target))) return;
    handleSelectionEvent();
  });
  document.addEventListener("keyup", (e) => {
    if (e.shiftKey || ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      handleSelectionEvent();
    }
  });

  document.addEventListener("mousedown", (e) => {
    if (toolbarEl && !toolbarEl.contains(e.target) && (!panelEl || !panelEl.contains(e.target))) {
      hideToolbar();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideToolbar();
  });

  init();
})();
