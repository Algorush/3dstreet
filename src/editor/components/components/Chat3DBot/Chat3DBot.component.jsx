import { useState } from 'react';
import { Chatbot } from '../../../../lib/react-chatbot-kit';
import '../../../../lib/react-chatbot-kit.css';
import './style.css';

import config from './config';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';

const Chat3DBot = () => {
  localStorage.removeItem('chat_messages');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const saveMessages = (messages, HTMLString) => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  };

  const loadMessages = () => {
    const messages = JSON.parse(localStorage.getItem('chat_messages'));
    return messages;
  };
/*
  const handleImageUploadClick = () => {
    // Trigger the image upload widget
    actionProviderRef.handleUploadImage();
  };
*/
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
            actionProvider={(props) => {
                const ap = new ActionProvider(props);
                return ap;
              }
            }
            messageHistory={loadMessages()}
            saveMessages={saveMessages}
            runInitialMessagesWithHistory={false}
          />
        </div>
      )}
    </div>
  );
};

export { Chat3DBot };
