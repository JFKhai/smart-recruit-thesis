const fs = require("fs");
const os = require("os");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const { fromPath } = require("pdf2pic");
const CvProfile = require("../models/CvProfile");
const aiService = require("../services/aiService");
const cvExtractor = require("../services/cvExtractor");

const extractTextWithOCR = async (filePath) => {
  console.log("Đang dùng OCR fallback...");

  const tempDir = os.tmpdir();
  const filename = `ocr_temp_${Date.now()}`;

  const convert = fromPath(filePath, {
    density: 200,
    saveFilename: filename,
    savePath: tempDir,
    format: "png",
    width: 1240,
    height: 1754,
  });

  let imagePath = null;

  try {
    const pageImage = await convert(1, { responseType: "image" });
    imagePath = pageImage.path;
    console.log("Ảnh tạm được lưu tại:", imagePath);

    const worker = await createWorker("eng+vie");
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    await worker.terminate();

    return text;
  } finally {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log("Đã xóa file ảnh tạm.");
    }
  }
};

const uploadCv = async (req, res) => {
  try {
    console.log("==========================================");
    console.log("1. BẮT ĐẦU XỬ LÝ UPLOAD CV...");

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng cung cấp file PDF" });
    }

    console.log("2. Đã lưu file tạm tại:", req.file.path);
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    let extractedText = pdfData.text;

    console.log("3. Đã đọc PDF. Tổng số ký tự:", extractedText.length);

    if (!extractedText || extractedText.trim().length < 50) {
      console.log("PDF không có text → Chuyển sang OCR...");
      extractedText = await extractTextWithOCR(req.file.path);
      console.log("OCR xong. Ký tự nhận được:", extractedText.length);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "Không thể đọc nội dung từ file PDF này" });
    }

    const textToSend = extractedText.substring(0, 3000);
    console.log(
      "4. Đoạn text gửi đi:",
      textToSend.substring(0, 50).replace(/\n/g, " ") + "...",
    );
    console.log("5. Link AI Service:", process.env.AI_SERVICE_URL);
    console.log("--- ĐANG GỌI API SANG PYTHON ---");

    const embeddingVector = await aiService.getEmbedding(textToSend);

    if (embeddingVector && embeddingVector.length > 0) {
      console.log(
        "6. THÀNH CÔNG! Độ dài Vector nhận được:",
        embeddingVector.length,
      );
    } else {
      console.log("6. THẤT BẠI! Vector bị null. Trả về mảng rỗng.");
    }
    
    console.log("--- ĐANG TRÍCH XUẤT THÔNG TIN (Gemini -> Groq -> Regex) ---");
    const extractedData = await cvExtractor.extractCvData(textToSend);
    if (extractedData && extractedData._source !== "regex") {
      console.log("7. Trích xuất bằng AI THÀNH CÔNG!");
    } else {
      console.log("7. AI không khả dụng → đã dùng Regex Fallback (thông tin cơ bản, nên kiểm tra/sửa tay).");
    }

    console.log("==========================================");

    const existingPrimary = await CvProfile.findOne({ userId: req.user._id, isPrimary: true });
    const newCv = await CvProfile.create({
      userId: req.user._id,
      fullName: extractedData?.fullName || req.body.fullName || "Chưa cập nhật",
      headline: extractedData?.headline || "",
      email: extractedData?.email || "",
      phone: extractedData?.phone || "",
      location: extractedData?.location || "",
      address: extractedData?.address || "",
      dateOfBirth: extractedData?.dateOfBirth || "",
      website: extractedData?.website || "",
      summary: extractedData?.summary || textToSend,
      skills: extractedData?.skills || [],
      certifications: extractedData?.certifications || "",
      experience: extractedData?.experience || [],
      education: extractedData?.education || [],
      fileUrl: req.file.path,
      embedding: embeddingVector || [],
      isLookingForJob: true,
      isPrimary: !existingPrimary, 
    });

    res.status(201).json({ message: "Upload CV thành công!", data: newCv });
  } catch (error) {
    console.error("LỖI CRASH KHI XỬ LÝ CV:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xử lý hồ sơ" });
  }
};

