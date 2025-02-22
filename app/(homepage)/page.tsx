'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/chat-context';
import { streamMessage } from '@/lib/coze-client';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function HomePage() {
  const { chatSessions, activeSessionId, addMessage } = useChat();
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState(''); // 临时存储流式响应

  const handleSendMessage = async () => {
    if (!userInput.trim() || !activeSessionId || isLoading) return;

    // 1. 保存用户输入
    addMessage(activeSessionId, { role: 'user', content: userInput, timestamp: Date.now() });

    // 2. 初始化流式输出
    setStreamContent('');
    setIsLoading(true);

    try {
      var finalContent = streamContent; // 保存最终内容
      // 3. 发送流式消息
      await streamMessage('7473839565292863514', userInput, (chunk) => {
        setStreamContent((prev) => prev + chunk);
        finalContent += chunk;
      });

      addMessage(activeSessionId, { role: 'assistant', content: finalContent, timestamp: Date.now() });

      finalContent = ""; // 清空临时内容

    } catch (error) {
      console.error('❌ 发送失败:', error);
      addMessage(activeSessionId, { role: 'assistant', content: '发送失败，请重试。', timestamp: Date.now() });
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  return (
    <div className="p-4 bg-neutral-800 h-full w-full">
      <div className="p-4 bg-neutral-800 h-full max-w-[1000px] justify-center items-center mx-auto">
        <h1 className="text-2xl font-bold mb-4">💬 Chat Interface</h1>

        {/* 聊天消息列表 */}
        <div className="mb-4 h-[calc(100vh-150px)] overflow-y-auto">
          {activeSessionId && (
            chatSessions
              .find((session) => session.id === activeSessionId)
              ?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded ${message.role === 'user' ? 'bg-blue-500' : 'bg-gray-700'} text-white w-fit min-w-[100px]`}
                >
                  {/* 渲染markdown内容 */}
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {message.content}
                  </ReactMarkdown>
                  <span className="text-xs text-gray-300">{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
          )}

          {/* 实时流式输出 */}
          {isLoading && (
            <div className="p-2 rounded bg-gray-700 text-white">
              <p className="break-words">{streamContent || '正在生成中...'}</p>
            </div>
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
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} className="p-2 bg-blue-500 rounded text-white" disabled={isLoading}>
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
