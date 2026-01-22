
import React, { useState, useEffect } from 'react';
// Correct modular imports for standard Firebase Auth functions and types from firebase/auth
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, saveUserData } from './services/firebase';
import { AppData, UserProfile, DailyReport, Skill, Training, Certification, CareerPath, Achievement, Contact, MonthlyReview, WorkExperience, Education, JobApplication, PersonalProject } from './types';
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
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [permissionsBlocked, setPermissionsBlocked] = useState(false);
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('jejakkarir_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  // Listen to Auth State
  useEffect(() => {
    // onAuthStateChanged is the correct modular function to listen for authentication changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) setPermissionsBlocked(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to User Data in Firestore
  useEffect(() => {
    if (!user) {
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
          // Ensure personalProjects exists (for legacy users)
          if (!cloudData.personalProjects) cloudData.personalProjects = [];
          setData(cloudData);
        } else {
          // If no data in cloud, initialize with local/initial data
          saveUserData(user.uid, INITIAL_DATA);
        }
      }, (error) => {
        console.warn("Firestore access issues:", error);
        if (error.code === 'permission-denied') {
          setPermissionsBlocked(true);
          setDbError("Izin Database Ditolak (Permission Denied). Harap pastikan Firebase Security Rules diatur untuk mengizinkan akses read/write pada /users/" + user.uid);
        } else {
          setDbError("Terjadi kesalahan sinkronisasi database: " + error.message);
        }
      });
    };

    const unsubscribe = startSnapshot();
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('jejakkarir_data', JSON.stringify(data));
  }, [data]);

  const syncData = (newData: AppData) => {
    setData(newData);
    // Hanya simpan ke cloud jika izin tidak diblokir
    if (user && !permissionsBlocked) {
      saveUserData(user.uid, newData);
    }
  };

  const handleRetrySync = () => {
    setPermissionsBlocked(false);
    setDbError(null);
    if (user) {
      saveUserData(user.uid, data);
    }
  };

  const updateProfile = (profile: UserProfile) => {
    syncData({ ...data, profile });
  };
  
  const addItem = <T,>(key: keyof AppData, item: T) => {
    const newData = {
      ...data,
      [key]: [...((data[key] || []) as T[]), item]
    };
    syncData(newData);
  };

  const deleteItem = (key: keyof AppData, id: string) => {
    const newData = {
      ...data,
      [key]: ((data[key] || []) as any[]).filter(item => item.id !== id)
    };
    syncData(newData);
  };

  const updateItem = <T extends { id: string }>(key: keyof AppData, updatedItem: T) => {
    const newData = {
      ...data,
      [key]: ((data[key] || []) as T[]).map(item => item.id === updatedItem.id ? updatedItem : item)
    };
    syncData(newData);
  };

  const handleLogout = async () => {
    // signOut is the modular function to handle sign out
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
          onDeleteWork={(id) => deleteItem('workExperiences', id)}
          onAddEducation={(e) => addItem('educations', e)}
          onUpdateEducation={(e) => updateItem('educations', e)}
          onDeleteEducation={(id) => deleteItem('educations', id)}
        />
      );
      case 'daily': return (
        <DailyLogs 
          logs={data.dailyReports} 
          onAdd={(log) => addItem('dailyReports', log)} 
          onDelete={(id) => deleteItem('dailyReports', id)}
          affirmation={data.affirmations[Math.floor(Math.random() * data.affirmations.length)]}
        />
      );
      case 'skills': return (
        <SkillTracker 
          skills={data.skills}
          trainings={data.trainings}
          certs={data.certifications}
          onAddSkill={(s) => addItem('skills', s)}
          onUpdateSkill={(s) => updateItem('skills', s)}
          onDeleteSkill={(id) => deleteItem('skills', id)}
          onAddTraining={(t) => addItem('trainings', t)}
          onUpdateTraining={(t) => updateItem('trainings', t)}
          onDeleteTraining={(id) => deleteItem('trainings', id)}
          onAddCert={(c) => addItem('certifications', c)}
          onUpdateCert={(c) => updateItem('certifications', c)}
          onDeleteCert={(id) => deleteItem('certifications', id)}
        />
      );
      case 'loker': return (
        <JobTracker 
          applications={data.jobApplications || []}
          onAdd={(j) => addItem('jobApplications', j)}
          onUpdate={(j) => updateItem('jobApplications', j)}
          onDelete={(id) => deleteItem('jobApplications', id)}
        />
      );
      case 'projects': return (
        <PersonalProjectTracker 
          projects={data.personalProjects || []}
          onAdd={(p) => addItem('personalProjects', p)}
          onUpdate={(p) => updateItem('personalProjects', p)}
          onDelete={(id) => deleteItem('personalProjects', id)}
        />
      );
      case 'career': return (
        <CareerPlanner 
          paths={data.careerPaths}
          appData={data}
          onAddPath={(p) => addItem('careerPaths', p)}
          onUpdatePath={(p) => updateItem('careerPaths', p)}
          onDeletePath={(id) => deleteItem('careerPaths', id)}
        />
      );
      case 'career': return (
        <CareerPlanner 
          paths={data.careerPaths}
          appData={data}
          onAddPath={(p) => addItem('careerPaths', p)}
          onUpdatePath={(p) => updateItem('careerPaths', p)}
          onDeletePath={(id) => deleteItem('careerPaths', id)}
        />
      );
      case 'achievements': return (
        <AchievementTracker 
          achievements={data.achievements}
          profile={data.profile}
          workExperiences={data.workExperiences}
          onAdd={(a) => addItem('achievements', a)}
          onUpdate={(a) => updateItem('achievements', a)}
          onDelete={(id) => deleteItem('achievements', id)}
        />
      );
      case 'networking': return (
        <Networking 
          contacts={data.contacts}
          onAdd={(c) => addItem('contacts', c)}
          onUpdate={(c) => updateItem('contacts', c)}
          onDelete={(id) => deleteItem('contacts', id)}
        />
      );
      case 'reviews': return (
        <Reviews 
          reviews={data.monthlyReviews}
          onAdd={(r) => addItem('monthlyReviews', r)}
          onDelete={(id) => deleteItem('monthlyReviews', id)}
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

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      </div>
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Error Alert */}
          {dbError && (
            <div className="mb-6 p-6 bg-rose-50 border border-rose-200 text-rose-600 rounded-[2rem] text-xs font-bold animate-in slide-in-from-top-2 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm font-black uppercase tracking-tight">Koneksi Database Bermasalah</span>
                  </div>
                  <p className="font-medium opacity-80 leading-relaxed mb-4">
                    {dbError}
                  </p>
                  <div className="bg-white/50 p-3 rounded-xl border border-rose-100 mb-4">
                    <p className="text-[10px] uppercase text-rose-400 mb-1">Solusi: Update Firebase Rules Anda</p>
                    <code className="font-mono text-[10px] text-slate-800 break-all">
                      allow read, write: if request.auth != null && request.auth.uid == userId;
                    </code>
                  </div>
                </div>
                <button 
                  onClick={handleRetrySync}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-all whitespace-nowrap"
                >
                  🔄 Sinkronkan Sekarang
                </button>
              </div>
              <p className="text-[9px] text-rose-400 mt-2 italic font-medium">Aplikasi tetap berjalan dalam Mode Lokal. Data Anda aman di browser ini.</p>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