const getMyCvProfiles = async (req, res) => {
  try {
    const profiles = await CvProfile.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ data: profiles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCvProfileById = async (req, res) => {
  try {
    const profile = await CvProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
    }

    if (
      req.user.role !== "admin" &&
      profile.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Không có quyền truy cập hồ sơ này" });
    }

    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCvProfile = async (req, res) => {
  try {
    const existingPrimary = await CvProfile.findOne({ userId: req.user._id, isPrimary: true });
    const payload = {
      userId: req.user._id,
      fullName: req.body.fullName || "Chưa cập nhật",
      headline: req.body.headline,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      address: req.body.address,
      dateOfBirth: req.body.dateOfBirth,
      website: req.body.website,
      summary: req.body.summary,
      skills: req.body.skills || [],
      certifications: req.body.certifications,
      experience: req.body.experience || [],
      education: req.body.education || [],
      isLookingForJob:
        typeof req.body.isLookingForJob === "boolean"
          ? req.body.isLookingForJob
          : true,
      isPrimary: !existingPrimary,
    };

    const createdProfile = await CvProfile.create(payload);

    const textForEmb = [
      payload.headline || '',
      payload.summary || '',
      (payload.skills || []).join(', '),
      payload.certifications || '',
      (payload.experience || []).map(e => `${e.position || ''} ${e.description || ''}`).join(' '),
      (payload.education || []).map(e => `${e.major || ''} ${e.school || ''}`).join(' '),
    ].filter(Boolean).join('. ').trim();

    if (textForEmb.length >= 20) {
      try {
        const embedding = await aiService.getEmbedding(textForEmb.substring(0, 3000));
        if (embedding && embedding.length > 0) {
          createdProfile.embedding = embedding;
          await createdProfile.save();
          console.log('CV Profile: embedding tao thanh cong,', embedding.length, 'chieu');
        }
      } catch (e) {
        console.warn('CV Profile: khong the tao embedding -', e.message);
      }
    } else {
      createdProfile.embedding = [];
      await createdProfile.save();
    }

    res.status(201).json({ message: "Tạo hồ sơ thành công", data: createdProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCvProfile = async (req, res) => {
  try {
    const profile = await CvProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
    }

    if (profile.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền cập nhật hồ sơ này" });
    }

    const allowedFields = [
      "fullName",
      "headline",
      "email",
      "phone",
      "location",
      "address",
      "dateOfBirth",
      "website",
      "summary",
      "skills",
      "certifications",
      "experience",
      "education",
      "isLookingForJob",
      "fileUrl",
    ];

    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        profile[field] = req.body[field];
      }
    });

    const updatedProfile = await profile.save();

    const changedFields = Object.keys(req.body);
    if (changedFields.some(f => ['summary','skills','experience','education', 'headline', 'certifications'].includes(f))) {
      const textForEmb = [
        updatedProfile.headline || '',
        updatedProfile.summary || '',
        (updatedProfile.skills || []).join(', '),
        updatedProfile.certifications || '',
        (updatedProfile.experience || []).map(e => `${e.position || ''} ${e.description || ''}`).join(' '),
        (updatedProfile.education || []).map(e => `${e.major || ''} ${e.school || ''}`).join(' '),
      ].filter(Boolean).join('. ').trim();

      if (textForEmb.length >= 20) {
        try {
          const embedding = await aiService.getEmbedding(textForEmb.substring(0, 3000));
          if (embedding && embedding.length > 0) {
            updatedProfile.embedding = embedding;
            await updatedProfile.save();
            console.log('CV Profile: cap nhat embedding thanh cong,', embedding.length, 'chieu');
          }
        } catch (e) {
          console.warn('CV Profile: khong the cap nhat embedding -', e.message);
        }
      } else {
        updatedProfile.embedding = [];
        await updatedProfile.save();
        console.log('CV Profile: thong tin qua ngan, da xoa embedding.');
      }
    }

    res.json({ message: "Cập nhật hồ sơ thành công", data: updatedProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCvProfile = async (req, res) => {
  try {
    const profile = await CvProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
    }

    if (
      req.user.role !== "admin" &&
      profile.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Không có quyền xóa hồ sơ này" });
    }

    const wasPrimary = profile.isPrimary;
    await profile.deleteOne();

    // Deleting the primary CV promotes the newest remaining one
    if (wasPrimary) {
      const next = await CvProfile.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (next) {
        next.isPrimary = true;
        await next.save();
      }
    }

    res.json({ message: "Xóa hồ sơ thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setPrimaryCV = async (req, res) => {
  try {
    const profile = await CvProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
    }
    if (profile.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền thay đổi hồ sơ này" });
    }

    await CvProfile.updateMany(
      { userId: req.user._id, _id: { $ne: profile._id } },
      { $set: { isPrimary: false } }
    );

    profile.isPrimary = true;
    await profile.save();

    res.json({ message: "Đã đặt làm CV chính", data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadCv,
  getMyCvProfiles,
  getCvProfileById,
  createCvProfile,
  updateCvProfile,
  deleteCvProfile,
  setPrimaryCV,
};
