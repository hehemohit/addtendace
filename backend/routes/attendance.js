const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Get current user's attendance history
router.get('/my-attendance', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const query = { employee: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all attendance records (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      employeeId, 
      startDate, 
      endDate, 
      status,
      search 
    } = req.query;
    
    const query = {};
    
    if (employeeId) {
      query.employee = employeeId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (status) {
      query.status = status;
    }

    let attendanceQuery = Attendance.find(query)
      .populate('employee', 'name email department position')
      .populate('editedBy', 'name email')
      .sort({ date: -1 });

    // If search is provided, filter by employee name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      query.employee = { $in: userIds };
      attendanceQuery = Attendance.find(query)
        .populate('employee', 'name email department position')
        .populate('editedBy', 'name email')
        .sort({ date: -1 });
    }

    const attendance = await attendanceQuery
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's attendance overview (Admin only)
router.get('/today-overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('employee', 'name email department position');

    const allEmployees = await User.find({ role: 'employee', isActive: true })
      .select('name email department position');

    const attendanceMap = new Map();
    todayAttendance.forEach(record => {
      if (record.employee && record.employee._id) {
        attendanceMap.set(record.employee._id.toString(), record);
      }
    });

    const overview = allEmployees.map(employee => {
      const attendance = attendanceMap.get(employee._id.toString());
      return {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          position: employee.position
        },
        attendance: attendance ? {
          clockIn: attendance.clockIn,
          clockOut: attendance.clockOut,
          totalHours: attendance.totalHours,
          status: attendance.status,
          isLoggedIn: !attendance.clockOut
        } : {
          clockIn: null,
          clockOut: null,
          totalHours: 0,
          status: 'absent',
          isLoggedIn: false
        }
      };
    });

    res.json(overview);
  } catch (error) {
    console.error('Get today overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active user sessions (Admin only)
router.get('/active-sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all users
    const allUsers = await User.find({ role: 'employee', isActive: true })
      .select('name email department position');

    // Get today's attendance records
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      clockIn: { $exists: true },
      $or: [
        { clockOut: { $exists: false } },
        { clockOut: null }
      ]
    }).populate('employee', 'name email department position');

    // Create a map of active sessions
    const activeSessionsMap = new Map();
    todayAttendance.forEach(record => {
      if (record.employee && record.employee._id) {
        activeSessionsMap.set(record.employee._id.toString(), {
          employee: record.employee,
          clockIn: record.clockIn,
          clockOut: record.clockOut,
          totalHours: record.totalHours,
          status: record.status,
          isLoggedIn: !record.clockOut
        });
      }
    });

    // Create response with all users and their session status
    const userSessions = allUsers.map(user => {
      const session = activeSessionsMap.get(user._id.toString());
      return {
        employee: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          position: user.position
        },
        session: session || {
          clockIn: null,
          clockOut: null,
          totalHours: 0,
          status: 'absent',
          isLoggedIn: false
        }
      };
    });

    res.json(userSessions);
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single attendance record
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('editedBy', 'name email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if user can access this record
    if (req.user.role === 'employee' && attendance.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance record (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clockIn, clockOut, status, notes } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (clockIn) attendance.clockIn = new Date(clockIn);
    if (clockOut) attendance.clockOut = new Date(clockOut);
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    
    attendance.isManualEntry = true;
    attendance.editedBy = req.user._id;

    await attendance.save();

    const updatedAttendance = await Attendance.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('editedBy', 'name email');

    res.json({
      message: 'Attendance record updated successfully',
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manual attendance record (Admin only)
router.post('/manual', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { employeeId, date, clockIn, clockOut, status, notes } = req.body;

    if (!employeeId || !date || !clockIn) {
      return res.status(400).json({ message: 'Employee ID, date, and clock-in time are required' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance record already exists for this date
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: attendanceDate, $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this date' });
    }

    const attendance = new Attendance({
      employee: employeeId,
      date: attendanceDate,
      clockIn: new Date(clockIn),
      clockOut: clockOut ? new Date(clockOut) : null,
      status: status || 'present',
      notes: notes || '',
      isManualEntry: true,
      editedBy: req.user._id
    });

    await attendance.save();

    const newAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email department position')
      .populate('editedBy', 'name email');

    res.status(201).json({
      message: 'Manual attendance record created successfully',
      attendance: newAttendance
    });
  } catch (error) {
    console.error('Create manual attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const totalRecords = await Attendance.countDocuments(query);
    const presentRecords = await Attendance.countDocuments({ ...query, status: 'present' });
    const absentRecords = await Attendance.countDocuments({ ...query, status: 'absent' });
    const lateRecords = await Attendance.countDocuments({ ...query, status: 'late' });
    const halfDayRecords = await Attendance.countDocuments({ ...query, status: 'half-day' });

    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

    res.json({
      totalRecords,
      presentRecords,
      absentRecords,
      lateRecords,
      halfDayRecords,
      totalEmployees,
      attendanceRate: totalEmployees > 0 ? Math.round((presentRecords / totalEmployees) * 100) : 0
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
