const keyEl = document.getElementById("apiKey");
const statusEl = document.getElementById("status");

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["openaiApiKey"], ({ openaiApiKey }) => {
    keyEl.value = openaiApiKey || "";
  });
});

document.getElementById("save").addEventListener("click", async () => {
  const v = keyEl.value.trim();
  chrome.storage.local.set({ openaiApiKey: v }, () => {
    statusEl.textContent = v ? "API key saved." : "Cleared.";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  });
});

document.getElementById("clear").addEventListener("click", async () => {
  keyEl.value = "";
  chrome.storage.local.remove(["openaiApiKey"], () => {
    statusEl.textContent = "Cleared.";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  });
});