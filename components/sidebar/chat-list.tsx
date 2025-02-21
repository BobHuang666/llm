// components/sidebar/chat-list.tsx
'use client';

import { useChat } from '@/context/chat-context';
import { PlusCircle } from 'lucide-react';

export const ChatList = () => {
  const { chatSessions, activeSessionId, createNewSession, setActiveSessionId } = useChat();

  return (
    <div className="space-y-4">
      {/* 新建会话按钮 */}
      <button
        onClick={createNewSession}
        className="w-full flex items-center gap-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition"
      >
        <PlusCircle className="w-5 h-5" />
        新建会话
      </button>

      {/* 会话列表 */}
      {chatSessions.length > 0 ? (
        chatSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`w-full p-2 text-left rounded-md transition ${activeSessionId === session.id ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            <div className="flex justify-between items-center">
              <span>{session.messages[0]?.content || '新会话'}</span>
              <span className="text-xs text-gray-400">{new Date(session.createdAt).toLocaleTimeString()}</span>
            </div>
          </button>
        ))
      ) : (
        <p className="text-gray-500">暂无会话</p>
      )}
    </div>
  );
};
