/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Languages,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  BookOpen,
  ArrowRight,
  Globe2,
  Cpu,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';

interface RegionalVariant {
  dialect: string;
  phrase: string;
  note: string;
}

interface VocabularyItem {
  english: string;
  hausa: string;
  note?: string;
}

interface TranslationResult {
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

interface ProviderStatus {
  activeProvider: 'api' | 'local';
  apiModel: string;
  isApiKeyConfigured: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

interface SampleItem {
  category: string;
  title: string;
  text: string;
  tone: string;
  audience: string;
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [tonePreference, setTonePreference] = useState('Respectful & Natural');
  const [targetAudience, setTargetAudience] = useState('General');
  const [providerOverride, setProviderOverride] = useState<'api' | 'local' | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [showAlphabetModal, setShowAlphabetModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Fetch initial system status & sample inputs
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.status) {
          setStatus(data.status);
        }
      })
      .catch((err) => console.error('Status fetch error:', err));

    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.error('Samples fetch error:', err));
  }, []);

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const activeProvider = providerOverride || status?.activeProvider || 'api';
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          provider: activeProvider,
          tonePreference,
          targetAudience,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to translate. Please check your provider settings.');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while translating.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.hausaTranslation) return;
    navigator.clipboard.writeText(result.hausaTranslation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ha-NG'; // Hausa language code
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const insertCharacter = (char: string) => {
    setInputText((prev) => prev + char);
  };

  const activeProviderDisplay = providerOverride || status?.activeProvider || 'api';
  const activeModelDisplay =
    activeProviderDisplay === 'local'
      ? status?.ollamaModel || 'gemma4:e2b'
      : status?.apiModel || 'gemma-4-31b-it';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Space_Grotesk']">
                  Gemma<span className="text-emerald-400">Hausa</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Gemma 4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Natural English to Latin-Script Hausa (Boko)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Provider indicator badge & quick switch */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 text-xs">
              <button
                onClick={() => setProviderOverride('api')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  activeProviderDisplay === 'api'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Google AI Studio Gemini API (gemma-4-31b-it)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>API</span>
              </button>
              <button
                onClick={() => setProviderOverride('local')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  activeProviderDisplay === 'local'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Local Ollama fallback (gemma4:e2b)"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Ollama</span>
              </button>
            </div>

            {/* Quick Hausa Alphabet Cheat sheet */}
            <button
              onClick={() => setShowAlphabetModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
              title="Hausa Boko Alphabet (ɓ, ɗ, ƙ, 'y)"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Help / Setup Guide */}
            <button
              onClick={() => setShowSetupModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
              title="Provider & Smoke Test Setup"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Intro banner */}
        <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900/60 border border-emerald-900/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Translate English into Natural, Authentic Hausa
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Captures conversational tone, regional variants (Kano vs. Sokoto), cultural etiquette, and English-to-Hausa idiomatic equivalents using Google's <span className="text-emerald-400 font-medium">Gemma 4</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>Active Model:</span>
              <code className="text-emerald-400 font-mono font-semibold">{activeModelDisplay}</code>
            </div>
          </div>
        </div>

        {/* Translation Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form & Samples */}
          <div className="lg:col-span-6 space-y-4">
            <form onSubmit={handleTranslate} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>English Input</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">{inputText.length} characters</span>
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleTranslate();
                    }
                  }}
                  rows={5}
                  placeholder="Type or paste English text, full sentences, expressions, or colloquial phrases... (e.g. 'Don't count your chickens before they hatch')"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all"
                />
              </div>

              {/* Special Hausa Boko Characters Quick Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 hidden sm:inline">Hausa Boko letters:</span>
                <div className="flex items-center space-x-1.5">
                  {['ɓ', 'ɗ', 'ƙ', "'y", 'Ɓ', 'Ɗ', 'Ƙ'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => insertCharacter(char)}
                      className="px-2 py-1 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-700 rounded-md text-xs font-mono font-medium transition-colors"
                      title={`Insert '${char}'`}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context / Tone Selectors */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Tone & Style
                  </label>
                  <select
                    value={tonePreference}
                    onChange={(e) => setTonePreference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Respectful & Natural">Respectful & Natural</option>
                    <option value="Casual & Colloquial">Casual & Colloquial</option>
                    <option value="Formal & Professional">Formal & Professional</option>
                    <option value="Proverbial & Idiomatic">Proverbial & Idiomatic</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="General">General / Anyone</option>
                    <option value="Elder / Respectful Host">Elder / Respectful Host</option>
                    <option value="Peer or Friend">Peer or Friend</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
              </div>

              {/* Translate CTA Button */}
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Translating with Gemma 4...</span>
                  </>
                ) : (
                  <>
                    <span>Translate into Natural Hausa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Sample Input Chips */}
            {samples.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>💡 Try a realistic sample:</span>
                </div>
                <div className="space-y-2">
                  {samples.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(sample.text);
                        setTonePreference(sample.tone);
                        setTargetAudience(sample.audience);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-emerald-500/40 text-xs transition-all group flex flex-col space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-emerald-400 group-hover:text-emerald-300">
                          {sample.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {sample.category}
                        </span>
                      </div>
                      <p className="text-slate-300 italic line-clamp-2">
                        "{sample.text}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Hausa Output & Cultural Intelligence */}
          <div className="lg:col-span-6 space-y-4">
            {error && (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-start space-x-3 text-rose-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">Translation Request Failed</h3>
                    <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-900/40 flex flex-wrap gap-2 text-xs">
                  {activeProviderDisplay === 'api' ? (
                    <div className="text-slate-300 text-[11px]">
                      Tip: Ensure your <code className="bg-rose-950 text-rose-200 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> is set in your environment, or switch to <button onClick={() => setProviderOverride('local')} className="text-emerald-400 underline font-medium">Ollama local mode</button>.
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[11px]">
                      Tip: Ensure Ollama is running locally (<code className="bg-rose-950 text-rose-200 px-1 py-0.5 rounded font-mono">ollama run gemma4:e2b</code>), or switch back to <button onClick={() => setProviderOverride('api')} className="text-emerald-400 underline font-medium">API mode</button>.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translation Output Card */}
            {result ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
                {/* Header with tone, copy & speech */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Standard Hausa (Boko)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                      {result.toneAndRegister}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleSpeak(result.hausaTranslation)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        speaking
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Translation In Boko Script */}
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <p className="text-lg sm:text-xl font-bold text-white tracking-wide leading-relaxed selection:bg-emerald-500 selection:text-slate-950">
                    {result.hausaTranslation}
                  </p>
                  {result.pronunciationGuide && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1.5">
                      <span className="text-emerald-400 font-semibold">Pronunciation guide:</span>
                      <span>{result.pronunciationGuide}</span>
                    </p>
                  )}
                </div>

                {/* Regional Variations (Kano vs Sokoto, etc.) */}
                {result.regionalVariants && result.regionalVariants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Regional & Dialectal Phrasings</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {result.regionalVariants.map((variant, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-3 space-y-1 text-xs"
                        >
                          <div className="font-semibold text-emerald-400">{variant.dialect}</div>
                          <div className="text-slate-100 font-medium font-sans">"{variant.phrase}"</div>
                          <div className="text-slate-400 text-[11px] leading-snug">{variant.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural Nuance & Idiomatic Notes */}
                {result.culturalNotes && (
                  <div className="space-y-1.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5 text-xs text-slate-300">
                    <div className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Cultural Context & Idiom Notes</span>
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      {result.culturalNotes}
                    </p>
                  </div>
                )}

                {/* Vocabulary Breakdown */}
                {result.vocabulary && result.vocabulary.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Key Vocabulary Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {result.vocabulary.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60"
                        >
                          <span className="text-slate-400">{item.english}</span>
                          <span className="font-medium text-emerald-300">{item.hausa}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engine Metadata Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>Engine:</span>
                    <span className="text-slate-300 font-medium">
                      {result.providerUsed === 'api' ? 'Google AI Studio API' : 'Local Ollama'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400/80">{result.modelUsed}</span>
                  </div>
                  <div>
                    {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state / placeholder */
              <div className="h-full min-h-[360px] bg-slate-900/40 border border-slate-800/60 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <Languages className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h3 className="font-semibold text-slate-200 text-sm">Ready for Your English Input</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter text on the left or click a sample to see natural Boko Hausa, regional dialects, and cultural etiquette notes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hausa Alphabet Boko Cheat Sheet Modal */}
      {showAlphabetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Hausa Boko Alphabet Reference</h3>
              </div>
              <button
                onClick={() => setShowAlphabetModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Hausa in Nigeria and Niger is written in **Boko** (standardized Latin orthography). It features 4 special hooked letters that represent distinct phonemes:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-emerald-400">ɓ / Ɓ</span>
                    <span className="font-semibold text-slate-100">Glottalized 'B' (Implosive)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Produced with a slight inward gulp of air. Example: <em>ɓarawo</em> (thief) vs <em>barawo</em>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-emerald-400">ɗ / Ɗ</span>
                    <span className="font-semibold text-slate-100">Glottalized 'D' (Implosive)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Produced with tongue pressed against alveolar ridge with slight suction. Example: <em>ɗalibi</em> (student), <em>ɗa</em> (son/child).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-emerald-400">ƙ / Ƙ</span>
                    <span className="font-semibold text-slate-100">Ejective 'K'</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Sharp, popping sound produced at the back of the mouth. Example: <em>ƙofa</em> (door), <em>ƙarfi</em> (strength).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-emerald-400">'y / Ƴ</span>
                    <span className="font-semibold text-slate-100">Glottalized 'Y'</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Glottal stop combined with a 'y' glide. Example: <em>'ya'ya</em> (children / fruits).
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAlphabetModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Setup & Smoke Test Info Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">How This App Works (Dual Engines)</h3>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Google AI Studio (Gemini API)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Runs Gemma 4 in the cloud via <code className="font-mono text-slate-200">gemma-4-31b-it</code> using your server-side <code className="font-mono text-slate-200">GEMINI_API_KEY</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>2. Local Offline Fallback (Ollama)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Runs Gemma 4 offline on your local computer via <code className="font-mono text-slate-200">gemma4:e2b</code> at <code className="font-mono text-slate-200">http://localhost:11434</code>. Switch with <code className="font-mono text-slate-200">PROVIDER=local</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-emerald-400">3. Smoke Test Verification</div>
                <p className="text-slate-400 text-[11px]">
                  To verify your active provider from the command line, run:
                </p>
                <pre className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300">
                  npm run test:smoke
                </pre>
                <p className="text-slate-400 text-[11px]">
                  It will send a test sentence and print <strong className="text-emerald-400">PASS</strong> or <strong className="text-rose-400">FAIL</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSetupModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          GemmaHausa • Natural English-to-Hausa translation powered by Gemma 4 • Standard Boko orthography
        </p>
      </footer>
    </div>
  );
}
