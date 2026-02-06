
import React, { useState, useEffect } from 'react';
import { AppData, UserRole, SubscriptionProduct } from './types';
import { INITIAL_DATA } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DailyLogs from './components/DailyLogs';
import ProfileView from './components/ProfileView';
import CareerPlanner from './components/CareerPlanner';
import SkillTracker from './components/SkillTracker';
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
import { auth, getUserData, saveUserData, getProductsCatalog } from './services/firebase';
import { onAuthStateChanged } from '@firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // States for Landing Page logic
  const [showAuth, setShowAuth] = useState(false);
  const [publicProducts, setPublicProducts] = useState<SubscriptionProduct[]>([]);

  // Load public products for landing page
  useEffect(() => {
    getProductsCatalog().then(p => {
      if (p) setPublicProducts(p);
    });
  }, []);

  // Authenticate and load user data on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) {
          setData(userData);
        } else {
          const newData = { 
            ...INITIAL_DATA, 
            uid: user.uid, 
            profile: { 
              ...INITIAL_DATA.profile, 
              email: user.email || '', 
              name: user.displayName || 'User' 
            } 
          };
          await saveUserData(user.uid, newData);
          setData(newData);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen w-full flex items-center justify-center font-black text-slate-400 uppercase tracking-widest">Loading Gateway...</div>;
  
  // Logic: Show Landing Page first, then Auth, then App
  if (!user) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return (
      <LandingPage 
        onStart={() => setShowAuth(true)} 
        onLogin={() => setShowAuth(true)} 
        products={publicProducts} 
      />
    );
  }

  const isAdmin = data.role === UserRole.SUPERADMIN;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onNavigate={setActiveTab} />;
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
          onDeleteEducation={(id) => setData({...data, educations: data.educations.filter(id => id !== id)})} 
          appData={data} 
        />
      );
      case 'daily': return (
        <DailyLogs 
          logs={data.dailyReports} 
          categories={data.workCategories} 
          onAdd={(l) => setData({...data, dailyReports: [...data.dailyReports, l]})} 
          onUpdate={(l) => setData({...data, dailyReports: data.dailyReports.map(i => i.id === l.id ? l : i)})} 
          onDelete={(id) => setData({...data, dailyReports: data.dailyReports.filter(i => i.id !== id)})} 
          onAddCategory={(c) => setData({...data, workCategories: [...data.workCategories, c]})} 
          onDeleteCategory={(c) => setData({...data, workCategories: data.workCategories.filter(i => i !== c)})} 
          affirmation={data.affirmations[0]} 
        />
      );
      case 'skills': return (
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
          data={data} 
        />
      );
      case 'career': return <CareerPlanner paths={data.careerPaths} appData={data} onAddPath={(p) => setData({...data, careerPaths: [...data.careerPaths, p]})} onUpdatePath={(p) => setData({...data, careerPaths: data.careerPaths.map(i => i.id === p.id ? p : i)})} onDeletePath={(id) => setData({...data, careerPaths: data.careerPaths.filter(i => i.id !== id)})} />;
      case 'networking': return <Networking contacts={data.contacts} onAdd={(c) => setData({...data, contacts: [...data.contacts, c]})} onUpdate={(c) => setData({...data, contacts: data.contacts.map(i => i.id === c.id ? c : i)})} onDelete={(id) => setData({...data, contacts: data.contacts.filter(i => i.id !== id)})} />;
      case 'achievements': return <AchievementTracker achievements={data.achievements} profile={data.profile} workExperiences={data.workExperiences} onAdd={(a) => setData({...data, achievements: [...data.achievements, a]})} onUpdate={(a) => setData({...data, achievements: data.achievements.map(i => i.id === a.id ? a : i)})} onDelete={(id) => setData({...data, achievements: data.achievements.filter(i => i.id !== id)})} />;
      case 'loker': return <JobTracker applications={data.jobApplications} onAdd={(j) => setData({...data, jobApplications: [...data.jobApplications, j]})} onUpdate={(j) => setData({...data, jobApplications: data.jobApplications.map(i => i.id === j.id ? j : i)})} onDelete={(id) => setData({...data, jobApplications: data.jobApplications.filter(i => i.id !== id)})} />;
      case 'projects': return <PersonalProjectTracker projects={data.personalProjects} onAdd={(p) => setData({...data, personalProjects: [...data.personalProjects, p]})} onUpdate={(p) => setData({...data, personalProjects: data.personalProjects.map(i => i.id === p.id ? p : i)})} onDelete={(id) => setData({...data, personalProjects: data.personalProjects.filter(i => i.id !== id)})} />;
      case 'reviews': return <Reviews reviews={data.monthlyReviews} onAdd={(r) => setData({...data, monthlyReviews: [...data.monthlyReviews, r]})} onDelete={(id) => setData({...data, monthlyReviews: data.monthlyReviews.filter(i => i.id !== id)})} />;
      case 'cv_generator': return <CVGenerator data={data} />;
      case 'online_cv': return <OnlineCVBuilder data={data} onUpdateConfig={(c) => setData({...data, onlineCV: c})} />;
      case 'settings': return <AccountSettings reminderConfig={data.reminderConfig} onUpdateReminders={(c) => setData({...data, reminderConfig: c})} />;
      case 'billing': return <Billing data={data} products={publicProducts} />;
      case 'admin_dashboard': return <AdminPanel initialMode="dashboard" />;
      case 'admin_users': return <AdminPanel initialMode="users" />;
      case 'admin_admins': return <AdminPanel initialMode="admin_admins" />;
      case 'admin_transactions': return <AdminPanel initialMode="admin_transactions" />;
      case 'admin_ai': return <AdminPanel initialMode="ai" />;
      case 'admin_products': return <AdminPanel initialMode="products" />;
      case 'admin_integrations': return <AdminPanel initialMode="integrations" />;
      case 'admin_health': return <AdminPanel initialMode="health" />;
      default: return <Dashboard data={data} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => auth.signOut()} isAdmin={isAdmin} />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {renderContent()}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => auth.signOut()} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
