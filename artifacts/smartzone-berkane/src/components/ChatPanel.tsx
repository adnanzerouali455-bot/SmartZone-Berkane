import React, { useState, useRef, useEffect } from 'react';
import { Quartier } from '../data/quartiers';
import { parseMessage } from '../lib/chatEngine';
import { Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatPanelProps {
  quartiers: Quartier[];
  onRecommendation: (quartiers: Quartier[], criterion?: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ quartiers, onRecommendation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      text: "Bonjour ! Je suis votre assistant SmartZone. Posez-moi une question sur les quartiers de Berkane ou choisissez un filtre rapide ci-dessous.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    setTimeout(() => {
      const response = parseMessage(text, quartiers);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      onRecommendation(response.topQuartiers, response.criterion);
    }, 400);
  };

  const suggestions = [
    { label: "🏆 Meilleur score", query: "meilleur classement" },
    { label: "🔇 Quartier calme", query: "très calme" },
    { label: "🏥 Proche hôpital", query: "proche hôpital" },
    { label: "🏫 École proche", query: "école pour enfants" },
    { label: "💰 Moins cher", query: "pas cher" },
    { label: "📊 Comparer tous", query: "comparer tous" }
  ];

  return (
    <div className="flex flex-col h-[500px] border-b">
      <div className="bg-blue-600 text-white p-3 flex items-center gap-2">
        <Bot size={20} />
        <h2 className="font-semibold text-sm">Assistant IA</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-1 opacity-70">
                {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                <span className="text-xs">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {/* Basic markdown bold parsing for highlights */}
                {msg.text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug.query)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
            >
              {sug.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
            placeholder="Posez votre question..."
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button
            onClick={() => handleSend(inputValue)}
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
            disabled={!inputValue.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
