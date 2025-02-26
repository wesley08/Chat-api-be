const mongoose = require("mongoose");

const chatDbURI = process.env.chatDbURI;

const employeesDbURI = process.env.employeesDbURI;

// Chat DB Connection
mongoose
  .connect(chatDbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Chat Database Connected"))
  .catch(console.error);

// Employees DB Connection
const employeesConnection = mongoose.createConnection(employeesDbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

employeesConnection.once("open", () =>
  console.log("Employees Database Connected")
);

module.exports = { mongoose, employeesConnection };
