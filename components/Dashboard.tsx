
import React from 'react';
import { AppData, SkillStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const currentAffirmation = data.affirmations[Math.floor(Math.random() * data.affirmations.length)];
  
  const skillCount = data.skills.length;
  const achievedSkills = data.skills.filter(s => s.status === SkillStatus.ACHIEVED).length;
  const progressPercent = skillCount > 0 ? Math.round((achievedSkills / skillCount) * 100) : 0;
  
  const totalTrainingCost = data.trainings.reduce((sum, t) => sum + (t.cost || 0), 0);
  const activeCerts = data.certifications.filter(c => c.isActive).length;

  // Simple chart data from daily reports
  const chartData = data.dailyReports.slice(-7).map(report => ({
    name: new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: report.metricValue
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Halo, {data.profile.name}! 👋</h2>
          <p className="text-slate-500 font-medium mt-1">
            Fokus pengembangan: <span className="text-blue-600 font-black underline underline-offset-4">{data.profile.mainCareer}</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 max-w-md">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">✨</div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Affirmasi Hari Ini</p>
            <p className="text-sm italic text-slate-700 font-medium leading-tight">"{currentAffirmation}"</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Daily Metric" 
          value={data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricValue : 0} 
          subtitle={`Latest: ${data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricLabel : 'No logs'}`} 
          icon="📈" 
          color="blue" 
        />
        <MetricCard 
          title="Sertifikasi Aktif" 
          value={activeCerts} 
          subtitle={`Total: ${data.certifications.length}`} 
          icon="📜" 
          color="emerald" 
        />
        <MetricCard 
          title="Investasi Belajar" 
          value={`Rp ${(totalTrainingCost / 1000).toFixed(0)}k`} 
          subtitle={`${data.trainings.length} courses taken`} 
          icon="💰" 
          color="purple" 
        />
        <MetricCard 
          title="Pencapaian" 
          value={data.achievements.length} 
          subtitle="Professional Wins" 
          icon="🏆" 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Performance Trend</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aktivitas 7 Entry Terakhir</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase">Output Metric</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Target Karir Terdekat</h3>
            <div className="space-y-6">
              {data.careerPaths.filter(p => p.status !== 'tercapai').length > 0 ? (
                (() => {
                  const nextGoal = data.careerPaths.filter(p => p.status !== 'tercapai')[0];
                  return (
                    <div className="space-y-6">
                      <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Target Jabatan</p>
                        <p className="text-xl font-black">{nextGoal.targetPosition}</p>
                        <div className="flex justify-between items-end mt-6">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Deadline</p>
                              <p className="text-sm font-bold">{nextGoal.actionDeadline}</p>
                           </div>
                           <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                             {nextGoal.type}
                           </div>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/30 transition-all"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Mastery Level</p>
                          <p className="text-sm font-black text-blue-600">{(nextGoal.skillLevel / 5 * 100).toFixed(0)}%</p>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${nextGoal.skillLevel / 5 * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-bold">Semua target tercapai! 🚀</p>
                  <p className="text-xs text-slate-300 mt-1 italic">Waktunya menentukan impian baru.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-sm font-black uppercase tracking-widest text-white/70 mb-2">Overall Skill Gap</h3>
               <p className="text-4xl font-black">{progressPercent}% Achieved</p>
               <p className="text-xs mt-4 leading-relaxed font-medium opacity-80">
                 Kamu telah menguasai <span className="font-black text-white">{achievedSkills} dari {skillCount}</span> skill yang kamu track. Ayo kejar target sisanya!
               </p>
             </div>
             <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mb-12 -mr-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number | string; subtitle: string; icon: string; color: string }> = ({ title, value, subtitle, icon, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-inner`}>
        {icon}
      </div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{value}</h4>
      <p className="text-xs text-slate-500 mt-1 font-medium italic">{subtitle}</p>
    </div>
  );
};

export default Dashboard;
