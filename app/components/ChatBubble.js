/**
 * ChatBubble.js — Chatbot IA complet du Café Namasthé
 * 
 * Panneau de conversation intelligent alimenté par Google Gemini.
 * Fonctionnalités :
 * - Historique de conversation persistant durant la session
 * - Suggestions rapides pour guider l'utilisateur
 * - Indicateur de chargement animé
 * - Auto-scroll vers le dernier message
 * - Envoi avec Enter ou bouton
 */
'use client';

import { useState, useRef, useEffect } from 'react';

// Icône SVG personnalisée de conseillère clientèle avec un vrai casque d'écoute et micro
function SupportAgentIcon({ size = 20 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      {/* Arceau du casque */}
      <path d="M3 11c0-4.97 4.03-9 9-9s9 4.03 9 9" />
      {/* Écouteur gauche */}
      <rect x="2" y="10" width="3" height="5" rx="1.5" fill="currentColor" />
      {/* Écouteur droit */}
      <rect x="19" y="10" width="3" height="5" rx="1.5" fill="currentColor" />
      {/* Tige du micro */}
      <path d="M20 13c0 1.8-1 2.5-2.5 2.5h-2" />
      {/* Micro (bout) */}
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
      {/* Épaules / Corps de l'agent */}
      <path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
      {/* Tête */}
      <circle cx="12" cy="11" r="3" fill="none" />
    </svg>
  );
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Bonjour ! 👋🎧 Je suis l'assistant virtuel du Café Namasthé.\n\nJe suis là pour répondre à toutes tes questions ou pour t'aider à trouver le breuvage parfait parmi nos centaines de recettes ! Comment puis-je t'aider aujourd'hui ?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggestions rapides affichées au début
  const suggestions = [
    "Besoin d'énergie ⚡",
    "Mode relax 🧘‍♀️",
    "Quelque chose de rafraîchissant 🧊",
    "J'ai besoin de vitamines 🍓",
  ];

  // Auto-scroll vers le bas quand un nouveau message apparaît
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sur l'input quand le chat s'ouvre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Envoyer un message à l'API
  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    // Ajouter le message utilisateur
    const newMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Préparer l'historique (sans le message système initial)
      const history = newMessages
        .filter((_, i) => i > 0 && i < newMessages.length) // Exclure le premier message et le dernier (qu'on envoie séparément)
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          history: history
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || "Désolé, je n'ai pas pu répondre." 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Oups ! 😅 Erreur de connexion. Réessayez dans un instant." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la touche Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  // Transformer le texte avec des liens Markdown [Texte](/url) en balises cliquables
  const renderMessageContent = (text) => {
    if (typeof text !== 'string') return text;
    // On coupe le texte au niveau des liens markdown
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={i} href={match[2]} className="chat-link" style={{ color: 'var(--crimson)', textDecoration: 'underline', fontWeight: '500' }}>
            {match[1]}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Bulle de chat flottante */}
      <button
        className="chat-bubble"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
        id="chat-bubble-btn"
        title="Parlez à notre assistant IA"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Panneau de chat */}
      {open && (
        <div className="chat-panel" id="chat-panel">
          {/* En-tête */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                <SupportAgentIcon size={20} />
              </div>
              <div>
                <span className="chat-header-name">Assistant Namasthé</span>
                <span className="chat-header-status">
                  <span className="chat-status-dot"></span>
                  En ligne
                </span>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)} 
              className="chat-close-btn"
              aria-label="Fermer le chat"
            >
              ✕
            </button>
          </div>

          {/* Zone de messages */}
          <div className="chat-messages" id="chat-messages">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar">
                    <SupportAgentIcon size={16} />
                  </div>
                )}
                <div className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Indicateur de chargement */}
            {loading && (
              <div className="chat-msg chat-msg-ai">
                <div className="chat-msg-avatar">
                  <SupportAgentIcon size={16} />
                </div>
                <div className="chat-bubble-ai chat-typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            {/* Suggestions rapides (seulement au début) */}
            {messages.length <= 1 && !loading && (
              <div className="chat-suggestions">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    className="chat-suggestion-btn"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Champ de saisie */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez un message..."
              className="chat-input"
              disabled={loading}
            />
            <button 
              onClick={() => sendMessage()}
              className={`chat-send-btn ${loading || !input.trim() ? 'disabled' : ''}`}
              disabled={loading || !input.trim()}
              aria-label="Envoyer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
