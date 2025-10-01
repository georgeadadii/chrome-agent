(function () {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "SOLO_RESULT") {
      showPanel(msg.output, msg.action);
    } else if (msg?.type === "SOLO_ERROR") {
      showPanel("ERROR" + msg.message, "error");
    }
  });

  function showPanel(text, label) {
    let panel = document.getElementById("solo-ai-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "solo-ai-panel";
      Object.assign(panel.style, {
        position: "fixed",
        zIndex: 2147483647,
        top: "16px",
        right: "16px",
        maxWidth: "min(520px, 90vw)",
        maxHeight: "min(70vh, 800px)",
        overflow: "auto",
        background: "#0f172a",
        color: "#e2e8f0",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        borderRadius: "12px",
        padding: "12px",
        font: "14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        whiteSpace: "pre-wrap"
      });
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div><strong style="font-size:13px">Solo AI</strong> <span id="solo-ai-label" style="opacity:.75;font-size:12px"></span></div>
          <button id="solo-ai-close" style="all:unset;cursor:pointer;padding:6px 10px;border-radius:8px;background:#334155;color:#e5e7eb">Close</button>
        </div>
        <div id="solo-ai-body" style="font-size:13px"></div>
      `;
      document.documentElement.appendChild(panel);
      document.getElementById("solo-ai-close").onclick = () => panel.remove();
    }
    document.getElementById("solo-ai-body").textContent = text || "";
    document.getElementById("solo-ai-label").textContent = label ? "· " + label : "";
  }
})();