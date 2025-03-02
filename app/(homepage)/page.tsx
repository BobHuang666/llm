// app/(homepage)/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/chat-context';
import { streamWorkflow, uploadFile, retrieveFileDetails, verifyPermissions } from '@/lib/coze-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileUpload } from '@/components/file-upload';
import { FilePreview } from '@/components/file-preview';
import { Loader2 } from 'lucide-react';
import { FileContent } from '@/lib/types';


export default function HomePage() {
  const { chatSessions, activeSessionId, addMessage } = useChat();
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking...');

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        await verifyPermissions();
        setPermissionStatus('✅ 权限状态正常');
      } catch (error: any) {
        setPermissionStatus(`❌ 权限错误: ${error.message}`);
        console.error('权限验证失败:', error);
      }
    };

    checkPermissions();
  }, []);

  const handleSendMessage = async () => {
    if ((!userInput.trim() && attachments.length === 0) || !activeSessionId || isLoading) return;

    try {
      setIsLoading(true);

      // 处理文件上传和验证
      const fileDetails = await Promise.all(
        attachments.map(async (file) => {
          try {
            const fileId = await uploadFile(file);
            const detail = await retrieveFileDetails(fileId);

            // 验证关键字段
            if (!detail.data?.file_name || !detail.data.id) {
              throw new Error('文件信息不完整');
            }

            return {
              fileId,
              detail,
              paramKey: file.type.startsWith('image/') ? 'image_input' : 'file_input',
              originalFile: file
            };
          } catch (error) {
            console.error('文件处理失败:', file.name, error);
            throw new Error(`文件 ${file.name} 处理失败: ${error.message}`);
          }
        })
      );

      // 构建工作流参数
      const parameters = fileDetails.reduce((acc, item) => {
        acc[item.paramKey] = JSON.stringify({ file_id: item.fileId });
        return acc;
      }, {} as Record<string, any>);

      parameters.text_input = userInput;

      // 添加用户消息（带验证）
      fileDetails.forEach(({ detail, originalFile }) => {
        addMessage(activeSessionId, {
          role: 'user',
          content: {
            type: 'file',
            url: URL.createObjectURL(originalFile),
            name: detail.data.file_name, // 确保使用正确的字段
            mimeType: originalFile.type,
            meta: {
              id: detail.data.id,
              size: detail.data.bytes,
              uploadedAt: detail.data.created_at
            }
          },
          timestamp: Date.now(),
        });
      });


      // 执行工作流
      let finalContent = '';
      await streamWorkflow(
        process.env.NEXT_PUBLIC_WORKFLOW_ID!, // 从环境变量获取
        parameters,
        (chunk) => {
          setStreamContent(prev => prev + chunk);
          finalContent += chunk;
        },
        (error) => {
          throw new Error(error);
        }
      );

      // 添加助手响应
      addMessage(activeSessionId, {
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now(),
      });
    } catch (error) {
      // 增强错误处理
      const errorMessage = error.message.includes('file_name')
        ? '文件处理失败：服务器返回格式异常'
        : error.message;

      addMessage(activeSessionId, {
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      });
    } finally {
      setUserInput('');
      setAttachments([]);
      setIsLoading(false);
      setStreamContent('');
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
                  <CopyButton code={codeString} />
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
          {content}
        </ReactMarkdown>
      );
    }

    return <FilePreview content={content} />;
  };

  return (
    <div className="p-4 bg-neutral-800 h-full w-full">

      {/* 添加权限状态提示 */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="text-sm flex items-center gap-2">
          <span>系统状态：</span>
          <span className={`font-medium ${permissionStatus.includes('✅') ? 'text-green-400' : 'text-red-400'
            }`}>
            {permissionStatus}
          </span>
        </div>
      </div>

      <div className="p-4 bg-neutral-800 h-full max-w-[1000px] mx-auto">
        <div className="mb-4 h-[calc(100vh-520px)] overflow-y-auto space-y-4">
          {activeSessionId && chatSessions
            .find((session) => session.id === activeSessionId)
            ?.messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-600 ml-auto max-w-[80%]'
                  : 'bg-gray-700 max-w-[90%]'}`}
              >
                {renderMessageContent(message.content)}
                <div className="mt-2 text-xs text-gray-300">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

          {isLoading && (
            <div className="p-4 rounded-lg bg-gray-700 max-w-[90%]">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" />
                正在生成响应...
              </div>
              {streamContent && (
                <div className="mt-2">
                  <ReactMarkdown>{streamContent}</ReactMarkdown>
                </div>
              )}
              {/* 添加错误提示区域 */}
              {permissionStatus.startsWith('❌') && (
                <div className="mt-2 text-red-400 text-sm">
                  操作被拒绝，请检查：
                  <ul className="list-disc pl-4 mt-1">
                    <li>访问令牌是否已过期</li>
                    <li>是否具有文件操作权限</li>
                    <li>工作流ID是否正确</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-stretch">
          <div className="flex flex-col gap-2 flex-1">
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

const CopyButton = ({ code }: { code: string }) => {
  const [copyText, setCopyText] = useState('Copy');

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 1500); // Reset button text after a short delay
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded w-[70px]"
    >
      {copyText}
    </button>
  );
};
