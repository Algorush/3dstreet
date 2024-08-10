import { useState } from 'react';
import { Chatbot } from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import './style.css';

import config from './config';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';

const Chat3DBot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="Chat3DBot">
      {!isChatOpen && (
        <div className="ChatIcon" onClick={toggleChat}>
          3D Chat
        </div>
      )}
      {isChatOpen && (
        <div className="ChatContainer">
          <div className="Chatbot__header">
            Street Editor Bot
            <button className="CloseButton" onClick={toggleChat}>X</button>
          </div>
          <Chatbot
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
          />
        </div>
      )}
    </div>
  );
};

export { Chat3DBot };
