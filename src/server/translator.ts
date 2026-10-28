import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export type LanguageCode = 'english' | 'hausa' | 'fulfulde' | 'yoruba' | 'igbo';
export type TargetLanguage = LanguageCode; // Backwards compatibility

export interface RegionalVariant {
  dialect: string;
  phrase: string;
  note: string;
}

export interface VocabularyItem {
  english: string;
  hausa: string; // Used for translation word across target languages
  note?: string;
}

export interface TranslationResult {
  originalText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  translatedText: string;
  hausaTranslation: string; // Keeps backward compatibility with existing components
  pronunciationGuide: string;
  toneAndRegister: string;
  regionalVariants: RegionalVariant[];
  culturalNotes: string;
  vocabulary: VocabularyItem[];
  providerUsed: 'api' | 'local';
  modelUsed: string;
  timestamp: string;
  latencyMs?: number;
}

export interface DualComparisonItem {
  language: LanguageCode;
  languageLabel: string;
  flag: string;
  translatedText: string;
  pronunciationGuide: string;
  culturalNotes: string;
  regionalVariants: RegionalVariant[];
}

export interface DualComparisonResult {
  originalText: string;
  sourceLanguage: LanguageCode;
  comparisons: DualComparisonItem[];
  vocabulary: VocabularyItem[];
  providerUsed: 'api' | 'local';
  modelUsed: string;
  timestamp: string;
  latencyMs?: number;
}

export interface TranslateOptions {
  provider?: 'api' | 'local';
  model?: string;
  sourceLanguage?: LanguageCode;
  targetLanguage?: LanguageCode;
  tonePreference?: string;
  targetAudience?: string;
}

export interface ProviderStatus {
  activeProvider: 'api' | 'local';
  apiModel: string;
  availableApiModels: string[];
  isApiKeyConfigured: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

/**
 * Normalizes and validates the Ollama Base URL
 */
export function normalizeOllamaUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'http://localhost:11434';
  }
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed === 'OLLAMA_BASE_URL' ||
    trimmed === 'MY_OLLAMA_BASE_URL' ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return 'http://localhost:11434';
  }
  let withProto = trimmed;
  if (!withProto.startsWith('http://') && !withProto.startsWith('https://')) {
    withProto = `http://${withProto}`;
  }
  try {
    const parsed = new URL(withProto);
    return parsed.origin;
  } catch {
    return 'http://localhost:11434';
  }
}

export function getProviderStatus(): ProviderStatus {
  const activeProvider = (process.env.PROVIDER?.toLowerCase() === 'local' ? 'local' : 'api') as 'api' | 'local';
  const apiModel = process.env.GEMMA_API_MODEL || 'gemini-3.8-flash';
  return {
    activeProvider,
    apiModel,
    availableApiModels: ['gemini-3.8-flash', 'gemma-4-26b-a4b-it', 'gemma-4-31b-it'],
    isApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    ollamaBaseUrl: normalizeOllamaUrl(process.env.OLLAMA_BASE_URL),
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:e2b',
  };
}

export function getLanguageName(code: LanguageCode): string {
  switch (code) {
    case 'hausa':
      return 'Latin-script Hausa (Boko)';
    case 'fulfulde':
      return 'Latin-script Fulfulde (Fula / Fulani / Pulaar)';
    case 'yoruba':
      return 'Standard Yoruba (Èdè Yorùbá)';
    case 'igbo':
      return 'Standard Igbo (Asụsụ Igbo)';
    case 'english':
    default:
      return 'English';
  }
}

export function getLanguageFlag(code: LanguageCode): string {
  switch (code) {
    case 'hausa':
      return '🇳🇬';
    case 'fulfulde':
      return '🌍';
    case 'yoruba':
      return '🇳🇬';
    case 'igbo':
      return '🇳🇬';
    case 'english':
    default:
      return '🇬🇧';
  }
}

/**
 * Builds a clear, bidirectional translation prompt for Gemma 4.
 */
