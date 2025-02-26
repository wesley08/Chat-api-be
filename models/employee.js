const { employeesConnection } = require("../config/database");
const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    first_name: String,
    last_name: String,
    email: String,
  },
  { collection: "employees" }
);

module.exports = employeesConnection.model("Employee", EmployeeSchema);
