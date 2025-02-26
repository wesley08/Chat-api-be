require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const chatRoutes = require("./routes/chatRoutes");
const groupRoutes = require('./routes/groupRoutes');
const Message = require("./models/message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors({ origin: "http://localhost:8081" }));
app.use(express.json());

app.use("/api", chatRoutes);
app.use("/api", groupRoutes);


const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("setUsername", (username) => {
    users[socket.id] = username;
    io.emit("updateUserList", users);
  });

  socket.on("privateMessage", async (msg) => {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
