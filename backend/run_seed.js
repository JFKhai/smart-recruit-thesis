const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const Job = require('./src/models/Job');
const CompanyProfile = require('./src/models/CompanyProfile');
const CvProfile = require('./src/models/CvProfile');
const aiService = require('./src/services/aiService');

const computeJobEmbedding = async (title, description, requirements) => {
  const reqArr = Array.isArray(requirements) ? requirements : [];
  const text = [title, description, ...reqArr].filter(Boolean).join("\n").substring(0, 3000);
  if (!text.trim()) return [];
  try {
    const emb = await aiService.getEmbedding(text);
    return emb && emb.length ? emb : [];
  } catch (e) {
    console.error("Lỗi computeJobEmbedding:", e.message);
    return [];
  }
};

const computeCvEmbedding = async (cvData) => {
  const textForEmb = [
    cvData.headline || '',
    cvData.summary || '',
    (cvData.skills || []).join(', '),
    (cvData.experience || []).map(e => `${e.position || ''} ${e.description || ''}`).join(' '),
    (cvData.education || []).map(e => `${e.major || ''} ${e.school || ''}`).join(' '),
  ].filter(Boolean).join('. ').trim();

  if (textForEmb.length < 20) return [];
  try {
    const emb = await aiService.getEmbedding(textForEmb.substring(0, 3000));
    return emb && emb.length ? emb : [];
  } catch (e) {
    console.error("Lỗi computeCvEmbedding:", e.message);
    return [];
  }
};

