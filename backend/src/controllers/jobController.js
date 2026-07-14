const Job = require("../models/Job");
const CvProfile = require("../models/CvProfile");
const aiService = require("../services/aiService");

const computeJobEmbedding = async (title, description, requirements) => {
  const reqArr = Array.isArray(requirements) ? requirements : [];
  const text = [title, description, ...reqArr].filter(Boolean).join("\n").substring(0, 3000);
  if (!text.trim()) {
    return [];
  }
  try {
    const emb = await aiService.getEmbedding(text);
    return emb && emb.length ? emb : [];
  } catch (e) {
    console.error("computeJobEmbedding:", e.message);
    return [];
  }
};

const matchJobWithAllCandidates = async (job) => {
  if (!job.embedding || job.embedding.length === 0) return;
  try {
    const User = require("../models/User");
    const CvProfileModel = require("../models/CvProfile");
    const Notification = require("../models/Notification");
    const CompanyProfileModel = require("../models/CompanyProfile");

    const companyProf = await CompanyProfileModel.findOne({ userId: job.employerId });
    const companyName = companyProf?.companyName || "Đối tác của Smart Recruit";

    const candidates = await User.find({
      role: "candidate",
      isEmailSubscribed: true,
    });

    for (const candidate of candidates) {
      const ApplicationModel = require("../models/Application");
      const hasApplied = await ApplicationModel.findOne({
        candidateId: candidate._id,
        jobId: job._id
      });
      if (hasApplied) continue;

      const cv = await CvProfileModel.findOne({ userId: candidate._id }).sort({ createdAt: -1 });
      if (!cv || !cv.isLookingForJob || !cv.embedding || cv.embedding.length === 0) continue;

      const minMatchScore = candidate.minMatchScore || 70;
      const rawScore = await aiService.calculateMatchingScore(cv.embedding, job.embedding);
      const percent = Math.round(Math.min(1, Math.max(0, rawScore)) * 100);

      if (percent >= minMatchScore) {
        const candidateNotifExists = await Notification.findOne({
          userId: candidate._id,
          type: 'job_match',
          jobId: job._id
        });
        if (!candidateNotifExists) {
          await Notification.create({
            userId: candidate._id,
            type: 'job_match',
            title: `Cơ hội việc làm mới phù hợp: ${job.title}`,
            body: `Hệ thống AI phát hiện bạn phù hợp ${percent}% với vị trí này tại ${companyName} (dựa trên CV: ${cv.fullName}).`,
            matchingScore: percent,
            jobId: job._id,
            cvProfileId: cv._id
          });
          console.log(`[Notification - Instant] Created candidate matching notification: ${candidate.email} - job: ${job.title}`);
        }

        const employerNotifExists = await Notification.findOne({
          userId: job.employerId,
          type: 'job_match',
          jobId: job._id,
          candidateId: candidate._id
        });
        if (!employerNotifExists) {
          await Notification.create({
            userId: job.employerId,
            type: 'job_match',
            title: `Ứng viên tiềm năng mới cho: ${job.title}`,
            body: `Hệ thống AI phát hiện ứng viên ${cv.fullName} phù hợp ${percent}% với yêu cầu tuyển dụng.`,
            matchingScore: percent,
            jobId: job._id,
            candidateId: candidate._id,
            cvProfileId: cv._id
          });
          console.log(`[Notification - Instant] Created employer matching notification: ${job.employerId} - candidate: ${candidate.email}`);
        }
      }
    }
  } catch (err) {
    console.error("Lỗi khi khớp nhanh sau khi tạo job:", err.message);
  }
};

const getAllOpenJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .populate("employerId", "email role")
      .sort({ createdAt: -1 });

    res.json({ data: jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ data: jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const CompanyProfile = require('../models/CompanyProfile');
    const job = await Job.findById(req.params.id).populate("employerId", "email role");
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    }

    const companyProfile = await CompanyProfile.findOne({ userId: job.employerId._id || job.employerId });

    const otherJobs = await Job.find({
      employerId: job.employerId._id || job.employerId,
      status: 'open',
      _id: { $ne: job._id }
    }).select('title location salary expiresAt createdAt').limit(5);

    res.json({ data: job, companyProfile: companyProfile || null, otherJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    const payload = {
      employerId: req.user._id,
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements || [],
      location: req.body.location,
      salary: req.body.salary || '',
      jobType: req.body.jobType || '',
      experience: req.body.experience || '',
      level: req.body.level || '',
      industry: req.body.industry || '',
      benefits: req.body.benefits || [],
      expiresAt: req.body.expiresAt,
      isEmailEnabled:
        typeof req.body.isEmailEnabled === "boolean"
          ? req.body.isEmailEnabled
          : true,
      status: req.body.status || "open",
    };

    const embedding = await computeJobEmbedding(
      payload.title,
      payload.description,
      payload.requirements,
    );

    const createdJob = await Job.create({ ...payload, embedding });

    matchJobWithAllCandidates(createdJob).catch(err =>
      console.error("Lỗi khi chạy matchJobWithAllCandidates:", err.message)
    );

    res.status(201).json({ message: "Tạo tin tuyển dụng thành công", data: createdJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createJobFromOld = async (req, res) => {
  try {
    const oldJob = await Job.findById(req.params.id);
    if (!oldJob) {
      return res.status(404).json({ message: "Không tìm thấy tin gốc để sao chép" });
    }

    if (oldJob.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền sao chép tin tuyển dụng này" });
    }

    const copiedJob = await Job.create({
      employerId: req.user._id,
      title: req.body.title || oldJob.title,
      description: req.body.description || oldJob.description,
      requirements: req.body.requirements || oldJob.requirements,
      location: req.body.location || oldJob.location,
      expiresAt: req.body.expiresAt || oldJob.expiresAt,
      isEmailEnabled:
        typeof req.body.isEmailEnabled === "boolean"
          ? req.body.isEmailEnabled
          : oldJob.isEmailEnabled,
      status: req.body.status || "open",
      embedding: oldJob.embedding || [],
    });

    res.status(201).json({ message: "Tạo tin mới từ tin cũ thành công", data: copiedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền cập nhật tin tuyển dụng này" });
    }

    const allowedFields = [
      "title",
      "description",
      "requirements",
      "location",
      "expiresAt",
      "isEmailEnabled",
      "status",
    ];

    let shouldReembed = false;
    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        if (field === "title" || field === "description" || field === "requirements") {
          shouldReembed = true;
        }
        job[field] = req.body[field];
      }
    });

    if (shouldReembed) {
      job.embedding = await computeJobEmbedding(job.title, job.description, job.requirements);
    }

    const updatedJob = await job.save();
    res.json({ message: "Cập nhật tin tuyển dụng thành công", data: updatedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền xóa tin tuyển dụng này" });
    }

    await job.deleteOne();
    res.json({ message: "Xóa tin tuyển dụng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    }

    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền khóa tin tuyển dụng này" });
    }

    job.status = "closed";
    await job.save();

    res.json({ message: "Đã khóa tin tuyển dụng", data: job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getJobsWithMatchPreview = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .populate("employerId", "email role")
      .sort({ createdAt: -1 });

    let cvProfile = await CvProfile.findOne({ userId: req.user._id, isPrimary: true });
    if (!cvProfile) {
      cvProfile = await CvProfile.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    }
    const cvEmbedding = cvProfile?.embedding || [];
    const hasEmbedding = cvEmbedding.length > 0;

    const jobsWithScore = await Promise.all(
      jobs.map(async (job) => {
        const jobObj = job.toObject();
        let previewScore = null;
        if (hasEmbedding && job.embedding && job.embedding.length > 0) {
          try {
            const raw = await aiService.calculateMatchingScore(cvEmbedding, job.embedding);
            previewScore = Math.round(Math.min(1, Math.max(0, raw)) * 100);
          } catch {
            previewScore = null;
          }
        }
        return { ...jobObj, previewScore };
      })
    );


    jobsWithScore.sort((a, b) => {
      if (a.previewScore === null && b.previewScore === null) return 0;
      if (a.previewScore === null) return 1;
      if (b.previewScore === null) return -1;
      return b.previewScore - a.previewScore;
    });

    res.json({
      data: jobsWithScore,
      hasEmbedding,
      cvName: cvProfile ? cvProfile.fullName : null,
      cvId: cvProfile ? cvProfile._id : null,
      isPrimary: cvProfile ? cvProfile.isPrimary : false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllOpenJobs,
  getMyJobs,
  getJobById,
  createJob,
  createJobFromOld,
  updateJob,
  deleteJob,
  closeJob,
  getJobsWithMatchPreview,
};
