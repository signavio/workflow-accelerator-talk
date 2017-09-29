module.exports = {
  validate: message => {
    if (message.trim().split(" ").length === 1) {
      return message.trim() + ".";
    }
    return message;
  }
};
