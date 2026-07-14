const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  deleteApplication,
} = require("../controllers/applicationController");

router.post("/", protect, authorize("candidate"), applyToJob);
router.get("/me", protect, authorize("candidate"), getMyApplications);
router.get(
  "/job/:jobId",
  protect,
  authorize("employer", "admin"),
  getApplicationsForJob,
);

router.patch(
  "/:id/status",
  protect,
  authorize("employer", "admin"),
  updateApplicationStatus,
);

router.delete(
  "/:id",
  protect,
  authorize("candidate", "admin"),
  deleteApplication,
);

module.exports = router;

