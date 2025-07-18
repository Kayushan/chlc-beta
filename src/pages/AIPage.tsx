
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, MessageCircle } from 'lucide-react';
import { callOpenRouterAPI } from '../lib/aiHelpers';
import { supabase } from '../lib/supabase';
import { getCurrentStaffUser } from '../lib/auth';

const SYSTEM_PROMPT = `You are EduBot, an AI assistant inside EduSync, a school management system built for Charis Hope Learning Centre. You assist staff in handling school diagnostics, reports, announcements, user support, and feedback. Always respond contextually and with kindness. Keep responses short and helpful unless asked for detail.`;

const AI_MODEL_TAG = 'EduSync AI';
const ASSISTANT_NAME = 'Harmony';

export const AIPage: React.FC = () => {
  // Always open: render chatbot directly on page load
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm ${ASSISTANT_NAME}, your assistant inside EduSync 👋\nHow can I help you today?`,
      timestamp: new Date(),
      model: AI_MODEL_TAG,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getCurrentStaffUser();
  const userRole = user?.role || 'guest';
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchAISettings = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .contains('access_level', { [user.role]: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) setAiSettings(data);
    };
    fetchAISettings();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || !aiSettings) return;
    const newMessages = [
      ...messages,
      { role: 'user', content: input, timestamp: new Date(), model: '' },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    const apiKeys = Array.isArray(aiSettings.api_keys) ? aiSettings.api_keys : aiSettings.api_key ? [aiSettings.api_key] : [];
    let lastError = null;
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const aiResponse = await callOpenRouterAPI(
          apiKeys[i],
          aiSettings.model,
          [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.map(({ role, content }) => ({ role, content })),
          ]
        );
        setMessages([
          ...newMessages,
          { role: 'assistant', content: aiResponse, timestamp: new Date(), model: aiSettings.model || AI_MODEL_TAG },
        ]);
        setIsLoading(false);
        return;
      } catch (err) {
        lastError = err;
      }
    }
    setError(lastError instanceof Error ? lastError.message : 'All API keys failed.');
    setIsLoading(false);
  };

  // Quick replies
  const quickReplies = [
    'How can I help with reports?',
    'Show me announcements',
    'Contact support',
  ];



  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed inset-0 sm:inset-auto sm:bottom-8 sm:right-8 z-50 flex items-end sm:items-center justify-center"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg flex flex-col h-[90vh] sm:h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="text-purple-500" />
            <span className="font-bold">{ASSISTANT_NAME}</span>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{aiSettings?.model || AI_MODEL_TAG}</span>
          </div>
          {/* Remove close button since this is now a page, not a modal */}
        </div>
        {/* System context (collapsible, dev only) */}
        <details className="p-2 text-xs text-gray-500 select-all" open={showDebug}>
          <summary onClick={() => setShowDebug((v) => !v)} className="cursor-pointer">System Context (dev)</summary>
          <div>
            <div>User role: <b>{userRole}</b></div>
            <div>System: {SYSTEM_PROMPT}</div>
          </div>
        </details>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`rounded-2xl px-4 py-2 max-w-xs shadow
                ${msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-purple-200 dark:border-purple-700'
                }`}>
                <div className="flex items-center gap-2">
                  {msg.role === 'assistant' && <Bot size={16} className="text-purple-500" />}
                  {msg.role === 'user' && <User size={16} className="text-blue-200" />}
                  <span>{msg.content}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{msg.model || ''} {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 mt-2">
              <Bot size={16} className="text-purple-500" />
              <span className="animate-pulse">Harmony is typing…</span>
            </div>
          )}
        </div>
        {/* Quick Replies */}
        <div className="flex gap-2 p-2">
          {quickReplies.map((q) => (
            <button
              key={q}
              className="bg-gray-200 dark:bg-gray-700 text-xs px-3 py-1 rounded-full hover:bg-purple-100"
              onClick={() => setInput(q)}
            >
              {q}
            </button>
          ))}
        </div>
        {/* Input */}
        <form
          className="flex items-center gap-2 p-4 border-t"
          onSubmit={e => { e.preventDefault(); handleSend(); }}
        >
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800"
            placeholder={`Ask ${ASSISTANT_NAME} anything…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading || !aiSettings}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2"
            disabled={!input.trim() || isLoading || !aiSettings}
          >
            <Send size={18} />
          </button>
        </form>
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm m-2">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </motion.div>
  );
};
