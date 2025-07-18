import { useState, useEffect } from 'react';
import { getCurrentStaffUser } from '../lib/auth';

const greetings = {
  creator: '👋 Hello, Creator! How can I assist you today?',
  admin: 'Hi Admin! Need help with managing staff or schedules?',
  head: 'Welcome Head Teacher! What would you like me to look up?',
  teacher: 'Hey Teacher! I’m here to support your daily tasks. 😊',
  guest: 'Hello! How can I help you today?',
};

export const useAssistantIdentity = () => {
  const [greeting, setGreeting] = useState('');
  const user = getCurrentStaffUser();
  const role = user?.role || 'guest';

  useEffect(() => {
    setGreeting(greetings[role as keyof typeof greetings] || greetings.guest);
  }, [role]);

  return { greeting };
};
