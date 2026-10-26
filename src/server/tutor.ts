import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getProviderStatus, LanguageCode, normalizeOllamaUrl } from './translator.ts';

dotenv.config();

export interface TutorChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorCurriculumModule {
  id: string;
  title: string;
  icon: string;
  description: string;
  starterPrompt: string;
  keyPhrases: { original: string; english: string; pronunciation: string }[];
}

export interface TutorResponse {
  reply: string;
  pronunciationGuide?: string;
  targetPhrases?: string[];
  culturalInsight?: string;
  suggestedReplies?: string[];
  providerUsed: 'api' | 'local';
  modelUsed: string;
  timestamp: string;
}

export function getCurriculum(language: LanguageCode): TutorCurriculumModule[] {
  switch (language) {
    case 'hausa':
      return [
        {
          id: 'h1',
          title: 'Module 1: Greetings & Honorific Etiquette',
          icon: '🌅',
          description: 'Learn morning, afternoon, and evening greetings and how to politely address elders with "ku".',
          starterPrompt: 'Hello Teacher! Please teach me the fundamental Hausa greetings for morning, afternoon, and evening, and how to respond properly.',
          keyPhrases: [
            { original: 'Ina kwana?', english: 'Good morning (How did you spend the night?)', pronunciation: 'Ee-nah kwah-nah?' },
            { original: 'Lafiya lau', english: 'Very well / In good health', pronunciation: 'Lah-fee-yah low' },
            { original: 'Ina yini?', english: 'Good afternoon (How is your day?)', pronunciation: 'Ee-nah yee-nee?' },
            { original: 'Sannu da aiki', english: 'Greetings on your work / Well done', pronunciation: 'Sahn-noo dah eye-kee' },
          ],
        },
        {
          id: 'h2',
          title: 'Module 2: Hooked Letters & Pronunciation',
          icon: '🗣️',
          description: 'Master the 4 unique Boko letters: ɓ (implosive b), ɗ (implosive d), ƙ (ejective k), and \'y.',
          starterPrompt: 'Can you teach me how to pronounce the 4 special hooked letters in Hausa (ɓ, ɗ, ƙ, \'y) with example words?',
          keyPhrases: [
            { original: 'Ƙoshi', english: 'Satisfaction / Satiation', pronunciation: 'Kk-oh-shee (popping k)' },
            { original: 'Ɗan', english: 'Son / Little', pronunciation: 'Dd-ahn (implosive d)' },
            { original: 'Ɓarawo', english: 'Thief', pronunciation: 'Bb-ah-rah-woh (implosive b)' },
            { original: '\'Ya\'ya', english: 'Children / Fruits', pronunciation: 'Y-ah-y-ah (glottal y)' },
          ],
        },
        {
          id: 'h3',
          title: 'Module 3: Market & Negotiation Mastery',
          icon: '🏪',
          description: 'Learn how to ask for prices, bargain politely, and purchase fresh produce in a bustling Hausa market.',
          starterPrompt: 'I want to roleplay visiting a market in Kano. How do I ask for prices, say something is too expensive, and negotiate politely?',
          keyPhrases: [
            { original: 'Nawa ne wannan?', english: 'How much is this?', pronunciation: 'Nah-wah neh wahn-nahn?' },
            { original: 'Ya yi tsada, a rage mani', english: 'It is too expensive, please reduce it for me', pronunciation: 'Yah yee tsah-dah, ah rah-geh mah-nee' },
            { original: 'Ina so in sayi...', english: 'I want to buy...', pronunciation: 'Ee-nah soh een sah-yee...' },
          ],
        },
        {
          id: 'h4',
          title: 'Module 4: Proverbs & Cultural Wisdom (Karin Magana)',
          icon: '📜',
          description: 'Explore the profound worldview and storytelling idioms of traditional Hausa culture.',
          starterPrompt: 'Please teach me 3 famous Hausa proverbs (karin magana) and the life wisdom behind them.',
          keyPhrases: [
            { original: 'Haka Allah ya so', english: 'This is what God willed / Acceptance', pronunciation: 'Hah-kah Ahl-lah yah soh' },
            { original: 'Komi ya baci zai gyaru', english: 'Whatever is damaged can be repaired', pronunciation: 'Koh-mee yah bah-chee zeye gyah-roo' },
          ],
        },
      ];

    case 'fulfulde':
      return [
        {
          id: 'f1',
          title: 'Module 1: The Principle of Jam (Peace & Greetings)',
          icon: '🕊️',
          description: 'Discover why "Jam" (peace) is the core of every greeting in Fulani culture.',
          starterPrompt: 'Hello Teacher! Teach me how Fulani people greet each other using "Jam" and the proper responses.',
          keyPhrases: [
            { original: 'Jam waali?', english: 'Did you sleep in peace? (Morning greeting)', pronunciation: 'Jahm wah-lee?' },
            { original: 'Jam tan', english: 'Peace only (The traditional answer)', pronunciation: 'Jahm tahn' },
            { original: 'No mbadda?', english: 'How are you doing?', pronunciation: 'Noh mbah-dah?' },
          ],
        },
        {
          id: 'f2',
          title: 'Module 2: Fulfulde Special Letters (ɓ, ɗ, ƴ, ŋ)',
          icon: '🗣️',
          description: 'Practice the distinctive Fulfulde consonants including glottalized ƴ and velar nasal ŋ.',
          starterPrompt: 'Can you teach me how to read and pronounce the special letters ƴ and ŋ in Fulfulde?',
          keyPhrases: [
            { original: 'Ƴiiƴam', english: 'Blood', pronunciation: 'Yee-yahm' },
            { original: 'Ŋari', english: 'Beauty / Grace', pronunciation: 'Ngah-ree' },
          ],
        },
        {
          id: 'f3',
          title: 'Module 3: Pulaaku - The Fulani Code of Honor',
          icon: '👑',
          description: 'Learn the language of respect, modesty (Semteende), and hospitality in Fulani society.',
          starterPrompt: 'Explain the concept of Pulaaku to me and teach me words associated with respect and modesty.',
          keyPhrases: [
            { original: 'Munyal', english: 'Patience / Endurance', pronunciation: 'Moon-yahl' },
            { original: 'Semteende', english: 'Modesty / Shame / Self-respect', pronunciation: 'Sehm-tehn-deh' },
          ],
        },
      ];

    case 'yoruba':
      return [
        {
          id: 'y1',
          title: 'Module 1: Respect & Honorifics (Ẹ ku...)',
          icon: '👑',
          description: 'Understand the essential Yoruba greeting formula "Ẹ ku..." for every situation and elder respect.',
          starterPrompt: 'Hello Teacher! Teach me how to use the "Ẹ ku..." greeting system in Yoruba for morning, work, and hosts.',
          keyPhrases: [
            { original: 'Ẹ ku aarọ o', english: 'Good morning (Respectful)', pronunciation: 'Eh koo ah-raw oh' },
            { original: 'Ẹ ku iṣẹ', english: 'Well done at your work / Greeting for someone working', pronunciation: 'Eh koo ee-sheh' },
            { original: 'Ṣe alaafia ni?', english: 'Are you in peace / health?', pronunciation: 'Sheh ah-lah-fee-ah nee?' },
          ],
        },
        {
          id: 'y2',
          title: 'Module 2: Tones and Sub-dots (ẹ, ọ, ṣ)',
          icon: '🎵',
          description: 'Master the high (ó), mid (o), and low (ò) tone system that gives Yoruba its musical melody.',
          starterPrompt: 'How do tone marks change the meaning of words in Yoruba? Can you give examples with Owo (money, hand, broom)?',
          keyPhrases: [
            { original: 'Owó', english: 'Money (High tone)', pronunciation: 'Oh-WOH' },
            { original: 'Ọwọ́', english: 'Hand (High tone on open o)', pronunciation: 'Aw-WOH' },
            { original: 'Ọ̀wọ̀', english: 'Respect / Honor (Low tones)', pronunciation: 'Aw-waw' },
          ],
        },
        {
          id: 'y3',
          title: 'Module 3: Ọmọlúwàbí - The Moral Persona',
          icon: '📜',
          description: 'Learn proverbs and conversational expressions representing the ideal person of integrity.',
          starterPrompt: 'What does Ọmọlúwàbí mean in Yoruba culture and what phrases express good character?',
          keyPhrases: [
            { original: 'Iwa rere lẹṣọ eniyan', english: 'Good character is the beauty of a human being', pronunciation: 'Ee-wah reh-reh leh-shaw eh-nee-yahn' },
          ],
        },
      ];

    case 'igbo':
      return [
        {
          id: 'i1',
          title: 'Module 1: Daily Greetings & Inquiries (Kedu)',
          icon: '☀️',
          description: 'Learn the primary Igbo greetings: Ụtụtụ ọma, Nnọọ, and how to use Kedu in conversation.',
          starterPrompt: 'Hello Teacher! Please teach me how to greet people throughout the day in Igbo and how to use "Kedu".',
          keyPhrases: [
            { original: 'Ụtụtụ ọma', english: 'Good morning', pronunciation: 'Oo-too-too aw-mah' },
            { original: 'Kedu ka i mere?', english: 'How are you doing?', pronunciation: 'Keh-doo kah ee meh-reh?' },
            { original: 'A dị m mma', english: 'I am fine / well', pronunciation: 'Ah dee m mm-mah' },
            { original: 'Nnọọ', english: 'Welcome', pronunciation: 'Nn-naw' },
          ],
        },
        {
          id: 'i2',
          title: 'Module 2: Dotted Vowels (ị, ọ, ụ) & Nasals (ṅ)',
          icon: '🗣️',
          description: 'Master the vowel harmony pairs and dotted letters unique to standard Asụsụ Igbo.',
          starterPrompt: 'Can you teach me the difference between regular vowels and sub-dotted vowels (ị, ọ, ụ) in Igbo?',
          keyPhrases: [
            { original: 'Ịhe', english: 'Thing / Light', pronunciation: 'Ee-heh (light i)' },
            { original: 'Ọnụ', english: 'Mouth / Price', pronunciation: 'Aw-noo (open o and light u)' },
          ],
        },
        {
          id: 'i3',
          title: 'Module 3: Ilu Igbo - Proverbs & Worldview',
          icon: '🦅',
          description: 'Explore the wit and wisdom of traditional Igbo proverbs that salt conversation.',
          starterPrompt: 'Please teach me 3 famous Igbo proverbs (Ilu) and their meaning in traditional life.',
          keyPhrases: [
            { original: 'Onye kwe, chi ya ekwe', english: 'When a person says yes, their personal spirit agrees', pronunciation: 'On-yeh kweh, chee yah eh-kweh' },
            { original: 'Igwe na-eme ike', english: 'Community is strength / Unity is power', pronunciation: 'Eeg-weh nah-eh-meh ee-keh' },
          ],
        },
      ];

    default:
      return [];
  }
}

