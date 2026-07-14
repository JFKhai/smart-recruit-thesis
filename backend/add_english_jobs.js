const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const Job = require('./src/models/Job');
const aiService = require('./src/services/aiService');

const computeJobEmbedding = async (title, description, requirements) => {
  const reqArr = Array.isArray(requirements) ? requirements : [];
  const text = [title, description, ...reqArr].filter(Boolean).join("\n").substring(0, 3000);
  if (!text.trim()) return [];
  try {
    const emb = await aiService.getEmbedding(text);
    return emb && emb.length ? emb : [];
  } catch (e) {
    console.error("Error computeJobEmbedding:", e.message);
    return [];
  }
};

const newJobs = [
  {
    title: "Junior Full-Stack Developer (React & Node.js)",
    description: "We are looking for a Junior Full-Stack Developer to join our dynamic web application team. You will participate in building scalable web applications, designing user interfaces, and writing APIs. You will work closely with senior engineers using React, Node.js, Express, and MongoDB.",
    requirements: [
      "Proficient in JavaScript, HTML5, CSS3, and modern frontend frameworks like React.js.",
      "Experience with Node.js, Express.js backend development.",
      "Familiarity with MongoDB or relational databases.",
      "Strong debugging and problem-solving skills.",
      "Good team collaboration and communication skills."
    ],
    location: "Da Nang"
  },
  {
    title: "React Native Mobile Developer",
    description: "We are seeking a React Native Developer to build and maintain high-performance mobile applications for iOS and Android platforms. You will translate web-based UI/UX designs into fully functional mobile features, integrating with backend RESTful APIs.",
    requirements: [
      "Strong experience in JavaScript/TypeScript and React Native framework.",
      "Knowledge of mobile app release cycles on App Store and Google Play.",
      "Familiar with Git version control and RESTful API integration.",
      "Self-motivated and eager to learn new mobile technologies."
    ],
    location: "Ho Chi Minh"
  },
  {
    title: "Flutter Mobile Developer Intern",
    description: "Join us as a Flutter Intern to assist in designing and developing beautiful mobile user interfaces. You will work on cross-platform application modules, perform software debugging, and participate in daily scrum meetings.",
    requirements: [
      "Basic understanding of Dart language and Flutter SDK.",
      "Interest in mobile UI/UX and mobile application lifecycle.",
      "Eager to learn, strong logical thinking and debugging skills."
    ],
    location: "Da Nang"
  },
  {
    title: "Frontend React Developer (Vite & Tailwind CSS)",
    description: "We have an open position for a Frontend React Developer. You will be responsible for creating user registration screens, data visualization dashboard widgets, and modern interfaces using React (Vite) and Tailwind CSS.",
    requirements: [
      "Excellent skills in React.js, HTML, CSS, and Tailwind CSS.",
      "Experience with Git workflow and npm packages.",
      "Understanding of state management and component hooks."
    ],
    location: "Hanoi"
  }
];

const addJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const employer = await User.findOne({ role: 'employer' });
    if (!employer) {
      console.error('No employer found. Please run seed first or create an employer account.');
      process.exit(1);
    }
    console.log(`Using employer: ${employer.email} (${employer._id})`);

    for (const jobData of newJobs) {
      console.log(`Adding Job: ${jobData.title}...`);
      const embedding = await computeJobEmbedding(jobData.title, jobData.description, jobData.requirements);

      await Job.create({
        employerId: employer._id,
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
        status: 'open',
        embedding: embedding
      });
      console.log(`Successfully added Job: ${jobData.title} (Embedding size: ${embedding.length})`);
    }

    console.log('Jobs successfully added!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding jobs:', error);
    process.exit(1);
  }
};

addJobs();
