import update3DStreetEditor from '../../../../street-utils.js';

class ActionProvider {
    constructor(createChatBotMessage, setStateFunc) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setStateFunc;
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
        update3DStreetEditor(response.streetmix_json);
      }
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

    sendRequestToServer = async (message) => {
      try {
        const response = await fetch('/new-street', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: message })
        });

        const data = await response.json();
        this.handleServerResponse(data);
      } catch (error) {
        this.handleServerResponse({ error: 'Error while sending request to server' });
      }
    };
  }

  export default ActionProvider;
