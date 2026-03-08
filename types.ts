
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

export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  EXPIRED = 'Expired',
  PENDING = 'Pending'
}

// NEW ENUMS FOR CALENDAR
export enum EventType {
  INTERVIEW = 'Wawancara kerja',
  TEST = 'Tes / Assessment',
  TRAINING = 'Training / Kelas',
  CERTIFICATION = 'Sertifikasi',
  APPRAISAL = 'Appraisal / Evaluasi',
  DEADLINE = 'Deadline karier',
  MEETING = 'Meeting',
  OTHER = 'Event lain (custom)'
}

export enum ImportanceLevel {
  LOW = 'Rendah',
  MEDIUM = 'Sedang',
  HIGH = 'Tinggi'
}

export interface CareerEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO YYYY-MM-DD
  time: string; // HH:mm
  importance: ImportanceLevel;
  notes?: string;
  location?: string;
  link?: string;
  relatedId?: string; // ID dari Job, Training, atau Cert
}

export interface ManualTransaction {
  id: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  planTier: SubscriptionPlan;
  durationDays?: number;
  notes?: string;
  userName?: string;
  userEmail?: string;
  paymentMethod?: 'Manual' | 'Duitku';
  reference?: string; // Reference from Duitku
  checkoutUrl?: string;
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
  description: string;
  photoUrl?: string;
  jobCategory?: string;
  skillTags?: string[];
  companyCategory?: string[];
  trainingInterest?: string[];
  emailMarketingOptIn?: boolean;
}

export interface DailyReport {
  id: string;
  date: string;
  activity: string;
  description?: string;
  category: string; 
  context: 'Perusahaan' | 'Personal' | 'Sampingan';
  companyName?: string;
  output: string;
  metricValue: number;
  metricLabel: string;
  reflection: string;
  isPlan?: boolean;
  targetValue?: number;
}

export interface WorkReflection {
  id: string;
  date: string; // ISO YYYY-MM-DD
  mood: number; // 1-5
  energy: 'Low' | 'Medium' | 'High';
  workload: 'Light' | 'Normal' | 'Heavy';
  mainContribution: string;
  microWins: string[];
  skillsUsed: string[];
  suggestedSkills?: string[];
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
  isRelevant?: boolean;
  relatedTrainingId?: string;
  relatedCertId?: string;
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
  progress: number;
  deadline: string;
  priority: SkillPriority;
  certLink?: string;
  category?: string;
  calendarEventId?: string;
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
  status?: TrainingStatus;
  deadline?: string;
  certNumber?: string;
  cost?: number;
  progress?: number;
  category?: string;
  calendarEventId?: string;
}

export interface CareerPath {
  id: string;
  targetPosition: string;
  type: CareerType;
  targetYear: number;
  requiredSkills: string[];
  skillLevel: number;
  developmentPlan: string;
  actionDeadline: string;
  status: CareerStatus;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
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
  calendarEventId?: string;
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
  description?: string;
  category: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
  source: 'AI' | 'Manual';
  isFocusToday?: boolean;
}

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

export interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  callbackUrl?: string;
  returnUrl?: string;
  updatedAt?: string;
}

export interface TrackingConfig {
  metaPixelId: string;
  googleAnalyticsId: string;
  tiktokPixelId: string;
  updatedAt?: string;
}

export interface FollowUpConfig {
  pendingPaymentScript: string;
  expiryReminderScript: string;
  justExpiredScript: string;
  updatedAt?: string;
}

export interface LegalConfig {
  privacyPolicy: string;
  termsOfService: string;
  updatedAt?: string;
}

export interface LandingPageConfig {
  videoDemoLinks: Record<string, string>;
  desktopDashboardImg?: string;
  mobileDashboardImg?: string;
  adminWhatsApp?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  updatedAt?: string;
}

export interface MayarConfig {
  apiKey: string;
  subdomain?: string;
  webhookSecret?: string;
  enabledEvents: string[];
  environment: 'sandbox' | 'production';
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
  experienceRoadmap?: { position: string; field: string; duration: string; focus: string }[];
  recommendations: { 
    trainings: AiRecommendation[]; 
    certifications: AiRecommendation[] 
  };
  motivation: string;
  executiveSummary: string;
  dataFingerprint?: string;
  experiencePrerequisites?: string;
  relevantEducation?: string;
  educationRecommendation?: { strata: string; major: string; detail: string };
}

export interface CareerSwitchAnalysis {
  matchScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  skillComparison: {
    userTopSkills: string[];
    targetRequiredSkills: string[];
    matchingSkills: string[];
    missingSkills: string[];
  };
  financialReadiness: string;
  psychologicalInsight: string;
  estimatedTransitionMonths: number;
  roadmap: { step: string; detail: string }[];
}

export interface CareerMoveDiagnosis {
  stayProbability: number;
  jobChangeProbability: number;
  careerSwitchProbability: number;
  topRecommendation: 'stay' | 'move' | 'switch';
  rationalExplanation: string;
}

