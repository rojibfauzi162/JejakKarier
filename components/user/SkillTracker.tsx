
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Skill, Training, Certification, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AiStrategy, AiRecommendation, ToDoTask } from '../../types';
import { analyzeSkillGap } from '../../services/geminiService';
import { auth } from '../../services/firebase';

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
}

const SkillTracker: React.FC<SkillTrackerProps> = ({ 
  data, skills, trainings, certs, 
  onAddSkill, onUpdateSkill, onDeleteSkill,
  onAddTraining, onUpdateTraining, onDeleteTraining,
  onAddCert, onUpdateCert, onDeleteCert,
  onAddTodo,
  onSaveStrategy
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'learning' | 'certs' | 'ai'>('skills');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const getStatusStyle = (status: SkillStatus) => {
    switch(status) {
      case SkillStatus.ACHIEVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case SkillStatus.ON_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-100';
      case SkillStatus.GAP: return 'bg-slate-50 text-slate-400 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth & Intelligence</h2>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
           {['skills', 'learning', 'certs', 'ai'].map(tab => (
             <button key={tab} onClick={() => setActiveSubTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
           ))}
        </div>
      </header>
      
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Skill list would go here */}
        <div className="p-20 text-center text-slate-400 italic">Matriks kompetensi Anda ditampilkan di sini.</div>
      </div>
    </div>
  );
};

export default SkillTracker;
