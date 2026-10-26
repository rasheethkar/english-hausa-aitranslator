# GemmaTranslate - Pan-Nigerian & West African AI Translation Hub

A fast, comprehensive web application powered by **Gemma 4** through Google AI Studio (with local **Ollama** fallback) translating bidirectionally across the major languages of Nigeria and West Africa: **Hausa (Boko)**, **Fulfulde (Fula / Pulaar)**, **Yoruba (Èdè Yorùbá)**, **Igbo (Asụsụ Igbo)**, and **English**.

---

## 🌟 New Features Built in this Update

1. **Complete Nigerian Language Hub**:
   - **Hausa (Boko)**: Hooked letters (`ɓ`, `ɗ`, `ƙ`, `'y`), Kano/Sokoto dialects, *lafiya* / *addu'a* context.
   - **Fulfulde (Pulaar)**: Special letters (`ɓ`, `ɗ`, `ƴ`, `ŋ`), Adamawa/Fouta dialects, *Pulaaku* moral code & *Jam* peace greetings.
   - **Yoruba (Èdè Yorùbá)**: Sub-dots (`ẹ`, `ọ`, `ṣ`), tonal accents (high `á`, low `à`), *Ọmọlúwàbí* etiquette, *Ẹ ku...* honorific greetings.
   - **Igbo (Asụsụ Igbo)**: Sub-dotted vowels (`ị`, `ọ`, `ụ`), nasal `ṅ`, Central/Onitsha dialects, *Onye kwe chi ya ekwe* philosophy.

2. **🎙️ Voice Input (Speech-to-Text)**:
   - Click the microphone icon in the input box to speak directly in English or local African languages.
   - Uses browser Web Speech Recognition with animated pulsing feedback.

3. **🪟 Side-by-Side Dual Comparison Mode**:
   - Switch to the **Dual Compare** tab to translate one English sentence into **Hausa, Fulfulde, Yoruba, and Igbo simultaneously**.
   - Compare how all major Nigerian cultures express the identical thought side-by-side.

4. **🗂️ Phrasebook & Translation History (LocalStorage)**:
   - Every translation is automatically saved in your browser history.
   - Click the **Star icon** to bookmark phrases into your personal phrasebook.
   - **Export Button**: Download your phrasebook as a study text file.
   - 1-click **Open** to restore any previous translation back into the translator.

5. **🏆 Cultural Quiz & Practice Flashcards**:
   - Test your knowledge with interactive 5-question cultural etiquette quizzes covering Hausa, Fulfulde, Yoruba, and Igbo proverbs, hooked letters, and traditions.
   - Immediate feedback and cultural explanations for every question.

---

## 🚀 How to Run

```bash
# Start development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🧪 Smoke Test Commands

- **Hausa Smoke Test:** `npm run test:smoke`
- **Fulfulde Smoke Test:** `npm run test:smoke:fulfulde`
- **Yoruba / Igbo:** `TARGET_LANG=yoruba npm run test:smoke` or `TARGET_LANG=igbo npm run test:smoke`
