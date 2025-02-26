const { employeesConnection } = require("../config/database");
const mongoose = require("mongoose");

const EmployeeLeaveSchema = new mongoose.Schema(
  {
    employee_id: mongoose.Schema.Types.ObjectId,
    created_at: Date,
    leave_start: Date,
    leave_end: Date,
  },
  { collection: "employee_leaves" }
);

module.exports = employeesConnection.model(
  "EmployeeLeave",
  EmployeeLeaveSchema
);
