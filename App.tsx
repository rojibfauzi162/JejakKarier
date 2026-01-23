
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User } from '@firebase/auth';
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, saveUserData } from './services/firebase';
import { AppData, UserProfile, DailyReport, Skill, Training, Certification, CareerPath, Achievement, Contact, MonthlyReview, WorkExperience, Education, JobApplication, PersonalProject, OnlineCVConfig } from './types';
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
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const searchParams = new URLSearchParams(window.location.search);
  const isPublicView = searchParams.get('view') === 'shared_report';
  const publicContext = searchParams.get('context') || 'all';
  const publicUserName = searchParams.get('name') || 'User';
  
  // Deteksi rute CV Online publik (misal ?u=username)
  const onlineUserSlug = searchParams.get('u');
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
          if (!cloudData.personalProjects) cloudData.personalProjects = [];
          if (!cloudData.workCategories) cloudData.workCategories = INITIAL_DATA.workCategories;
          if (!cloudData.onlineCV) cloudData.onlineCV = INITIAL_DATA.onlineCV;
          setData(cloudData);
        } else {
          saveUserData(user.uid, INITIAL_DATA);
        }
      }, (error) => {
        console.warn("Firestore access issues:", error);
        if (error.code === 'permission-denied') {
          setPermissionsBlocked(true);
          setDbError("Izin Database Ditolak.");
        } else {
          setDbError("Terjadi kesalahan sinkronisasi database.");
        }
      });
    };

    const unsubscribe = startSnapshot();
    return () => unsubscribe();
  }, [user, isPublicView, isOnlineCVView]);

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
    triggerToast("Data berhasil disimpan ke sistem!");
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
      triggerToast("Data telah dihapus.");
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
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'profile': return (
        <ProfileView 
          profile={data.profile} 
          workExperiences={data.workExperiences}
          educations={data.educations}
          onUpdateProfile={updateProfile} 
          onAddWork={(w) => addItem('workExperiences', w)}
          onUpdateWork={(w) => updateItem('workExperiences', w)}
          onDeleteWork={(id) => requestDelete('workExperiences', id, 'Pengalaman Kerja')}
          onAddEducation={(e) => addItem('educations', e)}
          onUpdateEducation={(e) => updateItem('educations', e)}
          onDeleteEducation={(id) => requestDelete('educations', id, 'Riwayat Pendidikan')}
        />
      );
      case 'daily': return (
        <DailyLogs 
          logs={data.dailyReports} 
          categories={data.workCategories}
          currentCompany={data.profile.currentCompany}
          onAdd={(log) => addItem('dailyReports', log)} 
          onUpdate={(log) => updateItem('dailyReports', log)} 
          onDelete={(id) => requestDelete('dailyReports', id, 'Log Aktivitas Harian')}
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
          skills={data.skills}
          trainings={data.trainings}
          certs={data.certifications}
          onAddSkill={(s) => addItem('skills', s)}
          onUpdateSkill={(s) => updateItem('skills', s)}
          onDeleteSkill={(id) => requestDelete('skills', id, 'Daftar Skill')}
          onAddTraining={(t) => addItem('trainings', t)}
          onUpdateTraining={(t) => updateItem('trainings', t)}
          onDeleteTraining={(id) => requestDelete('trainings', id, 'Data Pelatihan')}
          onAddCert={(c) => addItem('certifications', c)}
          onUpdateCert={(c) => updateItem('certifications', c)}
          onDeleteCert={(id) => requestDelete('certifications', id, 'Sertifikasi')}
        />
      );
      case 'loker': return (
        <JobTracker 
          applications={data.jobApplications || []}
          onAdd={(j) => addItem('jobApplications', j)}
          onUpdate={(j) => updateItem('jobApplications', j)}
          onDelete={(id) => requestDelete('jobApplications', id, 'Data Lamaran Kerja')}
        />
      );
      case 'projects': return (
        <PersonalProjectTracker 
          projects={data.personalProjects || []}
          onAdd={(p) => addItem('personalProjects', p)}
          onUpdate={(p) => updateItem('personalProjects', p)}
          onDelete={(id) => requestDelete('personalProjects', id, 'Proyek Personal')}
        />
      );
      case 'career': return (
        <CareerPlanner 
          paths={data.careerPaths}
          appData={data}
          onAddPath={(p) => addItem('careerPaths', p)}
          onUpdatePath={(p) => updateItem('careerPaths', p)}
          onDeletePath={(id) => requestDelete('careerPaths', id, 'Target Karir')}
        />
      );
      case 'achievements': return (
        <AchievementTracker 
          achievements={data.achievements}
          profile={data.profile}
          workExperiences={data.workExperiences}
          onAdd={(a) => addItem('achievements', a)}
          onUpdate={(a) => updateItem('achievements', a)}
          onDelete={(id) => requestDelete('achievements', id, 'Data Pencapaian')}
        />
      );
      case 'networking': return (
        <Networking 
          contacts={data.contacts}
          onAdd={(c) => addItem('contacts', c)}
          onUpdate={(c) => updateItem('contacts', c)}
          onDelete={(id) => requestDelete('contacts', id, 'Kontak Networking')}
        />
      );
      case 'reviews': return (
        <Reviews 
          reviews={data.monthlyReviews}
          onAdd={(r) => addItem('monthlyReviews', r)}
          onDelete={(id) => requestDelete('monthlyReviews', id, 'Review Bulanan')}
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
      default: return <Dashboard data={data} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex min-h-screen bg-slate-50 relative">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      </div>
      
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-28 lg:pb-8 overflow-x-hidden">
        <div className="w-full">
          {dbError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs flex justify-between items-center shadow-sm">
              <p>⚠️ {dbError}</p>
              <button onClick={handleRetrySync} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold">Retry Sync</button>
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      {/* Global Success Alert (Toast) */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500">
            <span className="text-xl">✅</span>
            <span className="font-black text-xs uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 lg:p-10 animate-in zoom-in duration-300 border border-slate-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">🗑️</div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hapus Data?</h3>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus <span className="text-rose-600 font-black">{showConfirm.label}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
