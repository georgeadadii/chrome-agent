const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const actionButtons = Array.from(document.querySelectorAll('#actions .btn'));
const settingsBtn = document.getElementById('settings-btn');

function appendMessage(text, role, extraClass) {
  const div = document.createElement('div');
  const base = role === 'user' ? 'user-message' : 'ai-message';
  div.className = `message ${base}${extraClass ? ' ' + extraClass : ''}`;
  div.textContent = text;
  chatArea.appendChild(div);
  requestAnimationFrame(() => {
    div.classList.add('fade-in');
    chatArea.scrollTop = chatArea.scrollHeight;
  });
  return div;
}

function handleAction(action) {
  const text = (userInput.value || '').trim();
  if (!text) return;

  appendMessage(text, 'user');
  const loadingEl = appendMessage('Thinking', 'ai', 'loading');

  chrome.runtime.sendMessage({ type: 'RUN_FROM_SIDEPANEL', action, text });

  function onMessage(msg) {
    if (msg?.type === 'SOLO_RESULT') {
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.classList.remove('loading');
        loadingEl.textContent = (msg.output || '').trim();
        loadingEl.classList.remove('fade-in');
        void loadingEl.offsetWidth;
        loadingEl.classList.add('fade-in');
      }
      chrome.runtime.onMessage.removeListener(onMessage);
    } else if (msg?.type === 'SOLO_ERROR') {
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.classList.remove('loading');
        loadingEl.classList.add('error');
        loadingEl.textContent = 'ERROR: ' + msg.message;
        loadingEl.classList.remove('fade-in');
        void loadingEl.offsetWidth;
        loadingEl.classList.add('fade-in');
      }
      chrome.runtime.onMessage.removeListener(onMessage);
    }
  }
  chrome.runtime.onMessage.addListener(onMessage);
}

actionButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.getAttribute('data-action');
    handleAction(action);
  });
});

settingsBtn.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ url: 'options.html' });
  }
});