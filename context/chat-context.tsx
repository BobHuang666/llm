// context/chat-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  createdAt: number;
  messages: Message[];
}

interface ChatContextType {
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  createNewSession: () => void;
  addMessage: (sessionId: string, message: Message) => void;
  setActiveSessionId: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      messages: [],
    };
    setChatSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const addMessage = (sessionId: string, message: Message) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message] }
          : session
      )
    );
  };

  return (
    <ChatContext.Provider value={{ chatSessions, activeSessionId, createNewSession, addMessage, setActiveSessionId }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
