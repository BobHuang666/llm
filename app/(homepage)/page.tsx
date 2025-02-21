// app/(homepage)/page.tsx
'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/chat-context';
import { sendMessage } from '@/lib/coze-client';
import { ChatList } from '@/components/sidebar/chat-list';

export default function HomePage() {
  const { chatSessions, activeSessionId, addMessage } = useChat();
  const [userInput, setUserInput] = useState('');

  const handleSendMessage = async () => {
    if (!userInput.trim() || !activeSessionId) return;

    // 保存用户输入
    addMessage(activeSessionId, { role: 'user', content: userInput, timestamp: Date.now() });

    // 请求 LLM 回复
    const botResponses = await sendMessage('your_bot_id', userInput);
    botResponses.forEach((response) => {
      addMessage(activeSessionId, { role: 'assistant', content: response.content, timestamp: Date.now() });
    });

    setUserInput('');
  };

  return (
    <div className="p-4 bg-neutral-800 h-full">
      <h1 className="text-2xl font-bold mb-4">💬 Chat Interface</h1>

      {/* 聊天消息列表 */}
      <div className="mb-4 h-[calc(100vh-200px)] overflow-y-auto">
        {activeSessionId && (
          chatSessions
            .find((session) => session.id === activeSessionId)
            ?.messages.map((message, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded ${message.role === 'user' ? 'bg-blue-500' : 'bg-gray-700'} text-white`}
              >
                <p>{message.content}</p>
                <span className="text-xs text-gray-300">{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
        )}
      </div>

      {/* 输入框和发送按钮 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 p-2 rounded bg-gray-700 text-white"
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} className="p-2 bg-blue-500 rounded text-white">
          发送
        </button>
      </div>
    </div>
  );
}
