import React, { useState, useRef, useEffect } from 'react';
import { useApp, API_URL } from '../context/AppContext';
import { Send, User, Sparkles, RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Assistant: React.FC = () => {
  useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `### Hello! I am your Smartphone Compare AI Platform Assistant\n\nI can help you review, filter, and compare smartphones. You can ask me questions like:\n- *"I need a phone under ₹30,000 for gaming."*\n- *"Which has a better camera: Galaxy S25 Ultra or Pixel 9 Pro XL?"*\n- *"Show me phones that support wireless charging."*\n\nHow can I help you choose your next device today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date()
          }
        ]);
      } else {
        throw new Error('AI response error');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '### Connection error occurred\n\nI was unable to query my knowledge base. Please check your internet connection or try again shortly.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSend(q);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `### Hello! I am your Smartphone Compare AI Platform Assistant\n\nI can help you review, filter, and compare smartphones. You can ask me questions like:\n- *"I need a phone under ₹30,000 for gaming."*\n- *"Which has a better camera: Galaxy S25 Ultra or Pixel 9 Pro XL?"*\n- *"Show me phones that support wireless charging."*\n\nHow can I help you choose your next device today?`,
        timestamp: new Date()
      }
    ]);
  };

  // Render markdown helper inside chatbot messages
  const renderMessageContent = (content: string) => {
    return content.split('\n\n').map((para, pIdx) => {
      if (para.startsWith('###')) {
        return <h3 key={pIdx} className="text-sm font-extrabold text-foreground mt-3 mb-1.5 flex items-center gap-1"><Sparkles className="h-4 w-4 text-secondary" /> {para.replace('###', '')}</h3>;
      }
      if (para.startsWith('##')) {
        return <h2 key={pIdx} className="text-base font-extrabold text-foreground mt-4 mb-2">{para.replace('##', '')}</h2>;
      }
      if (para.startsWith('-') || para.startsWith('*')) {
        return (
          <ul key={pIdx} className="list-disc pl-4 space-y-1.5 text-xs text-neutral-600">
            {para.split('\n').map((li, lIdx) => (
              <li key={lIdx}>{li.replace(/^[\s*-]+/, '').replace(/\*\*/g, '')}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={pIdx} className="text-xs text-neutral-600 leading-relaxed">
          {para.split(' ').map((word, wIdx) => {
            if (word.startsWith('**') && word.endsWith('**')) {
              return <strong key={wIdx} className="text-foreground font-bold">{word.replace(/\*\*/g, '')} </strong>;
            }
            return word + ' ';
          })}
        </p>
      );
    });
  };

  return (
    <div className="mx-auto flex h-[85vh] max-w-5xl flex-col px-4 py-6 md:px-8 text-left bg-background text-foreground">
      {/* Head */}
      <header className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Conversational Guru
          </span>
          <h1 className="mt-1 text-xl font-extrabold text-foreground">AI Chat Assistant</h1>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1 rounded-lg border border-border bg-neutral-50 px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reset Chat
        </button>
      </header>

      {/* Suggestion Chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleQuickQuestion('Recommend gaming phones under ₹30,000')}
          className="rounded-full bg-neutral-50 border border-border px-3 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-all"
        >
          Analyse Gaming under 30k
        </button>
        <button
          onClick={() => handleQuickQuestion('Which phone has the absolute best camera?')}
          className="rounded-full bg-neutral-50 border border-border px-3 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-all"
        >
          Analyse Best camera phone
        </button>
        <button
          onClick={() => handleQuickQuestion('Compare OnePlus 12 and Galaxy S24 Ultra')}
          className="rounded-full bg-neutral-50 border border-border px-3 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-all"
        >
          Compare OnePlus 12 vs S24 Ultra
        </button>
      </div>

      {/* Messages Board */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-white p-4 md:p-6 space-y-6 shadow-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex max-w-[85%] gap-3.5 ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
              msg.role === 'user' 
                ? 'bg-neutral-100 text-foreground border-border' 
                : 'bg-primary/20 text-amber-800 border-primary/30'
            }`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-secondary" />}
            </div>

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-3 border text-xs text-left shadow-sm ${
              msg.role === 'user'
                ? 'bg-primary/10 border-primary/20 rounded-tr-none text-foreground'
                : 'bg-neutral-50 border-border rounded-tl-none text-foreground'
            }`}>
              <div className="space-y-3">{renderMessageContent(msg.content)}</div>
              <div className="mt-2 text-right text-[8px] text-muted-foreground font-mono">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex max-w-[85%] gap-3.5 mr-auto items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-amber-800">
              <Sparkles className="h-4 w-4 text-secondary animate-spin" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-neutral-50 border border-border rounded-tl-none flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: '0ms' }} />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: '150ms' }} />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask a technical question or comparison detail..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-xl border border-border bg-neutral-50 p-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:bg-white disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
