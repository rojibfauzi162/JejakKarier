
export enum SkillStatus {
  GAP = 'gap',
  ON_PROGRESS = 'on progress',
  ACHIEVED = 'achieved'
}

export enum SkillCategory {
  HARD = 'Hard Skill',
  SOFT = 'Soft Skill'
}

export enum SkillPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum TrainingStatus {
  PLANNED = 'Planned',
  ON_PROCESS = 'On Process',
  COMPLETED = 'Completed'
}

export enum AchievementCategory {
  CAREER = 'career',
  FINANCIAL = 'financial',
  PERSONAL = 'personal'
}

export enum CareerStatus {
  NOT_STARTED = 'belum',
  ON_PROGRESS = 'on progress',
  ACHIEVED = 'tercapai'
}

export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  duration: string; // e.g., "Jan 2020 - Present"
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  description: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gapYear: number;
  mainCareer: string;
  sideCareer: string;
  currentCompany: string;
  currentPosition: string;
  jobDesk: string;
  shortTermTarget: string;
  longTermTarget: string;
}

export interface DailyReport {
  id: string;
  date: string;
  activity: string;
  output: string;
  metricValue: number;
  metricLabel: string;
  reflection: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  currentLevel: number; // 1-5
  requiredLevel: number; // 1-5
  status: SkillStatus;
  priority: SkillPriority;
  lastUsed: string;
  actionPlan: string;
}

export interface Training {
  id: string;
  name: string;      // Judul Course
  provider: string;  // Platform
  cost: number;      // Biaya
  date: string;      // Tanggal
  topic: string;     // Topik
  status: TrainingStatus;
  link: string;      // Link/Materi
  notes: string;     // Catatan
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  expiryDate: string;
  isActive: boolean;
}

export interface CareerStep {
  id: string;
  description: string;
  deadline: string;
  status: CareerStatus;
}

export interface CareerPath {
  id: string;
  targetPosition: string;
  targetAge: number;
  requiredSkills: string[];
  ownedSkills: string[];
  steps: CareerStep[];
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  category: AchievementCategory;
  impact: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  position: string;
  relation: 'mentor' | 'peer' | 'superior' | 'client';
  lastInteractionNote: string;
  lastInteractionDate: string;
}

export interface MonthlyReview {
  id: string;
  month: string;
  year: string;
  positives: string;
  improvements: string;
  obstacles: string;
  nextMonthPlan: string;
  aiSummary?: string;
}

export interface AppData {
  profile: UserProfile;
  workExperiences: WorkExperience[];
  educations: Education[];
  dailyReports: DailyReport[];
  skills: Skill[];
  trainings: Training[];
  certifications: Certification[];
  careerPaths: CareerPath[];
  achievements: Achievement[];
  contacts: Contact[];
  monthlyReviews: MonthlyReview[];
  affirmations: string[];
}
