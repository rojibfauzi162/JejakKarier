
import React, { useState, useEffect } from 'react';
import { AppData, UserRole, SubscriptionProduct, SubscriptionPlan, AccountStatus, ToDoTask, AiStrategy, Training, Certification, Skill } from './types';
import { INITIAL_DATA } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DailyLogs from './components/DailyLogs';
import ProfileView from './components/ProfileView';
import CareerPlanner from './components/CareerPlanner';
import SkillTracker from './components/user/SkillTracker';
import Networking from './components/Networking';
import AchievementTracker from './components/AchievementTracker';
import JobTracker from './components/JobTracker';
import PersonalProjectTracker from './components/PersonalProjectTracker';
import Reviews from './components/Reviews';
import CVGenerator from './components/CVGenerator';
import OnlineCVBuilder from './components/OnlineCVBuilder';
import AccountSettings from './components/AccountSettings';
import Billing from './components/Billing';
import AdminPanel from './components/admin/AdminPanel';
import MobileNav from './components/MobileNav';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PublicLegalView from './components/PublicLegalView';
import WorkReflectionView from './components/WorkReflection';
import PerformanceReports from './components/PerformanceReports';
import AiInsightActivity from './components/AiInsightActivity';
import ToDoList from './components/ToDoList';
import AppsHub from './components/user/AppsHub';
import UpgradeModal from './components/user/UpgradeModal';
import { auth, getUserData, saveUserData, getProductsCatalog } from './services/firebase';
import { onAuthStateChanged } from '@firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [skillsSubTab, setSkillsSubTab] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Toast System State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // States for Desktop Header Interactions
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Deteksi URL path saat inisialisasi untuk mendukung akses langsung (e.g. namadomain.com/privacy)
  const [publicLegalPage, setPublicLegalPage] = useState<'privacy' | 'terms' | null>(() => {
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    return null;
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) {
      setSkillsSubTab(subTab);
    } else {
      setSkillsSubTab(undefined);
    }
  };

  // Navigasi yang mengubah path URL sesuai permintaan user (namadomain.com/namahalaman)
  const navigateToLegal = (type: 'privacy' | 'terms' | null) => {
    try {
      if (type) {
        window.history.pushState({ type }, '', `/${type}`);
      } else {
        window.history.pushState({}, '', '/');
      }
      setPublicLegalPage(type);
    } catch (e) {
      // Fallback jika lingkungan sandbox membatasi manipulasi path history
      setPublicLegalPage(type);
    }
  };

  // Sinkronisasi navigasi tombol back/forward browser
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/privacy') setPublicLegalPage('privacy');
      else if (path === '/terms') setPublicLegalPage('terms');
      else setPublicLegalPage(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [showAuth, setShowAuth] = useState(false);
  const [publicProducts, setPublicProducts] = useState<SubscriptionProduct[]>([]);

  useEffect(() => {
    getProductsCatalog().then(p => {
      if (p) setPublicProducts(p);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) {
          setData(userData);
        } else {
          // Ambil katalog untuk mendapatkan izin modul paket FREE yang dikonfigurasi admin
          const catalog = await getProductsCatalog();
          const freePlan = catalog?.find(p => p.tier === SubscriptionPlan.FREE);

          const newData: AppData = { 
            ...INITIAL_DATA, 
            uid: user.uid,
            plan: SubscriptionPlan.FREE, 
            status: AccountStatus.ACTIVE,
            joinedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            planPermissions: freePlan?.allowedModules || INITIAL_DATA.planPermissions || ['dashboard', 'profile', 'daily', 'skills', 'todo'],
            planLimits: freePlan?.limits || INITIAL_DATA.planLimits,
            profile: { 
              ...INITIAL_DATA.profile, 
              email: user.email || '', 
              name: user.displayName || 'User',
              birthPlace: '',
              birthDate: '',
              maritalStatus: '',
              phone: '',
              domicile: '',
              mainCareer: '',
              sideCareer: '',
              currentCompany: '',
              currentPosition: '',
              jobDesk: '',
              shortTermTarget: '',
              longTermTarget: '',
              description: '',
              photoUrl: '',
              jobCategory: ''
            },
            workExperiences: [], 
            educations: [],      
            dailyReports: [],
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
            dailyReflections: []
          };
          await saveUserData(user.uid, newData);
          setData(newData);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Prioritas Render: Jika sedang di route legal publik, abaikan status Auth/Landing
  if (publicLegalPage) {
    return <PublicLegalView type={publicLegalPage} onBack={() => navigateToLegal(null)} />;
  }

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
       Initializing Gateway...
    </div>
  );
  
  if (!user) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return (
      <LandingPage 
        onStart={() => setShowAuth(true)} 
        onLogin={() => setShowAuth(true)} 
        onShowLegal={(type) => navigateToLegal(type)}
        products={publicProducts} 
      />
    );
  }

  const isAdmin = data.role === UserRole.SUPERADMIN;

  // Logic: Calculate Notification Alerts
  const getAlerts = () => {
    if (isAdmin) return [];
    const today = new Date().toISOString().split('T')[0];
    const nowHours = new Date().getHours();
    const nowMinutes = new Date().getMinutes();
    const currentTime = `${nowHours.toString().padStart(2,'0')}:${nowMinutes.toString().padStart(2,'0')}`;
    const alerts = [];

    const hasWorkLogs = data.dailyReports.some(l => l.date === today);
    if (!hasWorkLogs && currentTime >= (data.reminderConfig?.dailyLogReminderTime || "17:00")) {
      alerts.push({ id: 'log', text: "Lupa isi Aktivitas Kerja?", target: 'daily', icon: 'bi-pencil-square', color: 'indigo' });
    }

    const hasReflection = data.dailyReflections.some(r => r.date === today);
    if (!hasReflection && currentTime >= (data.reminderConfig?.reflectionReminderTime || "18:00")) {
      alerts.push({ id: 'ref', text: "Lengkapi Refleksi Kerja!", target: 'work_reflection', icon: 'bi-chat-quote', color: 'rose' });
    }

    // Tambahan Notifikasi Proaktif agar tidak kosong (Langkah Pengembangan & Skill Gap)
    const pendingTodos = data.todoList.filter(t => t.status === 'Pending');
    if (pendingTodos.length > 0) {
      alerts.push({ id: 'todo_p', text: `Ada ${pendingTodos.length} Langkah Belum Tuntas`, target: 'todo_list', icon: 'bi-list-check', color: 'blue' });
    }

    const gapSkills = data.skills.filter(s => s.status === 'gap');
    if (gapSkills.length > 0) {
      alerts.push({ id: 'skill_g', text: `Tinjau ${gapSkills.length} Celah Skill Strategis`, target: 'skills', icon: 'bi-shield-exclamation', color: 'amber' });
    }

    return alerts;
  };

  const activeAlerts = getAlerts();

  // Helper function to check permissions and wrap content in restricted overlay
  const withPermission = (moduleKey: string, content: React.ReactNode) => {
    if (isAdmin) return content;
    // JIKA USER SUDAH PAKET PRO / ENTERPRISE, JANGAN DI LIMIT
    if (data.plan !== SubscriptionPlan.FREE) return content;
    
    const permissions = data.planPermissions || [];
    // Always allow core modules
    if (['dashboard', 'profile', 'apps_hub', 'billing', 'settings'].includes(moduleKey)) return content;
    
    if (!permissions.includes(moduleKey)) {
      return (
        <div className="relative min-h-[600px] overflow-hidden rounded-[3rem]">
           <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center text-4xl mb-8 animate-bounce"><i className="bi bi-lock-fill text-indigo-600"></i></div>
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Fitur Premium Terkunci</h3>
              <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 text-lg italic">
                Modul ini hanya tersedia bagi anggota paket PRO atau Enterprise. Tingkatkan kualifikasi Anda sekarang.
              </p>
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-12 py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Upgrade ke Paket Pro →
              </button>
           </div>
           <div className="opacity-20 pointer-events-none grayscale blur-sm">
              {content}
           </div>
        </div>
      );
    }
    return content;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'apps_hub': return <AppsHub onNavigate={handleNavigate} />;
      case 'profile': return (
        <ProfileView 
          profile={data.profile} 
          workExperiences={data.workExperiences} 
          educations={data.educations} 
          onUpdateProfile={(p) => setData({...data, profile: p})} 
          onAddWork={(w) => setData({...data, workExperiences: [...data.workExperiences, w]})} 
          onUpdateWork={(w) => setData({...data, workExperiences: data.workExperiences.map(i => i.id === w.id ? w : i)})} 
          onDeleteWork={(id) => setData({...data, workExperiences: data.workExperiences.filter(i => i.id !== id)})} 
          onAddEducation={(e) => setData({...data, educations: [...data.educations, e]})} 
          onUpdateEducation={(e) => setData({...data, educations: data.educations.map(i => i.id === e.id ? e : i)})} 
          onDeleteEducation={(id) => setData({...data, educations: data.educations.filter(e => e.id !== id)})} 
          appData={data} 
        />
      );
      case 'daily': return withPermission('daily', (
        <DailyLogs 
          logs={data.dailyReports} 
          categories={data.workCategories} 
          onAdd={(l) => setData({...data, dailyReports: [...data.dailyReports, l]})} 
          onUpdate={(l) => setData({...data, dailyReports: data.dailyReports.map(i => i.id === l.id ? l : i)})} 
          onDelete={(id) => setData({...data, dailyReports: data.dailyReports.filter(i => i.id !== id)})} 
          onAddCategory={(c) => setData({...data, workCategories: [...data.workCategories, c]})} 
          onDeleteCategory={(c) => setData({...data, workCategories: data.workCategories.filter(i => i !== c)})} 
          affirmation={data.affirmations[0]} 
          appData={data}
          onUpgrade={() => setIsUpgradeModalOpen(true)}
        />
      ));
      case 'work_reflection': return withPermission('daily', (
        <WorkReflectionView 
          reflections={data.dailyReflections} 
          skills={data.skills} 
          onAdd={(r) => setData({...data, dailyReflections: [...data.dailyReflections, r]})} 
          onUpdateSkill={(s) => setData({...data, skills: data.skills.map(i => i.id === s.id ? s : i)})} 
          onAddTodo={(t) => setData({...data, todoList: [...data.todoList, t]})} 
          onAddAchievement={(a) => setData({...data, achievements: [...data.achievements, a]})} 
          appData={data} 
        />
      ));
      case 'reports': return withPermission('daily', <PerformanceReports data={data} />);
      case 'ai_insights': return withPermission('ai_insights', (
        <AiInsightActivity 
          data={data} 
          onUpdateInsights={(ins) => setData({...data, aiInsights: ins})} 
          onAddAchievement={(ach) => setData({...data, achievements: [...data.achievements, ach]})} 
        />
      ));
      case 'todo_list': return withPermission('todo', (
        <ToDoList 
          tasks={data.todoList} 
          categories={data.todoCategories} 
          onAdd={(t) => setData({...data, todoList: [...data.todoList, t]})} 
          onUpdate={(t) => setData({...data, todoList: data.todoList.map(i => i.id === t.id ? t : i)})} 
          onDelete={(id) => setData({...data, todoList: data.todoList.filter(i => i.id !== id)})} 
          onAddCategory={(c) => setData({...data, todoCategories: [...data.todoCategories, c]})} 
          onUpdateCategory={(o, n) => setData({...data, todoCategories: data.todoCategories.map(i => i === o ? n : i)})} 
          onDeleteCategory={(c) => setData({...data, todoCategories: data.todoCategories.filter(i => i !== c)})} 
        />
      ));
      case 'skills': return withPermission('skills', (
        <SkillTracker 
          skills={data.skills} 
          trainings={data.trainings} 
          certs={data.certifications} 
          onAddSkill={(s) => setData({...data, skills: [...data.skills, s]})} 
          onUpdateSkill={(s) => setData({...data, skills: data.skills.map(i => i.id === s.id ? s : i)})} 
          onDeleteSkill={(id) => setData({...data, skills: data.skills.filter(i => i.id !== id)})} 
          onAddTraining={(t) => setData({...data, trainings: [...data.trainings, t]})} 
          onUpdateTraining={(t) => setData({...data, trainings: data.trainings.map(i => i.id === t.id ? t : i)})} 
          onDeleteTraining={(id) => setData({...data, trainings: data.trainings.filter(i => i.id !== id)})} 
          onAddCert={(c) => setData({...data, certifications: [...data.certifications, c]})} 
          onUpdateCert={(c) => setData({...data, certifications: data.certifications.map(i => i.id === c.id ? c : i)})} 
          onDeleteCert={(id) => setData({...data, certifications: data.certifications.filter(i => i.id !== id)})} 
          onAddTodo={(t) => setData({...data, todoList: [...data.todoList, t]})}
          onSaveStrategy={(s: AiStrategy) => setData({...data, aiStrategies: [s, ...(data.aiStrategies || [])]})}
          showToast={showToast}
          data={data} 
          initialSubTab={skillsSubTab as any}
          onUpgrade={() => setIsUpgradeModalOpen(true)}
        />
      ));
      case 'career': return withPermission('career', <CareerPlanner paths={data.careerPaths} appData={data} onAddPath={(p) => setData({...data, careerPaths: [...data.careerPaths, p]})} onUpdatePath={(p) => setData({...data, careerPaths: data.careerPaths.map(i => i.id === p.id ? p : i)})} onDeletePath={(id) => setData({...data, careerPaths: data.careerPaths.filter(i => i.id !== id)})} />);
      case 'networking': return withPermission('networking', <Networking contacts={data.contacts} onAdd={(c) => setData({...data, contacts: [...data.contacts, c]})} onUpdate={(c) => setData({...data, contacts: data.contacts.map(i => i.id === c.id ? c : i)})} onDelete={(id) => setData({...data, contacts: data.contacts.filter(i => i.id !== id)})} />);
      case 'achievements': return withPermission('achievements', <AchievementTracker achievements={data.achievements} profile={data.profile} workExperiences={data.workExperiences} onAdd={(a) => setData({...data, achievements: [...data.achievements, a]})} onUpdate={(a) => setData({...data, achievements: data.achievements.map(i => i.id === a.id ? a : i)})} onDelete={(id) => setData({...data, achievements: data.achievements.filter(i => i.id !== id)})} />);
      case 'loker': return withPermission('loker', <JobTracker applications={data.jobApplications} onAdd={(j) => setData({...data, jobApplications: [...data.jobApplications, j]})} onUpdate={(j) => setData({...data, jobApplications: data.jobApplications.map(i => i.id === j.id ? j : i)})} onDelete={(id) => setData({...data, jobApplications: data.jobApplications.filter(i => i.id !== id)})} />);
      case 'projects': return withPermission('projects', <PersonalProjectTracker projects={data.personalProjects} onAdd={(p) => setData({...data, personalProjects: [...data.personalProjects, p]})} onUpdate={(p) => setData({...data, personalProjects: data.personalProjects.map(i => i.id === p.id ? p : i)})} onDelete={(id) => setData({...data, personalProjects: data.personalProjects.filter(i => i.id !== id)})} appData={data} onUpgrade={() => setIsUpgradeModalOpen(true)} />);
      case 'reviews': return withPermission('reviews', <Reviews reviews={data.monthlyReviews} onAdd={(r) => setData({...data, monthlyReviews: [...data.monthlyReviews, r]})} onDelete={(id) => setData({...data, monthlyReviews: data.monthlyReviews.filter(i => i.id !== id)})} />);
      case 'cv_generator': return withPermission('cv', <CVGenerator data={data} />);
      case 'online_cv': return withPermission('cv', <OnlineCVBuilder data={data} onUpdateConfig={(c) => setData({...data, onlineCV: c})} />);
      case 'settings': return <AccountSettings role={data.role} reminderConfig={data.reminderConfig} onUpdateReminders={(c) => setData({...data, reminderConfig: c})} />;
      case 'billing': return <Billing data={data} products={publicProducts} />;
      case 'admin_dashboard': return <AdminPanel initialMode="dashboard" />;
      case 'admin_users': return <AdminPanel initialMode="users" />;
      case 'admin_admins': return <AdminPanel initialMode="admin_admins" />;
      case 'admin_transactions': return <AdminPanel initialMode="admin_transactions" />;
      case 'admin_ai': return <AdminPanel initialMode="ai" />;
      case 'admin_products': return <AdminPanel initialMode="products" />;
      case 'admin_integrations': return <AdminPanel initialMode="integrations" />;
      case 'admin_settings': return <AdminPanel initialMode="settings" />;
      case 'admin_health': return <AdminPanel initialMode="health" />;
      default: return <Dashboard data={data} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => auth.signOut()} isAdmin={isAdmin} />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {/* Upgrade Modal Component */}
        {isUpgradeModalOpen && (
          <UpgradeModal 
            products={publicProducts} 
            onClose={() => setIsUpgradeModalOpen(false)} 
            currentPlan={data.plan}
          />
        )}

        {/* Toast Notification Container */}
        {toast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] animate-in slide-in-from-top-4 duration-500">
             <div className={`px-10 py-4 rounded-[2rem] shadow-2xl border flex items-center gap-4 ${
               toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 
               toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 
               'bg-blue-600 border-blue-500 text-white'
             }`}>
               <span className="text-xl">
                 {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
               </span>
               <span className="font-black text-[10px] uppercase tracking-widest leading-none">{toast.message}</span>
             </div>
          </div>
        )}

        {/* DESKTOP GLOBAL HEADER - Hanya untuk User */}
        {!isAdmin && (
          <header className="hidden lg:flex items-center justify-between mb-8 animate-in fade-in duration-700">
             <div className="flex-1">
                <div className="relative max-w-md">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                   <input type="text" placeholder="Quick Search Hub..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all" />
                </div>
             </div>

             <div className="flex items-center gap-6">
                {/* Notifications Engine */}
                <div className="relative">
                   <button 
                    onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                    className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all relative group"
                   >
                      <i className="bi bi-bell text-lg"></i>
                      {activeAlerts.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
                           {activeAlerts.length}
                        </span>
                      )}
                   </button>
                   
                   {isNotifOpen && (
                     <div className="absolute right-0 top-full mt-3 w-72 bg-white border border-slate-100 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] p-4 z-[110] animate-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Notifikasi Intelligence</p>
                        <div className="space-y-2">
                           {activeAlerts.length > 0 ? activeAlerts.map(alert => (
                             <button 
                              key={alert.id}
                              onClick={() => { setActiveTab(alert.target); setIsNotifOpen(false); }}
                              className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100 flex items-center gap-4 group"
                             >
                                <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm border border-slate-100 text-${alert.color}-500`}>
                                   <i className={`bi ${alert.icon}`}></i>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <p className="text-[11px] font-black text-slate-800 leading-tight">{alert.text}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Selesaikan Segera →</p>
                                </div>
                             </button>
                           )) : (
                             <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semua Tugas Beres! ✨</p>
                             </div>
                           )}
                        </div>
                     </div>
                   )}
                </div>

                {/* Profile Choice Dropdown */}
                <div className="relative">
                   <button 
                    onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                    className="flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                   >
                      <div className="w-9 h-9 bg-slate-100 rounded-xl overflow-hidden border-2 border-white shadow-inner">
                        {data.profile.photoUrl ? (
                          <img src={data.profile.photoUrl} className="w-full h-full object-cover" alt="User" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs uppercase">{data.profile.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1 group-hover:text-indigo-600 transition-colors">{data.profile.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{data.plan} Tier</p>
                      </div>
                      <i className={`bi bi-chevron-down text-[10px] text-slate-300 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-indigo-500' : ''}`}></i>
                   </button>

                   {isProfileOpen && (
                     <div className="absolute right-0 top-full mt-3 w-60 bg-white border border-slate-100 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] p-2 z-[110] animate-in slide-in-from-top-2">
                        <button onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                           <i className="bi bi-person-circle text-sm opacity-50"></i> Lihat Profil Saya
                        </button>
                        <button onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                           <i className="bi bi-gear text-sm opacity-50"></i> Pengaturan Akun
                        </button>
                        <button onClick={() => { setActiveTab('billing'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                           <i className="bi bi-credit-card text-sm opacity-50"></i> Billing & Plan
                        </button>
                        <div className="h-px bg-slate-50 my-1 mx-3"></div>
                        <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                           <i className="bi bi-box-arrow-right text-sm opacity-50"></i> Keluar Sesi
                        </button>
                     </div>
                   )}
                </div>
             </div>
          </header>
        )}

        {renderContent()}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={handleNavigate} onLogout={() => auth.signOut()} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
