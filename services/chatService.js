const Message = require("../models/message");

async function fetchUserMessages(userId) {
  return await Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).sort({ timestamp: 1 });
}

module.exports = { fetchUserMessages };
