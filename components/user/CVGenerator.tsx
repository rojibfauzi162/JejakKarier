
import React, { useState, useMemo } from 'react';
import { AppData, WorkExperience, Education, Skill, Training, Certification, Achievement } from '../../types';

interface CVGeneratorProps {
  data: AppData;
}

const CVGenerator: React.FC<CVGeneratorProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">CV Intelligence Builder</h2>
      </header>
      <div className="bg-white p-20 rounded-3xl border border-slate-100 shadow-sm text-center text-slate-400 italic">Generator CV otomatis berbasis data performa.</div>
    </div>
  );
};

export default CVGenerator;
