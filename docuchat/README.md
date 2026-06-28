# ExaminerAI — Motor Traffic Knowledge System

A mobile-first PWA chatbot for Motor Traffic Department examiners.
Upload legal documents (PDFs, Word, Excel, handwritten images) and ask AI questions — answered strictly from your documents only.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Gemini API key
```bash
cp .env.example .env
```
Open `.env` and replace `your_gemini_api_key_here` with your key from https://aistudio.google.com

### 3. Run the app
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

---

## 📱 Install on Mobile (PWA)

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the 3-dot menu → "Add to Home Screen"
3. App installs like a native app

**iPhone (Safari):**
1. Open the app URL in Safari
2. Tap Share → "Add to Home Screen"

---

## 🌐 Deploy to Vercel (Free)

```bash
# 1. Push this folder to a GitHub repo
# 2. Go to vercel.com → New Project → Import your repo
# 3. Add environment variable: VITE_GEMINI_API_KEY = your_key
# 4. Deploy — done!
```

---

## 📁 Supported File Types

| Type | Extensions |
|------|-----------|
| PDF | .pdf |
| Word | .docx, .doc |
| Excel / CSV | .xlsx, .xls, .csv |
| Images / Handwritten | .jpg, .jpeg, .png, .webp |

---

## ⚠️ Demo Disclaimer

This is a proof-of-concept demo. Do NOT upload real case files or personal data.
Production version should use a self-hosted private AI model.

---

## 🔐 Production Recommendation

For production use with real case files:
- Replace Gemini API with a self-hosted Ollama instance (Llama 3 or Mistral)
- Deploy on the department's own server
- Add proper authentication (NIC + Employee ID)
- Enable End-to-End Encryption for document storage
