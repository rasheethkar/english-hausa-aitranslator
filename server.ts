import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { translateToHausa, compareLanguages, getProviderStatus, LanguageCode } from './src/server/translator.ts';
import { getCurriculum, chatWithTutor } from './src/server/tutor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Status & Configuration Endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  try {
    const status = getProviderStatus();
    res.json({
      success: true,
      status,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Curated realistic samples for language learners & communicators
app.get('/api/samples', (req: Request, res: Response) => {
  const source = (req.query.source as string) || (req.query.lang as string) || 'english';
  const target = (req.query.target as string) || 'hausa';

  // If source is Hausa
  if (source === 'hausa') {
    return res.json({
      success: true,
      source: 'hausa',
      target,
      samples: [
        {
          category: 'Greeting & Family Well-being',
          title: 'Morning greeting (Ina kwana)',
          text: 'Ina kwana! Kwananku ya yi kyau? Da fatan ku da dukkan iyalanku kuna cikin ƙoshin lafiya.',
          tone: 'Respectful & Warm',
          audience: 'Elder / Host Family',
        },
        {
          category: 'Traditional Proverb (Karin Magana)',
          title: 'Chickens before hatching proverb',
          text: "Ba a kirga 'ya'yan kaza kafin a kyankyasa. Ka yi hakuri komai zai zo da sauki.",
          tone: 'Proverbial / Wise',
          audience: 'General / Storytelling',
        },
        {
          category: 'Heartfelt Hospitality & Prayer',
          title: 'Thanking host for warm hospitality',
          text: 'Nagode ƙwarai da kyakkyawar karramawar da kuka yi mini. Allah ya saka da alheri, ya albarkaci gidanku.',
          tone: 'Honorific & Grateful',
          audience: 'Host / Community',
        },
        {
          category: 'Market & Colloquial Expression',
          title: 'Market meeting & bargaining',
          text: 'Sannu da aiki! Ya kokari da kasuwa yau? Ina so in sayi hatsi da kayan miya masu kyau.',
          tone: 'Casual & Friendly',
          audience: 'Colleague / Market Vendor',
        },
      ],
    });
  }

  // If source is Fulfulde
  if (source === 'fulfulde') {
    return res.json({
      success: true,
      source: 'fulfulde',
      target,
      samples: [
        {
          category: 'Morning Peace (Jam)',
          title: 'Traditional peace greeting',
          text: 'Jam waali! No mbadda? Miɗo yiɗi a e ɓe mawnɓe ma e weltal. Allah ɓeydu en jam.',
          tone: 'Respectful & Traditional',
          audience: 'Community / Elders',
        },
        {
          category: 'Pulaaku Wisdom Proverb',
          title: 'Patience & contentment proverb',
          text: 'Ko heɓaaka hande, heɓoto jaŋgo. Munyal woni kure mawninde nguurndam.',
          tone: 'Proverbial / Wise',
          audience: 'General / Storytelling',
        },
        {
          category: 'Warm Hospitality Blessing',
          title: 'Guest gratitude & prayer',
          text: 'On jaaraama fota e jaɓɓungal mooɗon. Allah yaafi baaba e yaaya, yaafano en.',
          tone: 'Honorific & Grateful',
          audience: 'Host Family',
        },
      ],
    });
  }

  // If source is Yoruba
  if (source === 'yoruba') {
    return res.json({
      success: true,
      source: 'yoruba',
      target,
      samples: [
        {
          category: 'Respectful Morning Greeting',
          title: 'Morning greeting to an elder (Ẹ ku aarọ)',
          text: 'Ẹ ku aarọ o! Ṣe alaafia ni ẹ ji? Mo nireti pe gbogbo ara ile wa ninu alaafia ati idunnu.',
          tone: 'Respectful & Honorific',
          audience: 'Elder / Parents',
        },
        {
          category: 'Ọmọlúwàbí Proverb',
          title: 'Good character proverb (Iwa)',
          text: 'Iwa rere lẹṣọ eniyan. Owo le tán, ṣugbọn orukọ rere kii parẹ laelae.',
          tone: 'Proverbial / Wise',
          audience: 'General / Youth',
        },
        {
          category: 'Gratitude & Hospitality',
          title: 'Thanking a host for generous feast',
          text: 'Ẹ ṣe pupọ fun alejò to dara ati ounjẹ aladun yi. Ọlọrun a bùkún fun ile yin ati apo yin.',
          tone: 'Honorific & Warm',
          audience: 'Host Family',
        },
      ],
    });
  }

  // If source is Igbo
  if (source === 'igbo') {
    return res.json({
      success: true,
      source: 'igbo',
      target,
      samples: [
        {
          category: 'Respectful Morning Greeting',
          title: 'Morning greeting (Ụtụtụ ọma)',
          text: 'Ụtụtụ ọma! Kedu ka i mere? Enwere m olileanya na gị na ezinụlọ gị nọ n\'ezigbo ahụike.',
          tone: 'Respectful & Warm',
          audience: 'Elder / Host Family',
        },
        {
          category: 'Igbo Worldview Proverb (Ilu Igbo)',
          title: 'Perseverance proverb (Onye kwe)',
          text: 'Onye kwe, chi ya ekwe. Ọ bụrụ na mmadụ adaghị mbà, ihe ọma ga-emecha rute ya.',
          tone: 'Proverbial / Inspirational',
          audience: 'General / Youth',
        },
        {
          category: 'Heartfelt Hospitality',
          title: 'Warm hospitality gratitude',
          text: 'Daalụ nke ukwuu maka ile ọbịa ọma na nri a dị ụtọ. Chineke gọzie ezinụlọ gị.',
          tone: 'Honorific & Grateful',
          audience: 'Host / Community',
        },
      ],
    });
  }

  // Source is English
  res.json({
    success: true,
    source: 'english',
    target,
    samples: [
      {
        category: 'Proverb & Idiom',
        title: "Don't count chickens before they hatch",
        text: "Don't count your chickens before they hatch. Be patient and wait until everything is certain.",
        tone: 'Proverbial / Wise',
        audience: 'General / Storytelling',
      },
      {
        category: 'Daily Greeting & Etiquette',
        title: 'Morning greeting to a host',
        text: 'Good morning! How did you sleep? I hope you and your family are in good health.',
        tone: 'Respectful & Polite',
        audience: 'Elder or Host',
      },
      {
        category: 'Customer Support',
        title: 'Service delay apology',
        text: 'We sincerely apologize for the delay. We are working hard to resolve your issue right away.',
        tone: 'Professional & Empathetic',
        audience: 'Customer Support',
      },
      {
        category: 'Market & Everyday Colloquial',
        title: 'Meeting at the market',
        text: "Are you free this afternoon? Let's meet at the market to pick up fresh food and spices.",
        tone: 'Casual & Friendly',
        audience: 'Friend / Colleague',
      },
      {
        category: 'Warm Hospitality',
        title: 'Thanking host for warm meal',
        text: 'Thank you very much for your warm hospitality and delicious meal. May God bless your home.',
        tone: 'Honorific & Grateful',
        audience: 'Community / Host Family',
      },
    ],
  });
});

// Cultural Quiz Endpoint
app.get('/api/quiz', (_req: Request, res: Response) => {
  res.json({
    success: true,
    questions: [
      {
        id: 'q1',
        language: 'hausa',
        question: "In Hausa morning greetings, why is 'Ina kwana' followed by questions about family well-being ('lafiya')?",
        options: [
          "It is culturally expected to acknowledge the overnight transition and inquire about holistic health (peace & body).",
          "It is a legal requirement in traditional Hausa courts.",
          "It is only used when buying goods at the market.",
          "It indicates that breakfast is ready."
        ],
        correctIndex: 0,
        explanation: "'Ina kwana' literally means 'How did you spend the night?' In Hausa culture, greetings are sacred social rituals where 'lafiya' (peace/well-being) is always invoked."
      },
      {
        id: 'q2',
        language: 'hausa',
        question: "Which hooked Boko letter is found in the word for health/stoutness ('ƙoshin lafiya')?",
        options: [
          "ɓ (implosive b)",
          "ƙ (ejective popping k)",
          "ɗ (implosive d)",
          "'y (glottalized y)"
        ],
        correctIndex: 1,
        explanation: "'ƙ' is the ejective popping consonant produced at the back of the throat, as in 'ƙoshin lafiya'."
      },
      {
        id: 'q3',
        language: 'fulfulde',
        question: "What is the standard, polite response when a Fulani person asks you 'Jam waali?' (Did you sleep in peace)?",
        options: [
          "Jam tan (Peace only)",
          "Sannu (Hello)",
          "Aarọ (Morning)",
          "Ndoo (Sit down)"
        ],
        correctIndex: 0,
        explanation: "In Fulfulde, 'Jam' means peace/wellness. When asked 'Jam waali?', the expected traditional reply is 'Jam tan' (Peace only)."
      },
      {
        id: 'q4',
        language: 'yoruba',
        question: "In Yoruba culture, why do we use 'Ẹ ku aarọ' instead of 'O ku aarọ' when greeting an elder?",
        options: [
          "The prefix 'Ẹ' is an honorific plural demonstrating deep respect (Ọmọlúwàbí etiquette).",
          "It is only spoken on Fridays.",
          "It means good afternoon instead of good morning.",
          "It signifies that two people are greeting each other at once."
        ],
        correctIndex: 0,
        explanation: "Yoruba uses the honorific plural pronoun 'Ẹ' when addressing parents, elders, or guests to show respect, in accordance with the Ọmọlúwàbí moral code."
      },
      {
        id: 'q5',
        language: 'igbo',
        question: "What does the famous Igbo proverb 'Onye kwe, chi ya ekwe' teach?",
        options: [
          "When a person says yes to determination, their personal spirit (chi) affirms it.",
          "Chickens should be counted before hatching.",
          "Always sleep early before sunrise.",
          "Market prices never change."
        ],
        correctIndex: 0,
        explanation: "'Onye kwe, chi ya ekwe' is a core pillar of Igbo philosophy emphasizing human agency, self-belief, and perseverance."
      }
    ]
  });
});

// Main Translation Endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, provider, model, sourceLanguage, targetLanguage, tonePreference, targetAudience } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid text to translate.',
      });
    }

    const result = await translateToHausa(text, {
      provider,
      model,
      sourceLanguage: (sourceLanguage || 'english') as LanguageCode,
      targetLanguage: (targetLanguage || 'hausa') as LanguageCode,
      tonePreference,
      targetAudience,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during translation.',
    });
  }
});

