
import { AppData, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AchievementCategory } from './types';

export const INITIAL_DATA: AppData = {
  profile: {
    name: "User",
    age: 25,
    gapYear: 0,
    mainCareer: "Software Engineer",
    sideCareer: "Content Creator",
    currentCompany: "Tech Corp",
    currentPosition: "Junior Developer",
    jobDesk: "Frontend development using React",
    shortTermTarget: "Senior Developer in 2 years",
    longTermTarget: "Engineering Manager in 5 years"
  },
  workExperiences: [],
  educations: [],
  dailyReports: [],
  skills: [
    { 
      id: '1', 
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
      id: '2', 
      name: 'Kerja Tim', 
      category: SkillCategory.SOFT, 
      currentLevel: 5, 
      requiredLevel: 5, 
      status: SkillStatus.ACHIEVED,
      priority: SkillPriority.HIGH,
      lastUsed: '2025',
      actionPlan: 'Latihan rutin dalam kelompok'
    }
  ],
  trainings: [
    {
      id: 't1',
      name: 'Brevet Pajak A & B',
      provider: 'Klikpajak',
      cost: 500000,
      date: '2025-03-15',
      topic: 'Pajak',
      status: TrainingStatus.ON_PROCESS,
      link: 'https://klikpajak.id',
      notes: 'Sedang ambil kelas weekend'
    },
    {
      id: 't2',
      name: 'Excel untuk Keuangan',
      provider: 'MySkill',
      cost: 125000,
      date: '2025-02-05',
      topic: 'Excel',
      status: TrainingStatus.COMPLETED,
      link: 'https://myskill.id',
      notes: 'Bisa langsung praktik'
    }
  ],
  certifications: [],
  careerPaths: [],
  achievements: [],
  contacts: [],
  monthlyReviews: [],
  affirmations: ["I am capable of achieving my professional goals", "Every challenge is an opportunity to grow"]
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
