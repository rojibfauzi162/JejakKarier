
import React, { useState, useEffect } from 'react';
import { AppData, UserProfile, DailyReport, Skill, Training, Certification, CareerPath, Achievement, Contact, MonthlyReview, WorkExperience, Education } from './types';
import { INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import ProfileView from './components/ProfileView';
import DailyLogs from './components/DailyLogs';
import SkillTracker from './components/SkillTracker';
import CareerPlanner from './components/CareerPlanner';
import AchievementTracker from './components/AchievementTracker';
import Networking from './components/Networking';
import Reviews from './components/Reviews';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('pathpulse_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    localStorage.setItem('pathpulse_data', JSON.stringify(data));
  }, [data]);

  const updateProfile = (profile: UserProfile) => setData(prev => ({ ...prev, profile }));
  
  const addItem = <T,>(key: keyof AppData, item: T) => {
    setData(prev => ({
      ...prev,
      [key]: [...(prev[key] as T[]), item]
    }));
  };

  const deleteItem = (key: keyof AppData, id: string) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).filter(item => item.id !== id)
    }));
  };

  const updateItem = <T extends { id: string }>(key: keyof AppData, updatedItem: T) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] as T[]).map(item => item.id === updatedItem.id ? updatedItem : item)
    }));
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
          onAdd={(a) => addItem('achievements', a)}
          onDelete={(id) => deleteItem('achievements', id)}
        />
      );
      case 'networking': return (
        <Networking 
          contacts={data.contacts}
          onAdd={(c) => addItem('contacts', c)}
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
