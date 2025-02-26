const express = require("express");
const router = express.Router();
const { fetchUserMessages } = require("../services/chatService");
const {
  fetchEmployeeDetails,
  fetchEmployeeAttendance,
  fetchEmployeeLeaves,
} = require("../services/employeeService");

router.get("/getChatList", async (req, res) => {
  try {
    const userId = req.query.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messages = await fetchUserMessages(userId);

    const chatMap = new Map();
    const userIds = new Set();

    messages.forEach((msg) => {
      const chatId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      userIds.add(chatId);

      if (!chatMap.has(chatId)) {
        chatMap.set(chatId, {
          id: chatId,
          name: "",
          status: "Outside Office",
          messages: [],
        });
      }

      chatMap.get(chatId).messages.push({
        type: msg.senderId === userId ? "send" : "receive",
        text: msg.text,
        time: msg.timestamp.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
    });

    const employeeMap = await fetchEmployeeDetails(userIds);
    const employeeAttMap = await fetchEmployeeAttendance(userIds, today);
    const employeeLeaveMap = await fetchEmployeeLeaves(userIds, today);

    chatMap.forEach((chat, chatId) => {
      chat.name = employeeMap[chatId] || "Unknown";
      chat.preview = chat.messages[chat.messages.length - 1].text || "Test";
      chat.status =
        employeeLeaveMap[chatId] || employeeAttMap[chatId] || "Outside Office";
    });

    res.json({ success: true, data: Array.from(chatMap.values()) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving messages",
      error: error.message,
    });
  }
});

module.exports = router;
