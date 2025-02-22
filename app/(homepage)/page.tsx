'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/chat-context';
import { streamMessage } from '@/lib/coze-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    var finalContent = ""; // 清空临时内容

    try {
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

  // Handle Copy to Clipboard and change button text
  const handleCopy = (code: string, setCopyText: React.Dispatch<React.SetStateAction<string>>) => {
    navigator.clipboard.writeText(code);
    setCopyText('Copied');
    setTimeout(() => setCopyText('Copy'), 2000); // Reset to "Copy" after 2 seconds
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
                  className={`mb-2 p-4 rounded ${message.role === 'user' ? 'bg-blue-500' : 'bg-gray-700'} text-white w-fit min-w-[100px]`}
                >
                  {/* 渲染markdown内容 */}
                  <ReactMarkdown
                    components={{
                      code: ({ inline, className, children }) => {
                        const codeString = String(children).replace(/\n$/, '');
                        return inline ? (
                          <code className="bg-gray-800 text-yellow-300 p-1 rounded">{codeString}</code>
                        ) : (
                          <div className="relative">
                            <SyntaxHighlighter
                              language="javascript"
                              style={solarizedlight}
                              customStyle={{ backgroundColor: '#2E3A4B', borderRadius: '8px' }}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                            {/* Pass handleCopy function as prop */}
                            <CopyButton code={codeString} handleCopy={handleCopy} />
                          </div>
                        );
                      },
                      h1: ({ children }) => <h1 className="text-3xl font-bold mt-4 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold mt-4 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-lg font-medium mt-4 mb-2">{children}</h4>,
                      h5: ({ children }) => <h5 className="text-md font-medium mt-4 mb-2">{children}</h5>,
                      h6: ({ children }) => <h6 className="text-sm font-medium mt-4 mb-2">{children}</h6>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  <span className="text-xs text-gray-300">{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
          )}

          {/* 实时流式输出，进行markdown渲染 */}
          {isLoading && (
            <div className="p-2 rounded bg-gray-700 text-white">
              <ReactMarkdown>{streamContent || '正在生成中...'}</ReactMarkdown>
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

// CopyButton component to manage button text and copy functionality
const CopyButton = ({ code, handleCopy }: { code: string; handleCopy: (code: string, setCopyText: React.Dispatch<React.SetStateAction<string>>) => void }) => {
  const [copyText, setCopyText] = useState('Copy');

  return (
    <button
      onClick={() => handleCopy(code, setCopyText)}
      className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded w-[70px]"
    >
      {copyText}
    </button>
  );
};