// Dual / Multi-Comparison Endpoint
app.post('/api/compare', async (req: Request, res: Response) => {
  try {
    const { text, provider, model, sourceLanguage, targetLanguages, tonePreference, targetAudience } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid text to compare.',
      });
    }

    const result = await compareLanguages(
      text,
      (sourceLanguage || 'english') as LanguageCode,
      Array.isArray(targetLanguages) && targetLanguages.length > 0 ? targetLanguages : ['hausa', 'fulfulde', 'yoruba', 'igbo'],
      {
        provider,
        model,
        tonePreference,
        targetAudience,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during comparison.',
    });
  }
});

// AI Tutor Curriculum Endpoint
app.get('/api/tutor/curriculum', (req: Request, res: Response) => {
  const lang = (req.query.lang as LanguageCode) || 'hausa';
  const modules = getCurriculum(lang);
  res.json({
    success: true,
    language: lang,
    modules,
  });
});

// AI Tutor Chat Session Endpoint
app.post('/api/tutor/chat', async (req: Request, res: Response) => {
  try {
    const { language, level, topic, messages, provider, model } = req.body;

    if (!language || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Language and conversation messages are required.',
      });
    }

    const response = await chatWithTutor(
      language,
      level || 'beginner',
      topic || 'General Conversation',
      messages,
      provider,
      model
    );

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Tutor error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Tutor session failed.',
    });
  }
});

// Setup frontend serving
async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware with HMR disabled to avoid iframe WebSocket errors
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const status = getProviderStatus();
    console.log(`=======================================================`);
    console.log(`  GemmaTranslate Server running on port ${PORT}`);
    console.log(`  Active Provider : ${status.activeProvider.toUpperCase()}`);
    console.log(`  API Model       : ${status.apiModel}`);
    console.log(`  Ollama Model    : ${status.ollamaModel} (${status.ollamaBaseUrl})`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
