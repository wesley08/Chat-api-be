require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(
  cors({
    origin: "http://localhost:8081",
  })
);
app.use(express.json());

// Connect to MongoDB
const chatDbURI =
  "mongodb+srv://wesleywesley:MeygaVC3HGPSF00V@cluster0.pfemjwc.mongodb.net/chat";
const employeesDbURI =
  "mongodb://root:Ao3$v~JUc673uVoX@10.0.3.25:27017/uat_hrms?authSource=admin";

mongoose
  .connect(chatDbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Chat Database Connected"))
  .catch(console.error);

const employeesConnection = mongoose.createConnection(employeesDbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
employeesConnection.once("open", () =>
  console.log("Employees Database Connected")
);

// Define message schema
const Message = mongoose.model(
  "Message",
  new mongoose.Schema({
    messageId: String,
    text: String,
    senderId: String,
    receiverId: String,
    timestamp: { type: Date, default: Date.now },
    status: String,
  })
);

const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("setUsername", (username) => {
    users[socket.id] = username;
    io.emit("updateUserList", users);
  });

  socket.on("privateMessage", async (msg) => {
    console.log(
      `Message from ${msg.senderId} to ${msg.receiverId}: ${msg.text}`
    );
    const receiverSocketId = Object.keys(users).find(
      (id) => users[id] === msg.receiverId
    );
    if (receiverSocketId) io.to(receiverSocketId).emit("privateMessage", msg);
    await new Message(msg).save();
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("updateUserList", users);
  });
});

app.post("/api/setUsername", (req, res) => {
  users[req.body.socketId] = req.body.username;
  io.emit("updateUserList", users);
  res.json({ success: true, message: "Username set successfully" });
});

app.post("/api/sendMessage", async (req, res) => {
  await new Message(req.body).save();
  res.json({ success: true, message: "Message sent and saved" });
});

// Define Employee Schema using employeesConnection
const EmployeeSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    first_name: String,
    last_name: String,
    email: String,
  },
  { collection: "employees" }
);

const Employee = employeesConnection.model("Employee", EmployeeSchema);

// Define Employee Attendance Schema using employeesConnection
const EmployeeAttSchema = new mongoose.Schema(
  {
    employee_id: mongoose.Schema.Types.ObjectId,
    checkin_time: Date,
    checkout_time: Date,
    created_at: Date,
  },
  { collection: "employee_attendances" }
);

const EmployeeAtt = employeesConnection.model("EmployeeAtt", EmployeeAttSchema);

// Define Employee Leave Schema using employeesConnection
const EmployeeLeaveSchema = new mongoose.Schema(
  {
    employee_id: mongoose.Schema.Types.ObjectId,
    created_at: Date,
  },
  { collection: "employee_leaves" }
);

const EmployeeLeave = employeesConnection.model(
  "EmployeeLeave",
  EmployeeLeaveSchema
);

// Helper function to fetch employee details
async function fetchEmployeeDetails(userIds) {
  const employees = await Employee.find({ _id: { $in: Array.from(userIds) } });
  return Object.fromEntries(
    employees.map((emp) => [
      emp._id.toString(),
      `${emp.first_name} ${emp.last_name}`,
    ])
  );
}

// Helper function to fetch employee attendance for today
async function fetchEmployeeAttendance(userIds, today) {
  const employeeAtt = await EmployeeAtt.find({
    employee_id: { $in: Array.from(userIds) },
    created_at: { $gte: today },
  });
  return Object.fromEntries(
    employeeAtt.map((att) => [
      att.employee_id.toString(),
      att.checkin_time ? "At The Office" : "Outside Office",
    ])
  );
}

// Helper function to fetch employee leaves
async function fetchEmployeeLeaves(userIds, today) {
  const employeeLeaves = await EmployeeLeave.find({
    employee_id: { $in: Array.from(userIds) },
    leave_start: { $lte: today },
    leave_end: { $gte: today },
  });
  return Object.fromEntries(
    employeeLeaves.map((leave) => [leave.employee_id.toString(), "Day Off"])
  );
}

// Helper function to update chat map with employee names and status
function updateChatMap(chatMap, employeeMap, employeeAttMap, employeeLeaveMap) {
  chatMap.forEach((chat, chatId) => {
    chat.name = employeeMap[chatId] || "Unknown";
    chat.preview = chat.messages[chat.messages.length - 1].text || "Test";
    chat.status =
      employeeLeaveMap[chatId] || employeeAttMap[chatId] || "Outside Office";
  });
}

app.get("/api/getChatList", async (req, res) => {
  try {
    const userId = req.query.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the start of the day

    // Fetch messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ timestamp: 1 });

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

      const formatTime = (utcString) => {
        if (!utcString) {
          return "";
        }
        const date = new Date(utcString);
        if (isNaN(date)) {
          return "";
        }

        const options = { hour: "numeric", minute: "2-digit", hour12: true };
        return date.toLocaleTimeString(undefined, options);
      };

      chatMap.get(chatId).messages.push({
        type: msg.senderId === userId ? "send" : "receive",
        text: msg.text,
        time: formatTime(msg.timestamp),
      });
    });

    // Fetch employee details, attendance, and leaves
    const employeeMap = await fetchEmployeeDetails(userIds);
    const employeeAttMap = await fetchEmployeeAttendance(userIds, today);
    const employeeLeaveMap = await fetchEmployeeLeaves(userIds, today);

    // Update chatMap with employee names and status
    updateChatMap(chatMap, employeeMap, employeeAttMap, employeeLeaveMap);

    res.json({ success: true, data: Array.from(chatMap.values()) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving messages",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
