const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAllOpenJobs,
  getMyJobs,
  getJobById,
  createJob,
  createJobFromOld,
  updateJob,
  deleteJob,
  closeJob,
  getJobsWithMatchPreview,
} = require("../controllers/jobController");

router.get("/employer/my-jobs", protect, authorize("employer", "admin"), getMyJobs);
router.post("/", protect, authorize("employer", "admin"), createJob);
router.post(
  "/:id/clone",
  protect,
  authorize("employer", "admin"),
  createJobFromOld,
);
router.put("/:id", protect, authorize("employer", "admin"), updateJob);
router.patch("/:id/close", protect, authorize("employer", "admin"), closeJob);
router.delete("/:id", protect, authorize("employer", "admin"), deleteJob);
router.get("/", getAllOpenJobs);
router.get("/match-preview", protect, authorize("candidate"), getJobsWithMatchPreview);
router.get("/:id", getJobById);

module.exports = router;
