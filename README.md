# GemmaHausa - English to Natural Hausa AI Translator

A simple, fast web application that translates English into natural, culturally accurate Latin-script Hausa (**Boko**). It captures regional variations (such as Kano and Sokoto dialects), local idioms, and cultural etiquette notes.

Powered by **Gemma 4** through Google AI Studio (Gemini API) with an instant local offline fallback via **Ollama**.

---

## 🌟 What It Does

- **Natural Latin-Script Hausa (Boko)**: Generates grammatically correct Hausa with special hooked characters (`ɓ`, `ɗ`, `ƙ`, `'y`).
- **Cultural & Idiom Intelligence**: Rather than word-for-word translation, it translates the real meaning and matches English sayings with authentic Hausa idioms.
- **Regional Variations**: Shows dialect alternatives (e.g. Kano Eastern Standard vs. Sokoto Western Hausa).
- **Phonetic & Tone Guide**: Provides pronunciation guidance for English speakers and language learners.
- **Dual Engine**: Use Google AI Studio in the cloud, or run completely offline with Ollama on your computer.

---

## 📋 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

Your `.env` file should look like this:
```env
# PROVIDER: 'api' (Google AI Studio) or 'local' (Ollama)
PROVIDER=api

# Gemini API key (from Google AI Studio: https://aistudio.google.com/)
GEMINI_API_KEY="your-actual-api-key"

# Gemma 4 model ID
GEMMA_API_MODEL="gemma-4-31b-it"

# Ollama settings (used when PROVIDER=local)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gemma4:e2b"
```

---

## 🚀 How to Run

### Option A: Run with Google AI Studio (API)
This uses Google's high-speed cloud with Gemma 4 (`gemma-4-31b-it`).

1. In `.env`, ensure:
   ```env
   PROVIDER=api
   GEMINI_API_KEY=your_key_here
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:3000`.

---

### Option B: Run with Ollama (Local & Offline)
This runs Gemma 4 locally on your machine without sending any data over the internet.

1. Install [Ollama](https://ollama.com) on your computer.
2. Download and run the Gemma 4 model:
   ```bash
   ollama run gemma4:e2b
   ```
3. In `.env`, set:
   ```env
   PROVIDER=local
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`.

---

## 🧪 Run the Smoke Test

The smoke test sends a realistic sample phrase through your currently selected provider (`PROVIDER=api` or `PROVIDER=local`), verifies the translation and cultural notes, and prints **PASS** or **FAIL**:

```bash
npm run test:smoke
```

Example output:
```
==================================================
🚀 Starting Gemma 4 Hausa Translation Smoke Test
Provider : API
Model    : gemma-4-31b-it
...
✅ GEMMA 4 TRANSLATION SMOKE TEST: PASS
==================================================
PASS
```

To test the local Ollama provider specifically:
```bash
PROVIDER=local npm run test:smoke
```

---

## 💡 Quick Tips for Hausa Pronunciation (Boko Letters)

Hausa uses special Latin letters that change the meaning of words:
- **`ɓ`** (B with hook): Glottalized 'b' (produced with an inward gulp of air).
- **`ɗ`** (D with hook): Glottalized 'd'.
- **`ƙ`** (K with hook): Sharp, emphatic 'k' sound produced at the back of the throat.
- **`'y`**: Glottalized 'y' sound.
