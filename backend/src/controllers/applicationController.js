const Application = require("../models/Application");
const Job = require("../models/Job");
const CvProfile = require("../models/CvProfile");
const aiService = require("../services/aiService");

const applyToJob = async (req, res) => {
  try {
    const { jobId, cvProfileId } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: "Thiếu jobId" });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== "open") {
      return res.status(404).json({ message: "Không tìm thấy tin hoặc tin đã đóng" });
    }

    let cvProfile;
    if (cvProfileId) {
      cvProfile = await CvProfile.findById(cvProfileId);
      if (!cvProfile || cvProfile.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Hồ sơ CV không hợp lệ" });
      }
    } else {
      cvProfile = await CvProfile.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (!cvProfile) {
        const email = req.user.email || "candidate";
        cvProfile = await CvProfile.create({
          userId: req.user._id,
          fullName: email.split("@")[0] || "Ứng viên",
          summary:
            "Hồ sơ tạo tự động khi ứng tuyển (demo). Hãy bổ sung CV đầy đủ trong Profile & CV để có điểm khớp AI.",
          skills: [],
          embedding: [],
          isLookingForJob: true,
        });
      }
    }

    const existing = await Application.findOne({
      jobId,
      candidateId: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ message: "Bạn đã ứng tuyển tin này rồi" });
    }

    let matchingScore = 0;
    if (
      cvProfile.embedding &&
      cvProfile.embedding.length > 0 &&
      job.embedding &&
      job.embedding.length > 0
    ) {
      const raw = await aiService.calculateMatchingScore(cvProfile.embedding, job.embedding);
      matchingScore = Math.round(Math.min(1, Math.max(0, raw)) * 100);
    }

    const application = await Application.create({
      jobId,
      candidateId: req.user._id,
      cvProfileId: cvProfile._id,
      matchingScore,
      status: "pending",
    });

    const populated = await Application.findById(application._id).populate({
      path: "jobId",
      populate: { path: "employerId", select: "email role" },
    });

    try {
      const Notification = require('../models/Notification');
      const scoreText = matchingScore > 0 ? ` — Điểm khớp: ${matchingScore}%` : '';

      await Notification.updateMany(
        { userId: req.user._id, jobId: job._id, type: 'job_match' },
        { $set: { isDeleted: true } }
      );

      await Notification.create({
        userId: req.user._id,
        type: 'new_application',
        title: `Đã ứng tuyển: ${job.title}`,
        body: `Đơn ứng tuyển của bạn đã được gửi thành công (sử dụng CV: ${cvProfile.fullName})${scoreText}`,
        matchingScore: matchingScore || null,
        jobId: job._id,
        applicationId: application._id,
        cvProfileId: cvProfile._id
      });

      await Notification.create({
        userId: job.employerId,
        type: 'new_application',
        title: `Ứng viên mới cho: ${job.title}`,
        body: `${cvProfile.fullName || req.user.email} vừa ứng tuyển vị trí này${scoreText}`,
        matchingScore: matchingScore || null,
        jobId: job._id,
        applicationId: application._id,
        candidateId: req.user._id,
        cvProfileId: cvProfile._id,
      });
    } catch (notifErr) {
      console.error('[Notification] Lỗi tạo thông báo:', notifErr.message);
    }

    res.status(201).json({ message: "Ứng tuyển thành công", data: populated });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ candidateId: req.user._id })
      .populate({
        path: "jobId",
        select: "-embedding", 
        populate: { path: "employerId", select: "email role" },
      })
      .sort({ appliedAt: -1 });

    res.json({ data: apps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationsForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    }

    if (
      job.employerId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Không có quyền xem danh sách này" });
    }

    const apps = await Application.find({ jobId: req.params.jobId })
      .populate("candidateId", "email role")
      .populate("cvProfileId")
      .sort({ matchingScore: -1 });

    const BASE_URL = `${req.protocol}://${req.get('host')}`;
    const appsWithPdfUrl = apps.map(app => {
      const obj = app.toObject();
      if (obj.cvProfileId?.fileUrl) {
        const relativePath = obj.cvProfileId.fileUrl
          .replace(/\\/g, '/')
          .replace(/^.*uploads\//, 'uploads/');
        obj.cvProfileId.pdfUrl = `${BASE_URL}/${relativePath}`;
      }
      return obj;
    });

    res.json({ data: appsWithPdfUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['reviewed', 'interview', 'accepted', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Trạng thái không hợp lệ. Cho phép: ${allowedStatuses.join(', ')}` });
    }

    const app = await Application.findById(req.params.id).populate('jobId');
    if (!app) return res.status(404).json({ message: 'Không tìm thấy đơn ứng tuyển' });

    if (
      app.jobId.employerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn này' });
    }

    app.status = status;
    await app.save();

    res.json({ message: 'Cập nhật trạng thái thành công', data: app });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: "Không tìm thấy đơn ứng tuyển" });
    }

    if (
      app.candidateId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Bạn không có quyền hủy đơn này" });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Hủy đơn ứng tuyển thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  deleteApplication,
};
