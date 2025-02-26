const Employee = require("../models/employee");
const EmployeeAtt = require("../models/employeeAttendance");
const EmployeeLeave = require("../models/employeeLeave");

async function fetchEmployeeDetails(userIds) {
  const employees = await Employee.find({ _id: { $in: Array.from(userIds) } });
  return Object.fromEntries(
    employees.map((emp) => [
      emp._id.toString(),
      `${emp.first_name} ${emp.last_name}`,
    ])
  );
}

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

module.exports = {
  fetchEmployeeDetails,
  fetchEmployeeAttendance,
  fetchEmployeeLeaves,
};
