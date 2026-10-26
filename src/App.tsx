/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeftRight,
  Info,
  Mic,
  Star,
  Download,
  Trash2,
  Columns,
  Layers,
  Award,
  ChevronRight,
  GraduationCap,
  Send,
  MessageSquare
} from 'lucide-react';

export type LanguageCode = 'english' | 'hausa' | 'fulfulde' | 'yoruba' | 'igbo';

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
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  hausaTranslation: string;
  translatedText?: string;
  pronunciationGuide: string;
  toneAndRegister: string;
  regionalVariants: RegionalVariant[];
  culturalNotes: string;
  vocabulary: VocabularyItem[];
  providerUsed: 'api' | 'local';
  modelUsed: string;
  timestamp: string;
}

interface DualComparisonItem {
  language: LanguageCode;
  languageLabel: string;
  flag: string;
  translatedText: string;
  pronunciationGuide: string;
  culturalNotes: string;
  regionalVariants: RegionalVariant[];
}

interface DualComparisonResult {
  originalText: string;
  sourceLanguage: LanguageCode;
  comparisons: DualComparisonItem[];
  vocabulary: VocabularyItem[];
  providerUsed: 'api' | 'local';
  modelUsed: string;
  timestamp: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  originalText: string;
  translatedText: string;
  pronunciationGuide?: string;
  culturalNotes?: string;
  starred: boolean;
}

