
import React from 'react';

interface AppsHubProps {
  onNavigate: (tab: string, subTab?: string) => void;
}

const AppsHub: React.FC<AppsHubProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: "Harian & Performa",
      items: [
        { id: 'daily', label: 'Daily Work', icon: 'bi-pencil-square', color: 'bg-blue-50 text-blue-600' },
        { id: 'calendar', label: 'Calendar', icon: 'bi-calendar3', color: 'bg-indigo-50 text-indigo-600' }, // NEW ITEM
        { id: 'work_reflection', label: 'Refleksi Kerja', icon: 'bi-chat-quote', color: 'bg-rose-50 text-rose-600' },
        { id: 'reports', label: 'Laporan pekerjaan', icon: 'bi-graph-up', color: 'bg-blue-50 text-blue-600' },
        { id: 'todo_list', label: 'Langkah Pengembangan', icon: 'bi-check2-square', color: 'bg-indigo-50 text-indigo-600' },
        { id: 'mobile_stats', label: 'Data Statistik', icon: 'bi-bar-chart-line', color: 'bg-emerald-50 text-emerald-600' },
        { id: 'ai_insights', label: 'AI Insights', icon: 'bi-cpu', color: 'bg-purple-50 text-purple-600' },
        { id: 'reviews', label: 'Monthly Review', icon: 'bi-calendar-check', color: 'bg-amber-50 text-amber-600' },
      ]
    },
    {
      title: "Kompetensi & Belajar",
      items: [
        { id: 'skills', sub: 'skills', label: 'Skill Matrix', icon: 'bi-grid-3x3', color: 'bg-amber-50 text-amber-600' },
        { id: 'skills', sub: 'learning', label: 'Training History', icon: 'bi-journal-bookmark', color: 'bg-blue-50 text-blue-600' },
        { id: 'skills', sub: 'certs', label: 'Certification', icon: 'bi-patch-check', color: 'bg-emerald-50 text-emerald-600' },
        { id: 'skills', sub: 'ai', label: 'AI Strategist', icon: 'bi-magic', color: 'bg-indigo-50 text-indigo-600' },
        { id: 'skills', sub: 'mapping', label: 'Skill Mapping', icon: 'bi-radar', color: 'bg-rose-50 text-rose-600' },
      ]
    },
    {
      title: "Karir & Portfolio",
      items: [
        { id: 'career', label: 'Career Path', icon: 'bi-rocket-takeoff', color: 'bg-rose-50 text-rose-600' },
        { id: 'achievements', label: 'Achievements', icon: 'bi-trophy', color: 'bg-amber-50 text-amber-600' },
        { id: 'cv_generator', label: 'PDF Export', icon: 'bi-file-earmark-pdf', color: 'bg-slate-100 text-slate-700' },
        { id: 'online_cv', label: 'Digital Page', icon: 'bi-globe', color: 'bg-blue-50 text-blue-500' },
        { id: 'loker', label: 'Loker Tracker', icon: 'bi-briefcase', color: 'bg-teal-50 text-teal-600' },
        { id: 'projects', label: 'Personal Project', icon: 'bi-tools', color: 'bg-orange-50 text-orange-600' },
        { id: 'networking', label: 'Networking', icon: 'bi-people', color: 'bg-indigo-50 text-indigo-600' },
      ]
    },
    {
      title: "Akun & Sistem",
      items: [
        { id: 'billing', label: 'Billing & Plan', icon: 'bi-credit-card', color: 'bg-slate-100 text-slate-900' },
        { id: 'settings', label: 'Pengaturan', icon: 'bi-gear', color: 'bg-slate-100 text-slate-600' },
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <header className="px-1">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Main Hub</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Akses seluruh fitur dalam satu layar.</p>
      </header>

      {categories.map((cat, idx) => (
        <div key={idx} className="space-y-6">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">{cat.title}</h3>
          <div className="grid grid-cols-4 gap-y-8 gap-x-4">
            {cat.items.map((item, i) => (
              <button 
                key={i} 
                onClick={() => onNavigate(item.id, (item as any).sub)}
                className="flex flex-col items-center gap-3 active:scale-90 transition-all group"
              >
                <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-2xl shadow-sm border border-black/5 transition-all group-hover:shadow-lg ${item.color}`}>
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppsHub;