function buildTranslationPrompt(
  text: string,
  sourceLanguage: LanguageCode = 'english',
  targetLanguage: LanguageCode = 'hausa',
  tonePreference?: string,
  targetAudience?: string
): string {
  const srcName = getLanguageName(sourceLanguage);
  const tgtName = getLanguageName(targetLanguage);

  let specificGuidance = '';
  if (targetLanguage === 'hausa') {
    specificGuidance = `
- Ensure standard Boko Hausa orthography using hooked letters (ɓ, ɗ, ƙ, 'y).
- If the text has an English idiom/saying, provide conversational Hausa and the authentic Hausa proverb (karin magana).
- Include regional variants (e.g. Kano Eastern Standard vs Sokoto Western).`;
  } else if (targetLanguage === 'fulfulde') {
    specificGuidance = `
- Ensure grammatically correct Latin-script Fulfulde using special letters (ɓ, ɗ, ƴ, ŋ).
- Respect Fulani cultural etiquette and values (Pulaaku: respect, modesty, peace/jam).
- Include regional dialect variants (e.g. Adamawa, Fouta Djallon, Pulaar).`;
  } else if (targetLanguage === 'yoruba') {
    specificGuidance = `
- Use standard Yoruba orthography with accurate sub-dots (ẹ, ọ, ṣ) and tonal accent marks (acute á, grave à).
- Reflect Yoruba cultural etiquette (Ọmọlúwàbí values, respect honorifics like 'Ẹ ku...' for elders/hosts).
- Include regional variants (e.g. Standard Oyo vs Ekiti/Lagos).`;
  } else if (targetLanguage === 'igbo') {
    specificGuidance = `
- Use standard Igbo orthography with proper sub-dots (ị, ọ, ụ) and nasal letter ṅ.
- Reflect Igbo cultural concepts (e.g. Onye kwe chi ya ekwe, respect, hospitality greetings like Nnọọ, Ụtụtụ ọma).
- Include regional dialect notes (e.g. Central/Standard Igbo vs Owerri/Onitsha).`;
  } else if (targetLanguage === 'english') {
    specificGuidance = `
- Translate accurately into fluent, natural English.
- If the source phrase contains a cultural greeting, idiom, proverb, or religious invocation (e.g. addu'a, Pulaaku, Ọmọlúwàbí, Chi), explain both the literal meaning and cultural significance in "culturalNotes".
- Provide phonetic pronunciation assistance for the source phrase in "pronunciationGuide".`;
  }

  return `You are an expert bilingual linguist specializing in Nigerian and West African languages.
Translate the following ${srcName} input into natural, fluent ${tgtName}.

INPUT (${srcName}):
"${text}"

${tonePreference ? `Tone Preference: ${tonePreference}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Instructions:
1. Translate faithfully into ${tgtName}.${specificGuidance}
2. Return a JSON object strictly matching these keys:
- "translatedText": string (the primary translation in ${tgtName})
- "pronunciationGuide": string (phonetic pronunciation guide or tonal melody)
- "toneAndRegister": string (e.g. Respectful, Casual, Formal, Proverbial)
- "regionalVariants": array of objects [{ "dialect": string, "phrase": string, "note": string }]
- "culturalNotes": string (cultural etiquette, context, or idiomatic meaning)
- "vocabulary": array of objects [{ "english": string, "hausa": string, "note": string }] (mapping translated terms to original words)

Return ONLY the raw JSON object.`;
}

/**
 * Flexible parser that extracts JSON safely and normalizes any variations
 */
function parseModelJsonResponse(
  rawText: string,
  originalText: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Omit<TranslationResult, 'providerUsed' | 'modelUsed' | 'timestamp'> {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/i, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    const translationText = String(
      parsed.translatedText ||
      parsed.hausaTranslation ||
      parsed.yorubaTranslation ||
      parsed.igboTranslation ||
      parsed.englishTranslation ||
      parsed.fulfuldeTranslation ||
      ''
    ).trim() || 'Translation';

    // Normalize regionalVariants
    let regionalVariants: RegionalVariant[] = [];
    if (Array.isArray(parsed.regionalVariants)) {
      regionalVariants = parsed.regionalVariants.map((item: any) => ({
        dialect: String(item.dialect || 'Regional Variant'),
        phrase: String(item.phrase || item.text || ''),
        note: String(item.note || item.description || ''),
      }));
    } else if (typeof parsed.regionalVariants === 'string' && parsed.regionalVariants.trim()) {
      regionalVariants = [
        {
          dialect: 'Regional Variation',
          phrase: translationText,
          note: parsed.regionalVariants.trim(),
        },
      ];
    } else if (parsed.regionalVariants && typeof parsed.regionalVariants === 'object') {
      regionalVariants = Object.entries(parsed.regionalVariants).map(([dialect, val]) => ({
        dialect,
        phrase: typeof val === 'string' ? val : String((val as any).phrase || ''),
        note: typeof val === 'object' ? String((val as any).note || '') : '',
      }));
    }

    // Normalize culturalNotes
    let culturalNotesStr = '';
    if (typeof parsed.culturalNotes === 'string') {
      culturalNotesStr = parsed.culturalNotes.trim();
    } else if (parsed.culturalNotes && typeof parsed.culturalNotes === 'object') {
      culturalNotesStr = Object.entries(parsed.culturalNotes)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('. ');
    }

    // Normalize vocabulary
    let vocabulary: VocabularyItem[] = [];
    if (Array.isArray(parsed.vocabulary)) {
      vocabulary = parsed.vocabulary.map((item: any) => ({
        english: String(item.english || item.word || ''),
        hausa: String(item.hausa || item.translation || item.yoruba || item.igbo || item.fulfulde || item.original || ''),
        note: item.note ? String(item.note) : undefined,
      }));
    } else if (parsed.vocabulary && typeof parsed.vocabulary === 'object') {
      vocabulary = Object.entries(parsed.vocabulary).map(([k, v]) => ({
        english: k,
        hausa: typeof v === 'string' ? v : String((v as any).hausa || (v as any).translation || ''),
        note: typeof v === 'object' ? (v as any).note : undefined,
      }));
    }

    return {
      originalText,
      sourceLanguage,
      targetLanguage,
      hausaTranslation: translationText,
      translatedText: translationText,
      pronunciationGuide: String(parsed.pronunciationGuide || 'Standard pronunciation.').trim(),
      toneAndRegister: String(parsed.toneAndRegister || 'Respectful / Natural').trim(),
      regionalVariants,
      culturalNotes: culturalNotesStr,
      vocabulary,
    };
  } catch {
    const lines = cleaned.split('\n').filter(Boolean);
    const textLine = lines.find((l) => l.length > 3) || cleaned;

    return {
      originalText,
      sourceLanguage,
      targetLanguage,
      hausaTranslation: textLine.replace(/^[#*-]\s*/, '').trim(),
      translatedText: textLine.replace(/^[#*-]\s*/, '').trim(),
      pronunciationGuide: 'Standard pronunciation guidance.',
      toneAndRegister: 'Natural / Standard',
      regionalVariants: [],
      culturalNotes: cleaned.length > 80 ? cleaned.slice(0, 300) : 'Accurate translation with cultural context.',
      vocabulary: [],
    };
  }
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
          temperature: 0.2,
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
 * Executes translation via Google AI Studio / Gemini API using Gemma 4.
 */
async function translateWithGeminiApi(
  text: string,
  sourceLanguage: LanguageCode = 'english',
  targetLanguage: LanguageCode = 'hausa',
  preferredModel?: string,
  tonePreference?: string,
  targetAudience?: string
): Promise<{ result: Omit<TranslationResult, 'providerUsed' | 'modelUsed' | 'timestamp'>; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment, or switch to PROVIDER=local to use Ollama.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = buildTranslationPrompt(text, sourceLanguage, targetLanguage, tonePreference, targetAudience);

  const baseModel = preferredModel || process.env.GEMMA_API_MODEL || 'gemini-3.8-flash';
  const alternativeModel = baseModel === 'gemini-3.8-flash' ? 'gemma-4-26b-a4b-it' : 'gemini-3.8-flash';
  const modelsToTry = [baseModel, alternativeModel];

  let lastError: any = null;

  for (const modelToTry of modelsToTry) {
    try {
      const rawText = await callGemmaWithRetry(ai, modelToTry, prompt, 2);
      return {
        result: parseModelJsonResponse(rawText, text, sourceLanguage, targetLanguage),
        modelUsed: modelToTry,
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  const errorMsg = lastError?.message || 'Internal service error';
  throw new Error(
    `Google AI Studio Gemma 4 is momentarily unavailable (${errorMsg}). Please retry or switch to local Ollama.`
  );
}

/**
 * Executes translation via local Ollama instance (default: gemma4:e2b)
 */
async function translateWithOllama(
  text: string,
  baseUrl: string,
  modelName: string,
  sourceLanguage: LanguageCode = 'english',
  targetLanguage: LanguageCode = 'hausa',
  tonePreference?: string,
  targetAudience?: string
): Promise<{ result: Omit<TranslationResult, 'providerUsed' | 'modelUsed' | 'timestamp'>; modelUsed: string }> {
  const prompt = buildTranslationPrompt(text, sourceLanguage, targetLanguage, tonePreference, targetAudience);
  const cleanBase = normalizeOllamaUrl(baseUrl);

  let rawResponseText = '';

  try {
    const chatUrl = `${cleanBase}/api/chat`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: `You are an expert ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)} translator. Output strictly valid JSON.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
          options: {
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        rawResponseText = data.message?.content || data.response || '';
      } else {
        const generateUrl = `${cleanBase}/api/generate`;
        const genResponse = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt,
            stream: false,
            options: {
              temperature: 0.2,
            },
          }),
        });

        if (!genResponse.ok) {
          throw new Error(`Ollama returned status ${genResponse.status}: ${await genResponse.text()}`);
        }
        const data = await genResponse.json();
        rawResponseText = data.response || '';
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: any) {
    const isAbort = err.name === 'AbortError';
    throw new Error(
      `Could not reach local Ollama at ${cleanBase}${isAbort ? ' (Connection timed out after 6s)' : ''}. ` +
      `Ensure Ollama is running on your machine ('ollama serve' and 'ollama run ${modelName}'), ` +
      `or switch the provider toggle to 'API' to use Google AI Studio in the cloud.`
    );
  }

  if (!rawResponseText) {
    throw new Error(`Received empty translation output from Ollama model ${modelName}.`);
  }

  return {
    result: parseModelJsonResponse(rawResponseText, text, sourceLanguage, targetLanguage),
    modelUsed: modelName,
  };
}

