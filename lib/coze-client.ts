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
