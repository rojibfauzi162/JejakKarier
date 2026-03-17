
import { AppData, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AchievementCategory, CareerType, CareerStatus, JobStatus, ProjectStatus, UserRole, SubscriptionPlan, AccountStatus, SubscriptionProduct } from './types';

// Gunakan Object.freeze untuk memastikan INITIAL_DATA tidak bisa dimutasi di memori
export const INITIAL_DATA: AppData = Object.freeze({
  role: UserRole.USER,
  plan: SubscriptionPlan.FREE,
  status: AccountStatus.ACTIVE,
  joinedAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  planPermissions: ['dashboard', 'profile', 'daily', 'skills', 'todo_list', 'calendar', 'work_reflection', 'loker', 'cv_generator', 'online_cv', 'interview_script', 'networking', 'projects', 'career', 'reports', 'achievements', 'ai_insights', 'reviews'],
  aiUsage: {
    cvGenerated: 0,
    coverLetters: 0,
    careerAnalysis: 0,
    totalTokens: 0
  },
  profile: {
    name: "",
    birthPlace: "",
    birthDate: "",
    maritalStatus: "",
    email: "",
    phone: "",
    domicile: "",
    mainCareer: "",
    sideCareer: "",
    currentCompany: "",
    currentPosition: "",
    jobDesk: "",
    shortTermTarget: "",
    longTermTarget: "",
    description: "",
    photoUrl: "",
    jobCategory: ""
  },
  workExperiences: [],
  educations: [],
  dailyReports: [],
  dailyReflections: [],
  skills: [],
  trainings: [],
  certifications: [],
  careerPaths: [],
  achievements: [],
  contacts: [],
  monthlyReviews: [],
  jobApplications: [],
  personalProjects: [],
  todoList: [],
  interviewScripts: [],
  todoCategories: ['Pendukung Kerja', 'Pengembangan Diri', 'Buka Peluang', 'Keseimbangan Hidup'],
  careerEvents: [],
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
  },
  reminderConfig: {
    weeklyProgress: true,
    monthlyEvaluation: true,
    dailyMotivation: true,
    dailyLogReminderTime: "17:00",
    reflectionReminderTime: "18:00",
    todoReminderTime: "20:00",
    timezone: "Asia/Jakarta"
  },
  completedAiMilestones: [],
  onboardingCompleted: false
});

export const DEFAULT_PRODUCTS: SubscriptionProduct[] = [
  { 
    id: 'p_free', 
    name: 'Free Trial Premium', 
    tier: SubscriptionPlan.FREE, 
    price: 0, 
    durationDays: 7, 
    allowedModules: ['dashboard', 'profile', 'daily', 'skills', 'todo_list', 'calendar', 'work_reflection', 'loker', 'cv_generator', 'online_cv', 'interview_script', 'networking', 'projects', 'career', 'reports', 'achievements', 'ai_insights', 'reviews'], 
    limits: { 
      dailyLogs: 10, 
      skills: 10, 
      projects: 10, 
      cvExports: 10,
      trainingHistory: 10,
      certification: 10,
      careerPath: 10,
      jobTracker: 10,
      networking: 10,
      todoList: 10,
      workExperience: 10,
      education: 10,
      careerCalendar: 10,
      achievements: 10
    },
    isActive: true,
    showOnLanding: false, 
    isHighlighted: false,
    enabledDurations: [7]
  },
  { 
    id: 'p_pro_monthly', 
    name: 'Paket Bulanan', 
    tier: SubscriptionPlan.PRO, 
    price: 39000, 
    originalPrice: 48750, 
    durationDays: 30, 
    allowedModules: ['dashboard', 'profile', 'daily', 'skills', 'todo_list', 'career', 'loker', 'cv_generator', 'online_cv', 'interview_script', 'networking', 'projects', 'reviews', 'ai_insights', 'calendar', 'work_reflection', 'reports', 'achievements'], 
    limits: { 
      dailyLogs: 'unlimited', 
      skills: 'unlimited', 
      projects: 'unlimited', 
      cvExports: 'unlimited',
      trainingHistory: 'unlimited',
      certification: 'unlimited',
      careerPath: 'unlimited',
      jobTracker: 'unlimited',
      networking: 'unlimited',
      todoList: 'unlimited',
      workExperience: 'unlimited',
      education: 'unlimited',
      careerCalendar: 'unlimited',
      achievements: 'unlimited'
    }, 
    mayarProductId: 'paket-bulanan-jejakkarir-40840', 
    isActive: true, 
    showOnLanding: true, 
    isHighlighted: false, 
    enabledDurations: [30] 
  },
  { 
    id: 'p_pro_quarterly', 
    name: 'Paket 3 Bulanan', 
    tier: SubscriptionPlan.PRO, 
    price: 99000, 
    originalPrice: 165000, 
    durationDays: 90, 
    allowedModules: ['dashboard', 'profile', 'daily', 'skills', 'todo_list', 'career', 'loker', 'cv_generator', 'online_cv', 'interview_script', 'networking', 'projects', 'reviews', 'ai_insights', 'calendar', 'work_reflection', 'reports', 'achievements'], 
    limits: { 
      dailyLogs: 'unlimited', 
      skills: 'unlimited', 
      projects: 'unlimited', 
      cvExports: 'unlimited',
      trainingHistory: 'unlimited',
      certification: 'unlimited',
      careerPath: 'unlimited',
      jobTracker: 'unlimited',
      networking: 'unlimited',
      todoList: 'unlimited',
      workExperience: 'unlimited',
      education: 'unlimited',
      careerCalendar: 'unlimited',
      achievements: 'unlimited'
    }, 
    mayarProductId: 'paket-3-bulanan-jejakkarir-40841', 
    isActive: true, 
    showOnLanding: true, 
    isHighlighted: false, 
    enabledDurations: [90] 
  },
  { 
    id: 'p_pro_yearly', 
    name: 'Paket Tahunan', 
    tier: SubscriptionPlan.PRO, 
    price: 149000, 
    originalPrice: 496667, 
    durationDays: 365, 
    allowedModules: ['dashboard', 'profile', 'daily', 'skills', 'todo_list', 'career', 'loker', 'cv_generator', 'online_cv', 'interview_script', 'networking', 'projects', 'reviews', 'ai_insights', 'calendar', 'work_reflection', 'reports', 'achievements'], 
    limits: { 
      dailyLogs: 'unlimited', 
      skills: 'unlimited', 
      projects: 'unlimited', 
      cvExports: 'unlimited',
      trainingHistory: 'unlimited',
      certification: 'unlimited',
      careerPath: 'unlimited',
      jobTracker: 'unlimited',
      networking: 'unlimited',
      todoList: 'unlimited',
      workExperience: 'unlimited',
      education: 'unlimited',
      careerCalendar: 'unlimited',
      achievements: 'unlimited'
    }, 
    mayarProductId: 'paket-tahunan-jejakkarir-40842', 
    isActive: true, 
    showOnLanding: true, 
    isHighlighted: true, 
    enabledDurations: [365] 
  }
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
