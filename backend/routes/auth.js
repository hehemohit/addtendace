const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '24h' });
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check for existing attendance record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      employee: user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    let sessionStartTime = new Date();
    let isSessionContinuation = false;

    // Check if user has a recent logout (within 10 minutes)
    if (attendance && attendance.clockOut) {
      const logoutTime = new Date(attendance.clockOut);
      const now = new Date();
      const timeDiff = now - logoutTime;
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

      if (timeDiff <= tenMinutes) {
        // Continue the same session
        isSessionContinuation = true;
        sessionStartTime = attendance.clockIn; // Keep original session start time
        attendance.clockOut = null; // Remove clock out time
        await attendance.save();
      } else {
        // Create new attendance record
        attendance = new Attendance({
          employee: user._id,
          date: today,
          clockIn: sessionStartTime
        });
        await attendance.save();
      }
    } else if (!attendance) {
      // No attendance record for today, create new one
      attendance = new Attendance({
        employee: user._id,
        date: today,
        clockIn: sessionStartTime
      });
      await attendance.save();
    } else if (attendance && !attendance.clockOut) {
      // User is already logged in, update session start time
      sessionStartTime = attendance.clockIn;
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: isSessionContinuation ? 'Login successful - Session continued' : 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position
      },
      attendance: {
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
        isLoggedIn: !attendance.clockOut
      },
      sessionInfo: {
        startTime: sessionStartTime,
        isContinuation: isSessionContinuation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (attendance && attendance.clockIn && !attendance.clockOut) {
      attendance.clockOut = new Date();
      await attendance.save();
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    res.json({
      user: req.user,
      attendance: attendance ? {
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
        isLoggedIn: !attendance.clockOut,
        totalHours: attendance.totalHours
      } : null
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', department, position } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department: department || 'General',
      position: position || 'Employee'
    });

    await user.save();

    // Generate token for immediate login
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'User with this email already exists' });
    } else {
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
