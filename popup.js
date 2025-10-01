const inputEl = document.getElementById("input");
const actionEl = document.getElementById("action");
const outputEl = document.getElementById("output");

document.getElementById("open-options").addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});

document.getElementById("grab").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || ""
    });

    inputEl.value = (result || "").trim();
    if (!inputEl.value) {
      outputEl.textContent = "No selection found on the page.";
    } else {
      outputEl.textContent = "";
    }
  } catch (e) {
    outputEl.textContent = "Error grabbing selection: " + String(e?.message || e);
  }
});

document.getElementById("run").addEventListener("click", async () => {
  const text = inputEl.value.trim();
  const action = actionEl.value;
  if (!text) {
    outputEl.textContent = "Please paste text or grab a selection first.";
    return;
  }
  outputEl.textContent = "Thinking…";

  chrome.runtime.sendMessage(
    { type: "RUN_FROM_POPUP", action, text },
    (res) => {
      if (!res?.ok) {
        outputEl.textContent = "⚠️ " + (res?.error || "Unknown error.");
        return;
      }
      outputEl.textContent = res.output.trim();
    }
  );
});