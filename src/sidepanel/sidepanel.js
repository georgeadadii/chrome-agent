const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const presetBtn = document.getElementById('preset-btn');
const presetMenu = document.getElementById('preset-menu');
const actionButtons = Array.from(document.querySelectorAll('#actions .btn'));
const settingsBtn = document.getElementById('settings-btn');

const ACTION_LABELS = {
  summarise: 'Summarise:',
  tone_change: 'Tone Change:',
  key_points: 'Key Points:',
  create_notes: 'Create Notes:'
};

let selectedAction = null;
let selectedPrefix = '';

function getPrefixLength() {
  return selectedPrefix ? (selectedPrefix.length + 1) : 0;
}

function stripPrefix(text) {
  if (!selectedPrefix) return text;
  const want = selectedPrefix + ' ';
  return text.startsWith(want) ? text.slice(want.length) : text;
}

function applyPrefixToInput() {
  if (!selectedPrefix) return;
  const content = stripPrefix(userInput.value);
  userInput.value = selectedPrefix + ' ' + content;
  requestAnimationFrame(() => {
    const pos = userInput.value.length;
    userInput.selectionStart = userInput.selectionEnd = pos;
  });
}

function clearPrefixFromInput() {
  if (!selectedPrefix) return;
  userInput.value = stripPrefix(userInput.value);
}

function setPreset(action) {
  if (!action) {
    clearPrefixFromInput();
    selectedAction = null;
    selectedPrefix = '';
    return;
  }

  clearPrefixFromInput();

  selectedAction = action;
  selectedPrefix = ACTION_LABELS[action] || '';
  if (selectedPrefix) {
    applyPrefixToInput();
  }
}

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

function handleAction(action, overrideText) {
  const text = (overrideText != null ? overrideText : (userInput.value || '')).trim();
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

if (presetBtn) {
  presetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = presetMenu.hasAttribute('hidden');
    if (isHidden) {
      presetMenu.removeAttribute('hidden');
      presetBtn.setAttribute('aria-expanded', 'true');
    } else {
      presetMenu.setAttribute('hidden', '');
      presetBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

xif (presetMenu) {
  presetMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches('.dropdown-item')) {
      const action = target.getAttribute('data-action');
      setPreset(action);
      presetMenu.setAttribute('hidden', '');
      presetBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Freeform send via button or Enter
sendBtn.addEventListener('click', () => {
  const actionToUse = selectedAction || 'freeform';
  const content = selectedAction ? stripPrefix(userInput.value).trim() : (userInput.value || '').trim();
  handleAction(actionToUse, content);
  userInput.value = selectedAction ? (selectedPrefix + ' ') : '';
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const actionToUse = selectedAction || 'freeform';
    const content = selectedAction ? stripPrefix(userInput.value).trim() : (userInput.value || '').trim();
    handleAction(actionToUse, content);
    userInput.value = selectedAction ? (selectedPrefix + ' ') : '';
    return;
  }
  // Keep caret from moving into the prefix when a preset is selected
  if (selectedPrefix) {
    const prefixLen = getPrefixLength();
    const start = userInput.selectionStart;
    const end = userInput.selectionEnd;
    if ((e.key === 'Backspace' && start <= prefixLen && start === end) ||
        (e.key === 'ArrowLeft' && start <= prefixLen)) {
      e.preventDefault();
      userInput.selectionStart = userInput.selectionEnd = prefixLen;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      userInput.selectionStart = userInput.selectionEnd = prefixLen;
    }
  }
});

// Ensure prefix remains if user edits or pastes
userInput.addEventListener('input', () => {
  if (!selectedPrefix) return;
  const want = selectedPrefix + ' ';
  if (!userInput.value.startsWith(want)) {
    applyPrefixToInput();
  }
});