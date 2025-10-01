const inputEl = document.getElementById("input");
const actionEl = document.getElementById("action");
const outputEl = document.getElementById("output");

document.getElementById("run").addEventListener("click", () => {
  const text = inputEl.value.trim();
  const action = actionEl.value;
  if (!text) {
    outputEl.textContent = "Please paste text first.";
    return;
  }
  outputEl.textContent = `[dummy:${action}] ${text.slice(0, 200)}`;
});