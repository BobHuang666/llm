// components/sidebar/chat-list.tsx
'use client';

import { useChat } from '@/context/chat-context';
import { PlusCircle } from 'lucide-react';

export const ChatList = () => {
  const { chatSessions, activeSessionId, createNewSession, setActiveSessionId } = useChat();

  return (
    <div className="space-y-4 w-full h-full overflow-y-auto ">
      {/* 新建会话按钮 */}
      <button
        onClick={createNewSession}
        className="w-full flex items-center gap-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition"
      >
        <PlusCircle className="w-5 h-5" />
        新建会话
      </button>

      {/* 会话列表，倒序排列，溢出省略并滚动 */}
      <div className="space-y-2">
        {chatSessions
          .slice() // 复制数组
          .sort((a, b) => b.createdAt - a.createdAt) // 按创建时间倒序排列
          .map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`w-full p-2 text-left rounded-md transition ${activeSessionId === session.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              <div className="flex justify-between items-center">
                {/* 会话标题，溢出时省略 */}
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{session.messages[0]?.content || '新会话'}</span>
                <span className="text-xs text-gray-400">{new Date(session.createdAt).toLocaleTimeString()}</span>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
};
