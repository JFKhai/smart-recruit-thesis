require("dotenv").config(); // Load biến môi trường
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();
const path = require("path");
const fs = require("fs");

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API Smart Recruit đang chạy và đã kết nối DB!");
});

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));

app.use("/api/cv", require("./src/routes/cvRoutes"));
app.use("/api/jobs", require("./src/routes/jobRoutes"));
app.use("/api/applications", require("./src/routes/applicationRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/job-alerts", require("./src/routes/jobAlertRoutes"));
app.use("/api/reviews", require("./src/routes/reviewRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);

  const { startCronJobs } = require("./src/cronJob");
  startCronJobs();
});
