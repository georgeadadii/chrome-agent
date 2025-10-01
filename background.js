const MODEL = "gpt-4o-mini";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "solo_root",
    title: "Solo AI",
    contexts: ["selection"]
  });

  const items = [
    { id: "summarise", title: "Summarise" },
    { id: "tone_change", title: "Tone change (professional)" },
    { id: "key_points", title: "Key points" }
  ];
  items.forEach(({ id, title }) =>
    chrome.contextMenus.create({
      id: "solo_" + id,
      parentId: "solo_root",
      title,
      contexts: ["selection"]
    })
  );
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId || !info.menuItemId.startsWith("solo_")) return;
  const action = info.menuItemId.replace("solo_", "");
  const text = info.selectionText || "";

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await sendToTab(tab.id, { type: "SOLO_ERROR", message: "Add your API key in Solo AI → Options." });
      return;
    }
    const prompt = buildPrompt(action, text);
    const output = await callOpenAI(apiKey, MODEL, prompt);
    await sendToTab(tab.id, { type: "SOLO_RESULT", action, input: text, output });
  } catch (err) {
    await sendToTab(tab.id, { type: "SOLO_ERROR", message: String(err && err.message || err) });
  }
});

// Handle requests from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    if (request?.type === "RUN_FROM_POPUP") {
      const { action, text } = request;
      const apiKey = await getApiKey();
      if (!apiKey) {
        sendResponse({ ok: false, error: "Add your API key in Solo AI → Options." });
        return;
      }
      try {
        const prompt = buildPrompt(action, text);
        const output = await callOpenAI(apiKey, MODEL, prompt);
        sendResponse({ ok: true, output });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      }
      return;
    }
  })();
  return true;
});

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["openaiApiKey"], (res) => resolve(res.openaiApiKey || null));
  });
}

function buildPrompt(action, text) {
  const header = "You are a precise, concise writing assistant. Prefer short, scannable output.";
  if (action === "summarise") {
    return header + "\\n\\nSummarise the following in however many bullet points you deem important. Keep key facts and numbers.\\n\\nText:\\n" + text;
  }
  if (action === "tone_change") {
    return header + "\\n\\nRewrite the text in a professional, concise tone. Preserve meaning and facts.\\n\\nText:\\n" + text;
  }
  if (action === "key_points") {
    return header + "\\n\\nExtract key bullet points (max 2 sentence each).\\n\\nText:\\n" + text;
  }
  return header + "\\n\\nOperate on this text:\\n" + text;
}

async function callOpenAI(apiKey, model, prompt) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error && (data.error.message || data.error.type)) || ("HTTP " + res.status);
    throw new Error("OpenAI error: " + msg);
  }

  const output =
    data.output_text ||
    (Array.isArray(data.output) && data.output[0] && data.output[0].content && data.output[0].content[0] && data.output[0].content[0].text) ||
    (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
    "";

  if (!output) throw new Error("No text output from model.");
  return String(output).trim();
}

function sendToTab(tabId, msg) {
  return new Promise((resolve) => chrome.tabs.sendMessage(tabId, msg, resolve));
}