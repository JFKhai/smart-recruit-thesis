const Notification = require('../models/Notification');


const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id, isDeleted: { $ne: true } })
      .populate('jobId', 'title location')
      .populate('candidateId', 'email')
      .populate('cvProfileId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ data: notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
      isDeleted: { $ne: true },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    if (notif.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền' });
    }
    notif.isRead = true;
    await notif.save();
    res.json({ message: 'Đã đánh dấu đã đọc', data: notif });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    if (notif.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền' });
    }
    notif.isDeleted = true;
    await notif.save();
    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
