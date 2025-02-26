const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  messageId: String,
  text: String,
  senderId: String,
  receiverId: String,
  timestamp: { type: Date, default: Date.now },
  status: String,
});

module.exports = mongoose.model("Message", MessageSchema);
