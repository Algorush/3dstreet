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
        this.actionProvider.sendRequestToServer(message);
      }
    }
  }

  export default MessageParser;
