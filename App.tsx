import React, { useState, useEffect, useRef } from 'react';
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
import MobileHeader from './components/user/MobileHeader';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PublicLegalView from './components/PublicLegalView';
import WorkReflectionView from './components/WorkReflection';
import PerformanceReports from './components/PerformanceReports';
import AiInsightActivity from './components/AiInsightActivity';
import ToDoList from './components/ToDoList';
import AppsHub from './components/user/AppsHub';
import UpgradeModal from './components/user/UpgradeModal';
import MobileStats from './components/user/MobileStats';
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
  const desktopNotifRef = useRef<HTMLDivElement>(null);

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

  // Close desktop notification on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopNotifRef.current && !desktopNotifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          // Ambil katalog untuk mendapatkan izin modul paket paket FREE yang dikonfigurasi admin
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
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-indigo-50/50 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-blue-50/50 rounded-full blur-[100px] animate-pulse delay-700"></div>
      <div className="relative flex flex-col items-center gap-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center text-white text-4xl font-black shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] animate-bounce">F</div>
        <div className="space-y-4">
           <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-[0.25em] uppercase leading-none">Sedang Memuat...</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em] leading-none">Menyiapkan Dasbor Karir Anda</p>
           </div>
           <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto border border-white shadow-inner">
              <div className="h-full bg-indigo-600 rounded-full w-full animate-loading-bar origin-left"></div>
           </div>
        </div>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">FokusKarir v2.0 • Intelligent Systems</div>
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
      case 'mobile_stats': return <MobileStats data={data} />;
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
      case 'apps_hub': return <AppsHub onNavigate={handleNavigate} />;
      case 'admin_dashboard': return isAdmin ? <AdminPanel initialMode="dashboard" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_users': return isAdmin ? <AdminPanel initialMode="users" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_admins': return isAdmin ? <AdminPanel initialMode="admin_admins" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_transactions': return isAdmin ? <AdminPanel initialMode="admin_transactions" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_ai': return isAdmin ? <AdminPanel initialMode="ai" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_products': return isAdmin ? <AdminPanel initialMode="products" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_integrations': return isAdmin ? <AdminPanel initialMode="integrations" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_settings': return isAdmin ? <AdminPanel initialMode="settings" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      case 'admin_health': return isAdmin ? <AdminPanel initialMode="health" userRole={data.role} /> : <Dashboard data={data} onNavigate={handleNavigate} />;
      default: return <Dashboard data={data} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => auth.signOut()} isAdmin={isAdmin} />
      
      <main className="flex-1 lg:ml-64">
        {/* PT-6 Wrapper for content to add space from header in mobile */}
        <div className={`${!isAdmin ? 'pt-0' : 'p-4 lg:p-8'}`}>
          {/* Mobile Global Header for User role - ALWAYS VISIBLE */}
          {!isAdmin && (
            <MobileHeader 
              profile={data.profile} 
              notificationCount={activeAlerts.length} 
              onNavigate={handleNavigate}
              activeTab={activeTab}
              alerts={activeAlerts}
            />
          )}

          <div className={`${!isAdmin ? 'p-4 lg:p-8 pt-6' : ''}`}>
            {/* Upgrade Modal Component */}
            {isUpgradeModalOpen && (
              <UpgradeModal 
                products={publicProducts} 
                onClose={() => setIsUpgradeModalOpen(false)} 
                currentPlan={data.plan}
              />
            )}
            
            {/* Header Desktop */}
            <div className="hidden lg:flex items-center justify-between mb-8">
               <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{activeTab.replace('_', ' ')}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FokusKarir Control Center</p>
               </div>
               <div className="flex items-center gap-6">
                  {/* Desktop Notification Center */}
                  <div className="relative" ref={desktopNotifRef}>
                     <button 
                       onClick={() => setIsNotifOpen(!isNotifOpen)}
                       className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative border ${isNotifOpen ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600 hover:border-indigo-100'}`}
                     >
                        <i className={`bi ${isNotifOpen ? 'bi-bell-fill' : 'bi-bell'}`}></i>
                        {activeAlerts.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {activeAlerts.length}
                          </span>
                        )}
                     </button>
                     
                     {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl p-4 animate-in slide-in-from-top-2 duration-300 z-[120]">
                           <div className="p-4 border-b border-slate-50 mb-3 flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pusat Notifikasi</h4>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase">{activeAlerts.length} Baru</span>
                           </div>
                           <div className="space-y-1.5 max-h-[350px] overflow-y-auto no-scrollbar">
                              {activeAlerts.length > 0 ? activeAlerts.map((alert, i) => (
                                <button 
                                  key={alert.id} 
                                  onClick={() => { handleNavigate(alert.target); setIsNotifOpen(false); }}
                                  className="w-full flex items-center gap-4 p-4 rounded-[1.75rem] hover:bg-slate-50 transition-all text-left group"
                                >
                                   <div className={`w-10 h-10 rounded-2xl bg-${alert.color}-50 text-${alert.color}-600 flex items-center justify-center text-sm shrink-0 border border-${alert.color}-100`}>
                                      <i className={`bi ${alert.icon}`}></i>
                                   </div>
                                   <div className="flex-1 overflow-hidden">
                                      <p className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{alert.text}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Ketuk untuk Selesaikan</p>
                                   </div>
                                </button>
                              )) : (
                                <div className="py-12 text-center">
                                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada notifikasi baru</p>
                                </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-3">
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-900 leading-none">{data.profile.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{data.plan} Member</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                        {data.profile.photoUrl ? <img src={data.profile.photoUrl} className="w-full h-full object-cover" alt="User profile" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="bi bi-person-fill"></i></div>}
                     </div>
                  </div>
               </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={handleNavigate} onLogout={() => auth.signOut()} isAdmin={isAdmin} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[6000] px-6 py-3 rounded-2xl shadow-2xl border text-white font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-4 ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 
          toast.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-blue-600 border-blue-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;