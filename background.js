chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "solo_root",
    title: "Solo AI",
    contexts: ["selection"]
  });
  [
    { id: "summarise", title: "Summarise" },
    { id: "tone_change", title: "Tone change (professional)" },
    { id: "key_points", title: "Key points" }
  ].forEach(({ id, title }) => {
    chrome.contextMenus.create({
      id: "solo_" + id,
      parentId: "solo_root",
      title,
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId?.startsWith("solo_")) return;
  const action = info.menuItemId.replace("solo_", "");
  const text = info.selectionText || "";
  await chrome.tabs.sendMessage(tab.id, {
    type: "SOLO_RESULT",
    action,
    output: `[dummy:${action}] ${text.slice(0, 160)}`
  });
});