const employersData = [
  {
    email: 'hr@techlogistics.vn',
    name: 'Tech Logistics Corp',
    description: 'Công ty hàng đầu về giải pháp kho bãi và vận tải thông minh.',
    industry: 'logistics',
    size: 'large',
    website: 'https://techlogistics.vn',
    address: '12 đường Duy Tân, Dịch Vọng Hậu, Cầu Giấy',
    foundedYear: 2018,
    benefits: ['Bảo hiểm sức khỏe cao cấp', 'Du lịch hàng năm', 'Lương tháng 13+'],
    contactName: 'Nguyễn Văn Nam',
    phone: '02439998888',
    taxId: '0108345678',
    province: 'Hà Nội',
    jobs: [
      {
        title: 'Chuyên viên Điều phối Vận tải (Logistics Coordinator)',
        description: 'Quản lý, theo dõi và điều phối các chuyến hàng toàn quốc. Tối ưu hóa lộ trình và chi phí vận chuyển. Xử lý các sự cố phát sinh trong quá trình giao nhận.',
        requirements: ['Tốt nghiệp chuyên ngành Logistics, Quản lý chuỗi cung ứng.', 'Có kỹ năng giải quyết vấn đề và giao tiếp tốt.', 'Thành thạo tin học văn phòng.'],
        location: 'Hà Nội'
      },
      {
        title: 'Nhân viên Kế toán Kho (Warehouse Accountant)',
        description: 'Quản lý sổ sách, hóa đơn xuất nhập kho. Đối chiếu số liệu và thực hiện báo cáo tồn kho định kỳ.',
        requirements: ['Tốt nghiệp CĐ/ĐH chuyên ngành Kế toán.', 'Sử dụng thành thạo phần mềm kế toán (MISA, FAST...).', 'Trung thực, cẩn thận.'],
        location: 'Hồ Chí Minh'
      },
      {
        title: 'Chuyên viên Digital Marketing',
        description: 'Lên kế hoạch và thực thi các chiến dịch quảng cáo cho dịch vụ vận chuyển của công ty trên các nền tảng Facebook, Google.',
        requirements: ['Có kinh nghiệm chạy Ads tối thiểu 1 năm.', 'Khả năng phân tích số liệu và tối ưu chiến dịch.', 'Sáng tạo, nắm bắt xu hướng tốt.'],
        location: 'Hà Nội'
      }
    ]
  },
  {
    email: 'tuyendung@iot-smart.io',
    name: 'IoT Smart Solutions',
    description: 'Tiên phong trong lĩnh vực Internet of Things, cung cấp thiết bị nhà thông minh và giải pháp nông nghiệp công nghệ cao.',
    industry: 'technology',
    size: 'medium',
    website: 'https://iot-smart.io',
    address: '99 đường Nguyễn Hữu Thọ, Khuê Trung, Cẩm Lệ',
    foundedYear: 2020,
    benefits: ['Thiết bị làm việc hiện đại', 'Trợ cấp ăn trưa', 'Thưởng dự án hấp dẫn'],
    contactName: 'Lê Thị Mai',
    phone: '02363555777',
    taxId: '0402987654',
    province: 'Đà Nẵng',
    jobs: [
      {
        title: 'Kỹ sư Lập trình Nhúng (Embedded Software Engineer - IoT)',
        description: 'Phát triển firmware cho các vi điều khiển ARM, ESP32. Giao tiếp với các cảm biến qua I2C, SPI, UART. Đẩy dữ liệu lên cloud qua MQTT/HTTP.',
        requirements: ['Thành thạo ngôn ngữ C/C++.', 'Hiểu biết về các giao thức mạng trong IoT.', 'Ưu tiên ứng viên có kinh nghiệm làm việc với RTOS.'],
        location: 'Đà Nẵng'
      },
      {
        title: 'Kế toán Tổng hợp',
        description: 'Phụ trách các nghiệp vụ kế toán công nợ, thuế, bảo hiểm cho toàn công ty. Lập báo cáo tài chính cuối năm.',
        requirements: ['Có bằng cử nhân Kế toán / Kiểm toán.', 'Kinh nghiệm ít nhất 3 năm ở vị trí tương đương.', 'Nắm vững luật thuế hiện hành.'],
        location: 'Đà Nẵng'
      },
      {
        title: 'Nhân viên Content Marketing',
        description: 'Viết bài PR, blog về các sản phẩm smarthome. Xây dựng nội dung cho Fanpage và kịch bản video TikTok.',
        requirements: ['Khả năng viết lách tốt, văn phong hiện đại.', 'Có kiến thức cơ bản về thiết bị công nghệ là một lợi thế.', 'Biết sử dụng Canva/Photoshop cơ bản.'],
        location: 'Đà Nẵng'
      },
      {
        title: 'Nhân viên Sale B2B (Giải pháp IoT)',
        description: 'Tìm kiếm khách hàng doanh nghiệp, tư vấn các giải pháp nông nghiệp thông minh. Chăm sóc khách hàng và chốt hợp đồng.',
        requirements: ['Kỹ năng giao tiếp, thuyết phục xuất sắc.', 'Không ngại đi công tác.', 'Có kinh nghiệm sales B2B phần mềm/giải pháp là điểm cộng.'],
        location: 'Hồ Chí Minh'
      }
    ]
  },
  {
    email: 'career@fintech-asia.com',
    name: 'Fintech Asia Group',
    description: 'Tập đoàn tài chính công nghệ cung cấp ví điện tử và giải pháp thanh toán.',
    industry: 'finance',
    size: 'large',
    website: 'https://fintech-asia.com',
    address: 'Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1',
    foundedYear: 2015,
    benefits: ['Lương tháng 14', 'Gói chăm sóc sức khỏe gia đình', 'Cơ hội onsite nước ngoài'],
    contactName: 'Phạm Minh Hoàng',
    phone: '02831112222',
    taxId: '0313456123',
    province: 'Hồ Chí Minh',
    jobs: [
      {
        title: 'Chuyên viên Kế toán Tài chính (Finance Accountant)',
        description: 'Kiểm soát dòng tiền, thực hiện các báo cáo dòng tiền hàng ngày. Làm việc trực tiếp với ngân hàng và các đối tác thanh toán.',
        requirements: ['Tốt nghiệp xuất sắc ngành Tài chính/Kế toán.', 'Kinh nghiệm làm việc tại các công ty Fintech/Ngân hàng.', 'Có chứng chỉ ACCA/CPA là một lợi thế.'],
        location: 'Hồ Chí Minh'
      },
      {
        title: 'Trưởng nhóm Marketing Kỹ thuật số (Performance Marketing Manager)',
        description: 'Quản lý ngân sách marketing lớn. Phân bổ ngân sách trên các kênh (Google, Facebook, Tiktok). Tối ưu hóa CPA và ROI.',
        requirements: ['Có tối thiểu 4 năm kinh nghiệm Performance Marketing.', 'Có khả năng lãnh đạo đội nhóm.', 'Data-driven, tư duy phân tích nhạy bén.'],
        location: 'Hồ Chí Minh'
      },
      {
        title: 'Kỹ sư Phân tích Dữ liệu (Data Engineer)',
        description: 'Xây dựng data warehouse, xử lý big data từ các giao dịch. Cung cấp dữ liệu sạch cho team Data Analyst và Data Science.',
        requirements: ['Thành thạo SQL, Python, Spark.', 'Kinh nghiệm với AWS/GCP.', 'Kiến thức về ETL pipelines.'],
        location: 'Hà Nội'
      }
    ]
  },
  {
    email: 'jobs@meditech.vn',
    name: 'Meditech Hospital & Research',
    description: 'Bệnh viện đa khoa quốc tế kết hợp nghiên cứu và phát triển giải pháp y tế số.',
    industry: 'healthcare',
    size: 'large',
    website: 'https://meditech.vn',
    address: '150 đường Nguyễn Thị Minh Khai, Quận 3',
    foundedYear: 2017,
    benefits: ['Khám sức khỏe miễn phí cho bản thân và người thân', 'Phụ cấp trực ca', 'Đào tạo chuyên môn liên tục'],
    contactName: 'Trần Thị Thảo',
    phone: '02838887777',
    taxId: '0314987654',
    province: 'Hồ Chí Minh',
    jobs: [
      {
        title: 'Chuyên viên Tư vấn Y khoa (Medical Consultant)',
        description: 'Hỗ trợ khách hàng về thông tin y tế, tư vấn dịch vụ khám chữa bệnh từ xa và chăm sóc sức khỏe chủ động qua ứng dụng của bệnh viện.',
        requirements: ['Tốt nghiệp Đại học Y/Dược.', 'Giao tiếp tốt, có kỹ năng lắng nghe và đồng cảm.', 'Ưu tiên ứng viên có kinh nghiệm làm việc tại bệnh viện hoặc phòng khám.'],
        location: 'Hồ Chí Minh'
      }
    ]
  },
  {
    email: 'hr@edusmart.edu.vn',
    name: 'EduSmart Academy',
    description: 'Hệ thống trung tâm đào tạo Anh ngữ và Kỹ năng mềm chuẩn quốc tế.',
    industry: 'education',
    size: 'medium',
    website: 'https://edusmart.edu.vn',
    address: '254 đường Nguyễn Văn Linh, Thạc Gián, Thanh Khê',
    foundedYear: 2021,
    benefits: ['Học tiếng Anh miễn phí cho con em', 'Thưởng thành tích học viên vượt trội', 'Môi trường làm việc trẻ trung, năng động'],
    contactName: 'Vũ Hoàng Anh',
    phone: '02363999111',
    taxId: '0403123456',
    province: 'Đà Nẵng',
    jobs: [
      {
        title: 'Giảng viên Tiếng Anh IELTS (IELTS Instructor)',
        description: 'Giảng dạy các khóa học IELTS từ cơ bản đến nâng cao. Đánh giá năng lực học viên và thiết kế bài giảng phù hợp theo giáo trình của trung tâm.',
        requirements: ['IELTS tối thiểu 8.0 (không kỹ năng nào dưới 7.0).', 'Có chứng chỉ nghiệp vụ sư phạm hoặc kinh nghiệm giảng dạy tối thiểu 1 năm.', 'Nhiệt huyết, trách nhiệm cao.'],
        location: 'Đà Nẵng'
      }
    ]
  },
  {
    email: 'recruitment@mediamax.com',
    name: 'MediaMax Agency',
    description: 'Đơn vị truyền thông sáng tạo hàng đầu, chuyên cung cấp giải pháp Marketing tổng thể cho các nhãn hàng lớn.',
    industry: 'marketing',
    size: 'medium',
    website: 'https://mediamax.com',
    address: '85 đường Cách Mạng Tháng Tám, Quận 1',
    foundedYear: 2019,
    benefits: ['Trà chiều hàng ngày', 'Thưởng nóng theo chiến dịch thành công', 'Không gian làm việc sáng tạo'],
    contactName: 'Hoàng Thị Dung',
    phone: '02835559999',
    taxId: '0315998877',
    province: 'Hồ Chí Minh',
    jobs: [
      {
        title: 'Chuyên viên Thiết kế Đồ họa (Graphic Designer)',
        description: 'Thiết kế các ấn phẩm truyền thông kỹ thuật số, banner quảng cáo, bộ nhận diện thương hiệu cho các chiến dịch marketing của khách hàng trên social media.',
        requirements: ['Sử dụng thành thạo Photoshop, Illustrator, Premiere/After Effects.', 'Có tư duy thẩm mỹ hiện đại và sáng tạo.', 'Gửi kèm portfolio dự án đã thực hiện khi ứng tuyển.'],
        location: 'Hồ Chí Minh'
      }
    ]
  }
];

