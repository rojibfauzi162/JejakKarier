
import React, { useState, useEffect } from 'react';
import { PersonalProject, ProjectStatus } from '../../types';

interface PersonalProjectTrackerProps {
  projects: PersonalProject[];
  onAdd: (p: PersonalProject) => void;
  onUpdate: (p: PersonalProject) => void;
  onDelete: (id: string) => void;
}

const PersonalProjectTracker: React.FC<PersonalProjectTrackerProps> = ({ projects, onAdd, onUpdate, onDelete }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">Project Tracker</h2>
        <button className="px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">+ Proyek Baru</button>
      </header>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-20 text-center text-slate-400 italic">Manajemen proyek personal dan portfolio Anda.</div>
    </div>
  );
};

export default PersonalProjectTracker;
