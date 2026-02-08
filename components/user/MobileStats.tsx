import React from 'react';
import { AppData, SkillStatus } from '../../types';

interface MobileStatsProps {
  data: AppData;
}

const MobileStats: React.FC<MobileStatsProps> = ({ data }) => {
  const skillCount = data.skills.length;
  const achievedSkills = data.skills.filter(s => s.status === SkillStatus.ACHIEVED).length;
  const progressPercent = skillCount > 0 ? Math.round((achievedSkills / skillCount) * 100) : 0;
  
  const lastReport = data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1] : null;

  const stats = [
    {
      title: "Produktivitas",
      value: lastReport ? lastReport.metricValue : 0,
      subtitle: lastReport ? lastReport.metricLabel : "Belum ada data",
      icon: "bi-graph-up-arrow",
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      title: "Progress Skill",
      value: `${progressPercent}%`,
      subtitle: `${achievedSkills} / ${skillCount} Skill Tercapai`,
      icon: "bi-mortarboard",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Status Akun",
      value: data.plan,
      subtitle: data.expiryDate ? `Sisa ${Math.ceil((new Date(data.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Hari` : "Aktif Selamanya",
      icon: "bi-shield-check",
      color: "bg-slate-100 text-slate-900"
    },
    {
      title: "Pencapaian",
      value: data.achievements.length,
      subtitle: "Milestone Tervalidasi",
      icon: "bi-trophy",
      color: "bg-amber-50 text-amber-600"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="px-1">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Data Statistik</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ringkasan statistik Anda hari ini.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${s.color}`}>
              <i className={`bi ${s.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{s.title}</p>
              <h4 className="text-2xl font-black text-slate-900 leading-none">{s.value}</h4>
              <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest opacity-60 italic">{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-[0.3em] mb-4">Tips Pro</h4>
            <p className="text-sm font-medium leading-relaxed opacity-80">"Lengkapi seluruh data harian Anda untuk mendapatkan analisis grafik yang lebih akurat pada fitur Performance Reports di Desktop."</p>
         </div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
      </div>
    </div>
  );
};

export default MobileStats;