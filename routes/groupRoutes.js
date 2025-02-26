const express = require('express');
const router = express.Router();
const Group = require('../models/group');
const EmployeeGroup = require('../models/employeeGroup');

router.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find({ default: false, deleted: false });
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving groups", error: error.message });
  }
});

router.post("/joinGroup", async (req, res) => {
  try {
    const { employee_id, group_id } = req.body;
    const employeeGroup = new EmployeeGroup({ employee_id, group_id });
    await employeeGroup.save();
    res.json({ success: true, message: "Joined group successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error joining group", error: error.message });
  }
});

router.post("/leaveGroup", async (req, res) => {
  try {
    const { employee_id, group_id } = req.body;
    await EmployeeGroup.findOneAndUpdate({ employee_id, group_id }, { deleted: true, updated_at: new Date() });
    res.json({ success: true, message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error leaving group", error: error.message });
  }
});

router.get("/employeeGroups", async (req, res) => {
  try {
    const { employee_id } = req.query;

    const employeeGroups = await EmployeeGroup.find({ employee_id, deleted: false })
      .populate("group_id");

    const formattedGroups = employeeGroups.map((eg) => ({
      group_id: eg.group_id?._id || "Unknown ID",
      group_name: eg.group_id?.name || "Unknown Group",
    }));

    res.json({ success: true, data: formattedGroups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving employee groups", error: error.message });
  }
});

module.exports = router;