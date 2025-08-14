// lib/coze-client.ts
import { CozeAPI, COZE_CN_BASE_URL, RoleType, ChatEventType } from '@coze/api';

export const cozeClient = new CozeAPI({
  token: process.env.NEXT_PUBLIC_COZE_TOKEN!,
  allowPersonalAccessTokenInBrowser: true,
  baseURL: COZE_CN_BASE_URL,
});

// 流式发送消息
export const streamMessage = async (botId: string, message: string, onChunk: (chunk: string) => void) => {
  const stream = await cozeClient.chat.stream({
    bot_id: botId,
    additional_messages: [{ role: RoleType.User, content: message, content_type: 'text' }],
  });

  // 监听流数据
  for await (const part of stream) {
    if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA && part.data?.content) {
      onChunk(part.data.content); // 实时返回消息片段
    }
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://api.coze.cn/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_COZE_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_message || "文件上传失败");
    }

    const { file_id } = await response.json();
    return file_id;
  } catch (error: unknown) {
    let errorMsg = '未知错误';
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    console.error('上传失败详情:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      error: errorMsg
    });
    throw new Error(`文件上传失败: ${errorMsg}`);
  }
}
export const streamWorkflow = async (
  workflowId: string,
  parameters: Record<string, unknown>,
  onMessage: (content: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  const response = await fetch('https://api.coze.cn/v1/workflow/stream_run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_COZE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      parameters,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_message || `请求失败: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 处理SSE格式数据
      const events = buffer.split(/\n\n/);
      buffer = events.pop() || '';

      interface WorkflowStreamEvent {
        id: number;
        event: 'Message' | 'Error' | 'Interrupt' | 'Done' | string;
        data: {
          content?: string;
          error_message?: string;
          [key: string]: unknown;
        } | null;
      }

      for (const event of events) {
        const lines = event.split(/\n/);
        const eventData: WorkflowStreamEvent = { id: -1, event: 'Done', data: null };

        for (const line of lines) {
          if (line.startsWith('id:')) {
            eventData.id = parseInt(line.split(': ')[1]);
          } else if (line.startsWith('event:')) {
            eventData.event = line.split(': ')[1] as WorkflowStreamEvent['event'];
          } else if (line.startsWith('data:')) {
            try {
              eventData.data = JSON.parse(line.slice(5));
            } catch (e) {
              console.error('JSON解析错误:', e);
            }
          }
        }

        switch (eventData.event) {
          case 'Message':
            if (eventData.data?.content) {
              onMessage(eventData.data.content);
            }
            break;
          case 'Error':
            onError?.(eventData.data?.error_message || '未知错误');
            break;
          case 'Interrupt':
            onError?.('工作流被中断');
            break;
        }
      }
    }
  } catch (error) {
    console.error('流处理错误:', error);
    throw error;
  }
};

export const verifyPermissions = async () => {
  try {
    // 测试文件权限
    await fetch('https://api.coze.cn/v1/files/upload', {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_COZE_TOKEN}`
      }
    });

    // 测试工作流权限
    await fetch('https://api.coze.cn/v1/workflow/stream_run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_COZE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workflow_id: !process.env.NEXT_PUBLIC_BOT })
    });

  } catch (error) {
    console.error('权限验证失败，请检查：');
    console.error('1. 令牌是否已开启所需权限');
    console.error('2. 环境变量NEXT_PUBLIC_COZE_TOKEN是否正确');
    console.error('3. 令牌是否已过期');
    throw error;
  }
};

// lib/coze-client.ts
interface CozeError extends Error {
  code?: number;
  logId?: string;
}

export const handleCozeError = (error: unknown): never => {
  let customError: CozeError;
  if (error instanceof Error) {
    customError = error as CozeError;
  } else {
    customError = new Error('未知错误');
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: { data?: unknown } }).response !== null &&
    'data' in (error as { response: { data?: unknown } }).response!
  ) {
    const response = (error as { response: { data?: { code?: number; msg?: string; detail?: { logid?: string } } } }).response;
    if (response && response.data) {
      const { code, msg, detail } = response.data;
      customError.message = `${code} ${msg} (logid: ${detail?.logid})`;
      customError.code = code;
      customError.logId = detail?.logid;
    }
  }

  throw customError;
};

export const retrieveFileDetails = async (fileId: string) => {
  try {
    const response = await fetch(`https://api.coze.cn/v1/files/retrieve?file_id=${fileId}`, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_COZE_TOKEN}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || '获取文件详情失败');
    }

    const result = await response.json();

    // 添加数据验证
    if (!result.data?.file_name) {
      throw new Error('无效的文件详情响应格式');
    }

    return result;
  } catch (error: unknown) {
    let errorMsg = '未知错误';
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    console.error('文件详情获取失败:', {
      fileId,
      error: errorMsg
    });
    throw error;
  }
};