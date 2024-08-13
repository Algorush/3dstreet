import Events from '../../../lib/Events';
const streetUtils = require('../../../../street-utils.js');

const BASE_SERVER_URL = 'http://127.0.0.1:5000';

class ActionProvider {
    constructor(createChatBotMessage, setState) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setState;
    }

    handleServerResponse = (response) => {
      if (response.error) {
        const botMessage = this.createChatBotMessage(`Error: ${response.error}`);
        this.setState((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage]
        }));
      } else if (response.text) {
        const botMessage = this.createChatBotMessage(response.text);
        this.setState((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage]
        }));
      } else if (response.streetmix_json) {
        const botMessage = this.createChatBotMessage("Street generation completed. Updating editor...");
        this.setState((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage]
        }));
        // Call the function for updating Street
        const streetEl = streetUtils.update3DStreetEditor(response.streetmix_json);
        Events.emit('entitycreated', streetEl);
      }
    };

    handleUploadImage = () => {
      this.createChatBotMessage("Please upload an image:", {
        widget: "imageUploadWidget"
      });
    };

    handleAddElement = (message) => {
      const botMessage = this.createChatBotMessage("Processing request to add element...");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage]
      }));

      this.sendRequestToServer(message);
    };

    handleRemoveElement = (message) => {
      const botMessage = this.createChatBotMessage("Processing request to remove element...");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage]
      }));

      this.sendRequestToServer(message);
    };

    handleCreateStreet = (message) => {
      const botMessage = this.createChatBotMessage("Generating street...");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage]
      }));

      this.sendRequestToServer(message);
    };

    handleUnknownCommand = () => {
      const botMessage = this.createChatBotMessage("Command not recognized.");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage]
      }));
    };

    /* sendRequestToServer = async (endpoint, data) => {
      try {
        const response = await fetch(`${BASE_SERVER_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Received content is not JSON");
        }

        const responseData = await response.json();
        this.handleServerResponse(responseData);
        console.log('Response from server:', responseData);
      } catch (error) {
        STREET.notify.errorMessage(error);
        console.error('Error sending request to server:', error);
      }
    }; */

    sendRequestToServer = async (endpoint, data) => {
      try {
          let body, contentType;

          // Check if data is an image (assuming you have a way to determine this)
          if (data instanceof File && data.type.startsWith('image/')) {
              const formData = new FormData();
              formData.append('image', data);
              if (typeof description !== 'undefined') { // Add description if it exists
                  formData.append('description', data.description);
              }
              body = formData;
              contentType = 'multipart/form-data'; // No need to set explicitly, FormData does it
          } else {
              // If data is not an image, assume it's text (or other JSON-serializable data)
              body = JSON.stringify(data);
              contentType = 'application/json';
          }

          const response = await fetch(`${BASE_SERVER_URL}${endpoint}`, {
              method: 'POST',
              headers: {
                  'Content-Type': contentType
              },
              body: body
          });

          if (!response.ok) {
              throw new Error(`Server error: ${response.statusText}`);
          }

          const responseContentType = response.headers.get('content-type');
          if (!responseContentType || !responseContentType.includes('application/json')) {
              throw new TypeError("Received content is not JSON");
          }

          const responseData = await response.json();
          this.handleServerResponse(responseData);
          console.log('Response from server:', responseData);
      } catch (error) {
          STREET.notify.errorMessage(error);
          console.error('Error sending request to server:', error);
      }
  };
}

  export default ActionProvider;
