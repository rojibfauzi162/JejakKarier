
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
    name: report.date ? new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' }) : '?',
    value: report.metricValue
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back, {data.profile.name}!</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            Main Objective: <span className="text-indigo-600 border-b-2 border-indigo-600/30">{data.profile.mainCareer}</span>
          </p>
        </div>
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(79,70,229,0.15)] text-white flex items-center gap-6 max-w-lg group hover:-translate-y-1 transition-all duration-500 cursor-default">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] mb-1">Daily Intelligence</p>
            <p className="text-base italic font-semibold leading-tight">"{currentAffirmation}"</p>
          </div>
        </div>
      </header>

      {/* MATRIX CARDS & GROWTH OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <MetricCard 
          title="Daily Output" 
          value={data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricValue : 0} 
          subtitle={`${data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricLabel : 'Awaiting Data'}`} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>} 
          color="indigo" 
        />
        <MetricCard 
          title="Mastery Score" 
          value={`${progressPercent}%`} 
          subtitle={`${achievedSkills} / ${skillCount} Skill achieved`} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>} 
          color="emerald" 
        />
        <MetricCard 
          title="Access Level" 
          value={data.plan} 
          subtitle={data.expiryDate ? `Expires in ${Math.ceil((new Date(data.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Days` : 'Lifetime Citizen'} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>} 
          color="slate" 
        />
        <MetricCard 
          title="Win Records" 
          value={data.achievements.length} 
          subtitle="Validated milestones" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>} 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Main Performance Chart */}
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Performance Analytics</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">7-Day Trajectory</p>
              </div>
              <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Metric Points</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <Tooltip 
                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px', backgroundColor: '#ffffff' }}
                    itemStyle={{ fontWeight: '900', color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Matrix Visual Summary */}
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Competency Matrix</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Skill Proficiency Distribution</p>
               </div>
               <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">Active Matrix</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
               {data.skills.slice(0, 6).map(skill => (
                 <div key={skill.id} className="space-y-3 group">
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{skill.name}</span>
                       <span className="text-[10px] font-black text-slate-400">LV {skill.currentLevel} <span className="opacity-40">/ 5</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                       <div 
                        className={`h-full transition-all duration-1000 rounded-full ${skill.currentLevel >= 4 ? 'bg-emerald-500' : skill.currentLevel >= 3 ? 'bg-indigo-500' : 'bg-amber-500'}`} 
                        style={{ width: `${(skill.currentLevel/5)*100}%` }}
                       ></div>
                    </div>
                 </div>
               ))}
               {data.skills.length === 0 && <p className="col-span-2 text-center text-slate-300 italic py-16 font-bold uppercase tracking-widest text-xs">Awaiting Matrix Entry...</p>}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
            <h3 className="text-xl font-black tracking-tight mb-10 flex items-center justify-between">
              Next Milestone
              <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
              </span>
            </h3>
            <div className="space-y-10">
              {data.careerPaths.filter(p => p.status !== 'tercapai').length > 0 ? (
                (() => {
                  const nextGoal = data.careerPaths.filter(p => p.status !== 'tercapai')[0];
                  return (
                    <div className="space-y-10">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Target Title</p>
                        <p className="text-2xl font-black tracking-tight leading-none">{nextGoal.targetPosition}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Status</p>
                            <p className="text-xs font-black uppercase">{nextGoal.status}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Target Year</p>
                            <p className="text-xs font-black uppercase">{nextGoal.targetYear}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Readiness Index</p>
                          <p className="text-xs font-black text-indigo-400">{(nextGoal.skillLevel / 5 * 100).toFixed(0)}%</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${nextGoal.skillLevel / 5 * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-10">
                  <p className="text-indigo-400 font-black uppercase tracking-[0.2em]">Summit Reached! 🚀</p>
                  <p className="text-[10px] text-white/30 mt-3 font-bold uppercase tracking-widest leading-relaxed">It's time to set new extraordinary horizons.</p>
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px] -mr-24 -mt-24"></div>
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center text-center group">
             <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Achievement Vault</h3>
             <p className="text-4xl font-black text-slate-900 tracking-tight">{data.achievements.length}</p>
             <p className="text-[11px] font-bold text-slate-500 mt-4 uppercase tracking-widest">Validated Hall of Fame</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number | string; subtitle: string; icon: React.ReactNode; color: string }> = ({ title, value, subtitle, icon, color }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-900',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:-translate-y-2 group">
      <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4>
      <p className="text-[10px] text-slate-500 mt-5 font-black uppercase tracking-widest opacity-60 italic">{subtitle}</p>
    </div>
  );
};

export default Dashboard;
