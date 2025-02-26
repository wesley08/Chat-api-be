const { employeesConnection } = require("../config/database");
const mongoose = require("mongoose");

const EmployeeAttSchema = new mongoose.Schema(
  {
    employee_id: mongoose.Schema.Types.ObjectId,
    checkin_time: Date,
    checkout_time: Date,
    created_at: Date,
  },
  { collection: "employee_attendances" }
);

module.exports = employeesConnection.model("EmployeeAtt", EmployeeAttSchema);
