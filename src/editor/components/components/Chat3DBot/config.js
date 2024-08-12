import { createChatBotMessage } from 'react-chatbot-kit';
import { ImageUploadWidget } from './components/ImageUploadWidget.jsx';

const botName = "Chatbot";

const config = {
  botName: botName,
  initialMessages: [createChatBotMessage(`Hi, I'm 3D Street ${botName}, I can create 3D streets for you from your description! And I can also help you to create safer street, just ask me about it!`)],
  state: {},
  widgets: [
    {
      widgetName: 'imageUploadWidget',
      widgetFunc: (props) => <ImageUploadWidget {...props} />,
      mapStateToProps: ['handleImageUpload'] // Pass the upload handler from ActionProvider
    }
  ]
};

export default config;
