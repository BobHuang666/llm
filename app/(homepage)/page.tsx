// app/(homepage)/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@/context/chat-context';
import { streamMessage } from '@/lib/coze-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileUpload } from '@/components/file-upload';
import { FilePreview } from '@/components/file-preview';
import { ImageIcon, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { chatSessions, activeSessionId, addMessage } = useChat();
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('上传错误:', error);
      throw error; // 抛出错误以便外层捕获
    }
  }, []);

  const handleSendMessage = async () => {
    if ((!userInput.trim() && attachments.length === 0) || !activeSessionId || isLoading) return;

    try {
      setIsLoading(true);

      // Upload files
      const fileContents = await Promise.all(
        attachments.map(async (file) => ({
          type: 'file' as const,
          url: await handleFileUpload(file),
          name: file.name,
          mimeType: file.type,
        }))
      );

      // Add user message
      if (userInput.trim() || fileContents.length > 0) {
        addMessage(activeSessionId, {
          role: 'user',
          content: fileContents.length > 0 ? fileContents[0] : userInput,
          timestamp: Date.now(),
        });
      }

      // Stream assistant response
      let finalContent = '';
      await streamMessage('7473839565292863514', userInput, (chunk) => {
        setStreamContent((prev) => prev + chunk);
        finalContent += chunk;
      });

      addMessage(activeSessionId, {
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('Error:', error);
      addMessage(activeSessionId, {
        role: 'assistant',
        content: '消息发送失败，请重试',
        timestamp: Date.now(),
      });
    } finally {
      setUserInput('');
      setAttachments([]);
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string | FileContent) => {
    if (typeof content === 'string') {
      return (
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
                </div>
              );
            },
            // ...其他Markdown组件...
            h1: ({ children }) => <h1 className="text-3xl font-bold mt-4 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-semibold mt-4 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>,
            h4: ({ children }) => <h4 className="text-lg font-medium mt-4 mb-2">{children}</h4>,
            h5: ({ children }) => <h5 className="text-md font-medium mt-4 mb-2">{children}</h5>,
            h6: ({ children }) => <h6 className="text-sm font-medium mt-4 mb-2">{children}</h6>,
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }

    return <FilePreview content={content} />;
  };

  return (
    <div className="p-4 bg-neutral-800 h-full w-full">
      <div className="p-4 bg-neutral-800 h-full max-w-[1000px] mx-auto">
        {/* 消息列表 */}
        <div className="mb-4 h-[calc(100vh-180px)] overflow-y-auto space-y-4">
          {activeSessionId && chatSessions
            .find((session) => session.id === activeSessionId)
            ?.messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-600 ml-auto max-w-[80%]'
                  : 'bg-gray-700 max-w-[90%]'
                  }`}
              >
                {renderMessageContent(message.content)}
                <div className="mt-2 text-xs text-gray-300">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

          {/* 流式响应 */}
          {isLoading && (
            <div className="p-4 rounded-lg bg-gray-700 max-w-[90%]">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" />
                正在生成响应...
              </div>
              {streamContent && (
                <div className="mt-2">
                  <ReactMarkdown>
                    {streamContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="flex gap-2 items-stretch">
          <div className="flex flex-col gap-2 flex-1">
            {/* 附件预览 */}
            {attachments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {attachments.map((file, index) => (
                  <div key={index} className="relative">
                    <FilePreview
                      content={{
                        type: 'file',
                        url: URL.createObjectURL(file),
                        name: file.name,
                        mimeType: file.type,
                      }}
                      onRemove={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 输入框 */}
            <div className="flex gap-2">
              <FileUpload
                onUpload={(file) => {
                  setAttachments(prev => [...prev, file]);
                  return Promise.resolve('');
                }}
                disabled={isLoading}
              />
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入消息..."
                className="flex-1 p-2 rounded-md bg-gray-700 text-white"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-blue-500 rounded-md text-white hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
