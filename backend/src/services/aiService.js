const axios = require("axios");

const aiUrl = () => (process.env.AI_SERVICE_URL || "").trim();

const aiService = {
  getEmbedding: async (text) => {
    if (!aiUrl()) {
      return null;
    }
    try {
      const response = await axios.post(
        `${aiUrl()}/get-embedding`,
        {
          text: text,
        },
      );
      return response.data.embedding; 
    } catch (error) {
      console.error("Lỗi khi gọi AI Service (Embedding):", error.message);
      if (error.response) {
        console.error("Chi tiết lỗi từ Python:", error.response.status, error.response.data);
      }
      return null;
    }
  },

  calculateMatchingScore: async (cvEmbedding, jobEmbedding) => {
    if (!aiUrl()) {
      return 0;
    }
    try {
      const response = await axios.post(
        `${aiUrl()}/calculate-matching`,
        {
          cv_vector: cvEmbedding,
          job_vector: jobEmbedding,
        },
      );
      return response.data.score; 
    } catch (error) {
      console.error("Lỗi khi gọi AI Service (Matching):", error.message);
      return 0;
    }
  },
};

module.exports = aiService;
