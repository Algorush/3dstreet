import { createChatBotMessage } from 'react-chatbot-kit';

const botName = "Chatbot";

const config = {
  botName: botName,
  initialMessages: [createChatBotMessage(`Hi, I'm ${botName}, how can I help you?`)],
  state: {}
};

export default config;
