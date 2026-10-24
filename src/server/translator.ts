import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export interface RegionalVariant {
  dialect: string; // e.g. "Kano (Standard/Eastern)", "Sokoto (Western)", "Zaria"
  phrase: string;
  note: string;
}

export interface VocabularyItem {
  english: string;
  hausa: string;
  note?: string;
}

export interface TranslationResult {
  originalText: string;
  hausaTranslation: string;
  pronunciationGuide: string;
  toneAndRegister: string;
  regionalVariants: RegionalVariant[];
  culturalNotes: string;
  vocabulary: VocabularyItem[];
  providerUsed: 'api' | 'local';
  modelUsed: string;
  timestamp: string;
}

export interface TranslateOptions {
  provider?: 'api' | 'local';
  tonePreference?: string;
  targetAudience?: string;
}

export interface ProviderStatus {
  activeProvider: 'api' | 'local';
  apiModel: string;
  isApiKeyConfigured: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export function getProviderStatus(): ProviderStatus {
  const activeProvider = (process.env.PROVIDER?.toLowerCase() === 'local' ? 'local' : 'api') as 'api' | 'local';
  return {
    activeProvider,
    apiModel: process.env.GEMMA_API_MODEL || 'gemma-4-31b-it',
    isApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:e2b',
  };
}

/**
 * Builds the prompt instructions for Gemma 4.
 * Both Google AI Studio and Ollama use this exact same prompt pipeline.
 */
function buildTranslationPrompt(text: string, tonePreference?: string, targetAudience?: string): string {
  return `You are an expert linguist and native Hausa translator specializing in Latin-script Hausa (Boko).
Translate the following English text into natural-sounding, culturally appropriate, grammatically correct Hausa.

ENGLISH INPUT:
"${text}"

${tonePreference ? `Tone Preference: ${tonePreference}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

TRANSLATION INSTRUCTIONS:
1. Translate into standard Latin-script Hausa (Boko), using proper hooked letters where needed: ɓ, ɗ, ƙ, and 'y.
2. If the phrase contains an English idiom or proverb, provide both a natural conversational translation AND the authentic Hausa equivalent idiom or cultural expression.
3. Provide regional alternatives (such as Kano/Eastern standard vs. Sokoto/Western variants).
4. Explain any cultural nuances, social etiquette (e.g. respect for elders, gender distinction ka/ki), or context notes.
5. Provide a short vocabulary list for key terms.

Output MUST be a valid JSON object strictly matching this schema:
{
  "hausaTranslation": "Standard Boko Hausa translation",
  "pronunciationGuide": "Phonetic pronunciation tips and tone cues",
  "toneAndRegister": "Tone description (e.g. Respectful, Casual, Friendly, Formal)",
  "regionalVariants": [
    {
      "dialect": "Kano (Standard / Eastern)",
      "phrase": "Regional phrasing",
      "note": "When or where this is commonly used"
    },
    {
      "dialect": "Sokoto (Western)",
      "phrase": "Western regional variant",
      "note": "Western Hausa nuance"
    }
  ],
  "culturalNotes": "Clear context notes explaining nuances, etiquette, or idiomatic equivalents",
  "vocabulary": [
    {
      "english": "word or phrase",
      "hausa": "Hausa translation",
      "note": "brief grammar or meaning hint"
    }
  ]
}

Return ONLY the raw JSON object. Do not enclose in markdown code fences if possible, or use standard \`\`\`json.`;
}

/**
 * Helper to clean and parse JSON from model responses
 */
function parseModelJsonResponse(rawText: string, originalText: string): Omit<TranslationResult, 'providerUsed' | 'modelUsed' | 'timestamp'> {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/i, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      originalText,
      hausaTranslation: String(parsed.hausaTranslation || '').trim() || 'Fassarar Hausa',
      pronunciationGuide: String(parsed.pronunciationGuide || 'Karanta a hankali daidai da haruffan Boko.').trim(),
      toneAndRegister: String(parsed.toneAndRegister || 'Na Yau da Kullum (Natural / Standard)').trim(),
      regionalVariants: Array.isArray(parsed.regionalVariants) ? parsed.regionalVariants : [],
      culturalNotes: String(parsed.culturalNotes || '').trim(),
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
    };
  } catch {
    // Graceful fallback parser if model output was freeform text
    const lines = cleaned.split('\n').filter(Boolean);
    const hausaLine = lines.find((l) => !l.toLowerCase().includes('english') && l.length > 5) || cleaned;

    return {
      originalText,
      hausaTranslation: hausaLine.replace(/^[#*-]\s*/, '').trim(),
      pronunciationGuide: 'Kula da haruffan Boko masu lankwasa: ɓ, ɗ, ƙ, da \'y.',
      toneAndRegister: 'Daidaitacciyar Hausa (Standard Hausa)',
      regionalVariants: [
        {
          dialect: 'Kano (Eastern Standard)',
          phrase: hausaLine.trim(),
          note: 'Daidaitacciyar fassara don tattaunawa.',
        },
      ],
      culturalNotes: cleaned.length > 100 ? cleaned.slice(0, 300) : 'Fassara ta musamman da la\'akari da al\'ada.',
      vocabulary: [],
    };
  }
}

/**
 * Executes translation via Google AI Studio / Gemini API using Gemma 4
 */
async function translateWithGeminiApi(
  text: string,
  modelName: string,
  tonePreference?: string,
  targetAudience?: string
): Promise<Omit<TranslationResult, 'providerUsed' | 'modelUsed' | 'timestamp'>> {
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

  const prompt = buildTranslationPrompt(text, tonePreference, targetAudience);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.2, // Low temperature for high translation accuracy
    },
  });

  const rawText = response.text || '';
  if (!rawText) {
    throw new Error('Received empty response from Gemma 4 API.');
  }

  return parseModelJsonResponse(rawText, text);
}

