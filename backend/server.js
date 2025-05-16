require('dotenv').config();  // Load env variables
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Root Route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, employeeId, password, department, role, adminCode } = req.body;

  if (!name || !email || !employeeId || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (role === 'Admin' && adminCode !== process.env.ADMIN_CODE) {
    return res.status(400).json({ message: 'Invalid admin code!' });
  }

  if (role === 'Employee' && !department) {
    return res.status(400).json({ message: 'Department is required for employees' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      employeeId,
      password: hashedPassword,
      department,
      role,
    });

    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    const user = await User.findOne({ employeeId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, employeeId: user.employeeId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
