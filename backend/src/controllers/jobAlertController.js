const JobAlert = require('../models/JobAlert');

const ALLOWED_FREQUENCY = ['daily', 'weekly'];

/** Lấy & làm sạch dữ liệu alert từ body. */
const buildAlertPayload = (body, user) => {
  const payload = {
    keyword: typeof body.keyword === 'string' ? body.keyword.trim() : '',
    email: (body.email || user.email || '').trim().toLowerCase(),
    location: body.location || '',
    minSalary: Number(body.minSalary) || 0,
    experience: body.experience || '',
    jobType: body.jobType || '',
    frequency: ALLOWED_FREQUENCY.includes(body.frequency) ? body.frequency : 'daily',
    agreedToTerms: !!body.agreedToTerms,
  };
  if (body.minMatchScore !== undefined) {
    payload.minMatchScore = Number(body.minMatchScore) || 50;
  }
  if (body.isActive !== undefined) {
    payload.isActive = !!body.isActive;
  }
  return payload;
};

// POST /api/job-alerts
const createJobAlert = async (req, res) => {
  try {
    const payload = buildAlertPayload(req.body, req.user);

    if (!payload.keyword) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khoá tìm kiếm' });
    }
    if (!payload.email) {
      return res.status(400).json({ message: 'Vui lòng nhập email nhận thông báo' });
    }
    if (!payload.agreedToTerms) {
      return res
        .status(400)
        .json({ message: 'Bạn cần đồng ý cho phép sử dụng dữ liệu để nhận thông báo' });
    }

    const alert = await JobAlert.create({ ...payload, userId: req.user._id });
    res.status(201).json({ message: 'Đã tạo thông báo việc làm', data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/job-alerts (của tôi)
const getMyJobAlerts = async (req, res) => {
  try {
    const alerts = await JobAlert.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ data: alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Tìm alert thuộc về user hiện tại, hoặc trả về null + gửi response lỗi. */
const findOwnedAlert = async (req, res) => {
  const alert = await JobAlert.findById(req.params.id);
  if (!alert) {
    res.status(404).json({ message: 'Không tìm thấy thông báo việc làm' });
    return null;
  }
  if (alert.userId.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: 'Không có quyền' });
    return null;
  }
  return alert;
};

// PUT /api/job-alerts/:id
const updateJobAlert = async (req, res) => {
  try {
    const alert = await findOwnedAlert(req, res);
    if (!alert) return;

    const payload = buildAlertPayload(req.body, req.user);
    if (!payload.keyword) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khoá tìm kiếm' });
    }

    Object.assign(alert, payload);
    await alert.save();
    res.json({ message: 'Đã cập nhật thông báo việc làm', data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/job-alerts/:id/toggle - bật/tắt nhanh
const toggleJobAlert = async (req, res) => {
  try {
    const alert = await findOwnedAlert(req, res);
    if (!alert) return;

    alert.isActive = !alert.isActive;
    await alert.save();
    res.json({ message: alert.isActive ? 'Đã bật thông báo' : 'Đã tắt thông báo', data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/job-alerts/:id
const deleteJobAlert = async (req, res) => {
  try {
    const alert = await findOwnedAlert(req, res);
    if (!alert) return;

    await alert.deleteOne();
    res.json({ message: 'Đã xoá thông báo việc làm' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createJobAlert,
  getMyJobAlerts,
  updateJobAlert,
  toggleJobAlert,
  deleteJobAlert,
};