/**
 * Unified translation function
 */
export async function translateToHausa(
  text: string,
  options?: TranslateOptions
): Promise<TranslationResult> {
  const startTime = Date.now();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Please provide text to translate.');
  }

  const status = getProviderStatus();
  const provider = options?.provider || status.activeProvider;
  const sourceLanguage = options?.sourceLanguage || 'english';
  const targetLanguage = options?.targetLanguage || 'hausa';
  const timestamp = new Date().toISOString();

  if (provider === 'local') {
    const model = options?.model || status.ollamaModel;
    const { result, modelUsed } = await translateWithOllama(
      trimmed,
      status.ollamaBaseUrl,
      model,
      sourceLanguage,
      targetLanguage,
      options?.tonePreference,
      options?.targetAudience
    );
    return {
      ...result,
      providerUsed: 'local',
      modelUsed,
      timestamp,
      latencyMs: Date.now() - startTime,
    };
  }

  const requestedModel = options?.model || status.apiModel;
  const { result, modelUsed } = await translateWithGeminiApi(
    trimmed,
    sourceLanguage,
    targetLanguage,
    requestedModel,
    options?.tonePreference,
    options?.targetAudience
  );

  return {
    ...result,
    providerUsed: 'api',
    modelUsed,
    timestamp,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Dual / Multi-language comparison translation
 * Translates one English phrase into multiple target African languages simultaneously.
 */
export async function compareLanguages(
  text: string,
  sourceLanguage: LanguageCode = 'english',
  targetLanguages: LanguageCode[] = ['hausa', 'fulfulde', 'yoruba', 'igbo'],
  options?: TranslateOptions
): Promise<DualComparisonResult> {
  const startTime = Date.now();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Please provide text to compare.');
  }

  const status = getProviderStatus();
  const timestamp = new Date().toISOString();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Fallback: translate sequentially
    const comparisons: DualComparisonItem[] = [];
    for (const lang of targetLanguages) {
      const res = await translateToHausa(trimmed, {
        ...options,
        sourceLanguage,
        targetLanguage: lang,
      });
      comparisons.push({
        language: lang,
        languageLabel: getLanguageName(lang),
        flag: getLanguageFlag(lang),
        translatedText: res.translatedText,
        pronunciationGuide: res.pronunciationGuide,
        culturalNotes: res.culturalNotes,
        regionalVariants: res.regionalVariants,
      });
    }
    return {
      originalText: trimmed,
      sourceLanguage,
      comparisons,
      vocabulary: [],
      providerUsed: options?.provider || status.activeProvider,
      modelUsed: status.apiModel,
      timestamp,
      latencyMs: Date.now() - startTime,
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });

  const prompt = `Translate this English text into ${targetLanguages.map(getLanguageName).join(' AND ')} simultaneously.
INPUT: "${trimmed}"

Return a JSON object with:
{
  "comparisons": [
    ${targetLanguages.map(lang => `{
      "language": "${lang}",
      "translatedText": "Translation in ${getLanguageName(lang)}",
      "pronunciationGuide": "Phonetic guide",
      "culturalNotes": "Cultural context & etiquette notes",
      "regionalVariants": [{ "dialect": "Region", "phrase": "Variant", "note": "Note" }]
    }`).join(',\n')}
  ],
  "vocabulary": [
    { "english": "key word", "hausa": "Hausa/Yoruba/Igbo/Fulfulde equivalent", "note": "meaning" }
  ]
}

Return ONLY valid JSON.`;

  const modelToUse = options?.model || status.apiModel;
  let rawText = '';

  try {
    rawText = await callGemmaWithRetry(ai, modelToUse, prompt, 2);
  } catch {
    // If structured multi-call fails, fall back to sequential translation
    const comparisons: DualComparisonItem[] = [];
    for (const lang of targetLanguages) {
      const res = await translateToHausa(trimmed, {
        ...options,
        sourceLanguage,
        targetLanguage: lang,
      });
      comparisons.push({
        language: lang,
        languageLabel: getLanguageName(lang),
        flag: getLanguageFlag(lang),
        translatedText: res.translatedText,
        pronunciationGuide: res.pronunciationGuide,
        culturalNotes: res.culturalNotes,
        regionalVariants: res.regionalVariants,
      });
    }
    return {
      originalText: trimmed,
      sourceLanguage,
      comparisons,
      vocabulary: [],
      providerUsed: 'api',
      modelUsed: modelToUse,
      timestamp,
      latencyMs: Date.now() - startTime,
    };
  }

  // Clean JSON
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/i, '');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.substring(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(cleaned);
    const comparisons: DualComparisonItem[] = Array.isArray(parsed.comparisons)
      ? parsed.comparisons.map((c: any) => ({
          language: (c.language || 'hausa') as LanguageCode,
          languageLabel: getLanguageName(c.language || 'hausa'),
          flag: getLanguageFlag(c.language || 'hausa'),
          translatedText: String(c.translatedText || '').trim(),
          pronunciationGuide: String(c.pronunciationGuide || '').trim(),
          culturalNotes: String(c.culturalNotes || '').trim(),
          regionalVariants: Array.isArray(c.regionalVariants) ? c.regionalVariants : [],
        }))
      : [];

    return {
      originalText: trimmed,
      sourceLanguage,
      comparisons: comparisons.length > 0 ? comparisons : targetLanguages.map(lang => ({
        language: lang,
        languageLabel: getLanguageName(lang),
        flag: getLanguageFlag(lang),
        translatedText: 'Translation',
        pronunciationGuide: '',
        culturalNotes: '',
        regionalVariants: [],
      })),
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      providerUsed: 'api',
      modelUsed: modelToUse,
      timestamp,
      latencyMs: Date.now() - startTime,
    };
  } catch {
    // If parse fails, run sequential
    const comparisons: DualComparisonItem[] = [];
    for (const lang of targetLanguages) {
      const res = await translateToHausa(trimmed, { ...options, sourceLanguage, targetLanguage: lang });
      comparisons.push({
        language: lang,
        languageLabel: getLanguageName(lang),
        flag: getLanguageFlag(lang),
        translatedText: res.translatedText,
        pronunciationGuide: res.pronunciationGuide,
        culturalNotes: res.culturalNotes,
        regionalVariants: res.regionalVariants,
      });
    }
    return {
      originalText: trimmed,
      sourceLanguage,
      comparisons,
      vocabulary: [],
      providerUsed: 'api',
      modelUsed: modelToUse,
      timestamp,
      latencyMs: Date.now() - startTime,
    };
  }
}
