# 🧠 Solo AI Agent – Chrome Extension

A lightweight Chrome Agent that lets you **summarise**, **rephrase**, **explain**, or **save** any highlighted text directly in your browser.  
Designed for students, researchers, and professionals who want AI assistance without switching tabs.

---

## 🚀 Features

- **Summarise highlighted text** instantly in the side panel  
- **Change tone** (professional, casual, persuasive, etc.)  
- **Explain complex text** in simpler terms  
- **Extract key points or action items**  
- **Save insights to Notion, OneNote, or local history** *(coming soon...)*  
- Clean, minimal UI with icons and keyboard shortcuts  

---

## 📲 Usage

1. Open **chrome://extensions/**
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the **chrome-agent** directory

---

## 🧠 How It Works

- **Background script** listens for highlighted text and sends it to the model endpoint
- **Side panel UI** displays responses using smooth streaming output
- **API utility** handles communication with your AI backend (e.g. OpenAI)
- **Storage utility** saves conversation history or preferences locally using `chrome.storage`

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch (`feature/your-feature-name`)  
3. Commit your changes  
4. Open a Pull Request
