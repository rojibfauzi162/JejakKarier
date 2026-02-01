import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, type User } from '@firebase/auth';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, saveUserData } from './services/firebase';
import { AppData, UserProfile, DailyReport, Skill, Training, Certification, CareerPath, Achievement, Contact, MonthlyReview, WorkExperience, Education, JobApplication, PersonalProject, OnlineCVConfig, UserRole, SubscriptionPlan, AccountStatus, AiStrategy, ReminderConfig, SkillStatus, ToDoTask, WorkReflection } from './types';
import { INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import ProfileView from './components/ProfileView';
import DailyLogs from './components/DailyLogs';
import SkillTracker from './components/SkillTracker';
import JobTracker from './components/JobTracker';
import CareerPlanner from './components/CareerPlanner';
import AchievementTracker from './components/AchievementTracker';
import Networking from './components/Networking';
import Reviews from './components/Reviews';
import PersonalProjectTracker from './components/PersonalProjectTracker';
import PerformanceReports from './components/PerformanceReports';
import PublicReportView from './components/PublicReportView';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import CVGenerator from './components/CVGenerator';
import OnlineCVBuilder from './components/OnlineCVBuilder';
import OnlineCVView from './components/OnlineCVView';
import AccountSettings from './components/AccountSettings';
import AdminPanel from './components/AdminPanel';
import Reminders from './components/Reminders';
import AiInsightActivity from './components/AiInsightActivity';
import ToDoList from './components/ToDoList';
import WorkReflectionView from './components/WorkReflection';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Fix: Implement HubButton for the Apps Hub view
const HubButton: React.FC<{ onClick: () => void, label: string, icon: string, color: string }> = ({ onClick, label, icon, color }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-100 hover:bg-purple-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all active:scale-95 group ${colors[color] || colors.indigo}`}>
      <div className="text-3xl transition-transform group-hover:scale-110"><i className={`bi ${icon}`}></i></div>
      <span className="text-[10px] font-black uppercase tracking-widest text-center">{label}</span>
    </button>
  );
};

// Fix: Implement MetricCard for local App usage (e.g. mobile stats)
const MetricCard: React.FC<{ title: string; value: number | string; subtitle: string; icon: React.ReactNode; color: string }> = ({ title, value, subtitle, icon, color }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-900',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-500 hover:shadow-md group">
      <div className={`w-12 h-12 ${colors[color] || colors.indigo} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform text-xl`}>
        {icon}
      </div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">{title}</p>
      <h4 className="text-xl font-black text-slate-900 tracking-tight">{value}</h4>
      <p className="text-[9px] text-slate-500 mt-4 font-bold uppercase tracking-widest opacity-60 italic">{subtitle}</p>
    </div>
  );
};

// Fix: Implement InputGroup for the Onboarding wizard
const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

// Fix: Implement ActionItem helper for the NotificationOverlay
const ActionItem = ({ label, isDone, onComplete }: { label: string; isDone: boolean; onComplete: () => void }) => (
  <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${isDone ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-100 shadow-sm'}`}>
    <button 
      onClick={() => !isDone && onComplete()}
      className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200 text-transparent hover:border-emerald-400'}`}
    >
      <i className="bi bi-check-lg text-xs"></i>
    </button>
    <p className={`text-[11px] font-bold leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{label}</p>
  </div>
);

// Fix: Implement NotificationOverlay to show AI-driven career signals and smart reminders
const NotificationOverlay: React.FC<{ data: AppData, onClose: () => void, onUpdateMilestone: (id: string, label: string) => void, onNavigate: (tab: string, date?: string) => void }> = ({ data, onClose, onUpdateMilestone, onNavigate }) => {
  const latestStrategy = data.aiStrategies?.[0];
  const completed = data.completedAiMilestones || [];

  // Hitung Pengingat Harian
  const today = new Date().toISOString().split('T')[0];
  const hasWorkLogs = data.dailyReports.some(l => l.date === today);
  const hasReflection = data.dailyReflections.some(r => r.date === today);
  
  // Perbaikan: Identifikasi tanggal tugas tertunda tertua untuk navigasi akurat
  const pendingTasks = data.todoList.filter(t => t.status === 'Pending');
  const oldestPendingDate = pendingTasks.length > 0 
    ? pendingTasks.sort((a,b) => a.createdAt.localeCompare(b.createdAt))[0].createdAt.split('T')[0]
    : today;

  // Perbaikan: Identifikasi log kerja yang terlewat (3 hari terakhir)
  const last3Days = [0, 1, 2].map(daysBack => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().split('T')[0];
  });
  const oldestMissingLogDate = last3Days.reverse().find(date => !data.dailyReports.some(l => l.date === date)) || today;

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Notifications Hub</h3>
           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900"><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {/* Section 1: Smart Reminders */}
           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Protocol Reminders</p>
              {!hasWorkLogs && (
                <button onClick={() => { onNavigate('daily', oldestMissingLogDate); onClose(); }} className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-left flex items-center gap-4 hover:bg-indigo-100 transition-colors">
                   <span className="text-xl">📝</span>
                   <div>
                      <p className="text-[11px] font-black text-indigo-700 leading-tight">Log Harian Belum Diisi!</p>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                        {oldestMissingLogDate === today ? 'Hari Ini' : new Date(oldestMissingLogDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                      </p>
                   </div>
                </button>
              )}
              {!hasReflection && (
                <button onClick={() => { onNavigate('work_reflection', today); onClose(); }} className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left flex items-center gap-4 hover:bg-rose-100 transition-colors">
                   <span className="text-xl">🧘</span>
                   <div>
                      <p className="text-[11px] font-black text-rose-700 leading-tight">Refleksi Belum Terisi!</p>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Self Review</p>
                   </div>
                </button>
              )}
              {pendingTasks.length > 0 && (
                <button onClick={() => { onNavigate('todo_list', oldestPendingDate); onClose(); }} className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-left flex items-center gap-4 hover:bg-emerald-100 transition-colors">
                   <span className="text-xl">🚀</span>
                   <div>
                      <p className="text-[11px] font-black text-emerald-700 leading-tight">{pendingTasks.length} Langkah Tertunda</p>
                      <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Mulai dari {new Date(oldestPendingDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
                   </div>
                </button>
              )}
              {hasWorkLogs && hasReflection && pendingTasks.length === 0 && (
                <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <span className="text-3xl grayscale mb-4 block">✅</span>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semua Protokol Tuntas!</p>
                </div>
              )}
           </div>

           {/* Section 2: AI Actions */}
           {latestStrategy && (
             <div className="space-y-6 pt-6 border-t border-slate-100">
               <p className="text-10px font-black text-slate-400 uppercase tracking-widest ml-1">Career Signals</p>
               <div className="p-5 bg-slate-900 rounded-[1.5rem] text-white">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">AI Coach Motivation</p>
                  <p className="text-xs font-bold italic leading-relaxed opacity-80">"{latestStrategy.motivation}"</p>
               </div>
               <div className="space-y-4">
                  <ActionItem 
                    label={latestStrategy.immediateActions.weekly} 
                    isDone={completed.includes(`action:${latestStrategy.immediateActions.weekly}`)}
                    onComplete={() => onUpdateMilestone(`action:${latestStrategy.immediateActions.weekly}`, latestStrategy.immediateActions.weekly)}
                  />
                  <ActionItem 
                    label={latestStrategy.immediateActions.monthly} 
                    isDone={completed.includes(`action:${latestStrategy.immediateActions.monthly}`)}
                    onComplete={() => onUpdateMilestone(`action:${latestStrategy.immediateActions.monthly}`, latestStrategy.immediateActions.monthly)}
                  />
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [permissionsBlocked, setPermissionsBlocked] = useState(false);
  
  // State untuk alur pendaratan (Landing vs Auth)
  const [guestMode, setGuestMode] = useState<'landing' | 'auth'>('landing');

  // New State for Notification Overlay
  const [showNotif, setShowNotif] = useState(false);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // UI States for Alert and Confirmation
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ key: keyof AppData; id: string; label: string } | null>(null);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('jejakkarir_data');
    return saved ? JSON.parse(saved) : {
      ...INITIAL_DATA,
      role: UserRole.USER,
      plan: SubscriptionPlan.FREE,
      status: AccountStatus.ACTIVE,
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      aiUsage: { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 },
      completedAiMilestones: []
    };
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalTargetDate, setGlobalTargetDate] = useState<string | undefined>(undefined);

  const searchParams = new URLSearchParams(window.location.search);
  const isPublicView = searchParams.get('view') === 'shared_report' || searchParams.get('view') === 'shared_insight';
  const publicContext = searchParams.get('context') || 'all';
  const publicUserName = searchParams.get('name') || 'User';
  
  // Deteksi rute CV Online publik (Mendukung ?u= atau /profile/username)
  const pathParts = window.location.pathname.split('/');
  const onlineUserSlug = searchParams.get('u') || (pathParts[1] === 'profile' ? pathParts[2] : null);
  const isOnlineCVView = !!onlineUserSlug;

  // IDENTIFIKASI ADMIN SECARA LANGSUNG DARI EMAIL AUTH (MENCEGAH LAG FIRESTORE)
  // Perbaikan: Menghapus rojibfauzi@gmail.com dari daftar pengecekan Admin
  const isAdmin = useMemo(() => {
    const authEmail = (user?.email || '').toLowerCase();
    const isSpecialEmail = authEmail === 'admin@jejakkarir.com';
    return data.role === UserRole.SUPERADMIN || isSpecialEmail;
  }, [user, data.role]);

  // Notification count logic
  const notificationCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    if (!data.dailyReports.some(l => l.date === today)) count++;
    if (!data.dailyReflections.some(r => r.date === today)) count++;
    const pendingTasks = data.todoList.filter(t => t.status === 'Pending' && new Date(t.createdAt).toISOString().split('T')[0] === today);
    count += pendingTasks.length;
    return count;
  }, [data]);

  const handleTabChange = (tab: string, date?: string) => {
    setActiveTab(tab);
    setGlobalTargetDate(date);
  };

  useEffect(() => {
    if (isPublicView || isOnlineCVView) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser as User | null);
      setAuthLoading(false);
      if (!currentUser) setPermissionsBlocked(false);
    });
    return () => unsubscribe();
  }, [isPublicView, isOnlineCVView]);

  useEffect(() => {
    if (!user || isPublicView || isOnlineCVView) {
      setDbError(null);
      return;
    }

    const startSnapshot = () => {
      setDbError(null);
      return onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        setDbError(null);
        setPermissionsBlocked(false);
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as AppData;
          
          const authEmail = (user.email || '').toLowerCase();
          const isHardcodedAdmin = authEmail === 'admin@jejakkarir.com';
          // Email yang harus dikembalikan ke role USER
          const isToBeDemoted = authEmail === 'rojibfauzi@gmail.com';
          
          // Cek Onboarding: Jika profile jobDesk kosong dan bukan admin, tampilkan onboarding
          if (!cloudData.profile?.jobDesk && !isHardcodedAdmin) {
            setShowOnboarding(true);
          }

          let needsUpdateToDB = false;

          // Proteksi inisialisasi agar data lokal tidak tertimpa undefined saat sync
          if (!cloudData.workExperiences) cloudData.workExperiences = [];
          if (!cloudData.educations) cloudData.educations = [];
          if (!cloudData.dailyReports) cloudData.dailyReports = [];
          if (!cloudData.dailyReflections) cloudData.dailyReflections = [];
          if (!cloudData.skills) cloudData.skills = [];
          if (!cloudData.trainings) cloudData.trainings = [];
          if (!cloudData.certifications) cloudData.certifications = [];
          if (!cloudData.careerPaths) cloudData.careerPaths = [];
          if (!cloudData.achievements) cloudData.achievements = [];
          if (!cloudData.contacts) cloudData.contacts = [];
          if (!cloudData.monthlyReviews) cloudData.monthlyReviews = [];
          if (!cloudData.jobApplications) cloudData.jobApplications = [];
          if (!cloudData.personalProjects) cloudData.personalProjects = [];
          if (!cloudData.todoList) cloudData.todoList = [];
          if (!cloudData.todoCategories) cloudData.todoCategories = INITIAL_DATA.todoCategories;
          if (!cloudData.workCategories) cloudData.workCategories = INITIAL_DATA.workCategories;
          if (!cloudData.onlineCV) cloudData.onlineCV = INITIAL_DATA.onlineCV;
          if (!cloudData.reminderConfig) cloudData.reminderConfig = INITIAL_DATA.reminderConfig;
          if (!cloudData.affirmations) cloudData.affirmations = INITIAL_DATA.affirmations;
          if (!cloudData.completedAiMilestones) cloudData.completedAiMilestones = [];
          
          // SINKRONISASI IDENTITAS AGRESSIF (PERBAIKAN EMAIL & NAMA)
          if (!cloudData.profile) cloudData.profile = { ...INITIAL_DATA.profile };
          
          const currentProfileEmail = (cloudData.profile.email || '').toLowerCase();
          const isDefaultEmail = currentProfileEmail === 'alex@example.com' || !currentProfileEmail;
          
          if (isDefaultEmail || currentProfileEmail !== authEmail) {
            cloudData.profile.email = user.email || '';
            needsUpdateToDB = true;
          }

          if ((cloudData.profile.name === 'Alex' || !cloudData.profile.name) && user.displayName) {
            cloudData.profile.name = user.displayName;
            needsUpdateToDB = true;
          }

          // PASTIKAN ROLE DISINKRONKAN KE DATABASE JIKA BERUBAH ATAU KOSONG
          if (isHardcodedAdmin && cloudData.role !== UserRole.SUPERADMIN) {
            cloudData.role = UserRole.SUPERADMIN;
            needsUpdateToDB = true;
          } else if (isToBeDemoted && cloudData.role !== UserRole.USER) {
            // DEMOSI PAKSA UNTUK rojibfauzi@gmail.com
            cloudData.role = UserRole.USER;
            needsUpdateToDB = true;
          } else if (!cloudData.role) {
            cloudData.role = UserRole.USER;
            needsUpdateToDB = true;
          }
          
          if (!cloudData.plan) { cloudData.plan = SubscriptionPlan.FREE; needsUpdateToDB = true; }
          if (!cloudData.status) { cloudData.status = AccountStatus.ACTIVE; needsUpdateToDB = true; }
          if (!cloudData.aiUsage) { cloudData.aiUsage = { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 }; needsUpdateToDB = true; }
          
          // Update last login if different day
          const lastDate = new Date(cloudData.lastLogin || 0).toDateString();
          const todayDate = new Date().toDateString();
          if (lastDate !== todayDate) {
            cloudData.lastLogin = new Date().toISOString();
            needsUpdateToDB = true;
          }

          if (needsUpdateToDB) {
            setDoc(doc(db, "users", user.uid), cloudData, { merge: true });
          }

          // REDIREKSI ADMIN KE ADMIN DASHBOARD PADA LOGIN PERTAMA
          if (isHardcodedAdmin && (activeTab === 'dashboard' || !activeTab.includes('admin'))) {
            setActiveTab('admin_dashboard');
          }

          setData(cloudData);
        } else {
          // MEMBUAT DATA AWAL DENGAN IDENTITAS ASLI DARI AUTH
          const authEmail = (user.email || '').toLowerCase();
          const isAdminRole = (authEmail === 'admin@jejakkarir.com');
          const newData = {
            ...INITIAL_DATA,
            uid: user.uid,
            profile: {
              ...INITIAL_DATA.profile,
              name: user.displayName || 'New User',
              email: user.email || ''
            },
            role: isAdminRole ? UserRole.SUPERADMIN : UserRole.USER,
            plan: SubscriptionPlan.FREE,
            status: AccountStatus.ACTIVE,
            joinedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            aiUsage: { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 },
            completedAiMilestones: []
          };
          saveUserData(user.uid, newData as AppData);
          if (!isAdminRole) {
            setShowOnboarding(true);
          } else {
             setActiveTab('admin_dashboard');
          }
        }
      }, (error) => {
        console.warn("Firestore access issues:", error);
        if (error.code === 'permission-denied') {
          setPermissionsBlocked(true);
          setDbError("Akses database ditolak.");
        } else {
          setDbError("Terjadi hambatan sinkronisasi sistem.");
        }
      });
    };

    const unsubscribe = startSnapshot();
    return () => unsubscribe();
  }, [user, isPublicView, isOnlineCVView, activeTab]);

  useEffect(() => {
    if (!isPublicView && !isOnlineCVView) {
      localStorage.setItem('jejakkarir_data', JSON.stringify(data));
    }
  }, [data, isPublicView, isOnlineCVView]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const syncData = (newData: AppData) => {
    setData(newData);
    if (user && !permissionsBlocked) {
      saveUserData(user.uid, newData);
    }
    triggerToast("Data Berhasil Diperbarui.");
  };

  const handleRetrySync = () => {
    setPermissionsBlocked(false);
    setDbError(null);
    if (user) saveUserData(user.uid, data);
  };

  const updateProfile = (profile: UserProfile) => {
    syncData({ ...data, profile });
  };
  
  const addItem = (key: keyof AppData, item: any) => {
    setData(prev => {
      const currentArray = prev[key];
      if (Array.isArray(currentArray)) {
        const newData = {
          ...prev,
          [key]: [...currentArray, item]
        };
        if (user && !permissionsBlocked) {
          saveUserData(user.uid, newData);
        }
        return newData;
      }
      return prev;
    });
    triggerToast("Data Berhasil Ditambah.");
  };

  const deleteItem = (key: keyof AppData, id: string) => {
    setData(prev => {
      const currentArray = prev[key];
      if (Array.isArray(currentArray)) {
        const newData = {
          ...prev,
          [key]: currentArray.filter((item: any) => item.id !== id)
        };
        if (user && !permissionsBlocked) {
          saveUserData(user.uid, newData);
        }
        return newData;
      }
      return prev;
    });
    triggerToast("Data Telah Dihapus.");
  };

  const requestDelete = (key: keyof AppData, id: string, label: string) => {
    setShowConfirm({ key, id, label });
  };

  const confirmDelete = () => {
    if (showConfirm) {
      deleteItem(showConfirm.key, showConfirm.id);
      setShowConfirm(null);
    }
  };

  const updateItem = (key: keyof AppData, updatedItem: any) => {
    setData(prev => {
      const currentArray = prev[key];
      if (Array.isArray(currentArray)) {
        const newData = {
          ...prev,
          [key]: currentArray.map((item: any) => item.id === updatedItem.id ? updatedItem : item)
        };
        if (user && !permissionsBlocked) {
          saveUserData(user.uid, newData);
        }
        return newData;
      }
      return prev;
    });
  };

  const handleAddCategory = (cat: string) => {
    syncData({ ...data, workCategories: [...data.workCategories, cat] });
  };

  const handleDeleteCategory = (cat: string) => {
    if (data.workCategories.length > 1) {
      syncData({ ...data, workCategories: data.workCategories.filter(c => c !== cat) });
    }
  };

  const handleAddTodoCategory = (cat: string) => {
    syncData({ ...data, todoCategories: [...data.todoCategories, cat] });
  };

  const handleUpdateTodoCategory = (old: string, next: string) => {
    syncData({ 
      ...data, 
      todoCategories: data.todoCategories.map(c => c === old ? next : c),
      todoList: data.todoList.map(t => t.category === old ? { ...t, category: next } : t)
    });
  };

  const handleDeleteTodoCategory = (cat: string) => {
    const isFixed = ['Pendukung Kerja', 'Pengembangan Diri', 'Buka Peluang', 'Keseimbangan Hidup'].includes(cat);
    if (!isFixed) {
      syncData({ ...data, todoCategories: data.todoCategories.filter(c => c !== cat) });
    }
  };

  const handleUpdateMilestone = (milestoneId: string, label: string) => {
    const current = data.completedAiMilestones || [];
    if (!current.includes(milestoneId)) {
      // 1. Lock Milestone Centang
      const newCompleted = [...current, milestoneId];
      
      // 2. Add to To-Do List
      const newTask: ToDoTask = {
        id: Math.random().toString(36).substr(2, 9),
        task: label,
        category: 'Pengembangan Diri', // Default category for AI tasks
        status: 'Pending',
        createdAt: new Date().toISOString(),
        source: 'AI'
      };

      syncData({ 
        ...data, 
        completedAiMilestones: newCompleted,
        todoList: [newTask, ...(data.todoList || [])]
      });
      
      triggerToast("Tugas AI ditambahkan ke Langkah Pengembangan! 🚀");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGuestMode('landing');
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    // PROTEKSI: Akun banned atau isDeleted tidak bisa akses fitur utama
    if ((data.status === AccountStatus.BANNED || data.isDeleted) && !isAdmin) {
      return (
        <div className="h-full flex items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
           <div className="max-w-xl w-full bg-white p-16 rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] text-center border border-rose-100">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" cy="8" x2="12" y2="12"></line><line x1="12" cy="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">{data.isDeleted ? 'Akun Dinonaktifkan' : 'Akses Terbatas'}</h2>
              <p className="text-slate-400 leading-relaxed font-bold mb-12 text-sm uppercase tracking-widest">
                {data.isDeleted 
                  ? 'Akun Anda sedang dijadwalkan untuk dihapus permanen. Hubungi admin jika ini kesalahan.' 
                  : 'Akses akun Anda telah dibatasi sementara oleh admin sistem.'}
              </p>
              <button onClick={() => setActiveTab('settings')} className="w-full py-5 bg-slate-950 text-white font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.02] transition-all">Buka Pengaturan Keamanan</button>
           </div>
        </div>
      );
    }

    // PROTEKSI KHUSUS ADMIN: Akun admin tertentu hanya boleh melihat Admin Panel
    if (isAdmin && (activeTab === 'dashboard' || !activeTab.includes('admin'))) {
       return <AdminPanel initialMode="dashboard" />;
    }

    // Wrap content with Mobile Header for navigation experience
    const content = (() => {
      switch (activeTab) {
        case 'dashboard': return <Dashboard data={data} onNavigate={handleTabChange} onOpenNotif={() => setShowNotif(true)} />;
        case 'apps_hub': return (
          <div className="px-5 py-6 lg:px-0 lg:pt-6 space-y-10 animate-in fade-in duration-700">
             <div className="space-y-8">
                <div>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Aktivitas Harian</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <HubButton onClick={() => setActiveTab('daily')} label="Daily Work" icon="bi-pencil-square" color="indigo" />
                      <HubButton onClick={() => setActiveTab('todo_list')} label="Langkah Pengembangan" icon="bi-check2-square" color="emerald" />
                      <HubButton onClick={() => setActiveTab('work_reflection')} label="Refleksi Kerja" icon="bi-chat-quote" color="amber" />
                      <HubButton onClick={() => setActiveTab('reports')} label="Performa Data" icon="bi-graph-up-arrow" color="blue" />
                      <HubButton onClick={() => setActiveTab('ai_insights')} label="AI Insight Activity" icon="bi-cpu" color="purple" />
                   </div>
                </div>
                <div>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Pengembangan Diri</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <HubButton onClick={() => setActiveTab('skills')} label="Skills & Learning" icon="bi-mortarboard" color="cyan" />
                      <HubButton onClick={() => setActiveTab('career')} label="Career Path" icon="bi-rocket-takeoff" color="amber" />
                      <HubButton onClick={() => setActiveTab('achievements')} label="Achievements" icon="bi-trophy" color="emerald" />
                   </div>
                </div>
                <div>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Lowongan & Karir</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <HubButton onClick={() => setActiveTab('loker')} label="Loker Tracker" icon="bi-briefcase" color="slate" />
                      <HubButton onClick={() => setActiveTab('cv_generator')} label="PDF Export" icon="bi-file-earmark-pdf" color="indigo" />
                      <HubButton onClick={() => setActiveTab('online_cv')} label="Digital Page" icon="bi-globe" color="blue" />
                      <HubButton onClick={() => setActiveTab('networking')} label="Networking" icon="bi-people" color="emerald" />
                   </div>
                </div>
                <div>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Proyek & Review</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <HubButton onClick={() => setActiveTab('projects')} label="Personal Project" icon="bi-tools" color="purple" />
                      <HubButton onClick={() => setActiveTab('reviews')} label="Monthly Review" icon="bi-calendar-check" color="slate" />
                   </div>
                </div>
             </div>
          </div>
        );
        case 'todo_list': return (
          <div className="px-5 lg:px-0 pt-6">
            <ToDoList 
              tasks={data.todoList || []}
              categories={data.todoCategories || []}
              onAdd={(t) => addItem('todoList', t)}
              onUpdate={(t) => updateItem('todoList', t)}
              onDelete={(id) => requestDelete('todoList', id, 'Langkah harian')}
              onAddCategory={handleAddTodoCategory}
              onUpdateCategory={handleUpdateTodoCategory}
              onDeleteCategory={handleDeleteTodoCategory}
              targetDate={globalTargetDate}
            />
          </div>
        );
        case 'work_reflection': return (
          <div className="px-5 lg:px-0 pt-6">
            <WorkReflectionView 
              reflections={data.dailyReflections || []}
              skills={data.skills || []}
              onAdd={(r) => addItem('dailyReflections', r)}
              onUpdateSkill={(s) => addItem('skills', s)}
              onAddTodo={(t) => addItem('todoList', t)}
              onAddAchievement={(a) => addItem('achievements', a)}
              appData={data}
              targetDate={globalTargetDate}
            />
          </div>
        );
        case 'mobile_stats': return (
          <div className="px-5 py-6 lg:px-0 lg:pt-6 space-y-10 animate-in fade-in duration-700">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Produktivitas" value={data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricValue : 0} subtitle="Metrik Terakhir" icon={<i className="bi bi-graph-up"></i>} color="indigo" />
                <MetricCard title="Skill Matrix" value={`${data.skills.length}`} subtitle="Total Keahlian" icon={<i className="bi bi-bullseye"></i>} color="emerald" />
                <MetricCard title="Achievements" value={data.achievements.length} subtitle="Milestones" icon={<i className="bi bi-trophy"></i>} color="amber" />
                <MetricCard title="Akun" value={data.plan} subtitle="Status Member" icon={<i className="bi bi-gem"></i>} color="slate" />
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6">Trend 7 Hari Terakhir</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.dailyReports.slice(-7).map(r => ({ n: new Date(r.date).toLocaleDateString('en-US', {weekday:'short'}), v: r.metricValue }))}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                         <YAxis hide />
                         <Tooltip />
                         <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={4} fill="#6366f1" fillOpacity={0.1} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        );
        case 'profile': return (
          <div className="px-5 lg:px-0 pt-6">
            <ProfileView 
              profile={data.profile} 
              workExperiences={data.workExperiences}
              educations={data.educations}
              onUpdateProfile={updateProfile} 
              onAddWork={(w) => addItem('workExperiences', w)}
              onUpdateWork={(w) => updateItem('workExperiences', w)}
              onDeleteWork={(id) => requestDelete('workExperiences', id, 'Catatan Pengalaman')}
              onAddEducation={(e) => addItem('educations', e)}
              onUpdateEducation={(e) => updateItem('educations', e)}
              onDeleteEducation={(id) => requestDelete('educations', id, 'Catatan Pendidikan')}
            />
          </div>
        );
        case 'daily': return (
          <div className="px-5 lg:px-0 pt-6">
            <DailyLogs 
              logs={data.dailyReports} 
              categories={data.workCategories}
              currentCompany={data.profile.currentCompany}
              onAdd={(log) => addItem('dailyReports', log)} 
              onUpdate={(log) => updateItem('dailyReports', log)} 
              onDelete={(id) => requestDelete('dailyReports', id, 'Log Aktivitas')}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              affirmation={data.affirmations[Math.floor(Math.random() * data.affirmations.length)]}
              targetDate={globalTargetDate}
            />
          </div>
        );
        case 'reports': return (
          <div className="px-5 lg:px-0 pt-6"><PerformanceReports data={data} /></div>
        );
        case 'ai_insights': return (
          <div className="px-5 lg:px-0 pt-6">
            <AiInsightActivity 
              data={data} 
              onUpdateInsights={(newInsights) => {
                setData(prev => ({ ...prev, aiInsights: newInsights }));
                if (user && !permissionsBlocked) saveUserData(user.uid, { ...data, aiInsights: newInsights });
              }}
              onAddAchievement={(ach) => addItem('achievements', ach)}
            />
          </div>
        );
        case 'skills': return (
          <div className="px-5 lg:px-0 pt-6">
            <SkillTracker 
              data={data}
              skills={data.skills}
              trainings={data.trainings}
              certs={data.certifications}
              onAddSkill={(s) => addItem('skills', s)}
              onUpdateSkill={(s) => updateItem('skills', s)}
              onDeleteSkill={(id) => requestDelete('skills', id, 'Data Skill')}
              onAddTraining={(t) => addItem('trainings', t)}
              onUpdateTraining={(t) => updateItem('trainings', t)}
              onDeleteTraining={(id) => requestDelete('trainings', id, 'Log Pelatihan')}
              onAddCert={(c) => addItem('certifications', c)}
              onUpdateCert={(c) => updateItem('certifications', c)}
              onDeleteCert={(id) => requestDelete('certifications', id, 'Data Sertifikat')}
              onAddTodo={(t) => addItem('todoList', t)}
              onSaveStrategy={(strategy) => {
                setData(prev => ({ ...prev, aiStrategies: [strategy, ...(prev.aiStrategies || [])] }));
                if (user && !permissionsBlocked) saveUserData(user.uid, { ...data, aiStrategies: [strategy, ...(data.aiStrategies || [])] });
              }}
            />
          </div>
        );
        case 'loker': return (
          <div className="px-5 lg:px-0 pt-6">
            <JobTracker 
              applications={data.jobApplications || []}
              onAdd={(j) => addItem('jobApplications', j)}
              onUpdate={(j) => updateItem('jobApplications', j)}
              onDelete={(id) => requestDelete('jobApplications', id, 'Registri Lamaran')}
            />
          </div>
        );
        case 'projects': return (
          <div className="px-5 lg:px-0 pt-6">
            <PersonalProjectTracker 
              projects={data.personalProjects || []}
              onAdd={(p) => addItem('personalProjects', p)}
              onUpdate={(p) => updateItem('personalProjects', p)}
              onDelete={(id) => requestDelete('personalProjects', id, 'Milestone Proyek')}
            />
          </div>
        );
        case 'career': return (
          <div className="px-5 lg:px-0 pt-6">
            <CareerPlanner 
              paths={data.careerPaths}
              appData={data}
              onAddPath={(p) => addItem('careerPaths', p)}
              onUpdatePath={(p) => updateItem('careerPaths', p)}
              onDeletePath={(id) => requestDelete('careerPaths', id, 'Target Karir')}
            />
          </div>
        );
        case 'achievements': return (
          <div className="px-5 lg:px-0 pt-6">
            <AchievementTracker 
              achievements={data.achievements}
              profile={data.profile}
              workExperiences={data.workExperiences}
              onAdd={(a) => addItem('achievements', a)}
              onUpdate={(a) => updateItem('achievements', a)}
              onDelete={(id) => requestDelete('achievements', id, 'Entri Penghargaan')}
            />
          </div>
        );
        case 'networking': return (
          <div className="px-5 lg:px-0 pt-6">
            <Networking 
              contacts={data.contacts}
              onAdd={(c) => addItem('contacts', c)}
              onUpdate={(c) => updateItem('contacts', c)}
              onDelete={(id) => requestDelete('contacts', id, 'Kontak Jaringan')}
            />
          </div>
        );
        case 'reviews': return (
          <div className="px-5 lg:px-0 pt-6">
            <Reviews 
              reviews={data.monthlyReviews}
              onAdd={(r) => addItem('monthlyReviews', r)}
              onDelete={(id) => requestDelete('monthlyReviews', id, 'Review Berkala')}
            />
          </div>
        );
        case 'cv_generator': return (
          <div className="px-5 lg:px-0 pt-6"><CVGenerator data={data} /></div>
        );
        case 'online_cv': return (
          <div className="px-5 lg:px-0 pt-6">
            <OnlineCVBuilder 
              data={data} 
              onUpdateConfig={(config) => syncData({ ...data, onlineCV: config })} 
            />
          </div>
        );
        case 'settings': return (
          <div className="px-5 lg:px-0 pt-6">
            <AccountSettings 
              reminderConfig={data.reminderConfig} 
              onUpdateReminders={(config) => syncData({ ...data, reminderConfig: config })} 
            />
          </div>
        );
        case 'admin_dashboard': return (
          <AdminPanel initialMode="dashboard" />
        );
        case 'admin_users': return (
          <AdminPanel initialMode="users" />
        );
        case 'admin_products': return (
          <AdminPanel initialMode="products" />
        );
        case 'admin_ai': return (
          <AdminPanel initialMode="ai" />
        );
        case 'admin_health': return (
          <AdminPanel initialMode="health" />
        );
        default: return <Dashboard data={data} onNavigate={handleTabChange} onOpenNotif={() => setShowNotif(true)} />;
      }
    })();

    // In mobile, show a "Back Header" if not in dashboard
    if (activeTab !== 'dashboard' && !activeTab.includes('admin') && window.innerWidth < 1024) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
           <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 group">
                   <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black transition-transform group-active:scale-90"><i className="bi bi-arrow-left"></i></div>
                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Home</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowNotif(true)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg relative">
                  <i className="bi bi-bell"></i>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg">{notificationCount}</span>
                  )}
                </button>
                <button onClick={handleLogout} className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-lg"><i className="bi bi-box-arrow-right"></i></button>
              </div>
           </header>
           <div className="flex-1">
             {content}
           </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
         {/* Desktop Top Bar - Dark Style - FULL WIDTH FIX */}
         <div className="hidden lg:flex justify-between items-center px-12 py-6 bg-slate-950 border-b border-white/5 shadow-2xl w-full sticky top-0 z-50">
           <div className="flex items-center gap-4">
              <p className="text-white font-black text-sm uppercase tracking-tight">Home / <span className="text-indigo-400 capitalize">{activeTab.replace('_', ' ')}</span></p>
           </div>
           <div className="flex items-center gap-8">
              {/* Notification bell - Interactive fixed position */}
              <button 
                onClick={() => setShowNotif(true)} 
                className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-indigo-400 hover:bg-white/10 transition-all relative group"
              >
                <i className="bi bi-bell text-lg group-hover:rotate-12 transition-transform"></i>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-slate-950 flex items-center justify-center shadow-xl">{notificationCount}</span>
                )}
                {notificationCount === 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse"></span>}
              </button>

              <div className="h-8 w-px bg-white/10"></div>

              {/* User Identity Section */}
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-xs font-black text-white leading-none">{data.profile.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{data.profile.currentPosition || 'Profession'}</p>
                 </div>
                 <div className="relative group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 border-2 border-white/10 overflow-hidden shadow-lg shadow-indigo-900/20">
                       {data.profile.photoUrl ? (
                         <img src={data.profile.photoUrl} className="w-full h-full object-cover" alt="User" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center font-black text-white">{data.profile.name.charAt(0)}</div>
                       )}
                    </div>
                    {/* User Dropdown - Floating Menu */}
                    <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                       <div className="w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 overflow-hidden flex flex-col">
                          <button onClick={() => setActiveTab('profile')} className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 group/item">
                             <span className="text-slate-400 group-hover/item:text-indigo-600 transition-colors"><i className="bi bi-person"></i></span>
                             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Edit Profil</span>
                          </button>
                          <button onClick={() => setActiveTab('settings')} className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 group/item">
                             <span className="text-slate-400 group-hover/item:text-indigo-600 transition-colors"><i className="bi bi-gear"></i></span>
                             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Setting</span>
                          </button>
                          <div className="h-px bg-slate-50 my-1"></div>
                          <button onClick={handleLogout} className="w-full px-4 py-3 text-left hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-3 group/item text-rose-500">
                             <span className="transition-colors"><i className="bi bi-box-arrow-right"></i></span>
                             <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         </div>
         
         {/* Konten dengan pembatasan lebar dan jarak vertikal tambahan - PERBAIKAN: pt-2 pada mobile untuk mempersempit gap */}
         <div className="flex-1 px-0 lg:px-12 pt-2 pb-10 lg:py-16">
            <div className="max-w-7xl mx-auto w-full">
              {content}
            </div>
         </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-[6px] border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">J</div>
        </div>
      </div>
    );
  }

  // View publik untuk Report Sharing
  if (isPublicView) {
    return <PublicReportView data={data} contextFilter={publicContext} userName={publicUserName} />;
  }
  
  // View publik untuk CV Online (Landing Page)
  if (isOnlineCVView) {
    return <OnlineCVView slug={onlineUserSlug} initialData={data} />;
  }

  if (!user) {
    if (guestMode === 'landing') {
      return <LandingPage onStart={() => setGuestMode('auth')} onLogin={() => setGuestMode('auth')} />;
    }
    return (
      <div className="relative">
        <Auth />
        <button 
          onClick={() => setGuestMode('landing')} 
          className="fixed top-8 left-8 z-[100] px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
        >
          ← Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative font-sans text-slate-900">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
      </div>
      
      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} isAdmin={isAdmin} />

      <main className="flex-1 lg:ml-64 p-0 pb-32 lg:pb-0 overflow-x-hidden relative">
        <div className="w-full h-full">
          {dbError && (
            <div className="max-w-7xl mx-auto px-5 mt-8">
              <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-[2rem] text-xs flex justify-between items-center shadow-xl animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-4">
                  <span className="text-xl">⚠️</span>
                  <p className="font-bold uppercase tracking-widest">{dbError}</p>
                </div>
                <button onClick={handleRetrySync} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95">Hubungkan Lagi</button>
              </div>
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      {/* Notification Overlay Component */}
      {showNotif && (
        <NotificationOverlay 
          data={data} 
          onClose={() => setShowNotif(false)} 
          onUpdateMilestone={handleUpdateMilestone}
          onNavigate={handleTabChange}
        />
      )}

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[9000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in duration-500">
             <div className="p-8 lg:p-12">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Profil Profesional Baru</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Langkah {onboardingStep} dari 3</p>
                   </div>
                   <button onClick={() => setShowOnboarding(false)} className="px-5 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Isi Nanti (Skip)</button>
                </div>

                {onboardingStep === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-inner"><i className="bi bi-person-bounding-box"></i></div>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">Halo {data.profile.name}! Mari lengkapi data dasar identitas Anda untuk personalisasi sistem.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Nama Lengkap" value={data.profile.name} onChange={v => updateProfile({...data.profile, name: v})} placeholder="Alex Johnson" />
                        <InputGroup label="Nomor Handphone" value={data.profile.phone} onChange={v => updateProfile({...data.profile, phone: v})} placeholder="0812xxxx" />
                        <div className="md:col-span-2">
                           <InputGroup label="Domisili" value={data.profile.domicile} onChange={v => updateProfile({...data.profile, domicile: v})} placeholder="Jakarta Selatan" />
                        </div>
                     </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-inner"><i className="bi bi-briefcase-fill"></i></div>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">Dimana Anda bekerja sekarang? Data ini krusial untuk fitur Daily Logs.</p>
                     <div className="space-y-6">
                        <InputGroup label="Jabatan Sekarang" value={data.profile.currentPosition} onChange={v => updateProfile({...data.profile, currentPosition: v})} placeholder="Senior Tax Associate" />
                        <InputGroup label="Nama Instansi/Perusahaan" value={data.profile.currentCompany} onChange={v => updateProfile({...data.profile, currentCompany: v})} placeholder="PT Solusi Digital" />
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Singkat Pekerjaan</label>
                           <textarea className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[100px] resize-none" placeholder="Menangani kepatuhan pajak korporat..." value={data.profile.jobDesk} onChange={e => updateProfile({...data.profile, jobDesk: e.target.value})} />
                        </div>
                     </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-inner"><i className="bi bi-flag-fill"></i></div>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">Terakhir, apa impian karir Anda? AI akan membantu memetakan roadmap menuju ke sana.</p>
                     <div className="space-y-6">
                        <InputGroup label="Role Impian Masa Depan" value={data.profile.mainCareer} onChange={v => updateProfile({...data.profile, mainCareer: v})} placeholder="Chief Financial Officer (CFO)" />
                        <InputGroup label="Target Jangka Pendek (1-2 Thn)" value={data.profile.shortTermTarget} onChange={v => updateProfile({...data.profile, shortTermTarget: v})} placeholder="Sertifikasi Brevet C" />
                        <InputGroup label="Target Jangka Panjang (5+ Thn)" value={data.profile.longTermTarget} onChange={v => updateProfile({...data.profile, longTermTarget: v})} placeholder="Membangunan Konsultan Sendiri" />
                     </div>
                  </div>
                )}

                <div className="mt-12 flex gap-4 pt-8 border-t border-slate-100">
                   {onboardingStep > 1 && (
                     <button onClick={() => setOnboardingStep(s => s - 1)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-100 transition-all">Kembali</button>
                   )}
                   <button 
                    onClick={() => {
                      if (onboardingStep < 3) setOnboardingStep(s => s + 1);
                      else setShowOnboarding(false);
                    }} 
                    className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all"
                   >
                     {onboardingStep < 3 ? 'Lanjut Langkah Berikutnya' : 'Selesaikan Pengaturan ✨'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Global Success Alert (Toast) */}
      {toast && (
        <div className="fixed bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 z-[3000] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/10 backdrop-blur-xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <i className="bi bi-check-lg"></i>
            </div>
            <span className="font-black text-[10px] uppercase tracking-[0.3em]">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[5000] p-6">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 lg:p-16 animate-in zoom-in duration-500 border border-slate-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner text-4xl">
                <i className="bi bi-trash3"></i>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Hapus Data?</h3>
              <p className="text-slate-400 text-sm mt-5 leading-relaxed font-bold uppercase tracking-widest opacity-80">
                Apakah Anda yakin ingin menghapus <span className="text-rose-600 font-black">"{showConfirm.label}"</span>? Data ini tidak bisa dikembalikan.
              </p>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-3xl hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-[1.5] py-5 bg-rose-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-3xl shadow-[0_15px_30px_rgba(225,29,72,0.3)] hover:bg-rose-700 transition-all active:scale-95"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;