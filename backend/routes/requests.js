const express = require('express');
const Request = require('../models/Request');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all requests (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const requests = await Request.find(query)
      .populate('employee', 'name email department position')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get requests by employee (Employee only)
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const requests = await Request.find({ employee: req.user._id })
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments({ employee: req.user._id });

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('resolvedBy', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user has access to this request
    if (req.user.role !== 'admin' && request.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new request (Employee only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    const request = new Request({
      employee: req.user._id,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium'
    });

    await request.save();
    await request.populate('employee', 'name email department position');

    res.status(201).json({
      message: 'Request created successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await request.updateStatus(status, adminResponse, req.user._id);
    await request.populate('employee', 'name email department position');
    await request.populate('resolvedBy', 'name email');

    res.json({
      message: 'Request status updated successfully',
      request
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get request statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Request.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Request.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });

    res.json({
      totalRequests,
      pendingRequests,
      statusStats: stats,
      categoryStats,
      priorityStats
    });
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
