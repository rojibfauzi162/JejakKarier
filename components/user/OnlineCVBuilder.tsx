
import React, { useState, useMemo } from 'react';
import { AppData, OnlineCVConfig, WorkExperience, PersonalProject, Skill } from '../../types';

interface OnlineCVBuilderProps {
  data: AppData;
  onUpdateConfig: (config: OnlineCVConfig) => void;
}

const OnlineCVBuilder: React.FC<OnlineCVBuilderProps> = ({ data, onUpdateConfig }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Branding Hub</h2>
      </header>
      <div className="bg-slate-200 rounded-[3rem] p-20 text-center text-slate-400 italic">Halaman builder Digital Landing Page Anda.</div>
    </div>
  );
};

// Exporting placeholder for consistency
export const LiveThemeRenderer = ({ themeId, data, onUpdateText, isReadOnly = false }: any) => null;

export default OnlineCVBuilder;
