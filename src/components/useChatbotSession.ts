import { useState, useEffect, useRef } from 'react';
import { callOpenRouterAPI } from '../lib/aiHelpers';
import { supabase } from '../lib/supabase';
import { getCurrentStaffUser } from '../lib/auth';

const SYSTEM_PROMPT = `You are EduBot, an AI assistant inside EduSync, a school management system built for Charis Hope Learning Centre. You assist staff in handling school diagnostics, reports, announcements, user support, and feedback. Always respond contextually and with kindness. Keep responses short and helpful unless asked for detail.`;

const AI_MODEL_TAG = 'EduSync AI';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

export const useChatbotSession = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getCurrentStaffUser();

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
      if (!error && data) {
        setAiSettings(data);
      }
    };
    fetchAISettings();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || !aiSettings) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: input, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    const apiKeys = Array.isArray(aiSettings.api_keys) ? aiSettings.api_keys : aiSettings.api_key ? [aiSettings.api_key] : [];
    let lastError = null;

    for (const apiKey of apiKeys) {
      try {
        const aiResponse = await callOpenRouterAPI(
          apiKey,
          aiSettings.model,
          [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.map(({ role, content }) => ({ role, content })),
          ]
        );
        setMessages((prevMessages) => [
          ...prevMessages,
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

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    error,
    handleSend,
    messagesEndRef,
    aiSettings,
  };
};
