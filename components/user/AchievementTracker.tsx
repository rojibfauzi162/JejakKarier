
import React, { useState, useMemo, useEffect } from 'react';
import { Achievement, AchievementCategory, UserProfile, WorkExperience } from '../../types';

interface AchievementTrackerProps {
  achievements: Achievement[];
  profile: UserProfile;
  workExperiences: WorkExperience[];
  onAdd: (a: Achievement) => void;
  onUpdate: (a: Achievement) => void;
  onDelete: (id: string) => void;
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ achievements, profile, workExperiences, onAdd, onUpdate, onDelete }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Achievement Tracker</h2>
        <button className="px-6 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs">+ Log Achievement</button>
      </header>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-20 text-center text-slate-400 italic">Pencapaian profesional Anda tercatat di sini.</div>
    </div>
  );
};

export default AchievementTracker;
