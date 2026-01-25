
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User } from '@firebase/auth';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, saveUserData } from './services/firebase';
import { AppData, UserProfile, DailyReport, Skill, Training, Certification, CareerPath, Achievement, Contact, MonthlyReview, WorkExperience, Education, JobApplication, PersonalProject, OnlineCVConfig, UserRole, SubscriptionPlan, AccountStatus, AiStrategy } from './types';
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
import CVGenerator from './components/CVGenerator';
import OnlineCVBuilder from './components/OnlineCVBuilder';
import OnlineCVView from './components/OnlineCVView';
import AccountSettings from './components/AccountSettings';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [permissionsBlocked, setPermissionsBlocked] = useState(false);
  
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
      aiUsage: { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 }
    };
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const searchParams = new URLSearchParams(window.location.search);
  const isPublicView = searchParams.get('view') === 'shared_report';
  const publicContext = searchParams.get('context') || 'all';
  const publicUserName = searchParams.get('name') || 'User';
  
  // Deteksi rute CV Online publik (Mendukung ?u= atau /profile/username)
  const pathParts = window.location.pathname.split('/');
  const onlineUserSlug = searchParams.get('u') || (pathParts[1] === 'profile' ? pathParts[2] : null);
  const isOnlineCVView = !!onlineUserSlug;

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
          const isHardcodedAdmin = user.email === 'admin@jejakkarir.com';
          let needsUpdateToDB = false;

          if (!cloudData.personalProjects) cloudData.personalProjects = [];
          if (!cloudData.workCategories) cloudData.workCategories = INITIAL_DATA.workCategories;
          if (!cloudData.onlineCV) cloudData.onlineCV = INITIAL_DATA.onlineCV;
          
          // PASTIKAN ROLE DISINKRONKAN KE DATABASE JIKA BERUBAH ATAU KOSONG
          if (isHardcodedAdmin && cloudData.role !== UserRole.SUPERADMIN) {
            cloudData.role = UserRole.SUPERADMIN;
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
          if (cloudData.role === UserRole.SUPERADMIN && activeTab === 'dashboard') {
            setActiveTab('admin_dashboard');
          }

          setData(cloudData);
        } else {
          const newData = {
            ...INITIAL_DATA,
            uid: user.uid,
            role: user.email === 'admin@jejakkarir.com' ? UserRole.SUPERADMIN : UserRole.USER,
            plan: SubscriptionPlan.FREE,
            status: AccountStatus.ACTIVE,
            joinedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            aiUsage: { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 }
          };
          saveUserData(user.uid, newData as AppData);
        }
      }, (error) => {
        console.warn("Firestore access issues:", error);
        if (error.code === 'permission-denied') {
          setPermissionsBlocked(true);
          setDbError("Secure Database Access Denied.");
        } else {
          setDbError("System synchronization latency detected.");
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
    triggerToast("Central Record Updated Successfully.");
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
    const currentArray = data[key];
    if (Array.isArray(currentArray)) {
      const newData = {
        ...data,
        [key]: [...currentArray, item]
      };
      syncData(newData as AppData);
    }
  };

  const deleteItem = (key: keyof AppData, id: string) => {
    const currentArray = data[key];
    if (Array.isArray(currentArray)) {
      const newData = {
        ...data,
        [key]: currentArray.filter((item: any) => item.id !== id)
      };
      syncData(newData as AppData);
      triggerToast("Entry permanently purged.");
    }
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
    const currentArray = data[key];
    if (Array.isArray(currentArray)) {
      const newData = {
        ...data,
        [key]: currentArray.map((item: any) => item.id === updatedItem.id ? updatedItem : item)
      };
      syncData(newData as AppData);
    }
  };

  const handleAddCategory = (cat: string) => {
    if (!data.workCategories.includes(cat)) {
      syncData({ ...data, workCategories: [...data.workCategories, cat] });
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (data.workCategories.length > 1) {
      syncData({ ...data, workCategories: data.workCategories.filter(c => c !== cat) });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    // PROTEKSI: Akun banned atau isDeleted tidak bisa akses fitur utama
    if ((data.status === AccountStatus.BANNED || data.isDeleted) && !['settings', 'admin_dashboard', 'admin_users', 'admin_products', 'admin_health', 'admin_ai'].includes(activeTab)) {
      return (
        <div className="h-full flex items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
           <div className="max-w-xl w-full bg-white p-16 rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] text-center border border-rose-100">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">{data.isDeleted ? 'Vault Decommissioned' : 'Access Restricted'}</h2>
              <p className="text-slate-400 leading-relaxed font-bold mb-12 text-sm uppercase tracking-widest">
                {data.isDeleted 
                  ? 'Your account is scheduled for permanent purge. Contact administration if this is an error.' 
                  : 'Your credentials have been flagged by the system administrator due to policy compliance issues.'}
              </p>
              <button onClick={() => setActiveTab('settings')} className="w-full py-5 bg-slate-950 text-white font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.02] transition-all">Go to Security Settings</button>
           </div>
        </div>
      );
    }

    // MENCEGAH FLASH: Langsung tampilkan Admin Panel jika user terdeteksi sebagai admin meskipun tab masih 'dashboard'
    if (activeTab === 'dashboard' && (data.role === UserRole.SUPERADMIN || (user && user.email === 'admin@jejakkarir.com'))) {
      return <AdminPanel initialMode="dashboard" />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'profile': return (
        <ProfileView 
          // Fix: use data.profile instead of undefined profile variable
          profile={data.profile} 
          workExperiences={data.workExperiences}
          educations={data.educations}
          onUpdateProfile={updateProfile} 
          onAddWork={(w) => addItem('workExperiences', w)}
          onUpdateWork={(w) => updateItem('workExperiences', w)}
          onDeleteWork={(id) => requestDelete('workExperiences', id, 'Experience Record')}
          onAddEducation={(e) => addItem('educations', e)}
          onUpdateEducation={(e) => updateItem('educations', e)}
          onDeleteEducation={(id) => requestDelete('educations', id, 'Education Record')}
        />
      );
      case 'daily': return (
        <DailyLogs 
          logs={data.dailyReports} 
          categories={data.workCategories}
          currentCompany={data.profile.currentCompany}
          onAdd={(log) => addItem('dailyReports', log)} 
          onUpdate={(log) => updateItem('dailyReports', log)} 
          onDelete={(id) => requestDelete('dailyReports', id, 'Daily Activity Log')}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          affirmation={data.affirmations[Math.floor(Math.random() * data.affirmations.length)]}
        />
      );
      case 'reports': return (
        <PerformanceReports data={data} />
      );
      case 'skills': return (
        <SkillTracker 
          data={data}
          skills={data.skills}
          trainings={data.trainings}
          certs={data.certifications}
          onAddSkill={(s) => addItem('skills', s)}
          onUpdateSkill={(s) => updateItem('skills', s)}
          onDeleteSkill={(id) => requestDelete('skills', id, 'Core Skill Entry')}
          onAddTraining={(t) => addItem('trainings', t)}
          onUpdateTraining={(t) => updateItem('trainings', t)}
          onDeleteTraining={(id) => requestDelete('trainings', id, 'Training Log')}
          onAddCert={(c) => addItem('certifications', c)}
          onUpdateCert={(c) => updateItem('certifications', c)}
          onDeleteCert={(id) => requestDelete('certifications', id, 'Credential Record')}
          onSaveStrategy={(strategy) => syncData({ ...data, aiStrategies: [strategy, ...(data.aiStrategies || [])] })}
        />
      );
      case 'loker': return (
        <JobTracker 
          applications={data.jobApplications || []}
          onAdd={(j) => addItem('jobApplications', j)}
          onUpdate={(j) => updateItem('jobApplications', j)}
          onDelete={(id) => requestDelete('jobApplications', id, 'Application Registry')}
        />
      );
      case 'projects': return (
        <PersonalProjectTracker 
          projects={data.personalProjects || []}
          onAdd={(p) => addItem('personalProjects', p)}
          onUpdate={(p) => updateItem('personalProjects', p)}
          onDelete={(id) => requestDelete('personalProjects', id, 'Venture Milestone')}
        />
      );
      case 'career': return (
        <CareerPlanner 
          paths={data.careerPaths}
          appData={data}
          onAddPath={(p) => addItem('careerPaths', p)}
          onUpdatePath={(p) => updateItem('careerPaths', p)}
          onDeletePath={(id) => requestDelete('careerPaths', id, 'Career Objective')}
        />
      );
      case 'achievements': return (
        <AchievementTracker 
          achievements={data.achievements}
          profile={data.profile}
          workExperiences={data.workExperiences}
          onAdd={(a) => addItem('achievements', a)}
          onUpdate={(a) => updateItem('achievements', a)}
          onDelete={(id) => requestDelete('achievements', id, 'Hall of Fame Entry')}
        />
      );
      case 'networking': return (
        <Networking 
          contacts={data.contacts}
          onAdd={(c) => addItem('contacts', c)}
          onUpdate={(c) => updateItem('contacts', c)}
          onDelete={(id) => requestDelete('contacts', id, 'Networking Node')}
        />
      );
      case 'reviews': return (
        <Reviews 
          reviews={data.monthlyReviews}
          onAdd={(r) => addItem('monthlyReviews', r)}
          onDelete={(id) => requestDelete('monthlyReviews', id, 'Periodic Review')}
        />
      );
      case 'cv_generator': return (
        <CVGenerator data={data} />
      );
      case 'online_cv': return (
        <OnlineCVBuilder 
          data={data} 
          onUpdateConfig={(config) => syncData({ ...data, onlineCV: config })} 
        />
      );
      case 'settings': return (
        <AccountSettings />
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
      default: return <Dashboard data={data} />;
    }
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

  if (!user) return <Auth />;

  return (
    <div className="flex min-h-screen bg-slate-50 relative font-sans text-slate-900">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={data.role === UserRole.SUPERADMIN} />
      </div>
      
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={data.role === UserRole.SUPERADMIN} />

      <main className="flex-1 lg:ml-64 p-6 lg:p-12 pb-32 lg:pb-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {dbError && (
            <div className="mb-10 p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-[2rem] text-xs flex justify-between items-center shadow-xl animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-4">
                 <span className="text-xl">⚠️</span>
                 <p className="font-bold uppercase tracking-widest">{dbError}</p>
              </div>
              <button onClick={handleRetrySync} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95">Re-establish Protocol</button>
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      {/* Global Success Alert (Toast) */}
      {toast && (
        <div className="fixed bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 z-[3000] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/10 backdrop-blur-xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Purge Registry?</h3>
              <p className="text-slate-400 text-sm mt-5 leading-relaxed font-bold uppercase tracking-widest opacity-80">
                Confirming the deletion of <span className="text-rose-600 font-black">"{showConfirm.label}"</span>. This operation is irreversible.
              </p>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-5 bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-3xl hover:bg-slate-100 transition-all"
              >
                Abort
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-[1.5] py-5 bg-rose-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-3xl shadow-[0_15px_30px_rgba(225,29,72,0.3)] hover:bg-rose-700 transition-all active:scale-95"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
