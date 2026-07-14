const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createReview,
  getCompanyReviews,
  getMyReviewStatus,
  updateReview,
  deleteReview,
  replyToReview,
  adminListReviews,
  adminSetHidden,
} = require('../controllers/companyReviewController');

// Admin kiểm duyệt (đặt trước /:id để tránh nhầm route)
router.get('/admin/all', protect, authorize('admin'), adminListReviews);
router.patch('/admin/:id/hide', protect, authorize('admin'), adminSetHidden);

router.post('/', protect, createReview);
router.get('/company/:companyUserId', protect, getCompanyReviews);
router.get('/company/:companyUserId/me', protect, getMyReviewStatus);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/reply', protect, replyToReview);

module.exports = router;
