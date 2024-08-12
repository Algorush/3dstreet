class MessageParser {
    constructor(actionProvider) {
      this.actionProvider = actionProvider;
    }

    parse(message) {
      // Example commands:
      // add element
      // remove element
      // create street
      if (message.length > 0) {
        const data = { description: message };
        const endpoint = '/new-street';
        this.actionProvider.sendRequestToServer(endpoint, data);
      }
    }
  }

  export default MessageParser;
