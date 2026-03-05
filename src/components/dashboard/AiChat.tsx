'use client';

import { useState, useRef, useEffect } from 'react';
import { CampaignContext } from '@/lib/recommendations';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatProps {
  dateRange?: string;
}

export function AiChat({ dateRange }: AiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingContext, setPendingContext] = useState<CampaignContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Expose method to open with a pre-filled message
  useEffect(() => {
    (window as any).__openAiChat = (prompt: string, context?: CampaignContext) => {
      setIsOpen(true);
      setPendingContext(context || null);
      setInput(prompt);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    return () => { delete (window as any).__openAiChat; };
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          campaignContext: pendingContext || undefined,
          dateRange,
        }),
      });
      const data = await res.json();
      setPendingContext(null);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || data.error || 'Error al procesar',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error de conexión. Intentá de nuevo.',
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-600 rotate-90'
            : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-110 shadow-indigo-500/25'
        }`}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl border border-slate-700/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/20 bg-gradient-to-r from-indigo-950/60 to-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <div className="text-sm font-bold text-slate-200">Asistente de Ads</div>
                <div className="text-[10px] text-slate-500">Preguntá sobre tus campañas</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">💬</div>
                <div className="text-sm text-slate-400 mb-1">¡Preguntame lo que quieras!</div>
                <div className="text-xs text-slate-500">
                  Podés preguntar sobre métricas, estrategias, o hacer click en "Analizar" en cualquier recomendación.
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/30 text-indigo-100 rounded-br-sm'
                    : 'bg-slate-800/80 text-slate-300 rounded-bl-sm border border-slate-700/20'
                }`}>
                  {msg.content.split('\n').map((line, j) => {
                    if (line.match(/^(🟢|🟡|🔴|📊|🚨|🚀|🎯|💡|✅)/)) {
                      return <div key={j} className="font-semibold mt-1">{line}</div>;
                    }
                    return <div key={j}>{line || '\u00A0'}</div>;
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700/20 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-700/20 bg-slate-900/80">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Preguntá sobre tus campañas..."
                className="flex-1 bg-slate-800/60 border border-slate-700/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
