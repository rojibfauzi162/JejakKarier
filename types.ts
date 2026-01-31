
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

export enum UserRole {
  USER = 'user',
  SUPERADMIN = 'superadmin'
}

export enum SubscriptionPlan {
  FREE = 'Free',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise'
}

export enum AccountStatus {
  ACTIVE = 'Active',
  TRIAL = 'Trial',
  INACTIVE = 'Inactive',
  BANNED = 'Banned'
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
  description: string; // Properti baru untuk deskripsi diri
  photoUrl?: string; // Properti baru untuk foto profil
  jobCategory?: string; // Baru: Kategori Jabatan
}

export interface DailyReport {
  id: string;
  date: string;
  activity: string;
  category: string; 
  context: 'Perusahaan' | 'Personal' | 'Sampingan'; // Field baru
  companyName?: string; // Field baru
  output: string;
  metricValue: number;
  metricLabel: string;
  reflection: string;
  isPlan?: boolean; // Baru: Penanda apakah ini masih rencana
  targetValue?: number; // Baru: Target angka yang ingin dicapai
}

export interface WorkReflection {
  id: string;
  date: string; // ISO YYYY-MM-DD
  mood: number; // 1-5
  energy: 'Low' | 'Medium' | 'High';
  workload: 'Light' | 'Normal' | 'Heavy';
  mainContribution: string;
  microWins: string[]; // List of checkboxes
  skillsUsed: string[]; // Array of skill names
  suggestedSkills?: string[]; // Up to 2 manual new skills
  energyDrain?: string;
  focusTomorrow?: string;
  rotatingQuestion: string;
  rotatingAnswer: string;
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
  progress: number; // Properti baru 0-100
  deadline: string; // Properti baru YYYY-MM-DD
  priority: SkillPriority; // Properti baru
  certLink?: string; // Properti baru link/file sertifikat
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
  status?: TrainingStatus; // Properti baru
  deadline?: string; // Properti baru YYYY-MM-DD
  certNumber?: string; // Properti baru nomor sertifikat
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

export interface ToDoTask {
  id: string;
  task: string;
  description?: string; // Properti baru
  category: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
  source: 'AI' | 'Manual';
  isFocusToday?: boolean; // Properti baru
}

// Konfigurasi khusus untuk CV Online / Landing Page
export interface OnlineCVConfig {
  username: string;
  themeId: string;
  isActive: boolean;
  visibleSections: string[];
  selectedItemIds: Record<string, string[]>;
  customTitle?: string;
  customBio?: string;
  customPosition?: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
}

export interface AiConfig {
  openRouterKey: string;
  modelName: string;
  maxTokens: number;
  updatedAt?: string;
}

export interface AiRecommendation {
  name: string;
  provider: string;
  detail: string;
  schedule: string;
  priceRange: string;
  url?: string;
}

export interface AiStrategy {
  version: number;
  date: string;
  language: 'id' | 'en';
  targetGoal: string;
  readinessScore: number;
  scoreExplanation: string;
  criticalGaps: { skill: string; why: string; priority: string }[];
  immediateActions: { weekly: string; monthly: string; nextMonth: string };
  roadmapSteps: { title: string; detail: string }[];
  experienceRoadmap?: { position: string; duration: string; focus: string }[];
  recommendations: { 
    trainings: AiRecommendation[]; 
    certifications: AiRecommendation[] 
  };
  motivation: string;
  executiveSummary: string;
  dataFingerprint?: string; // Properti baru untuk validasi perubahan data
}

export interface AiInsightRecord {
  id: string;
  date: string;
  label: string; // e.g. "Januari 2026 Minggu ke-1"
  period: 'weekly' | 'monthly';
  audience: 'self' | 'supervisor';
  contexts: string[];
  result: any; // The JSON object returned by Gemini
}

export interface ReminderConfig {
  weeklyProgress: boolean;
  monthlyEvaluation: boolean;
  dailyMotivation: boolean;
  // BARU: Pengaturan Waktu Reminder Spesifik
  dailyLogReminderTime: string; // Format "HH:mm"
  reflectionReminderTime: string; // Format "HH:mm"
  todoReminderTime: string; // Format "HH:mm"
}

export interface AppData {
  uid?: string; // Ditambahkan untuk identifikasi di admin
  role: UserRole;
  plan: SubscriptionPlan;
  status: AccountStatus;
  joinedAt: string;
  lastLogin: string;
  activeFrom?: string; // Tanggal mulai masa aktif
  expiryDate?: string; // Tanggal akhir masa aktif
  planPermissions?: string[]; // Modul yang diizinkan (e.g. 'daily', 'cv')
  planLimits?: Record<string, number | 'unlimited'>; // Batas data per modul
  bypassAiLimits?: boolean; // Modul admin bypass kuota
  aiUsage: {
    cvGenerated: number;
    coverLetters: number;
    careerAnalysis: number;
    totalTokens: number;
  };
  profile: UserProfile;
  workExperiences: WorkExperience[];
  educations: Education[];
  dailyReports: DailyReport[];
  dailyReflections: WorkReflection[]; // Baru: Refleksi harian
  skills: Skill[];
  trainings: Training[];
  certifications: Certification[];
  careerPaths: CareerPath[];
  achievements: Achievement[];
  contacts: Contact[];
  monthlyReviews: MonthlyReview[];
  jobApplications: JobApplication[];
  personalProjects: PersonalProject[];
  todoList: ToDoTask[]; // Baru: Daftar tugas harian
  todoCategories: string[]; // Baru: Kategori tugas kustom
  aiInsights?: AiInsightRecord[]; // Riwayat AI Insight
  affirmations: string[];
  workCategories: string[]; // Properti baru untuk kustomisasi kategori kerja
  onlineCV: OnlineCVConfig; // Properti baru untuk CV Online
  aiStrategies?: AiStrategy[]; // Properti baru untuk riwayat strategi AI
  reminderConfig: ReminderConfig; // Baru: Konfigurasi pengingat
  completedAiMilestones: string[]; // Baru: Simpan ID mileston yang sudah tuntas
  isDeleted?: boolean; // Untuk fitur soft delete
  deletedAt?: string;
}
