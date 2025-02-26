const mongoose = require('mongoose');

const EmployeeGroupSchema = new mongoose.Schema({
  employee_id: mongoose.Schema.Types.ObjectId,
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: "employee_groups" });

module.exports = mongoose.model("EmployeeGroup", EmployeeGroupSchema);