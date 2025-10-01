(function () {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "SOLO_RESULT") {
      showSoloPanel(msg.output, msg.action);
    } else if (msg?.type === "SOLO_ERROR") {
      showSoloPanel("ERROR" + msg.message, "error");
    }
  });

  function showSoloPanel(text, label) {
    let panel = document.getElementById("solo-ai-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "solo-ai-panel";
      panel.style.cssText = [
        "position:fixed",
        "z-index:2147483647",
        "top:16px",
        "right:16px",
        "max-width:min(520px, 90vw)",
        "max-height:min(70vh, 800px)",
        "overflow:auto",
        "background:#0f172a",
        "color:#e2e8f0",
        "box-shadow:0 10px 30px rgba(0,0,0,0.35)",
        "border-radius:12px",
        "padding:12px 12px 8px 12px",
        "font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        "white-space:pre-wrap"
      ].join(";");
      panel.innerHTML = [
        "<div id=\"solo-ai-header\" style=\"display:flex;align-items:center;gap:8px;justify-content:space-between;margin-bottom:8px\">",
        "  <div style=\"display:flex;align-items:center;gap:8px\">",
        "    <strong style=\"font-size:13px\">Solo AI</strong>",
        "    <span id=\"solo-ai-label\" style=\"opacity:.75;font-size:12px\"></span>",
        "  </div>",
        "  <div style=\"display:flex;gap:6px\">",
        "    <button id=\"solo-ai-copy\" title=\"Copy\" style=\"all:unset;cursor:pointer;padding:6px 10px;border-radius:8px;background:#1f2937;color:#e5e7eb\">Copy</button>",
        "    <button id=\"solo-ai-close\" title=\"Close\" style=\"all:unset;cursor:pointer;padding:6px 10px;border-radius:8px;background:#334155;color:#e5e7eb\">Close</button>",
        "  </div>",
        "</div>",
        "<div id=\"solo-ai-body\" style=\"font-size:13px;white-space:pre-wrap\"></div>"
      ].join("");
      document.documentElement.appendChild(panel);

      document.getElementById("solo-ai-close").onclick = () => panel.remove();
      document.getElementById("solo-ai-copy").onclick = async () => {
        try {
          const t = document.getElementById("solo-ai-body").innerText;
          await navigator.clipboard.writeText(t);
          document.getElementById("solo-ai-copy").textContent = "Copied";
          setTimeout(() => (document.getElementById("solo-ai-copy").textContent = "Copy"), 1200);
        } catch {}
      };
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("solo-ai-panel")) {
          document.getElementById("solo-ai-panel").remove();
        }
      }, { capture: true });
    }
    document.getElementById("solo-ai-body").textContent = text || "";
    document.getElementById("solo-ai-label").textContent = label ? "· " + label : "";
  }
})();