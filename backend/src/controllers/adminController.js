const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const CvProfile = require('../models/CvProfile');
const Notification = require('../models/Notification');

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      totalCvs,
      totalNotifications,
      unreadNotifications,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments({ status: { $in: ['closed', 'archived'] } }),
      Application.countDocuments(),
      CvProfile.countDocuments(),
      Notification.countDocuments({ isDeleted: { $ne: true } }),
      Notification.countDocuments({ isRead: false, isDeleted: { $ne: true } }),
      User.countDocuments({ status: 'banned' }),
    ]);

    const recentUsers = await User.find()
      .select('email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentApplications = await Application.find()
      .populate('candidateId', 'email')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 })
      .limit(5);

    res.json({
      data: {
        users: { total: totalUsers, candidates: totalCandidates, employers: totalEmployers, banned: bannedUsers },
        jobs: { total: totalJobs, open: openJobs, closed: closedJobs },
        applications: { total: totalApplications },
        cvs: { total: totalCvs },
        notifications: { total: totalNotifications, unread: unreadNotifications },
        recentUsers,
        recentApplications,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role; // 'candidate' | 'employer' | 'admin'
    const status = req.query.status; // 'active' | 'banned'
    const search = req.query.search;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) filter.email = { $regex: search, $options: 'i' };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Status không hợp lệ. Chỉ chấp nhận: active, banned' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái tài khoản của chính mình' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    res.json({ message: `Đã ${status === 'banned' ? 'khoá' : 'kích hoạt'} tài khoản thành công`, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    res.json({ message: 'Đã xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('employerId', 'email')
      .select('-embedding')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

   
    const jobsWithCount = await Promise.all(
      jobs.map(async (job) => {
        const applyCount = await Application.countDocuments({ jobId: job._id });
        return { ...job.toObject(), applyCount };
      })
    );

    res.json({ data: jobsWithCount, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const closeJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng' });
    res.json({ message: 'Đã đóng tin tuyển dụng', data: job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng' });
    res.json({ message: 'Đã xóa tin tuyển dụng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSystemInfo = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const dbState = mongoose.connection.readyState;
    const dbStateMap = { 0: 'Ngắt kết nối', 1: 'Đã kết nối', 2: 'Đang kết nối', 3: 'Đang ngắt kết nối' };

    const aiServiceUrl = process.env.AI_SERVICE_URL || '(Chưa cấu hình)';
    const nodeEnv = process.env.NODE_ENV || 'development';

    const [totalNotifications, softDeletedNotifications, totalCvWithEmbedding] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isDeleted: true }),
      CvProfile.countDocuments({ embedding: { $exists: true, $not: { $size: 0 } } }),
    ]);

    res.json({
      data: {
        server: {
          uptime: `${hours}h ${minutes}m ${seconds}s`,
          uptimeSeconds,
          nodeEnv,
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
        database: {
          status: dbStateMap[dbState] || 'Không xác định',
          readyState: dbState,
          host: mongoose.connection.host || '—',
          name: mongoose.connection.name || '—',
        },
        services: {
          aiServiceUrl,
          cronSchedule: '* * * * * (mỗi 1 phút — chế độ Demo)',
        },
        notifications: {
          total: totalNotifications,
          softDeleted: softDeletedNotifications,
        },
        cvs: {
          withEmbedding: totalCvWithEmbedding,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getJobs,
  closeJob,
  deleteJob,
  getSystemInfo,
};