interface QuizQuestion {
  id: string;
  language: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface TutorCurriculumModule {
  id: string;
  title: string;
  icon: string;
  description: string;
  starterPrompt: string;
  keyPhrases: { original: string; english: string; pronunciation: string }[];
}

interface TutorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pronunciationGuide?: string;
  targetPhrases?: string[];
  culturalInsight?: string;
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

const LANGUAGE_CONFIG: Record<LanguageCode, { label: string; flag: string; native: string; speechCode: string }> = {
  english: { label: 'English', flag: '🇬🇧', native: 'English', speechCode: 'en-US' },
  hausa: { label: 'Hausa', flag: '🇳🇬', native: 'Harshen Hausa (Boko)', speechCode: 'ha-NG' },
  fulfulde: { label: 'Fulfulde', flag: '🌍', native: 'Fulfulde (Pulaar)', speechCode: 'ff-NG' },
  yoruba: { label: 'Yoruba', flag: '🇳🇬', native: 'Èdè Yorùbá', speechCode: 'yo-NG' },
  igbo: { label: 'Igbo', flag: '🇳🇬', native: 'Asụsụ Igbo', speechCode: 'ig-NG' },
};

export default function App() {
  // Navigation View: 'translate' | 'compare' | 'tutor' | 'history' | 'quiz'
  const [activeTab, setActiveTab] = useState<'translate' | 'compare' | 'tutor' | 'history' | 'quiz'>('translate');

  // Translation State
  const [inputText, setInputText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('english');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('hausa');
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

  // Voice Input (Speech-to-Text) State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Multi-Comparison State
  const [compareInput, setCompareInput] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<DualComparisonResult | null>(null);

  // AI Tutor State
  const [tutorLanguage, setTutorLanguage] = useState<LanguageCode>('hausa');
  const [tutorLevel, setTutorLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [tutorTopic, setTutorTopic] = useState('Greetings & Honorific Etiquette');
  const [tutorModules, setTutorModules] = useState<TutorCurriculumModule[]>([]);
  const [tutorMessages, setTutorMessages] = useState<TutorChatMessage[]>([]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([
    'Teach me the essential morning greetings',
    'How do I address an elder with respect?',
    'Teach me a famous proverb in this language',
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // History & Saved Favorites State (LocalStorage)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('gemma_translation_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historyFilter, setHistoryFilter] = useState<'all' | 'starred'>('all');

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gemma_translation_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  // Fetch initial system status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.status) {
          setStatus(data.status);
        }
      })
      .catch((err) => console.error('Status fetch error:', err));
  }, []);

  // Fetch samples whenever sourceLanguage or targetLanguage changes
  useEffect(() => {
    fetch(`/api/samples?source=${sourceLanguage}&target=${targetLanguage}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.error('Samples fetch error:', err));
  }, [sourceLanguage, targetLanguage]);

  // Fetch quiz questions
  useEffect(() => {
    fetch('/api/quiz')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.questions) {
          setQuizQuestions(data.questions);
        }
      })
      .catch((err) => console.error('Quiz fetch error:', err));
  }, []);

  // Fetch tutor curriculum whenever tutorLanguage changes
  useEffect(() => {
    fetch(`/api/tutor/curriculum?lang=${tutorLanguage}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.modules) {
          setTutorModules(data.modules);
        }
      })
      .catch((err) => console.error('Tutor curriculum fetch error:', err));

    // Reset tutor chat with a welcoming greeting
    initTutorWelcome(tutorLanguage);
  }, [tutorLanguage]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === 'tutor') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tutorMessages, activeTab]);

  const initTutorWelcome = (lang: LanguageCode) => {
    let welcome = '';
    let targetPhrases: string[] = [];
    let pronunciation = '';
    let culturalTip = '';

    if (lang === 'hausa') {
      welcome = "Sannu! Sunana Malam Aminu. Ina farin cikin taimaka maka koyon Harshen Hausa! 🌟 (Hello! My name is Teacher Aminu. I am delighted to help you learn Hausa!) Let's begin with the cornerstone greeting of Northern Nigeria: **Ina kwana?**";
      targetPhrases = ['Ina kwana?', 'Lafiya lau'];
      pronunciation = 'Ee-nah kwah-nah? (Rising melody) / Lah-fee-yah low';
      culturalTip = "In Hausa culture, greetings are sacred social rituals. 'Ina kwana' asks how you spent the night, and 'lafiya' represents holistic peace and health.";
    } else if (lang === 'fulfulde') {
      welcome = "Jam waali! No mbadda? Miɗo weltii e jaɓɓaago ma e janngirde Fulfulde! 🌟 (Peaceful morning! How are you? I am thrilled to welcome you to our Fulfulde lessons!) In Fulani culture, everything begins with **Jam** (Peace).";
      targetPhrases = ['Jam waali?', 'Jam tan'];
      pronunciation = 'Jahm wah-lee? / Jahm tahn';
      culturalTip = "Peace ('Jam') is the foundation of well-being. When asked 'Jam waali?', the expected traditional reply is always 'Jam tan' (Peace only).";
    } else if (lang === 'yoruba') {
      welcome = "Ẹ ku aarọ o! Ṣe alaafia ni? Mo nireti pe ẹ wa ninu idunnu ati alaafia! 🌟 (Good morning! Are you in peace? Welcome to your Yoruba language masterclass!) Notice how we use **'Ẹ ku...'** to greet with honor.";
      targetPhrases = ['Ẹ ku aarọ o', 'Ṣe alaafia ni?'];
      pronunciation = 'Eh koo ah-raw oh / Sheh ah-lah-fee-ah nee?';
      culturalTip = "The prefix 'Ẹ' is an honorific plural demonstrating deep respect (Ọmọlúwàbí etiquette). It is spoken to parents, elders, or guests.";
    } else if (lang === 'igbo') {
      welcome = "Ụtụtụ ọma! Kedu ka i mere? Nnọọ na klaasị anyị! 🌟 (Good morning! How are you doing? Welcome to your Igbo learning journey!) Let's start with **Ụtụtụ ọma** (Good morning) and **Kedu** (How are you).";
      targetPhrases = ['Ụtụtụ ọma', 'Kedu ka i mere?', 'A dị m mma'];
      pronunciation = 'Oo-too-too aw-mah / Keh-doo kah ee meh-reh?';
      culturalTip = "In Igbo culture, asking 'Kedu' invites genuine connection. The standard reply is 'A dị m mma' (I am fine/well).";
    }

    setTutorMessages([
      {
        id: `tutor_init_${Date.now()}`,
        role: 'assistant',
        content: welcome,
        targetPhrases,
        pronunciationGuide: pronunciation,
        culturalInsight: culturalTip,
        timestamp: new Date().toISOString(),
      },
    ]);

    setSuggestedReplies([
      'How do I respond properly?',
      'Can you teach me the pronunciation?',
      'Let us practice this together!',
    ]);
  };

  // Send message to AI Tutor
  const handleSendTutorMessage = async (customText?: string, customTopic?: string) => {
    const textToSend = customText || tutorInput.trim();
    if (!textToSend || tutorLoading) return;

    const userMsg: TutorChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...tutorMessages, userMsg];
    setTutorMessages(newMessages);
    setTutorInput('');
    setTutorLoading(true);

    const activeTopic = customTopic || tutorTopic;

    try {
      const activeProvider = providerOverride || status?.activeProvider || 'api';
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: tutorLanguage,
          level: tutorLevel,
          topic: activeTopic,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          provider: activeProvider,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.data) {
        const tutorReply = data.data;
        const tutorMsg: TutorChatMessage = {
          id: `tutor_${Date.now()}`,
          role: 'assistant',
          content: tutorReply.reply,
          pronunciationGuide: tutorReply.pronunciationGuide,
          targetPhrases: tutorReply.targetPhrases,
          culturalInsight: tutorReply.culturalInsight,
          timestamp: new Date().toISOString(),
        };

        setTutorMessages((prev) => [...prev, tutorMsg]);
        if (tutorReply.suggestedReplies?.length) {
          setSuggestedReplies(tutorReply.suggestedReplies);
        }
      } else {
        // Fallback response inside chat
        const fallbackMsg: TutorChatMessage = {
          id: `tutor_fallback_${Date.now()}`,
          role: 'assistant',
          content: "Madalla! You are making great effort with your practice. Let's continue practicing this phrase together! Click any suggested reply below to continue.",
          timestamp: new Date().toISOString(),
        };
        setTutorMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const fallbackMsg: TutorChatMessage = {
        id: `tutor_fallback_${Date.now()}`,
        role: 'assistant',
        content: "Madalla! You are making great effort with your practice. Let's continue practicing this phrase together! Click any suggested reply below to continue.",
        timestamp: new Date().toISOString(),
      };
      setTutorMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Start specific module lesson with AI tutor
  const startModuleLesson = (mod: TutorCurriculumModule) => {
    setTutorTopic(mod.title);
    handleSendTutorMessage(mod.starterPrompt, mod.title);
  };

  // Setup Voice Input for Translator or Tutor
  const toggleVoiceRecording = (target: 'translator' | 'tutor' = 'translator') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang =
        target === 'translator'
          ? LANGUAGE_CONFIG[sourceLanguage].speechCode
          : LANGUAGE_CONFIG[tutorLanguage].speechCode;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsRecording(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (target === 'translator') {
            setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setTutorInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to start', e);
      setIsRecording(false);
    }
  };

  // Swap Source and Target Languages
  const handleSwapLanguages = () => {
    const prevSource = sourceLanguage;
    const prevTarget = targetLanguage;

    setSourceLanguage(prevTarget);
    setTargetLanguage(prevSource);

    if (result?.translatedText) {
      setInputText(result.translatedText);
      setResult({
        ...result,
        sourceLanguage: prevTarget,
        targetLanguage: prevSource,
        originalText: result.translatedText,
        translatedText: inputText,
        hausaTranslation: inputText,
      });
    }
  };

  // Execute Main Translation
  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    if (sourceLanguage === targetLanguage) {
      setError('Please select two different languages for translation.');
      return;
    }

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
          sourceLanguage,
          targetLanguage,
          tonePreference,
          targetAudience,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to translate. Please check your provider settings.');
      }

      const resData: TranslationResult = data.data;
      setResult(resData);

      // Save into history
      const newHistoryItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceLanguage,
        targetLanguage,
        originalText: inputText.trim(),
        translatedText: resData.translatedText || resData.hausaTranslation || '',
        pronunciationGuide: resData.pronunciationGuide,
        culturalNotes: resData.culturalNotes,
        starred: false,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while translating.');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Multi-Language Comparison
  const handleRunComparison = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!compareInput.trim() || compareLoading) return;

    setCompareLoading(true);
    try {
      const activeProvider = providerOverride || status?.activeProvider || 'api';
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: compareInput.trim(),
          provider: activeProvider,
          sourceLanguage: 'english',
          targetLanguages: ['hausa', 'fulfulde', 'yoruba', 'igbo'],
          tonePreference,
          targetAudience,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setCompareResult(data.data);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  const currentTranslationText = result?.translatedText || result?.hausaTranslation || '';

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (textToSpeak: string, langCode: LanguageCode) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = LANGUAGE_CONFIG[langCode].speechCode;
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const insertCharacter = (char: string, targetInput: 'translate' | 'tutor' = 'translate') => {
    if (targetInput === 'translate') {
      setInputText((prev) => prev + char);
    } else {
      setTutorInput((prev) => prev + char);
    }
  };

  // Toggle favorite star
  const toggleStar = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
  };

  // Delete history item
  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all history
  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear your translation history?')) {
      setHistory([]);
    }
  };

  // Export phrasebook as formatted file
  const exportPhrasebook = () => {
    const dataToExport = historyFilter === 'starred' ? history.filter((h) => h.starred) : history;
    const content = dataToExport
      .map(
        (h) =>
          `[${h.sourceLanguage.toUpperCase()} ➔ ${h.targetLanguage.toUpperCase()}]\n` +
          `Original: ${h.originalText}\n` +
          `Translation: ${h.translatedText}\n` +
          (h.pronunciationGuide ? `Pronunciation: ${h.pronunciationGuide}\n` : '') +
          (h.culturalNotes ? `Cultural Context: ${h.culturalNotes}\n` : '') +
          `--------------------------------------------------\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemma_african_phrasebook_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quiz Handling
  const handleSelectQuizAnswer = (idx: number) => {
    if (showExplanation) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === quizQuestions[currentQuizIndex]?.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setQuizFinished(false);
  };

  const activeProviderDisplay = providerOverride || status?.activeProvider || 'api';
  const activeModelDisplay =
    activeProviderDisplay === 'local'
      ? status?.ollamaModel || 'gemma4:e2b'
      : status?.apiModel || 'gemma-4-26b-a4b-it';

  // Determine keyboard helper characters based on source or target language
  const inputLetters =
    sourceLanguage === 'hausa' || (sourceLanguage === 'english' && targetLanguage === 'hausa')
      ? ['ɓ', 'ɗ', 'ƙ', "'y", 'Ɓ', 'Ɗ', 'Ƙ']
      : sourceLanguage === 'fulfulde' || (sourceLanguage === 'english' && targetLanguage === 'fulfulde')
      ? ['ɓ', 'ɗ', 'ƴ', 'ŋ', 'Ɓ', 'Ɗ', 'Ƴ', 'Ŋ']
      : sourceLanguage === 'yoruba' || (sourceLanguage === 'english' && targetLanguage === 'yoruba')
      ? ['ẹ', 'ọ', 'ṣ', 'á', 'à', 'é', 'è', 'ó', 'ò', 'Ẹ', 'Ọ', 'Ṣ']
      : sourceLanguage === 'igbo' || (sourceLanguage === 'english' && targetLanguage === 'igbo')
      ? ['ị', 'ọ', 'ụ', 'ṅ', 'Ị', 'Ọ', 'Ụ', 'Ṅ']
      : ['ɓ', 'ɗ', 'ƙ', 'ƴ', 'ŋ', "'y"];

  // Tutor keyboard letters
  const tutorLetters =
    tutorLanguage === 'hausa'
      ? ['ɓ', 'ɗ', 'ƙ', "'y", 'Ɓ', 'Ɗ', 'Ƙ']
      : tutorLanguage === 'fulfulde'
      ? ['ɓ', 'ɗ', 'ƴ', 'ŋ', 'Ɓ', 'Ɗ', 'Ƴ', 'Ŋ']
      : tutorLanguage === 'yoruba'
      ? ['ẹ', 'ọ', 'ṣ', 'á', 'à', 'é', 'è', 'ó', 'ò', 'Ẹ', 'Ọ', 'Ṣ']
      : ['ị', 'ọ', 'ụ', 'ṅ', 'Ị', 'Ọ', 'Ụ', 'Ṅ'];

  const placeholderText =
    sourceLanguage === 'hausa'
      ? "Rubuta ko manna rubutun Hausa (Boko) a nan... (misali: 'Ina kwana? Yaya kake?')"
      : sourceLanguage === 'fulfulde'
      ? "Winndu Fulfulde ɗoo... (misali: 'Jam waali! No mbadda?')"
      : sourceLanguage === 'yoruba'
      ? "Kọ ẹsẹ tabi ọrọ Yorùbá si ibi... (apẹẹrẹ: 'Ẹ ku aarọ o! Ṣe alaafia ni ẹ ji?')"
      : sourceLanguage === 'igbo'
      ? "Dee ahịrịokwu Igbo ebe a... (dịka: 'Ụtụtụ ọma! Kedu ka i mere?')"
      : `Type or speak English text to translate into ${LANGUAGE_CONFIG[targetLanguage].label}...`;

  const filteredHistory = historyFilter === 'starred' ? history.filter((h) => h.starred) : history;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Space_Grotesk']">
                  Gemma<span className="text-emerald-400">Translate</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Nigerian & African Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hausa • Fulfulde • Yoruba • Igbo • English
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Provider switch */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 text-xs">
              <button
                onClick={() => setProviderOverride('api')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeProviderDisplay === 'api'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Google AI Studio Gemini API (Gemma 4)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>API</span>
              </button>
              <button
                onClick={() => setProviderOverride('local')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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

            {/* Alphabet Reference Button */}
            <button
              onClick={() => setShowAlphabetModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
              title="African Orthography (ɓ, ɗ, ƙ, ƴ, ŋ, ẹ, ọ, ṣ, ị, ụ)"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Help / Setup Guide */}
            <button
              onClick={() => setShowSetupModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
              title="Architecture & Tips"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex items-center space-x-1 border-t border-slate-800/50 text-xs overflow-x-auto py-1.5">
          <button
            onClick={() => setActiveTab('translate')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer font-medium ${
              activeTab === 'translate'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translator</span>
          </button>

          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer font-medium ${
              activeTab === 'tutor'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>🎓 AI Tutor (Learn & Chat)</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer font-medium ${
              activeTab === 'compare'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual Compare</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer font-medium ${
              activeTab === 'history'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phrasebook & History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer font-medium ${
              activeTab === 'quiz'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Cultural Quiz</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* ================= AI TUTOR TAB ================= */}
        {activeTab === 'tutor' && (
          <div className="space-y-6">
            {/* Language & Level Selector Header */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/50 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <GraduationCap className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Gemma Native African Language Tutor
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Choose the language you wish to master. Your AI teacher ("Malam") will guide you step-by-step with real-time pronunciation guides, cultural etiquette tips, and interactive practice challenges.
                  </p>
                </div>

                {/* Level Picker */}
                <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium px-2 hidden sm:inline">Level:</span>
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTutorLevel(lvl)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                        tutorLevel === lvl
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
                {(['hausa', 'fulfulde', 'yoruba', 'igbo'] as LanguageCode[]).map((code) => {
                  const isSelected = tutorLanguage === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setTutorLanguage(code)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{LANGUAGE_CONFIG[code].flag}</span>
                      <div className="overflow-hidden">
                        <div className={`font-bold text-xs truncate ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {LANGUAGE_CONFIG[code].label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {LANGUAGE_CONFIG[code].native}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Curriculum Modules Cards */}
            {tutorModules.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Structured Curriculum Modules for {LANGUAGE_CONFIG[tutorLanguage].label}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Click any module to start lesson</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tutorModules.map((mod) => (
                    <div
                      key={mod.id}
                      onClick={() => startModuleLesson(mod)}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg group flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{mod.icon}</span>
                          <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {mod.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>

                      {mod.keyPhrases.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60 space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">Key Phrase:</span>
                          <div className="text-xs font-semibold text-emerald-300">
                            "{mod.keyPhrases[0].original}"
                          </div>
                          <div className="text-[11px] text-slate-400 italic">
                            {mod.keyPhrases[0].english}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Interactive Chat Lesson Canvas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
              {/* Chat Session Header */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    🎓
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">Malam (Teacher)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        {LANGUAGE_CONFIG[tutorLanguage].label} • {tutorLevel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Topic: {tutorTopic}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => initTutorWelcome(tutorLanguage)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                  title="Restart conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restart Lesson</span>
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="p-4 sm:p-6 space-y-5 max-h-[480px] overflow-y-auto bg-slate-950/40">
                {tutorMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-1">
                        <span>{isUser ? 'You (Student)' : `Malam (${LANGUAGE_CONFIG[tutorLanguage].label} Teacher)`}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl space-y-3 leading-relaxed text-sm ${
                          isUser
                            ? 'bg-emerald-600 text-slate-950 font-semibold rounded-tr-none shadow-lg shadow-emerald-600/10'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-xl'
                        }`}
                      >
                        {/* Text Content */}
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Tutor Target Phrases Audio & Pronunciation Card */}
                        {!isUser && msg.targetPhrases && msg.targetPhrases.length > 0 && (
                          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400 font-semibold uppercase text-[10px]">
                              <span>Practice Listening:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.targetPhrases.map((phrase, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleSpeak(phrase, tutorLanguage)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{phrase}</span>
                                </button>
                              ))}
                            </div>

                            {msg.pronunciationGuide && (
                              <p className="text-[11px] text-slate-400 italic">
                                Pronunciation: {msg.pronunciationGuide}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Cultural Etiquette Insight */}
                        {!isUser && msg.culturalInsight && (
                          <div className="text-xs bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-xl text-slate-300 space-y-1">
                            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                              <Info className="w-3 h-3" />
                              <span>Cultural Insight</span>
                            </span>
                            <p>{msg.culturalInsight}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {tutorLoading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl w-fit">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Malam is writing your feedback...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Clickable Suggested Replies */}
              {suggestedReplies.length > 0 && !tutorLoading && (
                <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
                    💡 Suggested:
                  </span>
                  {suggestedReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendTutorMessage(reply)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-500/20 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-slate-300 transition-colors shrink-0 cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Input Bar */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
                {/* Special Letters Toolbar for Tutor */}
                <div className="flex items-center space-x-1.5 flex-wrap text-xs">
                  <span className="text-slate-500 text-[11px]">Special Letters:</span>
                  {tutorLetters.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => insertCharacter(char, 'tutor')}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono text-slate-300 cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendTutorMessage();
                        }
                      }}
                      placeholder={`Reply or practice in ${LANGUAGE_CONFIG[tutorLanguage].label} or ask in English...`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />

                    {/* Microphone button */}
                    <button
                      type="button"
                      onClick={() => toggleVoiceRecording('tutor')}
                      className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                      }`}
                      title="Speak answer via microphone"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendTutorMessage()}
                    disabled={tutorLoading || !tutorInput.trim()}
                    className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TRANSLATOR TAB ================= */}
        {activeTab === 'translate' && (
          <div className="space-y-6">
            {/* Direction Selector Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Source Language */}
                <div className="w-full sm:w-auto flex-1 flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 hidden md:inline">
                    From:
                  </span>
                  <div className="grid grid-cols-5 gap-1 w-full">
                    {(['english', 'hausa', 'fulfulde', 'yoruba', 'igbo'] as LanguageCode[]).map((code) => (
                      <button
                        key={`src-${code}`}
                        type="button"
                        onClick={() => {
                          setSourceLanguage(code);
                          if (targetLanguage === code) {
                            setTargetLanguage(code === 'english' ? 'hausa' : 'english');
                          }
                        }}
                        className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          sourceLanguage === code
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{LANGUAGE_CONFIG[code].flag}</span>
                        <span className="truncate">{LANGUAGE_CONFIG[code].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={handleSwapLanguages}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-700 transition-all cursor-pointer shadow-md group shrink-0"
                  title="Swap languages"
                >
                  <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                </button>

                {/* Target Language */}
                <div className="w-full sm:w-auto flex-1 flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 hidden md:inline">
                    To:
                  </span>
                  <div className="grid grid-cols-5 gap-1 w-full">
                    {(['hausa', 'fulfulde', 'yoruba', 'igbo', 'english'] as LanguageCode[]).map((code) => (
                      <button
                        key={`tgt-${code}`}
                        type="button"
                        onClick={() => {
                          setTargetLanguage(code);
                          if (sourceLanguage === code) {
                            setSourceLanguage(code === 'hausa' ? 'english' : 'hausa');
                          }
                        }}
                        className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          targetLanguage === code
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{LANGUAGE_CONFIG[code].flag}</span>
                        <span className="truncate">{LANGUAGE_CONFIG[code].label}</span>
                      </button>
                    ))}
                  </div>
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
                      <span>
                        {LANGUAGE_CONFIG[sourceLanguage].label} Input ({LANGUAGE_CONFIG[sourceLanguage].flag})
                      </span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">{inputText.length} chars</span>
                      {inputText && (
                        <button
                          type="button"
                          onClick={() => setInputText('')}
                          className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Text Area with Voice Input Button */}
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
                      placeholder={placeholderText}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 pr-12 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all"
                    />

                    {/* Microphone Voice Input Button */}
                    <button
                      type="button"
                      onClick={() => toggleVoiceRecording('translator')}
                      className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                      }`}
                      title={isRecording ? 'Listening... click to stop' : 'Click to speak via microphone'}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Special African Characters Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-400 hidden sm:inline">Alphabet letters:</span>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {inputLetters.map((char) => (
                        <button
                          key={char}
                          type="button"
                          onClick={() => insertCharacter(char, 'translate')}
                          className="px-2 py-1 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-700 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer"
                          title={`Insert '${char}'`}
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone & Audience */}
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
                        <span>
                          Translate to {LANGUAGE_CONFIG[targetLanguage].label} ({LANGUAGE_CONFIG[targetLanguage].flag})
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Sample Input Chips */}
                {samples.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                      <span>💡 Try a realistic {LANGUAGE_CONFIG[sourceLanguage].label} sample:</span>
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
                          className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-emerald-500/40 text-xs transition-all group flex flex-col space-y-1 cursor-pointer"
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

              {/* Right Column: Output & Cultural Intelligence */}
              <div className="lg:col-span-6 space-y-4">
                {error && (
                  <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start space-x-3 text-rose-400">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm">Notice</h3>
                        <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Translation Output Card */}
                {result ? (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
                    {/* Header with language indicator, tone, copy & speech */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          {LANGUAGE_CONFIG[result.targetLanguage || targetLanguage].label} Output ({LANGUAGE_CONFIG[result.targetLanguage || targetLanguage].flag})
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                          {result.toneAndRegister}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleSpeak(currentTranslationText, result.targetLanguage || targetLanguage)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            speaking
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                          }`}
                          title="Listen to pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(currentTranslationText)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer"
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

                    {/* Primary Translation */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                      <p className="text-lg sm:text-xl font-bold text-white tracking-wide leading-relaxed selection:bg-emerald-500 selection:text-slate-950">
                        {currentTranslationText}
                      </p>
                      {result.pronunciationGuide && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1.5">
                          <span className="text-emerald-400 font-semibold">Pronunciation guide:</span>
                          <span>{result.pronunciationGuide}</span>
                        </p>
                      )}
                    </div>

                    {/* Regional Variations */}
                    {result.regionalVariants && result.regionalVariants.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Regional Phrasings & Dialects</span>
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

                    {/* Cultural Nuance & Etiquette */}
                    {result.culturalNotes && (
                      <div className="space-y-1.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5 text-xs text-slate-300">
                        <div className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                          <Info className="w-3.5 h-3.5" />
                          <span>Cultural Context & Etiquette</span>
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
                  <div className="h-full min-h-[360px] bg-slate-900/40 border border-slate-800/60 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                      <Languages className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="max-w-xs space-y-1">
                      <h3 className="font-semibold text-slate-200 text-sm">
                        {LANGUAGE_CONFIG[sourceLanguage].label} ➔ {LANGUAGE_CONFIG[targetLanguage].label}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Enter text or speak via microphone to translate between English, Hausa, Fulfulde, Yoruba, and Igbo with deep cultural etiquette notes.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= DUAL SIDE-BY-SIDE COMPARE TAB ================= */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900/60 border border-emerald-900/40 rounded-2xl p-5 shadow-xl space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Columns className="w-5 h-5 text-emerald-400" />
                <span>Multi-Language Pan-Nigerian Comparison</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Translate an English sentence into **Hausa, Fulfulde, Yoruba, and Igbo** at the same time to see how the major Nigerian & West African cultures express the identical greeting, blessing, or proverb!
              </p>
            </div>

            <form onSubmit={handleRunComparison} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Enter English Sentence to Compare:
              </label>
              <div className="relative">
                <textarea
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  rows={3}
                  placeholder="e.g. 'Good morning! I hope you and your family are in good health. May God grant us peace.'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={compareLoading || !compareInput.trim()}
                className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center space-x-2"
              >
                {compareLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Translating into 4 African Languages...</span>
                  </>
                ) : (
                  <>
                    <span>Compare Across Hausa, Fulfulde, Yoruba & Igbo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Comparison Cards Grid */}
            {compareResult && compareResult.comparisons && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {compareResult.comparisons.map((c) => (
                  <div key={c.language} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{c.flag}</span>
                          <span className="font-bold text-white text-sm">{c.languageLabel}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSpeak(c.translatedText, c.language)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            title="Speak"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(c.translatedText)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                        <p className="font-bold text-slate-100 text-base leading-relaxed">
                          {c.translatedText}
                        </p>
                        {c.pronunciationGuide && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            {c.pronunciationGuide}
                          </p>
                        )}
                      </div>

                      {c.culturalNotes && (
                        <div className="text-xs text-slate-300 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg leading-relaxed">
                          <span className="font-semibold text-emerald-300">Culture: </span>
                          {c.culturalNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= PHRASEBOOK & HISTORY TAB ================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>Phrasebook & Translation History</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Starred phrases and recent translations saved in your browser.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                      historyFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({history.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('starred')}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center space-x-1 ${
                      historyFilter === 'starred' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    <span>Starred ({history.filter((h) => h.starred).length})</span>
                  </button>
                </div>

                {history.length > 0 && (
                  <>
                    <button
                      onClick={exportPhrasebook}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                      title="Download as text file"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                      onClick={clearAllHistory}
                      className="p-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-xl border border-slate-700 cursor-pointer"
                      title="Clear history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                          {LANGUAGE_CONFIG[item.sourceLanguage]?.label} ➔ {LANGUAGE_CONFIG[item.targetLanguage]?.label}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => toggleStar(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 cursor-pointer"
                          title={item.starred ? 'Remove star' : 'Star phrase'}
                        >
                          <Star className={`w-4 h-4 ${item.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleSpeak(item.translatedText, item.targetLanguage)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          title="Listen"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(item.translatedText)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInputText(item.originalText);
                            setSourceLanguage(item.sourceLanguage);
                            setTargetLanguage(item.targetLanguage);
                            setActiveTab('translate');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                          title="Open in translator"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Original ({LANGUAGE_CONFIG[item.sourceLanguage]?.label})</div>
                        <p className="text-slate-300">{item.originalText}</p>
                      </div>

                      <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-900/40">
                        <div className="text-[10px] text-emerald-400 uppercase font-semibold mb-1">Translation ({LANGUAGE_CONFIG[item.targetLanguage]?.label})</div>
                        <p className="text-white font-semibold">{item.translatedText}</p>
                        {item.pronunciationGuide && (
                          <p className="text-xs text-slate-400 mt-1 italic">{item.pronunciationGuide}</p>
                        )}
                      </div>
                    </div>

                    {item.culturalNotes && (
                      <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                        <span className="text-emerald-400 font-semibold">Cultural note: </span>
                        {item.culturalNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/60 border-dashed rounded-2xl p-12 text-center space-y-2">
                <Layers className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="font-semibold text-slate-300 text-sm">No saved phrases yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Translate sentences in the Translator tab and star your favorite phrases to build your custom offline phrasebook!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= CULTURAL QUIZ TAB ================= */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Cultural Etiquette & Dialect Quiz</h2>
                </div>
                {!quizFinished && quizQuestions.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Question {currentQuizIndex + 1} of {quizQuestions.length}
                  </span>
                )}
              </div>

              {!quizFinished && quizQuestions.length > 0 ? (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      {quizQuestions[currentQuizIndex].language.toUpperCase()} CULTURE
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 leading-snug">
                      {quizQuestions[currentQuizIndex].question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {quizQuestions[currentQuizIndex].options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === quizQuestions[currentQuizIndex].correctIndex;
                      let btnStyle = 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200';

                      if (showExplanation) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-300';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectQuizAnswer(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showExplanation && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  {showExplanation && (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-2 text-xs text-slate-200">
                      <div className="font-semibold text-emerald-400">Cultural Explanation:</div>
                      <p className="leading-relaxed">{quizQuestions[currentQuizIndex].explanation}</p>
                      <button
                        onClick={handleNextQuizQuestion}
                        className="mt-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <span>{currentQuizIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Final Score'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : quizFinished ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                    {score}/{quizQuestions.length}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Quiz Complete!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {score === quizQuestions.length
                        ? 'Master level! You have a profound understanding of Nigerian cultural etiquette, orthography, and dialects.'
                        : 'Well done! Reviewing cultural nuances turns basic translation into authentic, respectful communication.'}
                    </p>
                  </div>

                  <button
                    onClick={resetQuiz}
                    className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Loading quiz questions...
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Alphabet Reference Modal */}
      {showAlphabetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Pan-Nigerian Orthography Guide</h3>
              </div>
              <button
                onClick={() => setShowAlphabetModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] mb-2 tracking-wider">
                  🇳🇬 Hausa Hooked Letters (Boko)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ɓ / Ɓ</span> - Implosive b
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ɗ / Ɗ</span> - Implosive d
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ƙ / Ƙ</span> - Ejective k
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">'y / Ƴ</span> - Glottalized y
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] mb-2 tracking-wider">
                  🌍 Fulfulde (Fula) Letters
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ƴ / Ƴ</span> - Glottalized y
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ŋ / Ŋ</span> - Velar nasal 'ng'
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] mb-2 tracking-wider">
                  🇳🇬 Yoruba Sub-dots & Tones
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ẹ / ọ / ṣ</span> - Open vowels & sh
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">á / à</span> - High / Low tone
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] mb-2 tracking-wider">
                  🇳🇬 Igbo Dotted Vowels & Nasals
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ị / ọ / ụ</span> - Light vowels
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold mr-1">ṅ / Ṅ</span> - Velar nasal
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAlphabetModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">All Features Guide</h3>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-emerald-400">🎓 AI Language Tutor: </span>
                Select any language (Hausa, Fulfulde, Yoruba, Igbo) and your skill level. The AI teacher Malam conducts interactive lessons with pronunciation tips and cultural challenges.
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-emerald-400">🎙️ Voice Input: </span>
                Click the microphone icon in either the Translator or Tutor tab to speak your practice answers aloud.
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-emerald-400">🪟 Dual Compare Mode: </span>
                Compare how Hausa, Fulfulde, Yoruba, and Igbo express identical thoughts side-by-side.
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-emerald-400">🗂️ Phrasebook: </span>
                Star your favorite translations to build a study collection and export as text.
              </div>
            </div>

            <button
              onClick={() => setShowSetupModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          GemmaTranslate • Pan-Nigerian & West African Hub (Hausa, Fulfulde, Yoruba, Igbo) with AI Tutor • Powered by Gemma 4
        </p>
      </footer>
    </div>
  );
}
