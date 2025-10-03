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

// Ensure toolbar icon opens the Side Panel (no popup UI)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab && tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (e) {
    console.error("Failed to open side panel on action click:", e);
  }
});

// Handle context menu clicks - now opens side panel
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId || !info.menuItemId.startsWith("solo_")) return;
  const action = info.menuItemId.replace("solo_", "");
  const text = info.selectionText || "";

  // Open side panel first
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (e) {
    console.error("Failed to open side panel:", e);
    return;
  }

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      // Send error to side panel
      chrome.runtime.sendMessage({ 
        type: "SOLO_ERROR", 
        message: "Add your API key in Solo AI → Options." 
      });
      return;
    }
    const prompt = buildPrompt(action, text);
    const output = await callOpenAI(apiKey, MODEL, prompt);
    
    // Send result to side panel
    chrome.runtime.sendMessage({ 
      type: "SOLO_RESULT", 
      action, 
      input: text, 
      output 
    });
  } catch (err) {
    chrome.runtime.sendMessage({ 
      type: "SOLO_ERROR", 
      message: String(err && err.message || err) 
    });
  }
});

// Handle requests from side panel chat
chrome.runtime.onMessage.addListener((request, _sender) => {
  (async () => {
    if (request?.type === "RUN_FROM_SIDEPANEL") {
      const { action, text } = request;
      const rawKey = await getApiKey();
      const apiKey = sanitizeApiKey(rawKey);
      if (!apiKey) {
        chrome.runtime.sendMessage({ type: "SOLO_ERROR", message: "Add your API key in Solo AI → Options." });
        return;
      }
      try {
        const prompt = buildPrompt(action, text);
        const output = await callOpenAI(apiKey, MODEL, prompt);
        chrome.runtime.sendMessage({ type: "SOLO_RESULT", action, output });
      } catch (e) {
        chrome.runtime.sendMessage({ type: "SOLO_ERROR", message: String(e && e.message || e) });
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
    return header + "\n\nSummarise the following in however many bullet points you deem important. Keep key facts and numbers.\n\nText:\n" + text;
  }
  if (action === "tone_change") {
    return header + "\n\nRewrite the text in a professional, concise tone. Preserve meaning and facts.\n\nText:\n" + text;
  }
  if (action === "key_points") {
    return header + "\n\nExtract key bullet points (max 2 sentence each).\n\nText:\n" + text;
  }
  return header + "\n\nOperate on this text:\n" + text;
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

function sanitizeApiKey(v) {
  const raw = (v || "").trim();
  const ascii = raw.replace(/[^\x20-\x7E]/g, "");
  return ascii;
}