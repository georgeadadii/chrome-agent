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
  const header = `
You are SOLO — a precise, concise writing assistant embedded in a Chrome extension.
Your style: clear, factual, minimal fluff. 
Always format outputs in clean Markdown (use bullet points, bold key terms, short sentences).
Prefer readable spacing and visually distinct sections.`;

  if (action === "summarise") {
    return `${header}
      **Task:** Summarise the following text clearly and objectively.
      - Capture only the most important points, facts, and numbers.
      - Group related ideas under brief, bold headings.
      - Aim for 8–12 concise bullet points (or fewer if the text is short).
      - Avoid repetition or unnecessary phrasing.
      **Text to Summarise:**
      ${text}`;
  }

  if (action === "tone_change") {
    return `${header}
      **Task:** Rewrite the text in a **professional, confident, and concise** tone.
      - Preserve the original meaning, facts, and structure.
      - Remove redundancy and filler words.
      - Maintain a natural, human flow — not robotic.
      - Format the output in clean Markdown with short paragraphs.
      **Text to Rewrite:**
      ${text}`;
  }

  if (action === "key_points") {
    return `${header}
      **Task:** Extract the key insights and facts as bullet points.
      - Each point should be **1–2 sentences max**.
      - Use bold to highlight key terms or concepts.
      - Exclude trivial or repetitive information.
      - Maintain a neutral and factual tone.
      **Text to Analyse:**
      ${text}`;
  }

  return `${header}
    **Task:** Operate intelligently on the provided text based on user intent.
    **Text:**
    ${text}`;
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