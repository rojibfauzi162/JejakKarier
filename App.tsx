
import React, { useState, useEffect } from 'react';
// Fixing modular imports for Firebase Auth functions and types
import { onAuthStateChanged, signOut, User } from "firebase/auth";
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
import PerformanceReports from './components/PerformanceReports';
import PublicReportView from './components/PublicReportView';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
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

  // Logic: Detection for Shared Public Report View
  const searchParams = new URLSearchParams(window.location.search);
  const isPublicView = searchParams.get('view') === 'shared_report';
  const publicContext = searchParams.get('context') || 'all';
  const publicUserName = searchParams.get('name') || 'User';

  // Listen to Auth State
  useEffect(() => {
    if (isPublicView) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser as User | null);
      setAuthLoading(false);
      if (!currentUser) setPermissionsBlocked(false);
    });
    return () => unsubscribe();
  }, [isPublicView]);

  // Listen to User Data in Firestore
  useEffect(() => {
    if (!user || isPublicView) {
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
          setData(cloudData);
        } else {
          saveUserData(user.uid, INITIAL_DATA);
        }
      }, (error) => {
        console.warn("Firestore access issues:", error);
        if (error.code === 'permission-denied') {
          setPermissionsBlocked(true);
          setDbError("Izin Database Ditolak. Periksa Security Rules Firebase Anda.");
        } else {
          setDbError("Terjadi kesalahan sinkronisasi database: " + error.message);
        }
      });
    };

    const unsubscribe = startSnapshot();
    return () => unsubscribe();
  }, [user, isPublicView]);

  useEffect(() => {
    if (!isPublicView) {
      localStorage.setItem('jejakkarir_data', JSON.stringify(data));
    }
  }, [data, isPublicView]);

  const syncData = (newData: AppData) => {
    setData(newData);
    if (user && !permissionsBlocked) {
      saveUserData(user.uid, newData);
    }
  };

  const handleRetrySync = () => {
    setPermissionsBlocked(false);
    setDbError(null);
    if (user) saveUserData(user.uid, data);
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
          onDeleteWork={(id) => deleteItem('workExperiences', id)}
          onAddEducation={(e) => addItem('educations', e)}
          onUpdateEducation={(e) => updateItem('educations', e)}
          onDeleteEducation={(id) => deleteItem('educations', id)}
        />
      );
      case 'daily': return (
        <DailyLogs 
          logs={data.dailyReports} 
          categories={data.workCategories}
          currentCompany={data.profile.currentCompany}
          onAdd={(log) => addItem('dailyReports', log)} 
          onUpdate={(log) => updateItem('dailyReports', log)} 
          onDelete={(id) => deleteItem('dailyReports', id)}
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

  // Render Public View if detected
  if (isPublicView) {
    return <PublicReportView data={data} contextFilter={publicContext} userName={publicUserName} />;
  }

  if (!user) return <Auth />;

  return (
    <div className="flex min-h-screen bg-slate-50">
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
    </div>
  );
};

export default App;
