
import React, { useState, useEffect } from 'react';
import { AppData, Skill, Training, Certification, AiStrategy, ToDoTask, CareerEvent } from '../../types';

// Import sub-components from organized folder structure
import SkillMatrix from './skill-learning/SkillMatrix';
import TrainingHistory from './skill-learning/TrainingHistory';
import CertificationModule from './skill-learning/Certification';
import AiStrategist from './skill-learning/AiStrategist';
import SkillGapRadar from './skill-learning/SkillGapRadar';

interface SkillTrackerProps {
  data?: AppData;
  skills: Skill[];
  trainings: Training[];
  certs: Certification[];
  onAddSkill: (s: Skill) => void;
  onUpdateSkill: (s: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onAddTraining: (t: Training) => void;
  onUpdateTraining: (t: Training) => void;
  onDeleteTraining: (id: string) => void;
  onAddCert: (c: Certification) => void;
  onUpdateCert: (c: Certification) => void;
  onDeleteCert: (id: string) => void;
  onAddTodo?: (t: ToDoTask) => void;
  onSaveStrategy?: (strategy: AiStrategy) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
  initialSubTab?: 'skills' | 'learning' | 'certs' | 'ai' | 'mapping' | 'radar';
  onUpgrade?: () => void;
  onAddCalendarEvent?: (e: CareerEvent) => void;
}

const SkillTracker: React.FC<SkillTrackerProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'learning' | 'certs' | 'ai' | 'mapping'>(props.initialSubTab === 'radar' ? 'mapping' : (props.initialSubTab as any) || 'skills');

  // Sync sub-tab if initialSubTab prop changes (navigated from apps hub)
  useEffect(() => {
    if (props.initialSubTab) {
      setActiveSubTab(props.initialSubTab === 'radar' ? 'mapping' : (props.initialSubTab as any));
    }
  }, [props.initialSubTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth & Intelligence</h2>
          <div className="relative mt-5">
            <div className="grid grid-cols-2 lg:flex gap-3 overflow-hidden lg:overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar lg:mx-0 lg:px-0">
              <SubTabButton active={activeSubTab === 'skills'} onClick={() => setActiveSubTab('skills')} label="Skill Matrix" icon="🎯" />
              <SubTabButton active={activeSubTab === 'learning'} onClick={() => setActiveSubTab('learning')} label="Training History" icon="📖" />
              <SubTabButton active={activeSubTab === 'certs'} onClick={() => setActiveSubTab('certs')} label="Certification" icon="📜" />
              <SubTabButton active={activeSubTab === 'ai'} onClick={() => setActiveSubTab('ai')} label="AI Strategist" icon="🧠" />
              <SubTabButton active={activeSubTab === 'mapping'} onClick={() => setActiveSubTab('mapping')} label="Skill Mapping" icon="📡" />
            </div>
          </div>
        </div>
      </header>

      {/* Render selected sub-module */}
      <div className="animate-in fade-in duration-500">
        {activeSubTab === 'skills' && (
          <SkillMatrix 
            skills={props.skills} 
            trainings={props.trainings}
            certifications={props.certs}
            onAddSkill={props.onAddSkill} 
            onUpdateSkill={props.onUpdateSkill} 
            onDeleteSkill={props.onDeleteSkill} 
            showToast={props.showToast}
            onUpgrade={props.onUpgrade}
            appData={props.data}
          />
        )}
        {activeSubTab === 'learning' && (
          <TrainingHistory 
            trainings={props.trainings} 
            onAddTraining={props.onAddTraining} 
            onUpdateTraining={props.onUpdateTraining} 
            onDeleteTraining={props.onDeleteTraining} 
            showToast={props.showToast}
            onAddCalendarEvent={props.onAddCalendarEvent}
          />
        )}
        {activeSubTab === 'certs' && (
          <CertificationModule 
            certs={props.certs} 
            skills={props.skills}
            onAddCert={props.onAddCert} 
            onUpdateCert={props.onUpdateCert} 
            onDeleteCert={props.onDeleteCert} 
            showToast={props.showToast}
            onAddCalendarEvent={props.onAddCalendarEvent}
          />
        )}
        {activeSubTab === 'ai' && props.data && (
          <AiStrategist 
            data={props.data}
            onSaveStrategy={props.onSaveStrategy}
            onAddTodo={props.onAddTodo}
            onAddTraining={props.onAddTraining}
            onAddCert={props.onAddCert}
            showToast={props.showToast}
          />
        )}
        {activeSubTab === 'mapping' && props.data && (
          <SkillGapRadar 
            data={props.data} 
            onSwitchTab={(tab) => setActiveSubTab(tab as any)} 
            onAddSkill={props.onAddSkill}
          />
        )}
      </div>
    </div>
  );
};

const SubTabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${ active ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white bg-slate-50/50 border-slate-100' }`}>
    <span className="text-base">{icon}</span>
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

export default SkillTracker;
