
import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, type User } from '@firebase/auth';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, saveUserData, getProductsCatalog } from './services/firebase';
import { AppData, UserProfile, DailyReport, Skill, Training, Certification, CareerPath, Achievement, Contact, MonthlyReview, WorkExperience, Education, JobApplication, PersonalProject, OnlineCVConfig, UserRole, SubscriptionPlan, AccountStatus, AiStrategy, ReminderConfig, SkillStatus, ToDoTask, WorkReflection, SubscriptionProduct } from './types';
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
import Billing from './components/Billing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// HubButton for the Apps Hub view
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

// MetricCard for local App usage
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

// InputGroup for the Onboarding wizard
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

// ActionItem helper for the NotificationOverlay
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

// NotificationOverlay to show AI-driven career signals and smart reminders
const NotificationOverlay: React.FC<{ data: AppData, onClose: () => void, onUpdateMilestone: (id: string, label: string) => void, onNavigate: (tab: string, date?: string) => void }> = ({ data, onClose, onUpdateMilestone, onNavigate }) => {
  const latestStrategy = data.aiStrategies?.[0];
  const completed = data.completedAiMilestones || [];

  const today = new Date().toISOString().split('T')[0];
  const hasWorkLogs = data.dailyReports.some(l => l.date === today);
  const hasReflection = data.dailyReflections.some(r => r.date === today);
  
  const pendingTasks = data.todoList.filter(t => t.status === 'Pending');
  const oldestPendingDate = pendingTasks.length > 0 
    ? pendingTasks.sort((a,b) => a.createdAt.localeCompare(b.createdAt))[0].createdAt.split('T')[0]
    : today;

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
           </div>

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
  const [guestMode, setGuestMode] = useState<'landing' | 'auth'>('landing');
  const [showNotif, setShowNotif] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ key: keyof AppData; id: string; label: string } | null>(null);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('jejakkarir_data');
    return saved ? JSON.parse(saved) : { ...INITIAL_DATA };
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalTargetDate, setGlobalTargetDate] = useState<string | undefined>(undefined);

  const searchParams = new URLSearchParams(window.location.search);
  const isPublicView = searchParams.get('view') === 'shared_report' || searchParams.get('view') === 'shared_insight';
  const onlineUserSlug = searchParams.get('u') || (window.location.pathname.split('/')[1] === 'profile' ? window.location.pathname.split('/')[2] : null);
  const isOnlineCVView = !!onlineUserSlug;

  const isAdmin = useMemo(() => {
    const authEmail = (user?.email || '').toLowerCase();
    return data.role === UserRole.SUPERADMIN || authEmail === 'admin@jejakkarir.com';
  }, [user, data.role]);

  const notificationCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    if (!data.dailyReports.some(l => l.date === today)) count++;
    if (!data.dailyReflections.some(r => r.date === today)) count++;
    return count;
  }, [data]);

  const handleTabChange = (tab: string, date?: string) => {
    setActiveTab(tab);
    setGlobalTargetDate(date);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser as User | null);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProds = async () => {
        const p = await getProductsCatalog();
        if (p) setProducts(p);
    };
    fetchProds();
  }, [user]);

  useEffect(() => {
    if (!user || isPublicView || isOnlineCVView) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as AppData;
        const authEmail = (user.email || '').toLowerCase();
        
        if (!cloudData.profile?.jobDesk && (authEmail !== 'admin@jejakkarir.com')) {
          setShowOnboarding(true);
        }

        let needsUpdateToDB = false;
        const isToBeDemoted = authEmail === 'rojibfauzi@gmail.com';
        
        if (isToBeDemoted && cloudData.role !== UserRole.USER) {
          cloudData.role = UserRole.USER;
          needsUpdateToDB = true;
        }

        if (needsUpdateToDB) {
          setDoc(doc(db, "users", user.uid), cloudData, { merge: true });
        }
        
        setData(cloudData);
      }
    });
    return () => unsub();
  }, [user, isPublicView, isOnlineCVView]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const syncData = (newData: AppData) => {
    setData(newData);
    if (user) saveUserData(user.uid, newData);
    triggerToast("Data Berhasil Diperbarui.");
  };

  const addItem = (key: keyof AppData, item: any) => {
    const currentArray = data[key];
    if (Array.isArray(currentArray)) {
      syncData({ ...data, [key]: [...currentArray, item] });
    }
  };

  const updateItem = (key: keyof AppData, updatedItem: any) => {
    const currentArray = data[key];
    if (Array.isArray(currentArray)) {
      syncData({ ...data, [key]: currentArray.map((item: any) => item.id === updatedItem.id ? updatedItem : item) });
    }
  };

  const requestDelete = (key: keyof AppData, id: string, label: string) => {
    setShowConfirm({ key, id, label });
  };

  const confirmDelete = () => {
    if (showConfirm) {
      const currentArray = data[showConfirm.key];
      if (Array.isArray(currentArray)) {
        syncData({ ...data, [showConfirm.key]: currentArray.filter((item: any) => item.id !== showConfirm.id) });
      }
      setShowConfirm(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGuestMode('landing');
    setActiveTab('dashboard');
  };

  if (authLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (isPublicView) return <PublicReportView data={data} contextFilter={searchParams.get('context') || 'all'} userName={searchParams.get('name') || 'User'} />;
  if (isOnlineCVView) return <OnlineCVView slug={onlineUserSlug || ''} initialData={data} />;

  if (!user) {
    if (guestMode === 'landing') return <LandingPage onStart={() => setGuestMode('auth')} onLogin={() => setGuestMode('auth')} products={products} />;
    return <div className="relative"><Auth /><button onClick={() => setGuestMode('landing')} className="fixed top-8 left-8 z-[100] px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">← Beranda</button></div>;
  }

  const renderContent = () => {
    if (isAdmin && (activeTab === 'dashboard' || !activeTab.includes('admin'))) return <AdminPanel initialMode="dashboard" />;
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onNavigate={handleTabChange} onOpenNotif={() => setShowNotif(true)} />;
      case 'profile': return <ProfileView profile={data.profile} workExperiences={data.workExperiences} educations={data.educations} onUpdateProfile={(p) => syncData({...data, profile: p})} onAddWork={(w) => addItem('workExperiences', w)} onUpdateWork={(w) => updateItem('workExperiences', w)} onDeleteWork={(id) => requestDelete('workExperiences', id, 'Kerja')} onAddEducation={(e) => addItem('educations', e)} onUpdateEducation={(e) => updateItem('educations', e)} onDeleteEducation={(id) => requestDelete('educations', id, 'Edukasi')} />;
      case 'daily': return <DailyLogs logs={data.dailyReports} categories={data.workCategories} affirmation={data.affirmations[0]} onAdd={(l) => addItem('dailyReports', l)} onUpdate={(l) => updateItem('dailyReports', l)} onDelete={(id) => requestDelete('dailyReports', id, 'Aktivitas')} onAddCategory={(c) => syncData({...data, workCategories: [...data.workCategories, c]})} onDeleteCategory={(c) => syncData({...data, workCategories: data.workCategories.filter(x => x !== c)})} targetDate={globalTargetDate} />;
      case 'billing': return <Billing data={data} products={products} />;
      case 'todo_list': return <ToDoList tasks={data.todoList} categories={data.todoCategories} onAdd={(t) => addItem('todoList', t)} onUpdate={(t) => updateItem('todoList', t)} onDelete={(id) => requestDelete('todoList', id, 'Tugas')} targetDate={globalTargetDate} />;
      case 'work_reflection': return <WorkReflectionView reflections={data.dailyReflections} skills={data.skills} onAdd={(r) => addItem('dailyReflections', r)} onUpdateSkill={(s) => updateItem('skills', s)} targetDate={globalTargetDate} />;
      case 'skills': return <SkillTracker skills={data.skills} trainings={data.trainings} certs={data.certifications} onAddSkill={(s) => addItem('skills', s)} onUpdateSkill={(s) => updateItem('skills', s)} onDeleteSkill={(id) => requestDelete('skills', id, 'Skill')} onAddTraining={(t) => addItem('trainings', t)} onUpdateTraining={(t) => updateItem('trainings', t)} onDeleteTraining={(id) => requestDelete('trainings', id, 'Training')} onAddCert={(c) => addItem('certifications', c)} onUpdateCert={(c) => updateItem('certifications', c)} onDeleteCert={(id) => requestDelete('certifications', id, 'Sertif')} />;
      case 'career': return <CareerPlanner paths={data.careerPaths} appData={data} onAddPath={(p) => addItem('careerPaths', p)} onUpdatePath={(p) => updateItem('careerPaths', p)} onDeletePath={(id) => requestDelete('careerPaths', id, 'Karir')} />;
      case 'loker': return <JobTracker applications={data.jobApplications} onAdd={(j) => addItem('jobApplications', j)} onUpdate={(j) => updateItem('jobApplications', j)} onDelete={(id) => requestDelete('jobApplications', id, 'Loker')} />;
      case 'projects': return <PersonalProjectTracker projects={data.personalProjects} onAdd={(p) => addItem('personalProjects', p)} onUpdate={(p) => updateItem('personalProjects', p)} onDelete={(id) => requestDelete('personalProjects', id, 'Proyek')} />;
      case 'achievements': return <AchievementTracker achievements={data.achievements} profile={data.profile} workExperiences={data.workExperiences} onAdd={(a) => addItem('achievements', a)} onUpdate={(a) => updateItem('achievements', a)} onDelete={(id) => requestDelete('achievements', id, 'Prestasi')} />;
      case 'networking': return <Networking contacts={data.contacts} onAdd={(c) => addItem('contacts', c)} onUpdate={(c) => updateItem('contacts', c)} onDelete={(id) => requestDelete('contacts', id, 'Kontak')} />;
      case 'reviews': return <Reviews reviews={data.monthlyReviews} onAdd={(r) => addItem('monthlyReviews', r)} onDelete={(id) => requestDelete('monthlyReviews', id, 'Review')} />;
      case 'cv_generator': return <CVGenerator data={data} />;
      case 'online_cv': return <OnlineCVBuilder data={data} onUpdateConfig={(c) => syncData({...data, onlineCV: c})} />;
      case 'reports': return <PerformanceReports data={data} />;
      case 'ai_insights': return <AiInsightActivity data={data} onUpdateInsights={(i) => syncData({...data, aiInsights: i})} onAddAchievement={(a) => addItem('achievements', a)} />;
      case 'settings': return <AccountSettings reminderConfig={data.reminderConfig} onUpdateReminders={(c) => syncData({...data, reminderConfig: c})} />;
      case 'admin_dashboard': return <AdminPanel initialMode="dashboard" />;
      case 'admin_users': return <AdminPanel initialMode="users" />;
      case 'admin_ai': return <AdminPanel initialMode="ai" />;
      case 'admin_products': return <AdminPanel initialMode="products" />;
      case 'admin_integrations': return <AdminPanel initialMode="integrations" />;
      case 'admin_health': return <AdminPanel initialMode="health" />;
      default: return <Dashboard data={data} onNavigate={handleTabChange} onOpenNotif={() => setShowNotif(true)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} isAdmin={isAdmin} />
      <main className="flex-1 lg:ml-64 p-0 pb-32 lg:pb-0 overflow-x-hidden relative">
         <div className="max-w-7xl mx-auto px-0 lg:px-12 pt-2 pb-10 lg:py-16">
            {renderContent()}
         </div>
      </main>
      {showNotif && <NotificationOverlay data={data} onClose={() => setShowNotif(false)} onUpdateMilestone={(id, l) => syncData({...data, completedAiMilestones: [...(data.completedAiMilestones || []), id]})} onNavigate={handleTabChange} />}
      {toast && <div className="fixed bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 z-[3000] bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-2xl text-[10px] font-black uppercase tracking-widest">{toast.message}</div>}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[5000] p-6">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 text-center shadow-2xl">
            <h3 className="text-2xl font-black mb-4">Hapus {showConfirm.label}?</h3>
            <p className="text-slate-500 mb-10">Data tidak bisa dikembalikan setelah dihapus.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-4 bg-slate-50 rounded-2xl font-black">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
