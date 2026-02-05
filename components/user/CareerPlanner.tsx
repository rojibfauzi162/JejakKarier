
import React, { useState } from 'react';
import { CareerPath, CareerType, AppData, CareerStatus } from '../../types';
import { analyzeSkillGap } from '../../services/geminiService';

interface CareerPlannerProps {
  paths: CareerPath[];
  appData: AppData;
  onAddPath: (path: CareerPath) => void;
  onUpdatePath: (path: CareerPath) => void;
  onDeletePath: (id: string) => void;
}

const CareerPlanner: React.FC<CareerPlannerProps> = ({ paths, appData, onAddPath, onUpdatePath, onDeletePath }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Career Path Planner</h2>
          <p className="text-slate-500 mt-2 italic font-medium">"Tentukan posisi impian dan upgrade kualifikasi Anda."</p>
        </div>
      </header>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-20 text-center text-slate-400 italic">Roadmap karir masa depan Anda disusun di sini.</div>
    </div>
  );
};

export default CareerPlanner;
