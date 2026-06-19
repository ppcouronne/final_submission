import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Trash2, Bot, User as UserIcon, Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/client';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

// Browser Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
}

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

const suggestions = [
  'What are the best beaches in Mauritius for snorkeling?',
  'What flights should we look for from Montreal to Mauritius?',
  'Create a 2-week itinerary for Mauritius in April',
  'What do we need to know about visas as Canadians?',
  'What is the best area to stay in Mauritius?',
  'What is the approximate budget for 2 people for 2 weeks?',
];

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceSupported] = useState(!!SpeechRecognitionAPI);

  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const loadHistory = () =>
    api.get('/chat/history').then(r => setMessages(r.data)).finally(() => setFetching(false));

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Auto-speak new AI messages when voice is enabled
  useEffect(() => {
    if (!voiceEnabled || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant') {
      speakText(last.content);
    }
  }, [messages, voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Speech-to-Text ──────────────────────────────────────
  const startListening = () => {
    if (!SpeechRecognitionAPI) return;
    window.speechSynthesis?.cancel(); // stop any ongoing TTS so mic doesn't pick it up

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => { setIsListening(true); setInterimText(''); };

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) final += text;
        else interim += text;
      }
      setInterimText(interim);
      if (final) {
        setInput(final);
        setInterimText('');
        recognition.stop();
        // Auto-send after brief pause so user can see what was transcribed
        setTimeout(() => handleSend(final), 400);
      }
    };

    recognition.onend = () => { setIsListening(false); setInterimText(''); };
    recognition.onerror = () => { setIsListening(false); setInterimText(''); };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  };

  // ── Text-to-Speech ──────────────────────────────────────
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown-style formatting for cleaner speech
    const cleaned = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural'))
    ) ?? voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(v => !v);
  };

  // ── Messaging ────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setInterimText('');
    setLoading(true);

    const optimistic: ChatMessage = {
      id: Date.now(),
      trip_id: 1,
      user_id: user?.id,
      sender_name: user?.username,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await api.post('/chat/send', { content });
      await loadHistory();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    stopSpeaking();
    await api.delete('/chat/history');
    setMessages([]);
  };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); handleSend(); };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Chat 🤖</h1>
          <p className="text-slate-500 text-sm mt-1">Your personal Mauritius travel planning assistant</p>
        </div>
        <div className="flex items-center gap-2">
          {/* TTS Toggle */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium animate-pulse"
              title="Stop speaking"
            >
              <StopCircle size={15} /> Stop
            </button>
          )}
          <button
            onClick={toggleVoice}
            title={voiceEnabled ? 'Turn off voice read-back' : 'Turn on voice read-back'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              voiceEnabled
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden sm:inline">Voice {voiceEnabled ? 'On' : 'Off'}</span>
          </button>
          {messages.length > 0 && (
            <button onClick={handleClear} className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 text-sm transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
              <Trash2 size={14} /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice status banner */}
      {voiceEnabled && (
        <div className="mb-3 flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm px-4 py-2 rounded-xl">
          <Volume2 size={15} />
          <span>Voice mode on — AI responses will be read aloud. Use the mic button to speak your questions.</span>
        </div>
      )}

      {!voiceSupported && (
        <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-xl">
          Voice input requires Chrome or Edge. Text chat works in all browsers.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {fetching ? (
          <div className="flex items-center justify-center h-full text-slate-400">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <Bot size={32} className="text-purple-500" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">Your AI Travel Assistant</h3>
            <p className="text-slate-400 text-sm mb-2 max-w-sm">
              Ask me anything about Mauritius — or tap the mic and just speak!
            </p>
            {voiceSupported && (
              <p className="text-purple-500 text-xs mb-6">
                🎙️ Voice ready — press the mic button below to start talking
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(s)}
                  className="text-left text-sm bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 text-slate-600 px-3 py-2.5 rounded-lg transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-purple-600" />
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                    {msg.sender_name && <span className="font-medium">{msg.sender_name}</span>}
                    {msg.sender_name && <span>·</span>}
                    <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                    {msg.role === 'assistant' && voiceEnabled && (
                      <button
                        onClick={() => speakText(msg.content)}
                        className="ml-1 text-purple-400 hover:text-purple-600 transition-colors"
                        title="Read this message aloud"
                      >
                        <Volume2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <UserIcon size={16} className="text-teal-700" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-purple-600" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Interim transcript preview */}
      {interimText && (
        <div className="mt-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700 italic">
          🎙️ "{interimText}..."
        </div>
      )}

      {/* Suggestion chips */}
      {messages.length > 0 && !loading && !isListening && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.slice(0, 3).map(s => (
            <button key={s} onClick={() => handleSend(s)}
              className="flex-shrink-0 text-xs bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-600 px-3 py-1.5 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={isListening ? interimText : input}
          onChange={e => setInput(e.target.value)}
          placeholder={isListening ? 'Listening...' : 'Ask about Mauritius, flights, activities, budget...'}
          disabled={loading || isListening}
          className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-50 transition-colors ${
            isListening ? 'border-purple-400 bg-purple-50 text-purple-700 placeholder-purple-400' : 'border-slate-300'
          }`}
        />

        {/* Mic button */}
        {voiceSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            title={isListening ? 'Stop listening' : 'Speak your question'}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 scale-110'
                : 'bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-600 disabled:opacity-40'
            }`}
          >
            {isListening
              ? <MicOff size={18} className="animate-pulse" />
              : <Mic size={18} />
            }
          </button>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={loading || isListening || !input.trim()}
          className="w-12 h-12 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-2">
        AI powered by Ollama · Voice by browser Web Speech API (Chrome/Edge)
      </p>
    </div>
  );
}