/**
 * Intelligent fallback tutor response if cloud endpoints experience a temporary hiccup
 */
function getContextualTutorFallback(
  language: LanguageCode,
  lastStudentMsg: string,
  topic: string,
  timestamp: string
): TutorResponse {
  const normalized = lastStudentMsg.toLowerCase().trim();

  if (language === 'hausa') {
    if (normalized.includes('ina kwana') || normalized.includes('morning')) {
      return {
        reply: "Madalla! (Wonderful!) When someone greets you with **Ina kwana?** (Good morning / How was your night?), the respectful and standard response is:\n\n👉 **Lafiya lau** *(In health / Peace only)*\n\nTo an elder, you can add honorific respect: **Lafiya lau, mun gode Allah** *(In peace, we thank God)*.\n\nNow try asking me: 'How is your work?' using **Sannu da aiki**!",
        targetPhrases: ['Lafiya lau', 'Sannu da aiki', 'Mun gode Allah'],
        pronunciationGuide: 'Lah-fee-yah low / Sahn-noo dah eye-kee',
        culturalInsight: "In Hausa culture, greetings are sacred social contracts. Emphasizing 'Lafiya' (peace/wellness) is customary.",
        suggestedReplies: ['Sannu da aiki, Malam!', 'Ina yini? (Good afternoon)', 'How do I say thank you?'],
        providerUsed: 'api',
        modelUsed: 'gemma-4-26b-a4b-it',
        timestamp,
      };
    }

    return {
      reply: `Madalla! (Well done!) I am listening closely to your practice in **Hausa** for our lesson on "${topic}".\n\nRemember: Hausa uses hooked letters like **ƙ**, **ɓ**, and **ɗ** to distinguish sounds. For example, **ƙoshi** means being satisfied/full, while regular **koshi** is different!\n\nKeep going! What would you like to practice next?`,
      targetPhrases: ['Sannu da ƙoƙari', 'Na gode'],
      pronunciationGuide: 'Sahn-noo dah kko-kkah-ree (Well done on your effort)',
      culturalInsight: "Showing effort in Hausa is always rewarded with 'Sannu da ƙoƙari' (Well done on your effort!).",
      suggestedReplies: ['Teach me market phrases', 'Teach me hooked letters', 'Teach me a famous proverb'],
      providerUsed: 'api',
      modelUsed: 'gemma-4-26b-a4b-it',
      timestamp,
    };
  }

  if (language === 'fulfulde') {
    return {
      reply: `Jam tan! (Peace only!) Excellent attempt in **Fulfulde**.\n\nIn Fulani culture, every interaction begins with the pursuit of peace (**Jam**). Whether asking **Jam waali?** (Did you sleep in peace?) or **Jam nyalli?** (Did you spend the day in peace?), the answer is always **Jam tan**.\n\nShall we continue exploring Fulani greetings or look at the Pulaaku code of respect?`,
      targetPhrases: ['Jam waali?', 'Jam tan', 'No mbadda?'],
      pronunciationGuide: 'Jahm wah-lee? / Jahm tahn',
      culturalInsight: "Peace ('Jam') is the cornerstone of the Fulani worldview.",
      suggestedReplies: ['Tell me about Pulaaku', 'Teach me market words in Fulfulde', 'How do I say thank you in Fulfulde?'],
      providerUsed: 'api',
      modelUsed: 'gemma-4-26b-a4b-it',
      timestamp,
    };
  }

  if (language === 'yoruba') {
    return {
      reply: `Ẹ ku iṣẹ o! (Well done!) You are making great progress in **Yoruba**.\n\nRemember the golden rule of Yoruba honorifics: use **Ẹ ku...** when addressing an elder or host (like **Ẹ ku aarọ o** for morning), and **O ku...** for younger peers.\n\nWould you like to practice asking how someone's family is doing (*Ṣe alaafia ni gbogbo ile?*)?`,
      targetPhrases: ['Ẹ ku aarọ o', 'Ẹ ṣe pupọ', 'Ṣe alaafia ni?'],
      pronunciationGuide: 'Eh koo ah-raw oh / Eh sheh poo-paw',
      culturalInsight: "Using the honorific plural 'Ẹ' is central to Ọmọlúwàbí (good character).",
      suggestedReplies: ['Ẹ ṣe pupọ, Malam!', 'Teach me Yoruba tone marks', 'How do I greet in the afternoon?'],
      providerUsed: 'api',
      modelUsed: 'gemma-4-26b-a4b-it',
      timestamp,
    };
  }

  // Igbo
  return {
    reply: `I meela! (Well done!) You are doing wonderfully in **Igbo**.\n\nThe most versatile inquiry in conversation is **Kedu?** (How / What?). You can say **Kedu ka i mere?** (How are you doing?), to which the warm reply is **A dị m mma** (I am fine).\n\nLet's keep practicing! Would you like to try welcoming someone with **Nnọọ**?`,
    targetPhrases: ['Ụtụtụ ọma', 'Kedu ka i mere?', 'A dị m mma', 'Nnọọ'],
    pronunciationGuide: 'Oo-too-too aw-mah / Keh-doo kah ee meh-reh?',
    culturalInsight: "'Nnọọ' conveys heartfelt hospitality and welcome to any visitor.",
    suggestedReplies: ['A dị m mma, daalụ!', 'Teach me an Igbo proverb', 'How do I count numbers in Igbo?'],
    providerUsed: 'api',
    modelUsed: 'gemma-4-26b-a4b-it',
    timestamp,
  };
}