/**
 * Executes translation via local Ollama instance (default: gemma4:e2b)
 */
async function translateWithOllama(
  text: string,
  baseUrl: string,
  modelName: string,
  tonePreference?: string,
  targetAudience?: string
): Promise<Omit<TranslationResult, 'providerUsed' | 'modelUsed' | 'timestamp'>> {
  const prompt = buildTranslationPrompt(text, tonePreference, targetAudience);
  const cleanBase = baseUrl.replace(/\/$/, '');

  let rawResponseText = '';

  try {
    // Try /api/chat endpoint first
    const chatUrl = `${cleanBase}/api/chat`;
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert English to Latin-script Hausa (Boko) translator. Output strictly valid JSON.',
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
    });

    if (response.ok) {
      const data = await response.json();
      rawResponseText = data.message?.content || data.response || '';
    } else {
      // Fallback to /api/generate
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
  } catch (err: any) {
    throw new Error(
      `Could not reach local Ollama at ${baseUrl}. Ensure Ollama is installed and running ('ollama serve' and 'ollama run ${modelName}'). Error: ${err.message}`
    );
  }

  if (!rawResponseText) {
    throw new Error(`Received empty translation output from Ollama model ${modelName}.`);
  }

  return parseModelJsonResponse(rawResponseText, text);
}

/**
 * Unified translation function
 */
export async function translateToHausa(
  text: string,
  options?: TranslateOptions
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Please provide text in English to translate.');
  }

  const status = getProviderStatus();
  const provider = options?.provider || status.activeProvider;
  const timestamp = new Date().toISOString();

  if (provider === 'local') {
    const model = status.ollamaModel;
    const result = await translateWithOllama(
      trimmed,
      status.ollamaBaseUrl,
      model,
      options?.tonePreference,
      options?.targetAudience
    );
    return {
      ...result,
      providerUsed: 'local',
      modelUsed: model,
      timestamp,
    };
  }

  // Otherwise default to Google AI Studio Gemini API with Gemma 4
  const model = status.apiModel;
  const result = await translateWithGeminiApi(
    trimmed,
    model,
    options?.tonePreference,
    options?.targetAudience
  );

  return {
    ...result,
    providerUsed: 'api',
    modelUsed: model,
    timestamp,
  };
}
