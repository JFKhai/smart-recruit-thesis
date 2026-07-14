const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createJobAlert,
  getMyJobAlerts,
  updateJobAlert,
  toggleJobAlert,
  deleteJobAlert,
} = require('../controllers/jobAlertController');

router.post('/', protect, createJobAlert);
router.get('/', protect, getMyJobAlerts);
router.put('/:id', protect, updateJobAlert);
router.patch('/:id/toggle', protect, toggleJobAlert);
router.delete('/:id', protect, deleteJobAlert);

module.exports = router;
