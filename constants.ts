
import { AppData, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AchievementCategory, CareerType, CareerStatus, JobStatus, ProjectStatus, UserRole, SubscriptionPlan, AccountStatus } from './types';

// Fix: Added missing properties (role, plan, status, joinedAt, lastLogin, aiUsage, completedAiMilestones) required by AppData type
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
    name: "User",
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
  todoCategories: ['Pendukung Kerja', 'Pengembangan Diri', 'Buka Peluang', 'Keseimbangan Hidup'],
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
  completedAiMilestones: []
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
