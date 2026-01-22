
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
  PROFESIONAL = 'Profesional',
  PENGEMBANGAN_DIRI = 'Pengembangan Diri',
  ORGANISASI = 'Organisasi',
  FINANSIAL = 'Finansial'
}

export enum CareerStatus {
  NOT_STARTED = 'belum',
  ON_PROGRESS = 'on progress',
  ACHIEVED = 'tercapai'
}

export enum CareerType {
  UTAMA = 'Utama',
  SAMPINGAN = 'Sampingan'
}

export enum JobStatus {
  SUDAH_KIRIM = 'Sudah Kirim',
  PERLU_FOLLOW_UP = 'Perlu Follow UP',
  TIDAK_ADA_JAWABAN = 'Tidak ada jawaban',
  DITOLAK = 'Ditolak',
  WAWANCARA = 'Wawancara'
}

export enum ProjectStatus {
  SELESAI = 'Selesai',
  PROSES = 'Proses'
}

export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  duration: string;
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
  birthPlace: string;
  birthDate: string; // ISO format: YYYY-MM-DD
  maritalStatus: string;
  email: string;
  phone: string;
  domicile: string;
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
  currentLevel: number;
  requiredLevel: number;
  status: SkillStatus;
  priority: SkillPriority;
  lastUsed: string;
  actionPlan: string;
}

export interface Training {
  id: string;
  name: string;
  provider: string;
  cost: number;
  date: string;
  topic: string;
  status: TrainingStatus;
  link: string;
  notes: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate: string;
  isActive: boolean;
  relatedSkill: string;
  fileLink: string;
}

export interface CareerPath {
  id: string;
  targetPosition: string;
  type: CareerType;
  targetYear: number;
  requiredSkills: string[];
  skillLevel: number;
  developmentPlan: string;
  actionDeadline: string; // Display: "MMM YYYY", stored as YYYY-MM
  status: CareerStatus;
}

export interface Achievement {
  id: string;
  title: string;
  date: string; // Support flexible strings for ranges
  category: AchievementCategory;
  impact: string;
  scope: 'Perusahaan' | 'Personal';
  companyName?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  relation: 'mentor' | 'peer' | 'superior' | 'client' | 'HR';
  lastInteractionNote: string;
  followUpPlan: string;
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

export interface JobApplication {
  id: string;
  position: string;
  company: string;
  location: string;
  appliedDate: string;
  appliedVia: string;
  status: JobStatus;
  link: string;
  notes: string;
}

export interface PersonalProject {
  id: string;
  name: string;
  date: string;
  skills: string[];
  link: string;
  status: ProjectStatus;
  description: string;
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
  jobApplications: JobApplication[];
  personalProjects: PersonalProject[];
  affirmations: string[];
}
