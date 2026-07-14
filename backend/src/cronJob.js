const cron = require("node-cron");
const User = require("./models/User");
const CvProfile = require("./models/CvProfile");
const Job = require("./models/Job");
const JobAlert = require("./models/JobAlert");
const Application = require("./models/Application");
const CompanyProfile = require("./models/CompanyProfile");
const Notification = require("./models/Notification");
const aiService = require("./services/aiService");
const emailService = require("./services/emailService");
const { matchJobToAlert, isAlertDue } = require("./utils/alertMatching");

// Floor AI score for jobs that already passed hard alert filters
const ALERT_BASE_SCORE = 60;

const resolveCompanyName = async (job) => {
  const companyProf = await CompanyProfile.findOne({
    userId: job.employerId?._id || job.employerId,
  });
  return (
    companyProf?.companyName ||
    job.employerId?.email ||
    "Đối tác của Smart Recruit"
  );
};

const calcAiPercent = async (cv, job) => {
  if (!cv?.embedding?.length || !job?.embedding?.length) return null;
  try {
    const raw = await aiService.calculateMatchingScore(cv.embedding, job.embedding);
    return Math.round(Math.min(1, Math.max(0, raw)) * 100);
  } catch {
    return null;
  }
};

const ensureCandidateNotif = async (candidate, cv, job, companyName, score, keyword) => {
  const exists = await Notification.findOne({
    userId: candidate._id,
    type: "job_match",
    jobId: job._id,
  });
  if (exists) return;
  await Notification.create({
    userId: candidate._id,
    type: "job_match",
    title: `Việc làm mới khớp thông báo "${keyword}": ${job.title}`,
    body: `Vị trí này tại ${companyName} khớp ${score}% với thông báo việc làm của bạn (từ khoá: ${keyword}).`,
    matchingScore: score,
    jobId: job._id,
    cvProfileId: cv?._id || null,
  });
};

// Returns true if candidate has active alerts (caller should skip CV fallback)
const runAlertMatching = async (candidate, cv, openJobs) => {
  const alerts = await JobAlert.find({ userId: candidate._id, isActive: true });
  if (!alerts.length) return false;

  for (const alert of alerts) {
    if (!isAlertDue(alert)) continue;

    const since = alert.lastNotifiedAt || alert.createdAt;
    const matchedJobs = [];

    for (const job of openJobs) {
      if (new Date(job.createdAt) <= new Date(since)) continue;

      const hasApplied = await Application.findOne({
        candidateId: candidate._id,
        jobId: job._id,
      });
      if (hasApplied) continue;

      const aiPercent = await calcAiPercent(cv, job);
      const relevance =
        aiPercent != null ? Math.max(ALERT_BASE_SCORE, aiPercent) : ALERT_BASE_SCORE;

      const result = matchJobToAlert(alert, job, relevance);
      if (!result) continue;
      if (result.finalScore < alert.minMatchScore) continue;

      const companyName = await resolveCompanyName(job);
      matchedJobs.push({
        id: job._id,
        title: job.title,
        location: job.location,
        salary: job.salary,
        companyName,
        finalScore: result.finalScore,
        matchedBy: result.matchedBy,
      });

      await ensureCandidateNotif(
        candidate,
        cv,
        job,
        companyName,
        result.finalScore,
        alert.keyword
      );
    }

    if (matchedJobs.length > 0) {
      matchedJobs.sort((a, b) => b.finalScore - a.finalScore);
      await emailService.sendJobAlertEmail(
        { email: alert.email || candidate.email, fullName: cv?.fullName },
        { keyword: alert.keyword, location: alert.location, frequency: alert.frequency },
        matchedJobs
      );
    }

    alert.lastNotifiedAt = new Date();
    await alert.save();
  }

  return true;
};

// Fallback when candidate has no JobAlerts
const runCvMatching = async (candidate, cv, openJobs) => {
  if (!cv || !cv.isLookingForJob || !cv.embedding || cv.embedding.length === 0) {
    return;
  }

  const minMatchScore = candidate.minMatchScore || 70;
  const matchedJobs = [];

  for (const job of openJobs) {
    const hasApplied = await Application.findOne({
      candidateId: candidate._id,
      jobId: job._id,
    });
    if (hasApplied) continue;

    const percent = await calcAiPercent(cv, job);
    if (percent == null || percent < minMatchScore) continue;

    const companyName = await resolveCompanyName(job);
    matchedJobs.push({
      id: job._id,
      title: job.title,
      location: job.location,
      companyName,
      previewScore: percent,
    });

    const candidateNotifExists = await Notification.findOne({
      userId: candidate._id,
      type: "job_match",
      jobId: job._id,
    });
    if (!candidateNotifExists) {
      await Notification.create({
        userId: candidate._id,
        type: "job_match",
        title: `Cơ hội việc làm mới phù hợp: ${job.title}`,
        body: `Hệ thống AI phát hiện bạn phù hợp ${percent}% với vị trí này tại ${companyName} (dựa trên CV: ${cv.fullName}).`,
        matchingScore: percent,
        jobId: job._id,
        cvProfileId: cv._id,
      });
    }

    const employerId = job.employerId?._id || job.employerId;
    const employerNotifExists = await Notification.findOne({
      userId: employerId,
      type: "job_match",
      jobId: job._id,
      candidateId: candidate._id,
    });
    if (!employerNotifExists) {
      await Notification.create({
        userId: employerId,
        type: "job_match",
        title: `Ứng viên tiềm năng mới cho: ${job.title}`,
        body: `Hệ thống AI phát hiện ứng viên ${cv.fullName} phù hợp ${percent}% với yêu cầu tuyển dụng.`,
        matchingScore: percent,
        jobId: job._id,
        candidateId: candidate._id,
        cvProfileId: cv._id,
      });
    }
  }

  if (matchedJobs.length > 0) {
    matchedJobs.sort((a, b) => b.previewScore - a.previewScore);
    await emailService.sendJobMatchEmail(
      { email: candidate.email, fullName: cv.fullName },
      matchedJobs
    );
  }
};

const startCronJobs = () => {
  // Demo: every minute; prod: "0 9 * * *"
  const schedule = "* * * * *";
  //const schedule = "0 9 * * *";
  console.log(
    `[Cron] Đã khởi động luồng gửi email thông báo việc làm (Lịch trình: ${schedule})`
  );

  cron.schedule(schedule, async () => {
    console.log(
      "[Cron] Đang chạy tác vụ quét việc làm matching lúc:",
      new Date().toLocaleString()
    );
    try {
      const openJobs = await Job.find({ status: "open" }).populate(
        "employerId",
        "email"
      );
      if (!openJobs || openJobs.length === 0) return;

      const candidates = await User.find({
        role: "candidate",
        isEmailSubscribed: true,
      });

      for (const candidate of candidates) {
        let cv = await CvProfile.findOne({
          userId: candidate._id,
          isPrimary: true,
        });
        if (!cv) {
          cv = await CvProfile.findOne({ userId: candidate._id }).sort({
            createdAt: -1,
          });
        }

        const handledByAlerts = await runAlertMatching(candidate, cv, openJobs);

        if (!handledByAlerts) {
          await runCvMatching(candidate, cv, openJobs);
        }
      }
    } catch (error) {
      console.error("[Cron] Lỗi khi chạy tác vụ matching:", error.message);
    }
  });
};

module.exports = { startCronJobs };