export interface AiInsightRecord {
  id: string;
  date: string;
  label: string;
  period: 'weekly' | 'monthly';
  audience: 'self' | 'supervisor';
  contexts: string[];
  result: any;
}

export interface ReminderConfig {
  weeklyProgress: boolean;
  monthlyEvaluation: boolean;
  dailyMotivation: boolean;
  dailyLogReminderTime: string;
  reflectionReminderTime: string;
  todoReminderTime: string;
  timezone: string;
}

export interface SubscriptionProduct {
  id: string;
  name: string;
  tier: SubscriptionPlan;
  price: number;
  originalPrice?: number;
  durationDays: number;
  enabledDurations: number[];
  allowedModules: string[];
  isActive?: boolean;
  showOnLanding?: boolean;
  isHighlighted?: boolean;
  /** Added mayarProductId to satisfy constants and components */
  mayarProductId?: string;
  limits: {
    dailyLogs: number | 'unlimited';
    skills: number | 'unlimited';
    projects: number | 'unlimited';
    cvExports: number | 'unlimited';
    trainingHistory: number | 'unlimited';
    certification: number | 'unlimited';
    careerPath: number | 'unlimited';
    jobTracker: number | 'unlimited';
    networking: number | 'unlimited';
    todoList: number | 'unlimited';
    workExperience: number | 'unlimited';
    education: number | 'unlimited';
    careerCalendar: number | 'unlimited';
    achievements: number | 'unlimited'; // Added
  };
}

export interface InterviewScript {
  id: string;
  title?: string;
  targetRole: string;
  targetIndustry: string;
  language: 'ID' | 'EN';
  tone: 'Formal' | 'Casual' | 'Corporate';
  generatedAt: string;
  dynamicRole?: string;
  dynamicIndustry?: string;
  dynamicCompany?: string;
  dynamicSalaryMin?: string;
  dynamicSalaryMax?: string;
  elevatorPitch: string;
  commonQuestions: {
    question: string;
    answer: string;
  }[];
  behavioralQuestions: {
    question: string;
    starAnswer: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
  }[];
  questionsForInterviewer: string[];
  topHighlights: string[];
  weaknessFraming: {
    weakness: string;
    framing: string;
    improvementPlan: string;
  };
}

export interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  brevoApiKey?: string;
  senderEmail: string;
  senderName: string;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  content: string; // HTML content
  createdAt: string;
  createdBy: string;
  filters: {
    skillTags?: string[];
    companyCategory?: string[];
    trainingInterest?: string[];
    experienceLevel?: string[];
    manualUserIds?: string[];
  };
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount?: number;
}

export interface EmailLog {
  id: string;
  campaignId?: string;
  userId: string;
  userEmail: string;
  status: 'sent' | 'failed' | 'opened' | 'clicked';
  sentAt: string;
  error?: string;
  type: 'notification' | 'marketing';
}

export interface SystemTraining {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date: string; // ISO YYYY-MM-DD
  time: string;
  duration: string;
  location: string; // Link or Address
  price: number;
  image?: string;
  category: string;
  tags: string[];
  maxParticipants?: number;
  currentParticipants?: number;
  registrationLink?: string;
  isInternalRegistration?: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  uid?: string;
  role: UserRole;
  plan: SubscriptionPlan;
  status: AccountStatus;
  joinedAt: string;
  lastLogin: string;
  activeFrom?: string;
  expiryDate?: string;
  planPermissions?: string[];
  planLimits?: Record<string, number | 'unlimited'>;
  bypassAiLimits?: boolean;
  isAdminVerified?: boolean;
  adminPromotionRequested?: boolean;
  manualTransactions?: ManualTransaction[];
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
  dailyReflections: WorkReflection[];
  skills: Skill[];
  trainings: Training[];
  certifications: Certification[];
  careerPaths: CareerPath[];
  achievements: Achievement[];
  contacts: Contact[];
  monthlyReviews: MonthlyReview[];
  jobApplications: JobApplication[];
  personalProjects: PersonalProject[];
  todoList: ToDoTask[];
  todoCategories: string[];
  careerEvents: CareerEvent[]; // NEW ARRAY FOR CALENDAR
  aiInsights?: AiInsightRecord[];
  affirmations: string[];
  workCategories: string[];
  onlineCV: OnlineCVConfig;
  aiStrategies?: AiStrategy[];
  interviewScripts?: InterviewScript[];
  careerSwitchDecisions?: { date: string; result: CareerSwitchAnalysis; inputs: any }[];
  careerMoveAnalyses?: { date: string; diagnosis: CareerMoveDiagnosis; inputs: any }[];
  reminderConfig: ReminderConfig;
  completedAiMilestones: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  emailCampaigns?: EmailCampaign[];
  emailLogs?: EmailLog[];
  emailSettings?: EmailSettings;
  onboardingCompleted?: boolean;
}