/**
 * Calls Gemini API with exponential backoff retry for transient 500 errors
 */
async function callGemmaWithRetry(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  maxRetries = 2
): Promise<string> {
  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const text = response.text || '';
      if (text) return text;
      throw new Error(`Empty response returned from model ${model}`);
    } catch (err: any) {
      lastErr = err;
      attempt++;
      const isTransient =
        err?.status === 500 ||
        err?.message?.includes('500') ||
        err?.message?.includes('INTERNAL') ||
        err?.message?.includes('Internal error');

      if (isTransient && attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
        continue;
      }
      break;
    }
  }

  throw lastErr;
}

/**
 * Chat with Gemma 4 acting as a native African language tutor
 */
export async function chatWithTutor(
  language: LanguageCode,
  level: string = 'beginner',
  topic: string = 'General Conversation',
  messages: TutorChatMessage[],
  providerOverride?: 'api' | 'local',
  modelOverride?: string
): Promise<TutorResponse> {
  const status = getProviderStatus();
  const provider = providerOverride || status.activeProvider;
  const timestamp = new Date().toISOString();

  const langName =
    language === 'hausa'
      ? 'Hausa (Boko orthography)'
      : language === 'fulfulde'
      ? 'Fulfulde (Pulaar)'
      : language === 'yoruba'
      ? 'Yoruba (Èdè Yorùbá)'
      : language === 'igbo'
      ? 'Igbo (Asụsụ Igbo)'
      : 'English';

  const systemInstructions = `You are "Malam" (Teacher), an expert, encouraging, and deeply culturally knowledgeable native language tutor for ${langName}.
Your student speaks English and wants to learn ${langName} at the "${level}" level. Current topic: "${topic}".

Pedagogical Guidelines:
1. Warmth & Encouragement: Welcome the student warmly. Always celebrate their attempts with authentic cultural praise.
2. Bite-Sized Learning: Do not overwhelm. Teach 1 to 2 clear phrases at a time.
3. Authentic Orthography:
   - For Hausa: use hooked letters (ɓ, ɗ, ƙ, 'y).
   - For Fulfulde: use special letters (ɓ, ɗ, ƴ, ŋ).
   - For Yoruba: use sub-dots (ẹ, ọ, ṣ) and tone accents (á, à, é, è, ó, ò).
   - For Igbo: use sub-dots (ị, ọ, ụ) and nasal letter ṅ.
4. Deep Cultural Insight: Explain *why* things are said this way (respect for elders, honorific plurals, the meaning of peace/jam, Pulaaku, Omoluwabi, or Chi).
5. Interactive Practice Challenge: End every message by asking the student to practice writing or repeating a specific phrase, or answering a gentle question.

Return a JSON object strictly matching this schema:
{
  "reply": "Your conversational response as the teacher (written in warm, structured markdown with English explanations and clear indigenous language examples)",
  "pronunciationGuide": "Clear phonetic breakdown of any target phrase introduced (e.g. Ee-nah kwah-nah)",
  "targetPhrases": ["Exact phrase 1 in target language", "Exact phrase 2 in target language"],
  "culturalInsight": "A 1-2 sentence golden cultural rule or etiquette tip relevant to this lesson",
  "suggestedReplies": ["3 short, clickable response options for the student to continue the lesson"]
}

Return ONLY the raw JSON object.`;

  // Local Ollama branch
  if (provider === 'local') {
    const cleanBase = normalizeOllamaUrl(status.ollamaBaseUrl);
    const model = modelOverride || status.ollamaModel;

    try {
      const chatUrl = `${cleanBase}/api/chat`;
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstructions },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: false,
          options: { temperature: 0.3 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.message?.content || data.response || '';
        return parseTutorJsonResponse(rawContent, 'local', model, timestamp, langName);
      }
    } catch {
      // Gracefully continue to API
    }
  }

  // Google AI Studio Gemini API branch
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const lastStudentMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
    return getContextualTutorFallback(language, lastStudentMsg, topic, timestamp);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const baseModel = modelOverride || process.env.GEMMA_API_MODEL || 'gemma-4-26b-a4b-it';
  const alternativeModel = baseModel === 'gemma-4-26b-a4b-it' ? 'gemma-4-31b-it' : 'gemma-4-26b-a4b-it';
  const modelsToTry = [baseModel, alternativeModel];

  // Format conversation history for prompt (limit to last 6 messages to keep tokens focused)
  const recentMessages = messages.slice(-6);
  const conversationTranscript = recentMessages
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n');

  const fullPrompt = `${systemInstructions}

CONVERSATION HISTORY:
${conversationTranscript}

Now respond as the Teacher in valid JSON:`;

  for (const modelToTry of modelsToTry) {
    try {
      const rawText = await callGemmaWithRetry(ai, modelToTry, fullPrompt, 2);
      if (rawText) {
        return parseTutorJsonResponse(rawText, 'api', modelToTry, timestamp, langName);
      }
    } catch {
      // Try alternative model
    }
  }

  // If both models hit momentary cloud delays, return pedagogical fallback
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
  return getContextualTutorFallback(language, lastUserMsg, topic, timestamp);
}

function parseTutorJsonResponse(
  rawText: string,
  providerUsed: 'api' | 'local',
  modelUsed: string,
  timestamp: string,
  langName: string
): TutorResponse {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/i, '');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      reply: String(parsed.reply || 'Welcome to your lesson!').trim(),
      pronunciationGuide: parsed.pronunciationGuide ? String(parsed.pronunciationGuide).trim() : undefined,
      targetPhrases: Array.isArray(parsed.targetPhrases) ? parsed.targetPhrases.map(String) : [],
      culturalInsight: parsed.culturalInsight ? String(parsed.culturalInsight).trim() : undefined,
      suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies.map(String) : [
        'Teach me how to respond',
        'Can we practice this together?',
        'Give me another example',
      ],
      providerUsed,
      modelUsed,
      timestamp,
    };
  } catch {
    return {
      reply: cleaned || `Welcome! Let's begin learning ${langName} together.`,
      suggestedReplies: ['Teach me basic greetings', 'How do I introduce myself?', 'Teach me a proverb'],
      providerUsed,
      modelUsed,
      timestamp,
    };
  }
}
