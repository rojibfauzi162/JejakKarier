
import React, { useState } from 'react';
import { AppData, AiStrategy } from '../../types';

interface RemindersProps {
  data: AppData;
  onUpdateMilestone: (milestoneId: string) => void;
}

const Reminders: React.FC<RemindersProps> = ({ data, onUpdateMilestone }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Signals</h2>
      </header>
      <div className="bg-amber-50 border border-amber-200 p-20 rounded-[2.5rem] text-center text-amber-800 italic">Pengingat cerdas berdasarkan analisis strategi karir Anda.</div>
    </div>
  );
};

export default Reminders;
