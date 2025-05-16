const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  employeeId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  department: { type: String }, // Optional for Admin role
  role: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
