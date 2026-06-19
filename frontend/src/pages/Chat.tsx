import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Trash2, Bot, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/client';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = () =>
    api.get('/chat/history').then(r => setMessages(r.data)).finally(() => setFetching(false));

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
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
      const res = await api.post('/chat/send', { content });
      await loadHistory();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
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
        {messages.length > 0 && (
          <button onClick={handleClear} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
            <Trash2 size={14} /> Clear chat
          </button>
        )}
      </div>

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
            <p className="text-slate-400 text-sm mb-6 max-w-sm">I know all about Mauritius and can help with flights, accommodations, activities, budgets, and itineraries. Ask me anything!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(s)} className="text-left text-sm bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 text-slate-600 px-3 py-2.5 rounded-lg transition-colors">
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
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
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

      {/* Suggestions row (when has messages) */}
      {messages.length > 0 && !loading && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.slice(0, 3).map(s => (
            <button key={s} onClick={() => handleSend(s)} className="flex-shrink-0 text-xs bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-600 px-3 py-1.5 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about Mauritius, flights, activities, budget..."
          disabled={loading}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-12 h-12 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>

      {/* Ollama hint */}
      <p className="text-center text-xs text-slate-400 mt-2">
        Powered by Ollama (local AI) — requires <code className="bg-slate-100 px-1 rounded">ollama serve</code> + <code className="bg-slate-100 px-1 rounded">ollama pull llama3.2</code>
      </p>
    </div>
  );
}
