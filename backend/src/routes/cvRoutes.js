const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadCv,
  getMyCvProfiles,
  getCvProfileById,
  createCvProfile,
  updateCvProfile,
  deleteCvProfile,
  setPrimaryCV,
} = require("../controllers/cvController");


router.post("/upload", protect, upload.single("cv"), uploadCv);
router.get("/", protect, getMyCvProfiles);
router.post("/", protect, createCvProfile);
router.get("/:id", protect, getCvProfileById);
router.put("/:id", protect, updateCvProfile);
router.delete("/:id", protect, deleteCvProfile);
router.patch("/:id/set-primary", protect, setPrimaryCV);

module.exports = router;