const candidatesData = [
  {
    email: 'khai13@gmail.com',
    fullName: 'Trần Quang Khải',
    headline: 'AI Engineer / Embedded Systems Developer',
    phone: '0905123456',
    location: 'Đà Nẵng',
    summary: 'Đam mê lập trình nhúng, phát triển ứng dụng IoT và các mô hình AI phục vụ sản xuất thông minh.',
    skills: ['Python', 'FastAPI', 'React', 'Node.js', 'C/C++', 'Embedded Systems', 'IoT', 'ESP32', 'Machine Learning'],
    experience: [
      {
        company: 'AI Tech Lab',
        position: 'AI Engineer Intern',
        description: 'Nghiên cứu và triển khai mô hình nhận diện khuôn mặt trên thiết bị nhúng sử dụng Python và OpenCV.',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30')
      }
    ],
    education: [
      {
        school: 'Đại học Bách Khoa - Đại học Đà Nẵng',
        major: 'Công nghệ thông tin (Trí tuệ nhân tạo)',
        gpa: '3.6'
      }
    ]
  },
  {
    email: 'nhi15@gmail.com',
    fullName: 'Trần Thị Yến Nhi',
    headline: 'Digital Marketing & Content Creator',
    phone: '0987654321',
    location: 'Hà Nội',
    summary: 'Kinh nghiệm viết bài PR, quản lý Fanpage mạng xã hội và tối ưu hóa các chiến dịch quảng cáo trực tuyến.',
    skills: ['Content Marketing', 'Digital Marketing', 'Copywriting', 'SEO', 'Facebook Ads', 'Google Ads', 'Canva'],
    experience: [
      {
        company: 'Creative Hub Agency',
        position: 'Content Marketing Executive',
        description: 'Lên kịch bản nội dung và tối ưu hiệu quả chiến dịch quảng cáo Facebook, Google cho đối tác.',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-01')
      }
    ],
    education: [
      {
        school: 'Đại học Kinh tế Quốc dân',
        major: 'Marketing',
        gpa: '3.4'
      }
    ]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    console.log('Clearing database (dropping database)...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully.');

    for (const emp of employersData) {
      const hashedPassword = await bcrypt.hash('123123', 10);
      const user = await User.create({
        email: emp.email,
        password: hashedPassword,
        role: 'employer'
      });
      console.log(`[+] Created Employer User: ${emp.email}`);

      await CompanyProfile.create({
        userId: user._id,
        companyName: emp.name,
        industry: emp.industry,
        size: emp.size,
        about: emp.description,
        website: emp.website,
        address: emp.address,
        foundedYear: emp.foundedYear,
        benefits: emp.benefits,
        contactName: emp.contactName,
        phone: emp.phone,
        taxId: emp.taxId,
        province: emp.province,
        country: 'Việt Nam'
      });
      console.log(`  => Created Company Profile for: ${emp.name}`);

      for (const jobData of emp.jobs) {
        console.log(`  -> Đang tạo Job: ${jobData.title}...`);
        const embedding = await computeJobEmbedding(jobData.title, jobData.description, jobData.requirements);
        
        await Job.create({
          employerId: user._id,
          title: jobData.title,
          description: jobData.description,
          requirements: jobData.requirements,
          location: jobData.location,
          expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
          status: 'open',
          embedding: embedding
        });
        console.log(`  => Đã tạo xong Job: ${jobData.title} (Embedding size: ${embedding.length})`);
      }
    }

    for (const cand of candidatesData) {
      const hashedPassword = await bcrypt.hash('123123', 10);
      const user = await User.create({
        email: cand.email,
        password: hashedPassword,
        role: 'candidate'
      });
      console.log(`[+] Created Candidate User: ${cand.email}`);

      console.log(`  -> Đang tạo CV Profile cho: ${cand.fullName}...`);
      const embedding = await computeCvEmbedding(cand);
      
      await CvProfile.create({
        userId: user._id,
        fullName: cand.fullName,
        headline: cand.headline,
        email: cand.email,
        phone: cand.phone,
        location: cand.location,
        summary: cand.summary,
        skills: cand.skills,
        experience: cand.experience,
        education: cand.education,
        embedding: embedding,
        isLookingForJob: true
      });
      console.log(`  => Đã tạo xong CV Profile cho: ${cand.fullName} (Embedding size: ${embedding.length})`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
