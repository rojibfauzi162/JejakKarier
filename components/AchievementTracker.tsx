
import React from 'react';
import { Achievement, AchievementCategory } from '../types';

interface AchievementTrackerProps {
  achievements: Achievement[];
  onAdd: (a: Achievement) => void;
  onDelete: (id: string) => void;
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ achievements, onAdd, onDelete }) => {
  const addAch = () => {
    onAdd({
      id: Math.random().toString(),
      title: "New Achievement",
      date: new Date().toISOString().split('T')[0],
      category: AchievementCategory.CAREER,
      impact: "Description of the impact"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Achievement Tracker</h2>
          <p className="text-slate-500">Celebrate your professional and personal milestones.</p>
        </div>
        <button onClick={addAch} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl shadow-lg">
          + Log Achievement
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map(ach => (
          <div key={ach.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-start gap-6 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
              ach.category === AchievementCategory.CAREER ? 'bg-blue-50 text-blue-600' :
              ach.category === AchievementCategory.FINANCIAL ? 'bg-green-50 text-green-600' : 'bg-pink-50 text-pink-600'
            }`}>
              🏆
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-bold text-slate-800 text-lg">{ach.title}</h4>
                <button onClick={() => onDelete(ach.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">✕</button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">{ach.category} • {ach.date}</p>
              <p className="text-sm text-slate-600 italic">"{ach.impact}"</p>
            </div>
          </div>
        ))}
        {achievements.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 italic">No achievements logged. Time to win big!</div>}
      </div>
    </div>
  );
};

export default AchievementTracker;
