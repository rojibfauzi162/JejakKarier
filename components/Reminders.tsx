
import React, { useState } from 'react';
import { AppData, AiStrategy } from '../types';

interface RemindersProps {
  data: AppData;
  onUpdateMilestone: (milestoneId: string) => void;
}

const Reminders: React.FC<RemindersProps> = ({ data, onUpdateMilestone }) => {
  const latestStrategy: AiStrategy | undefined = data.aiStrategies && data.aiStrategies.length > 0 
    ? data.aiStrategies[0] 
    : undefined;

  const config = data.reminderConfig;
  const completedMilestones = data.completedAiMilestones || [];

  const [confirmingItem, setConfirmingItem] = useState<{ id: string, label: string } | null>(null);

  const handleToggleMilestone = (id: string, label: string) => {
    if (completedMilestones.includes(id)) return; // Already done
    setConfirmingItem({ id, label });
  };

  const executeMilestoneCompletion = () => {
    if (confirmingItem) {
      onUpdateMilestone(confirmingItem.id);
      setConfirmingItem(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Intelligence Reminders</h2>
        <p className="text-slate-500 font-medium italic">"Proactive signals to keep your career trajectory on track."</p>
      </header>

      {confirmingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-10 lg:p-12 border border-slate-100 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                 <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">Konfirmasi Tuntas</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10">
                    Apakah Anda yakin sudah menyelesaikan tugas: <br/>
                    <span className="text-indigo-600 mt-2 block font-black">"{confirmingItem.label}"</span>
                    <br/>
                    Tugas yang sudah selesai akan diabaikan pada generasi AI Strategist berikutnya.
                 </p>
                 <div className="flex gap-4">
                    <button onClick={() => setConfirmingItem(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-100">Batal</button>
                    <button onClick={executeMilestoneCompletion} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700">Ya, Tuntas!</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {!latestStrategy && (
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] text-center">
           <p className="text-amber-800 font-bold">Belum ada strategi AI yang terdeteksi.</p>
           <p className="text-amber-600 text-xs mt-2 uppercase tracking-widest font-black">Lakukan analisis di tab 'Skill & Learning > AI Strategist' untuk mengaktifkan pengingat.</p>
        </div>
      )}

      {latestStrategy && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* DAILY MOTIVATION SECTION */}
          {config.dailyMotivation && (
            <div className="lg:col-span-12">
               <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 lg:p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                       <span className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">✨</span>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Daily Pulse Motivation</p>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-black italic max-w-4xl leading-tight">
                       "{latestStrategy.motivation}"
                    </h3>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/50">Generated for {data.profile.name} • Updated Daily</p>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
               </div>
            </div>
          )}

          {/* WEEKLY PROGRESS SECTION */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Weekly Action Registry</h3>
               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${config.weeklyProgress ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                 {config.weeklyProgress ? 'Protocol: Active' : 'Protocol: Inactive'}
               </span>
            </div>

            {config.weeklyProgress ? (
              <div className="grid grid-cols-1 gap-4">
                <ReminderCard 
                  title="Weekly Micro Action" 
                  desc={latestStrategy.immediateActions.weekly} 
                  icon="🗓️" 
                  color="indigo" 
                  due="This Week"
                  isDone={completedMilestones.includes(`action:${latestStrategy.immediateActions.weekly}`)}
                  onToggle={() => handleToggleMilestone(`action:${latestStrategy.immediateActions.weekly}`, latestStrategy.immediateActions.weekly)}
                />
                <ReminderCard 
                  title="Monthly Strategic Step" 
                  desc={latestStrategy.immediateActions.monthly} 
                  icon="🚀" 
                  color="blue" 
                  due="Target: End of Month"
                  isDone={completedMilestones.includes(`action:${latestStrategy.immediateActions.monthly}`)}
                  onToggle={() => handleToggleMilestone(`action:${latestStrategy.immediateActions.monthly}`, latestStrategy.immediateActions.monthly)}
                />
                {latestStrategy.criticalGaps.map((gap, i) => (
                  <ReminderCard 
                    key={i}
                    title={`Gap Skill: ${gap.skill}`} 
                    desc={gap.why} 
                    icon="⚠️" 
                    color="rose" 
                    due={gap.priority}
                    isDone={completedMilestones.includes(`gap:${gap.skill}`)}
                    onToggle={() => handleToggleMilestone(`gap:${gap.skill}`, gap.skill)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Weekly Reminders are Disabled</p>
              </div>
            )}
          </div>

          {/* MONTHLY EVALUATION SECTION */}
          <div className="lg:col-span-4 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Evaluation</h3>
             </div>
             
             <div className={`p-8 rounded-[3rem] border-2 transition-all ${config.monthlyEvaluation ? 'bg-white border-slate-100 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">📅</div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Monthly Evaluation</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-bold mb-8">Saatnya meninjau kembali "AI Strategy v{latestStrategy.version}" Anda. Apakah ada kemajuan?</p>
                <button 
                  disabled={!config.monthlyEvaluation}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-slate-200"
                >
                  Run Re-Evaluation Now
                </button>
             </div>

             <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Strategic Summary</p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                  "{latestStrategy.executiveSummary.substring(0, 150)}..."
                </p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

const ReminderCard: React.FC<{ 
  title: string; 
  desc: string; 
  icon: string; 
  color: 'indigo' | 'blue' | 'rose'; 
  due: string;
  isDone?: boolean;
  onToggle?: () => void;
}> = ({ title, desc, icon, color, due, isDone, onToggle }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border flex items-start gap-6 group hover:shadow-lg transition-all ${colors[color]} ${isDone ? 'opacity-40 grayscale' : ''}`}>
      <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
           <h4 className={`font-black text-sm uppercase tracking-tight ${isDone ? 'line-through' : ''}`}>{title}</h4>
           <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">{due}</span>
              <button 
                onClick={onToggle}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-transparent hover:border-emerald-400'}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
           </div>
        </div>
        <p className={`text-xs font-bold leading-relaxed text-slate-700 italic transition-colors ${isDone ? 'line-through' : 'group-hover:text-slate-900'}`}>"{desc}"</p>
      </div>
    </div>
  );
};

export default Reminders;
