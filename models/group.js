const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: String,
  default: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: "groups" });

module.exports = mongoose.model("Group", GroupSchema);