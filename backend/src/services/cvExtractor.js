const axios = require("axios");
const geminiService = require("./geminiService");



const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (error) => {
  const status = error?.response?.status;
  const msg = (error?.message || "").toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    msg.includes("overloaded") ||
    msg.includes("timeout") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset")
  );
};

const buildPrompt = (text) => `
Bạn là chuyên gia nhân sự. Trích xuất thông tin từ CV dưới đây và trả về DUY NHẤT một JSON hợp lệ.

CV:
"""
${text}
"""

Cấu trúc JSON:
{
  "fullName": "Họ và tên",
  "headline": "Vị trí / tiêu đề nghề nghiệp",
  "email": "email",
  "phone": "số điện thoại",
  "location": "Thành phố, Quốc gia",
  "address": "địa chỉ cụ thể",
  "dateOfBirth": "ngày sinh",
  "website": "website / LinkedIn / GitHub",
  "summary": "giới thiệu bản thân 2-3 câu",
  "skills": ["kỹ năng 1", "kỹ năng 2"],
  "certifications": "các chứng chỉ, cách nhau dấu phẩy",
  "experience": [{ "company": "", "position": "", "description": "", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }],
  "education": [{ "school": "", "major": "", "gpa": "" }]
}

QUY TẮC:
- Giữ nguyên ngôn ngữ gốc của CV, KHÔNG dịch.
- Không tìm thấy thì để null (chuỗi) hoặc [] (mảng). TUYỆT ĐỐI không bịa.
- Chỉ trả JSON thuần, không kèm markdown.
`;

// Provider via LLM_BASE_URL / LLM_MODEL / LLM_API_KEY (default: Groq)
const extractWithOpenAICompat = async (text) => {
  const apiKey = process.env.LLM_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const baseURL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
  const model = process.env.LLM_MODEL || "llama-3.3-70b-versatile";
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model,
          messages: [
            { role: "system", content: "Bạn là API trích xuất CV, chỉ trả về JSON hợp lệ." },
            { role: "user", content: buildPrompt(text) },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        },
        {
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const content = res.data?.choices?.[0]?.message?.content;
      if (!content) return null;

      // Một số model vẫn bọc trong ```json -> gỡ bỏ cho chắc.
      const clean = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
      const parsed = JSON.parse(clean);
      console.log(`✅ Trích xuất CV thành công bằng LLM "${model}" (${baseURL}).`);
      return parsed;
    } catch (error) {
      const status = error?.response?.status;
      console.error(`Lỗi LLM [${model}, lần ${attempt}/${MAX_RETRIES}]:`, status || error.message);
      if (isRetryable(error) && attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.warn(`-> LLM quá tải, thử lại sau ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      return null;
    }
  }
  return null;
};

const extractWithRegex = (text) => {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?84|0)[\s.]?\d(?:[\s.]?\d){7,9}/);

  let fullName = null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 12)) {
    const words = line.split(/\s+/);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 5 &&
      /^[\p{L}\s.'-]+$/u.test(line) &&
      !/@|\d/.test(line) &&
      line.length <= 40;
    if (looksLikeName) {
      fullName = line;
      break;
    }
  }

  console.warn("⚠️ Dùng fallback REGEX (không có AI). Chỉ lấy được thông tin cơ bản.");
  return {
    fullName,
    headline: "",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0].replace(/[\s.]/g, "") : "",
    location: "",
    address: "",
    dateOfBirth: "",
    website: "",
    summary: text.slice(0, 400),
    skills: [],
    certifications: "",
    experience: [],
    education: [],
    _source: "regex",
  };
};

const extractCvData = async (text) => {
  try {
    const gemini = await geminiService.extractCvData(text);
    if (gemini) return gemini;
  } catch (e) {
    console.error("Gemini lỗi không mong đợi:", e.message);
  }

  const llm = await extractWithOpenAICompat(text);
  if (llm) return llm;

  return extractWithRegex(text);
};

module.exports = { extractCvData, extractWithOpenAICompat, extractWithRegex };
