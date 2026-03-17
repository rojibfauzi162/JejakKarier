
import React, { useState, useEffect, useRef } from 'react';
import { AppData, UserRole, SubscriptionProduct, SubscriptionPlan, AccountStatus, ToDoTask, AiStrategy, Training, Certification, Skill, CareerEvent, JobStatus, EventType, ImportanceLevel, WorkExperience, Education } from './types';
import { INITIAL_DATA, DEFAULT_PRODUCTS } from './constants';
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
import CVGenerator from './components/CVGenerator';
import OnlineCVBuilder from './components/OnlineCVBuilder';
import AccountSettings from './components/AccountSettings';
import Billing from './components/Billing';
import AdminPanel from './components/admin/AdminPanel';
import MobileNav from './components/MobileNav';
import MobileHeader from './components/user/MobileHeader';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Checkout from './components/Checkout';
import PublicLegalView from './components/PublicLegalView';
import WorkReflectionView from './components/WorkReflection';
import PerformanceReports from './components/PerformanceReports';
import AiInsightActivity from './components/AiInsightActivity';
import ToDoList from './components/ToDoList';
import AppsHub from './components/user/AppsHub';
import UpgradeModal from './components/user/UpgradeModal';
import MobileStats from './components/user/MobileStats';
import CareerCalendar from './components/user/CareerCalendar'; 
import InterviewIntelligenceScript from './components/user/InterviewIntelligenceScript';
import TrainingManagement from './components/admin/TrainingManagement';
import TrainingList from './components/public/TrainingList';
import TrainingDetail from './components/public/TrainingDetail';
import OnboardingFlow from './components/user/OnboardingFlow';
import { auth, getUserData, saveUserData, getProductsCatalog, findUserByEmail, deleteUserDoc, getTrackingConfig } from './services/firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { trackingService } from './services/trackingService';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const getCleanInitialData = () => JSON.parse(JSON.stringify(INITIAL_DATA));
  const [data, setData] = useState<AppData>(getCleanInitialData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [skillsSubTab, setSkillsSubTab] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionProduct | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [hideVerificationReminder, setHideVerificationReminder] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // NEW: State for mobile sidebar
  const [showOnboarding, setShowOnboarding] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendingEmail) return;
    setResendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      showToast("Link verifikasi berhasil dikirim ulang! Silakan cek kotak masuk Anda.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRefreshUserStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      if (auth.currentUser.emailVerified) {
        showToast("Email berhasil diverifikasi!", "success");
      } else {
        showToast("Email belum terverifikasi. Cek inbox Anda.", "info");
      }
    }
  };

  const [publicLegalPage, setPublicLegalPage] = useState<'privacy' | 'terms' | null>(() => {
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    return null;
  });

  const [publicTrainingPage, setPublicTrainingPage] = useState<{ type: 'list' | 'detail', id?: string } | null>(() => {
    const path = window.location.pathname;
    if (path === '/trainings') return { type: 'list' };
    if (path.startsWith('/trainings/')) return { type: 'detail', id: path.split('/')[2] };
    return null;
  });

  const checkProfileCompletion = (profile: any) => {
    const fields = [
      'name', 'birthPlace', 'birthDate', 'maritalStatus', 'email', 
      'phone', 'domicile', 'currentCompany', 'currentPosition', 
      'shortTermTarget', 'longTermTarget', 'description', 'photoUrl', 'jobCategory'
    ];
    const filled = fields.filter(f => profile[f] && profile[f].toString().trim() !== '').length;
    return (filled / fields.length) > 0.5;
  };

  useEffect(() => {
    if (user && data && !data.onboardingCompleted) {
      if (checkProfileCompletion(data.profile)) {
        // Auto-complete onboarding if profile is already > 50% filled
        const updatedData = { ...data, onboardingCompleted: true };
        setData(updatedData);
        if (data.uid) {
          saveUserData(data.uid, updatedData);
        }
      }
    }
  }, [user, data.profile, data.onboardingCompleted]);

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    setSkillsSubTab(subTab || undefined);
    setIsSidebarOpen(false); // Close sidebar on navigate
  };

  const navigateToLegal = (type: 'privacy' | 'terms' | null) => {
    if (type) window.history.pushState({ type }, '', `/${type}`);
    else window.history.pushState({}, '', '/');
    setPublicLegalPage(type);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/privacy') setPublicLegalPage('privacy');
      else if (path === '/terms') setPublicLegalPage('terms');
      else setPublicLegalPage(null);

      if (path === '/trainings') setPublicTrainingPage({ type: 'list' });
      else if (path.startsWith('/trainings/')) setPublicTrainingPage({ type: 'detail', id: path.split('/')[2] });
      else setPublicTrainingPage(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
  const [publicProducts, setPublicProducts] = useState<SubscriptionProduct[]>(DEFAULT_PRODUCTS);

  useEffect(() => {
    getProductsCatalog().then(p => {
      if (p && p.length > 0) setPublicProducts(p);
    });
    // Inisialisasi Tracking Pixel
    getTrackingConfig().then(cfg => {
      if (cfg) trackingService.init(cfg);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      
      // CHECK DEMO MODE FIRST
      const isDemo = localStorage.getItem('demo_mode') === 'true';
      const isAdminDemo = localStorage.getItem('admin_demo_mode') === 'true';
      const localSessionEmail = localStorage.getItem('local_session_user');
      
      // Clear any lingering demo/local session if a real user is now authenticated
      if (authUser && (isDemo || isAdminDemo || localSessionEmail)) {
        localStorage.removeItem('demo_mode');
        localStorage.removeItem('admin_demo_mode');
        localStorage.removeItem('local_session_user');
        // Reload to ensure a clean state without demo interference
        window.location.reload();
        return;
      }

      if (isDemo || isAdminDemo || localSessionEmail) { // Only check if no real authUser
        let demoUser: any;
        const isAdminEmail = localSessionEmail === 'admin@jejakkarir.com';
        
        if (localSessionEmail) {
          // Attempt to restore session from email
          demoUser = {
            uid: `local-${btoa(localSessionEmail)}`,
            email: localSessionEmail,
            displayName: localSessionEmail.split('@')[0],
            emailVerified: true
          };
        } else {
          demoUser = {
            uid: isAdminDemo ? 'admin-demo-123' : 'demo-user-123',
            email: isAdminDemo ? 'admin@jejakkarir.com' : 'demo@fokuskarir.com',
            displayName: isAdminDemo ? 'Super Admin Demo' : 'Demo User',
            emailVerified: true
          };
        }

        setUser(demoUser);
        
        // If it's a local session, we need to fetch the real data from Firestore
        if (localSessionEmail) {
          try {
            const existingData = await findUserByEmail(localSessionEmail);
            if (existingData) {
              setData(existingData);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Failed to fetch local session data:", e);
          }
        }

        setData({
          ...getCleanInitialData(),
          uid: demoUser.uid,
          role: (isAdminDemo || isAdminEmail) ? UserRole.SUPERADMIN : UserRole.USER,
          profile: {
            ...INITIAL_DATA.profile,
            name: demoUser.displayName,
            email: demoUser.email
          },
          plan: SubscriptionPlan.PRO, // Give pro access in demo
          planPermissions: DEFAULT_PRODUCTS.find(p => p.tier === SubscriptionPlan.PRO)?.allowedModules || []
        });
        setLoading(false);
        return;
      }

      if (!authUser) {
        setUser(null);
        setData(getCleanInitialData());
        setLoading(false);
        return;
      }
      
      // SET USER SECEPAT MUNGKIN AGAR LAYAR BERPINDAH
      setUser(authUser);

      try {
        let userData = await getUserData(authUser.uid);
        const catalog = await getProductsCatalog() || DEFAULT_PRODUCTS;
        
        if (!userData && authUser.email) {
          const existingByEmail = await findUserByEmail(authUser.email);
          if (existingByEmail && existingByEmail.uid !== authUser.uid) {
            userData = { ...existingByEmail, uid: authUser.uid };
            await saveUserData(authUser.uid, userData);
          }
        }

        if (userData) {
          const currentPlanConfig = catalog.find(p => p.tier === userData!.plan);
          if (currentPlanConfig) {
             // SINKRONISASI PERIZINAN MODUL DARI KATALOG
             const catalogModules = currentPlanConfig.allowedModules || [];
             userData.planPermissions = Array.from(new Set([...(userData.planPermissions || []), ...catalogModules]));
             userData.planLimits = currentPlanConfig.limits;
             
             // NORMALISASI KUNCI PERIZINAN (Legacy fix)
             if (userData.planPermissions.includes('todo_list') && !userData.planPermissions.includes('todo')) userData.planPermissions.push('todo');
             if (userData.planPermissions.includes('cv_generator') && !userData.planPermissions.includes('cv')) userData.planPermissions.push('cv');
             if (userData.planPermissions.includes('online_cv') && !userData.planPermissions.includes('cv')) userData.planPermissions.push('cv');
          }
          
          setData(userData);
          if (userData.role === UserRole.SUPERADMIN && activeTab === 'dashboard') {
              setActiveTab('admin_dashboard');
          }

          // Tracking Logic: Jika baru saja bayar (PAID), tembak Purchase event satu kali
          const lastTx = userData.manualTransactions?.slice().reverse()[0];
          if (lastTx && lastTx.status === 'Paid') {
             const firedKey = `fired_purchase_${lastTx.id}`;
             if (!localStorage.getItem(firedKey)) {
                trackingService.trackEvent('Purchase', { value: lastTx.amount, currency: 'IDR' });
                localStorage.setItem(firedKey, 'true');
             }
          }

        } else {
          // PROSES DATA BARU (REGISTRASI)
          const freePlan = catalog.find(p => p.tier === SubscriptionPlan.FREE);
          const joinedAt = new Date();
          const trialExpiry = new Date();
          trialExpiry.setDate(joinedAt.getDate() + 7);

          const pendingRegRaw = localStorage.getItem('pending_registration');
          const pendingReg = pendingRegRaw ? JSON.parse(pendingRegRaw) : {};

          // Kunci perizinan default yang harus dibuka (Sesuai Catalog)
          const defaultPermissions = freePlan?.allowedModules || ['dashboard', 'profile', 'daily', 'skills', 'todo_list', 'calendar', 'work_reflection', 'loker', 'cv_generator', 'online_cv', 'networking', 'projects', 'career', 'reports', 'achievements', 'ai_insights', 'reviews'];
          
          // Tambahkan alias kunci untuk kompatibilitas pengecekan withPermission
          if (defaultPermissions.includes('todo_list') && !defaultPermissions.includes('todo')) defaultPermissions.push('todo');
          if (defaultPermissions.includes('cv_generator') && !defaultPermissions.includes('cv')) defaultPermissions.push('cv');

          const newData: AppData = { 
            ...getCleanInitialData(), 
            uid: authUser.uid, 
            role: UserRole.USER, 
            plan: SubscriptionPlan.FREE, 
            status: AccountStatus.ACTIVE,
            joinedAt: joinedAt.toISOString(), 
            lastLogin: joinedAt.toISOString(),
            expiryDate: trialExpiry.toISOString(),
            planPermissions: defaultPermissions,
            planLimits: freePlan?.limits || { dailyLogs: 3, skills: 2, projects: 2, jobTracker: 2, careerCalendar: 2, networking: 2, todoList: 2, workExperience: 2, education: 2, trainingHistory: 2, certification: 2, careerPath: 2, cvExports: 1, achievements: 1 },
            profile: { 
              ...INITIAL_DATA.profile, 
              email: authUser.email || pendingReg.email || '', 
              name: pendingReg.name || authUser.displayName || 'User',
              phone: pendingReg.phone || ''
            }
          };
          await saveUserData(authUser.uid, newData);
          setData(newData);
          localStorage.removeItem('pending_registration');
        }
      } catch (err) {
        console.error("Auth Sinkronisasi Error:", err);
        showToast("Sinkronisasi tertunda, tetap masuk ke sistem.", "info");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const persist = async () => {
      if (user && data.uid === user.uid && !loading && data.uid) {
        await saveUserData(user.uid, data);
      }
    };
    persist();
  }, [data, user, loading]);

  if (publicLegalPage) return <PublicLegalView type={publicLegalPage} onBack={() => navigateToLegal(null)} />;
  if (publicTrainingPage?.type === 'list') return <TrainingList />;
  if (publicTrainingPage?.type === 'detail' && publicTrainingPage.id) return <TrainingDetail id={publicTrainingPage.id} />;
  if (loading) return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-indigo-50/50 rounded-full blur-[100px] animate-pulse"></div>
      <div className="relative flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center text-white text-4xl font-black shadow-xl animate-bounce">F</div>
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-black text-slate-900 tracking-[0.25em] uppercase">Loading...</h2>
          <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-white">
             <div className="h-full bg-indigo-600 rounded-full w-full animate-loading-bar origin-left"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (checkoutPlan) return <Checkout plan={checkoutPlan} user={user} onBack={() => setCheckoutPlan(null)} />;
  if (!user) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return <LandingPage onStart={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} onShowLegal={(type) => navigateToLegal(type)} onBuyPlan={(plan) => setCheckoutPlan(plan)} products={publicProducts} />;
  }

  const isAdmin = data.role === UserRole.SUPERADMIN;
  const activeAlerts = isAdmin ? [] : (() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const alerts = [];
    if (!data.dailyReports.some(l => l.date === todayStr)) alerts.push({ id: 'log', text: "Lupa isi Aktivitas Kerja?", target: 'daily', icon: 'bi-pencil-square', color: 'indigo' });
    const pendingTodos = data.todoList.filter(t => t.status === 'Pending');
    if (pendingTodos.length > 0) alerts.push({ id: 'todo_p', text: `${pendingTodos.length} Langkah Tertunda`, target: 'todo_list', icon: 'bi-list-check', color: 'blue' });
    return alerts;
  })();

  const withPermission = (moduleKey: string, content: React.ReactNode) => {
    // MODUL DASAR (Tapi Sekarang Di-Lock jika Belum Verifikasi sesuai permintaan user)
    const basicModules = ['dashboard', 'profile', 'apps_hub', 'billing', 'settings', 'calendar'];

    // LOCK TOTAL JIKA BELUM VERIFIKASI EMAIL (Kecuali Admin)
    if (user && !user.emailVerified && !isAdmin) {
      return (
        <div className="relative min-h-[500px] flex items-center justify-center bg-white rounded-[3rem] p-10 text-center animate-in zoom-in duration-500 border border-slate-100 shadow-sm">
           <div className="space-y-6">
              <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto shadow-inner">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">Email Belum Terverifikasi</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Mohon selesaikan verifikasi email Anda (<span className="font-bold text-indigo-600">{user.email}</span>) untuk membuka akses ke seluruh sistem dan modul FokusKarir.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                 <button onClick={handleRefreshUserStatus} className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all active:scale-95">Sudah Verifikasi? Cek Status</button>
                 <button onClick={handleResendVerification} disabled={resendingEmail} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">{resendingEmail ? 'Mengirim...' : 'Kirim Ulang Link Email'}</button>
              </div>
           </div>
        </div>
      );
    }

    if (isAdmin) return content;
    if (basicModules.includes(moduleKey)) return content;
    
    // CEK PERIZINAN BERDASARKAN ARRAY planPermissions
    const permissions = data.planPermissions || [];
    
    // Normalisasi kunci pencarian agar lebih cerdas
    const isAllowed = permissions.includes(moduleKey) || 
                      (moduleKey === 'todo' && permissions.includes('todo_list')) ||
                      (moduleKey === 'interview_script') ||
                      (moduleKey === 'cv' && (permissions.includes('cv_generator') || permissions.includes('online_cv')));

    if (!isAllowed) {
      return (
        <div className="relative min-h-[500px] flex items-center justify-center bg-white rounded-[3rem] p-10 text-center animate-in zoom-in duration-500 border border-slate-100 shadow-sm">
           <div className="space-y-6">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center text-3xl mx-auto"><i className="bi bi-lock-fill"></i></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fitur Khusus Member Pro</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">Upgrade akun Anda untuk membuka akses ke modul <span className="font-black uppercase">{moduleKey.replace('_', ' ')}</span> dan fitur analisis cerdas lainnya.</p>
              <button onClick={() => setIsUpgradeModalOpen(true)} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Upgrade Sekarang</button>
           </div>
        </div>
      );
    }
    return content;
  };

  const renderContent = () => {
    const commonProps = { 
      onUpgrade: () => setIsUpgradeModalOpen(true),
      onAddCalendarEvent: (e: CareerEvent) => setData(prev => ({...prev, careerEvents: [...(prev.careerEvents || []), e]}))
    };
    switch (activeTab) {
      case 'dashboard': return withPermission('dashboard', <Dashboard data={data} onNavigate={handleNavigate} onOpenOnboarding={() => setShowOnboarding(true)} />);
      case 'admin_dashboard': return <AdminPanel initialMode="dashboard" userRole={data.role} />;
      case 'admin_users': return <AdminPanel initialMode="users" userRole={data.role} />;
      case 'admin_admins': return <AdminPanel initialMode="admin_admins" userRole={data.role} />;
      case 'admin_transactions': return <AdminPanel initialMode="admin_transactions" userRole={data.role} />;
      case 'admin_tracking': return <AdminPanel initialMode="tracking" userRole={data.role} />;
      case 'duitku': return <AdminPanel initialMode="duitku" userRole={data.role} />;
      case 'admin_followup': return <AdminPanel initialMode="followup" userRole={data.role} />;
      case 'admin_ai': return <AdminPanel initialMode="ai" userRole={data.role} />;
      case 'admin_products': return <AdminPanel initialMode="products" userRole={data.role} />;
      case 'admin_sales_popup': return <AdminPanel initialMode="sales_popup" userRole={data.role} />;
      case 'admin_integrations': return <AdminPanel initialMode="integrations" userRole={data.role} />;
      case 'admin_settings': return <AdminPanel initialMode="settings" userRole={data.role} />;
      case 'admin_health': return <AdminPanel initialMode="health" userRole={data.role} />;
      case 'email_marketing': return <AdminPanel initialMode="email_marketing" userRole={data.role} />;
      case 'admin_trainings': return <TrainingManagement onToast={(msg, type) => showToast(msg, type)} />;
      
      case 'apps_hub': return withPermission('apps_hub', <AppsHub onNavigate={handleNavigate} />);
      case 'mobile_stats': return withPermission('mobile_stats', <MobileStats data={data} />);
      case 'profile': return withPermission('profile', <ProfileView profile={data.profile} workExperiences={data.workExperiences} educations={data.educations} onUpdateProfile={(p) => setData(prev => ({...prev, profile: p}))} onAddWork={(w) => setData(prev => ({...prev, workExperiences: [...prev.workExperiences, w]}))} onUpdateWork={(w) => setData(prev => ({...prev, workExperiences: prev.workExperiences.map(i => i.id === w.id ? w : i)}))} onDeleteWork={(id) => setData(prev => ({...prev, workExperiences: prev.workExperiences.filter(i => i.id !== id)}))} onAddEducation={(e) => setData(prev => ({...prev, educations: [...prev.educations, e]}))} onUpdateEducation={(e) => setData(prev => ({...prev, educations: prev.educations.map(i => i.id === e.id ? e : i)}))} onDeleteEducation={(id) => setData(prev => ({...prev, educations: prev.educations.filter(e => e.id !== id)}))} appData={data} />);
      case 'daily': return withPermission('daily', <DailyLogs logs={data.dailyReports} categories={data.workCategories} onAdd={(l) => setData(prev => ({...prev, dailyReports: [...prev.dailyReports, l]}))} onUpdate={(l) => setData(prev => ({...prev, dailyReports: prev.dailyReports.map(i => i.id === l.id ? l : i)}))} onDelete={(id) => setData(prev => ({...prev, dailyReports: prev.dailyReports.filter(i => i.id !== id)}))} onAddCategory={(c) => setData(prev => ({...prev, workCategories: [...prev.workCategories, c]}))} onUpdateCategory={(old, next) => setData(prev => ({...prev, workCategories: prev.workCategories.map(c => c === old ? next : c)}))} onDeleteCategory={(c) => setData(prev => ({...prev, workCategories: prev.workCategories.filter(i => i !== c)}))} affirmation={data.affirmations[0]} appData={data} onUpgrade={commonProps.onUpgrade} />);
      case 'work_reflection': return withPermission('work_reflection', <WorkReflectionView reflections={data.dailyReflections} skills={data.skills} onAdd={(r) => setData(prev => ({...prev, dailyReflections: [...data.dailyReflections, r]}))} onUpdateSkill={(s) => setData(prev => ({...prev, skills: prev.skills.map(i => i.id === s.id ? s : i)}))} onAddTodo={(t) => setData(prev => ({...prev, todoList: [...prev.todoList, t]}))} onAddAchievement={(a) => setData(prev => ({...prev, achievements: [...prev.achievements, a]}))} appData={data} />);
      case 'reports': return withPermission('reports', <PerformanceReports data={data} />);
      case 'ai_insights': return withPermission('ai_insights', <AiInsightActivity data={data} onUpdateInsights={(ins) => setData(prev => ({...prev, aiInsights: ins}))} onAddAchievement={(ach) => setData(prev => ({...prev, achievements: [...prev.achievements, ach]}))} onUpgrade={commonProps.onUpgrade} />);
      case 'todo_list': return withPermission('todo_list', <ToDoList tasks={data.todoList} categories={data.todoCategories} onAdd={(t) => setData(prev => ({...prev, todoList: [...prev.todoList, t]}))} onUpdate={(t) => setData(prev => ({...prev, todoList: prev.todoList.map(i => i.id === t.id ? t : i)}))} onDelete={(id) => setData(prev => ({...prev, todoList: prev.todoList.filter(i => i.id !== id)}))} onAddCategory={(c) => setData(prev => ({...prev, todoCategories: [...prev.todoCategories, c]}))} onUpdateCategory={(o, n) => setData(prev => ({...prev, todoCategories: prev.todoCategories.map(i => i === o ? n : i)}))} onDeleteCategory={(c) => setData(prev => ({...prev, todoCategories: prev.todoCategories.filter(i => i !== c)}))} appData={data} onUpgrade={commonProps.onUpgrade} />);
      case 'calendar': return withPermission('calendar', <CareerCalendar data={data} onAddEvent={(e) => setData(prev => ({...prev, careerEvents: [...(prev.careerEvents || []), e]}))} onDeleteEvent={(id) => setData(prev => ({...prev, careerEvents: (prev.careerEvents || []).filter(i => i.id !== id)}))} onUpgrade={commonProps.onUpgrade} onUpdateJobStatus={(id, s) => setData(prev => ({...prev, jobApplications: prev.jobApplications.map(j => j.id === id ? {...j, status: s} : j)}))} />);
      case 'skills': return withPermission('skills', <SkillTracker skills={data.skills} trainings={data.trainings} certs={data.certifications} onAddSkill={(s) => setData(prev => ({...prev, skills: [...prev.skills, s]}))} onUpdateSkill={(s) => setData(prev => ({...prev, skills: prev.skills.map(i => i.id === s.id ? s : i)}))} onDeleteSkill={(id) => setData(prev => ({...prev, skills: prev.skills.filter(i => i.id !== id)}))} onAddTraining={(t) => setData(prev => ({...prev, trainings: [...prev.trainings, t]}))} onUpdateTraining={(t) => setData(prev => ({...prev, trainings: prev.trainings.map(i => i.id === t.id ? t : i)}))} onDeleteTraining={(id) => setData(prev => ({...prev, trainings: prev.trainings.filter(i => i.id !== id)}))} onAddCert={(c) => setData(prev => ({...prev, certifications: [...prev.certifications, c]}))} onUpdateCert={(c) => setData(prev => ({...prev, certifications: prev.certifications.map(i => i.id === c.id ? c : i)}))} onDeleteCert={(id) => setData(prev => ({...prev, certifications: prev.certifications.filter(i => i.id !== id)}))} onAddTodo={(t) => setData(prev => ({...prev, todoList: [...prev.todoList, t]}))} onSaveStrategy={(s: AiStrategy) => setData(prev => ({...prev, aiStrategies: [s, ...(prev.aiStrategies || [])]}))} showToast={showToast} data={data} initialSubTab={skillsSubTab as any} onUpgrade={commonProps.onUpgrade} onAddCalendarEvent={commonProps.onAddCalendarEvent} />);
      case 'career': return withPermission('career', <CareerPlanner paths={data.careerPaths} appData={data} onAddPath={(p) => setData(prev => ({...prev, careerPaths: [...prev.careerPaths, p]}))} onUpdatePath={(p) => setData(prev => ({...prev, careerPaths: prev.careerPaths.map(i => i.id === p.id ? p : i)}))} onDeletePath={(id) => setData(prev => ({...prev, careerPaths: prev.careerPaths.filter(i => i.id !== id)}))} onUpgrade={commonProps.onUpgrade} />);
      case 'networking': return withPermission('networking', <Networking contacts={data.contacts} onAdd={(c) => setData(prev => ({...prev, contacts: [...prev.contacts, c]}))} onUpdate={(c) => setData(prev => ({...prev, contacts: prev.contacts.map(i => i.id === c.id ? c : i)}))} onDelete={(id) => setData(prev => ({...prev, contacts: prev.contacts.filter(i => i.id !== id)}))} appData={data} onUpgrade={commonProps.onUpgrade} />);
      case 'achievements': return withPermission('achievements', <AchievementTracker achievements={data.achievements} profile={data.profile} workExperiences={data.workExperiences} onAdd={(a) => setData(prev => ({...prev, achievements: [...prev.achievements, a]}))} onUpdate={(a) => setData(prev => ({...prev, achievements: prev.achievements.map(i => i.id === a.id ? a : i)}))} onDelete={(id) => setData(prev => ({...prev, achievements: prev.achievements.filter(i => i.id !== id)}))} appData={data} onUpgrade={commonProps.onUpgrade} />);
      case 'loker': return withPermission('loker', <JobTracker applications={data.jobApplications} careerEvents={data.careerEvents || []} onAdd={(j) => setData(prev => ({...prev, jobApplications: [...prev.jobApplications, j]}))} onUpdate={(j) => setData(prev => ({...prev, jobApplications: prev.jobApplications.map(i => i.id === j.id ? j : i)}))} onDelete={(id) => setData(prev => ({...prev, jobApplications: prev.jobApplications.filter(i => i.id !== id)}))} onAddCalendarEvent={commonProps.onAddCalendarEvent} appData={data} onUpgrade={commonProps.onUpgrade} />);
      case 'projects': return withPermission('projects', <PersonalProjectTracker projects={data.personalProjects} onAdd={(p) => setData(prev => ({...prev, personalProjects: [...prev.personalProjects, p]}))} onUpdate={(p) => setData(prev => ({...prev, personalProjects: prev.personalProjects.map(i => i.id === p.id ? p : i)}))} onDelete={(id) => setData(prev => ({...prev, personalProjects: prev.personalProjects.filter(i => i.id !== id)}))} appData={data} onUpgrade={commonProps.onUpgrade} />);
      case 'cv_generator': return withPermission('cv_generator', <CVGenerator data={data} />);
      case 'online_cv': return withPermission('online_cv', <OnlineCVBuilder data={data} onUpdateConfig={(c) => setData(prev => ({...prev, onlineCV: c}))} />);
      case 'interview_script': return withPermission('interview_script', <InterviewIntelligenceScript data={data} onUpdateScripts={(s) => setData(prev => ({...prev, interviewScripts: s}))} onUpgrade={commonProps.onUpgrade} />);
      case 'settings': return withPermission('settings', <AccountSettings reminderConfig={data.reminderConfig} onUpdateReminders={(c) => setData(prev => ({...prev, reminderConfig: c}))} />);
      case 'billing': return withPermission('billing', <Billing data={data} products={publicProducts} onSelectPlan={(p) => setCheckoutPlan(p)} />);
      default: return withPermission('dashboard', <Dashboard data={data} onNavigate={handleNavigate} />);
    }
  };

  const handleLogout = async () => { 
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('admin_demo_mode');
    localStorage.removeItem('local_session_user');
    
    try {
      await auth.signOut();
      // Attempt to clear Firebase IndexedDB to prevent stale sessions
      if (window.indexedDB && window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name && db.name.includes('firebase')) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.href = "/"; 
  };

  const getAdminTitle = () => {
    const titles: Record<string, string> = {
      'admin_dashboard': 'Dashboard Admin',
      'admin_users': 'Kelola User',
      'admin_admins': 'Kelola Admin',
      'admin_transactions': 'Manajemen Transaksi',
      'admin_tracking': 'Tracking & Pixels',
      'duitku': 'Integrasi Duitku',
      'admin_followup': 'Follow Up Manager',
      'admin_ai': 'AI Architecture',
      'admin_products': 'Product Matrix',
      'admin_sales_popup': 'Sales Popup Manager',
      'admin_settings': 'Pengaturan Admin',
      'admin_health': 'System Health',
      'email_marketing': 'Email Marketing',
      'admin_trainings': 'Training Management'
    };
    return titles[activeTab] || 'Admin Hub';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavigate} 
        onLogout={handleLogout} 
        isAdmin={isAdmin} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isBypassMode={!!localStorage.getItem('local_session_user') || !!localStorage.getItem('admin_demo_mode')}
      />
      <main className="flex-1 lg:ml-64">
        {!user?.emailVerified && !isAdmin && !hideVerificationReminder && user && (
          <div className="px-6 py-6 lg:px-10 lg:pt-8 animate-in slide-in-from-top-full duration-700 relative z-[200]">
             <div className="bg-[#fffbeb] border border-[#fef3c7] p-8 lg:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                <button onClick={() => setHideVerificationReminder(true)} className="absolute top-6 right-8 text-amber-900/30 hover:text-amber-900 transition-colors"><i className="bi bi-x-lg text-lg"></i></button>
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                   <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#fef3c7] rounded-[1.75rem] flex items-center justify-center shrink-0 shadow-inner"><i className="bi bi-envelope text-[#d97706] text-3xl"></i></div>
                   <div className="space-y-4 flex-1">
                      <h3 className="text-xl lg:text-2xl font-black text-[#92400e] tracking-tight leading-none uppercase">Verifikasi email dulu supaya akunmu aktif 100%</h3>
                      <p className="text-sm lg:text-base text-amber-800/80 font-medium leading-relaxed max-w-3xl">Kami sudah mengirimkan email verifikasi ke <span className="font-black text-[#92400e]">{user.email}</span>. Silakan cek inbox atau folder <span className="font-black">SPAM/Promotions</span>, lalu klik tombol verifikasi di email tersebut.</p>
                      <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <button onClick={handleResendVerification} disabled={resendingEmail} className="w-full sm:w-auto px-8 py-4 bg-[#d97706] hover:bg-[#b45309] text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"><i className="bi bi-envelope-fill"></i>{resendingEmail ? 'Mengirim Ulang...' : 'Kirim Ulang Email Verifikasi'}</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className={`${!isAdmin ? 'pt-0' : 'p-4 lg:p-8 pt-2'}`}>
          {!isAdmin && user && <MobileHeader profile={data.profile} notificationCount={activeAlerts.length} onNavigate={handleNavigate} activeTab={activeTab} alerts={activeAlerts} />}
          <div className={`${!isAdmin ? 'p-4 lg:p-8 pt-6' : 'pt-0'}`}>
            {isUpgradeModalOpen && (
              <UpgradeModal 
                products={publicProducts} 
                onClose={() => setIsUpgradeModalOpen(false)} 
                onSelectPlan={(p) => { setCheckoutPlan(p); setIsUpgradeModalOpen(false); }}
                currentPlan={data.plan} 
                userEmail={user.email} 
                userName={data.profile.name} 
              />
            )}
            {user && user.emailVerified && !isAdmin && (!data.onboardingCompleted || showOnboarding) && (
              <OnboardingFlow 
                key={data.uid || 'onboarding'}
                data={data} 
                onComplete={(updatedData) => {
                  setData(updatedData);
                  setShowOnboarding(false);
                }} 
              />
            )}
            <div className={`hidden lg:flex items-center justify-between ${!isAdmin ? 'mb-8' : 'mb-8'}`}>
               {isAdmin ? (
                 <div className="animate-in slide-in-from-left duration-500">
                   <h2 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">
                      {getAdminTitle()}
                   </h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     Sistem Administrasi FokusKarir.
                   </p>
                 </div>
               ) : (
                 <div></div>
               )}
               {user && (
                 <div className="flex items-center gap-6 ml-auto">
                    <div className="relative" ref={desktopNotifRef}>
                       <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative border ${isNotifOpen ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600'}`}><i className={`bi ${isNotifOpen ? 'bi-bell-fill' : 'bi-bell'} text-lg`}></i>{activeAlerts.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{activeAlerts.length}</span>}</button>
                       {isNotifOpen && (
                          <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl p-4 animate-in slide-in-from-top-2 duration-300 z-[120]">
                             <div className="p-4 border-b border-slate-50 mb-3 flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pusat Notifikasi</h4></div>
                             <div className="space-y-1.5">{activeAlerts.length > 0 ? activeAlerts.map((alert, i) => (<button key={i} onClick={() => { handleNavigate(alert.target); setIsNotifOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-[1.75rem] hover:bg-slate-50 transition-all text-left"><div className={`w-10 h-10 rounded-2xl bg-${alert.color}-50 text-${alert.color}-600 flex items-center justify-center text-sm shrink-0`}><i className={`bi ${alert.icon}`}></i></div><p className="text-xs font-black text-slate-800 leading-tight">{alert.text}</p></button>)) : (<div className="py-12 text-center text-slate-300 font-bold uppercase text-[10px]">Tidak ada notifikasi baru</div>)}</div>
                          </div>
                       )}
                    </div>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-3"><div className="text-right"><p className="text-[10px] font-black text-slate-900 leading-none">{data.profile.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{data.plan}</p></div><div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">{data.profile.photoUrl ? <img src={data.profile.photoUrl} className="w-full h-full object-cover" alt="User" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="bi bi-person-fill"></i></div>}</div></div>
                 </div>
               )}
            </div>
            {renderContent()}
          </div>
        </div>
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={handleNavigate} onLogout={handleLogout} isAdmin={isAdmin} onOpenSidebar={() => setIsSidebarOpen(true)} />
      {toast && <div className={`fixed top-4 right-4 z-[6000] px-6 py-3 rounded-2xl shadow-2xl border text-white font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-4 ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-50' : toast.type === 'error' ? 'bg-rose-600 border-rose-50' : 'bg-blue-600 border-blue-50'}`}>{toast.message}</div>}
    </div>
  );
};

export default App;
