import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, X } from 'lucide-react';
import { useChatbotSession } from './useChatbotSession';
import { useAssistantIdentity } from './useAssistantIdentity';

interface ChatAssistantProps {
  mode: 'modal' | 'full';
  onClose?: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ mode, onClose }) => {
  const {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    error,
    handleSend,
    messagesEndRef,
    aiSettings,
  } = useChatbotSession();

  const { greeting } = useAssistantIdentity();

  React.useEffect(() => {
    if (greeting) {
      setMessages([
        {
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
          model: 'EduBot',
        },
      ]);
    }
  }, [greeting, setMessages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={containerVariants}
      className={
        mode === 'full'
          ? 'fixed inset-0 flex flex-col'
          : 'fixed inset-0 sm:inset-auto sm:bottom-8 sm:right-8 z-50 flex items-end sm:items-center justify-center'
      }
    >
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-black rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg flex flex-col h-[90vh] sm:h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/edubot-avatar.png" alt="EduBot" className="w-10 h-10 rounded-full border-2 border-purple-300" />
            <div>
              <span className="font-bold text-lg text-purple-800 dark:text-purple-300">EduBot</span>
              <div className="text-xs text-purple-500 dark:text-purple-400">{aiSettings?.model || 'EduSync AI'}</div>
            </div>
          </div>
          {mode === 'modal' && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.3 }}
                className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <img src="/edubot-avatar.png" alt="EduBot" className="w-8 h-8 rounded-full self-start" />
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-sm shadow-md relative ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                    {msg.model || ''} {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <User size={24} className="text-blue-300" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <img src="/edubot-avatar.png" alt="EduBot" className="w-8 h-8 rounded-full" />
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl shadow-md">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-purple-200 dark:border-gray-700">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              className="flex-1 rounded-full border-2 border-transparent focus:border-purple-400 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500 transition-all"
              placeholder="Type your message to EduBot…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !aiSettings}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="submit"
              className="bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!input.trim() || isLoading || !aiSettings}
            >
              <Send size={20} />
            </motion.button>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm m-2">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </motion.div>
  );
};
