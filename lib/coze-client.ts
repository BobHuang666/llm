// lib/coze.client.ts
import { CozeAPI, COZE_CN_BASE_URL, RoleType } from '@coze/api';

export const cozeClient = new CozeAPI({
  token: process.env.NEXT_PUBLIC_COZE_TOKEN!,
  baseURL: COZE_CN_BASE_URL,
});

export const sendMessage = async (botId: string, message: string) => {
  try {
    const response = await cozeClient.chat.createAndPoll({
      bot_id: botId,
      additional_messages: [{ role: RoleType.User, content: message, content_type: 'text' }],
    });
    return response.messages;
  } catch (error) {
    console.error('❌ Coze API error:', error);
    return [];
  }
};
