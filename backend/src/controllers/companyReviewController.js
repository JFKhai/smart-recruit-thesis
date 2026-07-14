const CompanyReview = require('../models/CompanyReview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const CompanyProfile = require('../models/CompanyProfile');

// Eligible statuses for leaving a company review
const ELIGIBLE_STATUSES = ['reviewed', 'interview', 'accepted'];

const findEligibleApplication = async (candidateId, companyUserId) => {
  const jobIds = await Job.find({ employerId: companyUserId }).distinct('_id');
  if (!jobIds.length) return null;
  return Application.findOne({
    candidateId,
    jobId: { $in: jobIds },
    status: { $in: ELIGIBLE_STATUSES },
  });
};

const reviewerName = (review) => {
  if (review.isAnonymous) return 'Ẩn danh';
  const email = review.candidateId?.email;
  if (!email) return 'Ứng viên';
  return email.split('@')[0];
};

const formatReview = (review, currentUserId) => ({
  _id: review._id,
  rating: review.rating,
  comment: review.comment,
  isAnonymous: review.isAnonymous,
  reviewerName: reviewerName(review),
  employerReply: review.employerReply,
  employerRepliedAt: review.employerRepliedAt,
  createdAt: review.createdAt,
  isMine: currentUserId ? review.candidateId?._id?.toString() === currentUserId.toString() : false,
});

const createReview = async (req, res) => {
  try {
    const { companyUserId, rating, comment, isAnonymous } = req.body;
    if (!companyUserId) return res.status(400).json({ message: 'Thiếu companyUserId' });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Vui lòng chọn số sao từ 1 đến 5' });
    }
    if (companyUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể tự đánh giá công ty của mình' });
    }

    const eligibleApp = await findEligibleApplication(req.user._id, companyUserId);
    if (!eligibleApp) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể đánh giá công ty đã xem xét / mời phỏng vấn / nhận bạn.',
      });
    }

    const existing = await CompanyReview.findOne({
      companyUserId,
      candidateId: req.user._id,
    });
    if (existing) {
      return res.status(409).json({ message: 'Bạn đã đánh giá công ty này rồi' });
    }

    const review = await CompanyReview.create({
      companyUserId,
      candidateId: req.user._id,
      applicationId: eligibleApp._id,
      rating,
      comment: comment || '',
      isAnonymous: !!isAnonymous,
    });

    res.status(201).json({ message: 'Đã gửi đánh giá', data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Bạn đã đánh giá công ty này rồi' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getCompanyReviews = async (req, res) => {
  try {
    const { companyUserId } = req.params;
    const reviews = await CompanyReview.find({ companyUserId, isHidden: false })
      .populate('candidateId', 'email')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    for (const r of reviews) {
      total += r.rating;
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    }
    const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

    res.json({
      data: reviews.map((r) => formatReview(r, req.user?._id)),
      summary: { count, average, distribution },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyReviewStatus = async (req, res) => {
  try {
    const { companyUserId } = req.params;
    const myReview = await CompanyReview.findOne({
      companyUserId,
      candidateId: req.user._id,
    });
    const eligibleApp = myReview ? true : await findEligibleApplication(req.user._id, companyUserId);

    res.json({
      eligible: !!eligibleApp,
      alreadyReviewed: !!myReview,
      canReview: !!eligibleApp && !myReview,
      myReview: myReview
        ? {
            _id: myReview._id,
            rating: myReview.rating,
            comment: myReview.comment,
            isAnonymous: myReview.isAnonymous,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const findOwnReview = async (req, res) => {
  const review = await CompanyReview.findById(req.params.id);
  if (!review) {
    res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    return null;
  }
  if (review.candidateId.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: 'Không có quyền' });
    return null;
  }
  return review;
};

const updateReview = async (req, res) => {
  try {
    const review = await findOwnReview(req, res);
    if (!review) return;

    const { rating, comment, isAnonymous } = req.body;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Số sao phải từ 1 đến 5' });
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    if (isAnonymous !== undefined) review.isAnonymous = !!isAnonymous;

    await review.save();
    res.json({ message: 'Đã cập nhật đánh giá', data: review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await findOwnReview(req, res);
    if (!review) return;
    await review.deleteOne();
    res.json({ message: 'Đã xoá đánh giá' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const replyToReview = async (req, res) => {
  try {
    const review = await CompanyReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    if (review.companyUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Chỉ công ty được đánh giá mới phản hồi được' });
    }
    const { reply } = req.body;
    if (!reply || !reply.trim()) return res.status(400).json({ message: 'Nội dung phản hồi trống' });

    review.employerReply = reply.trim();
    review.employerRepliedAt = new Date();
    await review.save();
    res.json({ message: 'Đã phản hồi đánh giá', data: review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminListReviews = async (req, res) => {
  try {
    const reviews = await CompanyReview.find({})
      .populate('companyUserId', 'email')
      .populate('candidateId', 'email')
      .sort({ createdAt: -1 });

    const companyIds = reviews.map((r) => r.companyUserId?._id).filter(Boolean);
    const profiles = await CompanyProfile.find({ userId: { $in: companyIds } }).select(
      'userId companyName'
    );
    const nameByUser = {};
    profiles.forEach((p) => {
      nameByUser[p.userId.toString()] = p.companyName;
    });

    const data = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      isAnonymous: r.isAnonymous,
      isHidden: r.isHidden,
      employerReply: r.employerReply,
      createdAt: r.createdAt,
      companyName:
        nameByUser[r.companyUserId?._id?.toString()] ||
        r.companyUserId?.email ||
        'Không rõ',
      candidateEmail: r.candidateId?.email || 'Không rõ',
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminSetHidden = async (req, res) => {
  try {
    const review = await CompanyReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    review.isHidden = req.body.isHidden !== undefined ? !!req.body.isHidden : !review.isHidden;
    await review.save();
    res.json({
      message: review.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá',
      data: { _id: review._id, isHidden: review.isHidden },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getCompanyReviews,
  getMyReviewStatus,
  updateReview,
  deleteReview,
  replyToReview,
  adminListReviews,
  adminSetHidden,
};
