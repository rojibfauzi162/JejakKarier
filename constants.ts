
import { AppData, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AchievementCategory, CareerType, CareerStatus, JobStatus, ProjectStatus, UserRole, SubscriptionPlan, AccountStatus } from './types';

// Fix: Added missing properties (role, plan, status, joinedAt, lastLogin, aiUsage) required by AppData type
export const INITIAL_DATA: AppData = {
  role: UserRole.USER,
  plan: SubscriptionPlan.FREE,
  status: AccountStatus.ACTIVE,
  joinedAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  aiUsage: {
    cvGenerated: 0,
    coverLetters: 0,
    careerAnalysis: 0,
    totalTokens: 0
  },
  profile: {
    name: "Alex",
    birthPlace: "Jakarta",
    birthDate: "2004-05-15",
    maritalStatus: "Single",
    email: "alex@example.com",
    phone: "08123456789",
    domicile: "Jakarta Selatan",
    mainCareer: "Staf Perpajakan",
    sideCareer: "Freelance Konsultan",
    currentCompany: "Tax Solutions Global",
    currentPosition: "Tax Associate",
    jobDesk: "Managing corporate tax compliance",
    shortTermTarget: "Senior Tax Consultant",
    longTermTarget: "Tax Manager",
    description: "Seorang profesional perpajakan yang berdedikasi dengan fokus pada kepatuhan pajak korporat dan perencanaan strategis.",
    photoUrl: ""
  },
  workExperiences: [],
  educations: [],
  dailyReports: [
    {
      id: 'd1',
      date: '2025-01-20',
      activity: 'Rekonsiliasi PPN Masa Desember',
      category: 'Operasional',
      // Added missing context and companyName properties
      context: 'Perusahaan',
      companyName: 'Tax Solutions Global',
      output: 'Laporan Rekon Selesai',
      metricValue: 1,
      metricLabel: 'Laporan',
      reflection: 'Proses lancar, data dari vendor sudah lengkap.'
    },
    {
      id: 'd2',
      date: '2025-01-21',
      activity: 'Meeting Persiapan Audit Pajak Tahunan',
      category: 'Meeting',
      // Added missing context and companyName properties
      context: 'Perusahaan',
      companyName: 'Tax Solutions Global',
      output: 'Checklist Dokumen Audit',
      metricValue: 2,
      metricLabel: 'Jam Meeting',
      reflection: 'Perlu koordinasi lebih lanjut dengan tim finance.'
    },
    {
      id: 'd3',
      date: '2025-01-22',
      activity: 'Update UU HPP Klaster Perpajakan',
      category: 'Learning',
      // Added missing context property
      context: 'Personal',
      output: 'Ringkasan Aturan Baru',
      metricValue: 3,
      metricLabel: 'Modul Dibaca',
      reflection: 'Banyak perubahan di aturan teknis pemotongan PPh 21.'
    }
  ],
  skills: [
    { 
      id: 's1', 
      name: 'Akuntansi Dasar', 
      category: SkillCategory.HARD, 
      currentLevel: 4, 
      requiredLevel: 5, 
      status: SkillStatus.ON_PROGRESS,
      priority: SkillPriority.CRITICAL,
      lastUsed: '2025',
      actionPlan: 'Ikut kelas sertifikasi lanjutan'
    },
    { 
      id: 's2', 
      name: 'Kerja Tim', 
      category: SkillCategory.SOFT, 
      currentLevel: 5, 
      requiredLevel: 5, 
      status: SkillStatus.ACHIEVED,
      priority: SkillPriority.HIGH,
      lastUsed: '2025',
      actionPlan: 'Latihan rutin dalam kelompok'
    },
    { 
      id: 's3', 
      name: 'Excel', 
      category: SkillCategory.HARD, 
      currentLevel: 4, 
      requiredLevel: 5, 
      status: SkillStatus.ON_PROGRESS,
      priority: SkillPriority.CRITICAL,
      lastUsed: '2025',
      actionPlan: 'Pelatihan lanjutan macro'
    }
  ],
  trainings: [
    {
      id: 't1',
      name: 'Brevet Pajak A & B',
      provider: 'Klikpajak',
      cost: 500000,
      date: '2025-01-10',
      topic: 'Perpajakan',
      status: TrainingStatus.ON_PROCESS,
      link: 'https://klikpajak.id',
      notes: 'Sedang ambil kelas weekend',
      progress: 65,
      deadline: '2025-03-30',
      priority: SkillPriority.CRITICAL
    },
    {
      id: 't2',
      name: 'Dasar-Dasar Perpajakan Indonesia',
      provider: 'Online Pajak Academy',
      cost: 0,
      date: '2024-12-15',
      topic: 'Perpajakan',
      status: TrainingStatus.ON_PROCESS,
      link: 'https://academy.online-pajak.com',
      notes: 'Selesai & dapat e-sertif',
      progress: 100,
      deadline: '2025-01-15',
      priority: SkillPriority.HIGH
    },
    {
      id: 't3',
      name: 'Excel untuk Keuangan',
      provider: 'MySkill',
      cost: 125000,
      date: '2024-11-20',
      topic: 'Finansial',
      status: TrainingStatus.COMPLETED,
      link: 'https://myskill.id',
      notes: 'Bisa langsung praktik',
      progress: 100,
      deadline: '2024-12-31',
      priority: SkillPriority.MEDIUM
    }
  ],
  certifications: [
    {
      id: 'c1',
      name: 'Brevet A',
      issuer: 'Ikatan Konsultan Pajak Indonesia',
      date: '2025-01-10',
      expiryDate: '2028-01-10',
      isActive: true,
      relatedSkill: 'Strategi Pajak',
      fileLink: 'link/drive/0001'
    }
  ],
  careerPaths: [
    {
      id: 'cp1',
      targetPosition: 'Staf Perpajakan',
      type: CareerType.UTAMA,
      targetYear: 2025,
      requiredSkills: ['Akuntansi Dasar', 'Excel'],
      skillLevel: 5,
      developmentPlan: 'Sudah pengalaman operasional',
      actionDeadline: '2025-06',
      status: CareerStatus.ACHIEVED
    }
  ],
  achievements: [
    {
      id: 'a1',
      title: 'Pelaporan SPT Tahunan perusahaan tepat waktu',
      date: '2023-06-30',
      category: AchievementCategory.PROFESIONAL,
      impact: 'Menghindari denda administrasi dan meningkatkan kepercayaan pimpinan',
      scope: 'Perusahaan'
    }
  ],
  contacts: [],
  monthlyReviews: [],
  jobApplications: [
    {
      id: 'j1',
      position: 'Staf Perpajakan',
      company: 'PT Pajak Cerdas',
      location: 'Jakarta Selatan',
      appliedDate: '2025-07-10',
      appliedVia: 'Email',
      status: JobStatus.SUDAH_KIRIM,
      link: 'bit.ly/pajakcerdas',
      notes: 'Posisi cocok dengan skill'
    },
    {
      id: 'j2',
      position: 'Tax Consultant',
      company: 'KAP & Co.',
      location: 'Jakarta Pusat',
      appliedDate: '2025-07-12',
      appliedVia: 'Website',
      status: JobStatus.PERLU_FOLLOW_UP,
      link: 'bit.ly/kapcareer',
      notes: 'Ada alumni kampus'
    },
    {
      id: 'j3',
      position: 'Finance & Tax Admin',
      company: 'Startup Keuangan',
      location: 'Bandung',
      appliedDate: '2025-07-15',
      appliedVia: 'Orang Dalam',
      status: JobStatus.PERLU_FOLLOW_UP,
      link: 'bit.ly/startupfin',
      notes: 'Butuh skill Excel'
    },
    {
      id: 'j4',
      position: 'Tax Compliance Officer',
      company: 'PT Global Niaga',
      location: 'Tangerang',
      appliedDate: '2025-07-17',
      appliedVia: 'Kita Lulus',
      status: JobStatus.TIDAK_ADA_JAWABAN,
      link: 'bit.ly/globalniaga',
      notes: 'Syarat pengalaman minimal'
    },
    {
      id: 'j5',
      position: 'Tax Intern',
      company: 'TaxEdu Center',
      location: 'Online',
      appliedDate: '2025-07-20',
      appliedVia: 'Job Street',
      status: JobStatus.DITOLAK,
      link: 'bit.ly/taxedu',
      notes: 'Boleh kerja remote'
    },
    {
      id: 'j6',
      position: 'Freelance Tax Writer',
      company: 'Media Finansial',
      location: 'Remote',
      appliedDate: '2025-07-25',
      appliedVia: 'Linked In',
      status: JobStatus.WAWANCARA,
      link: 'bit.ly/taxwriter',
      notes: 'Bisa dikerjakan malam'
    }
  ],
  personalProjects: [
    {
      id: 'pp1',
      name: 'Mini Riset Pajak UMKM',
      date: '2025-04-01',
      skills: ['Analisis Data', 'Pemahaman UU Pajak', 'Excel'],
      link: 'https://bit.ly/proyek-risetpajak',
      status: ProjectStatus.SELESAI,
      description: 'Membuat mini riset tentang kendala UMKM terhadap pajak dan potensi solusi digital'
    },
    {
      id: 'pp2',
      name: 'Instagram Branding Pajak',
      date: '2025-06-15',
      skills: ['Copywriting', 'Branding Personal', 'Komunikasi Klien'],
      link: 'https://www.instagram.com/diary.pajak',
      status: ProjectStatus.PROSES,
      description: 'Membangun akun instagram untuk membagikan tips pajak dengan gaya personal branding'
    },
    {
      id: 'pp3',
      name: 'Template Laporan Pajak Pribadi',
      date: '2025-07-20',
      skills: ['Strategi Pajak', 'Excel', 'Brevet A'],
      link: 'https://bit.ly/template-laporanpajak',
      status: ProjectStatus.SELESAI,
      description: 'Merancang Google Sheet template untuk laporan pajak pribadi dan freelance'
    }
  ],
  affirmations: ["I am capable of achieving my professional goals", "Every challenge is an opportunity to grow"],
  workCategories: ['Operasional', 'Meeting', 'Learning', 'Administratif', 'Lainnya'],
  onlineCV: {
    username: "",
    themeId: "modern-dark",
    isActive: false,
    visibleSections: ['work', 'education', 'skills', 'achievements', 'projects'],
    selectedItemIds: {
      work: [],
      education: [],
      skills: [],
      achievements: [],
      projects: []
    },
    socialLinks: {}
  }
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
