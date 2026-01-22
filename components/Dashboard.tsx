
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

  // Simple chart data from daily reports
  const chartData = data.dailyReports.slice(-7).map(report => ({
    name: new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: report.metricValue
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome back, {data.profile.name}!</h2>
          <p className="text-slate-500">Tracking progress for <span className="font-semibold text-blue-600">{data.profile.mainCareer}</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-2xl">✨</div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Daily Affirmation</p>
            <p className="text-sm italic text-slate-700">"{currentAffirmation}"</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Daily Output" value={data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricValue : 0} subtitle="Latest record" color="blue" />
        <MetricCard title="Skills Tracked" value={skillCount} subtitle={`${achievedSkills} Achieved`} color="purple" />
        <MetricCard title="Contacts" value={data.contacts.length} subtitle="Networking base" color="green" />
        <MetricCard title="Achievements" value={data.achievements.length} subtitle="Professional wins" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Performance Trend (Daily Metric)</h3>
            <span className="text-xs font-semibold text-slate-400">Last 7 Entries</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Career Path Progress</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Overall Skill Gap</span>
                <span className="text-sm font-bold text-blue-600">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Current Focus</h4>
              {data.careerPaths.length > 0 ? (
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="font-bold text-slate-800">{data.careerPaths[0].targetPosition}</p>
                  <p className="text-xs text-slate-500 mt-1">Goal Age: {data.careerPaths[0].targetAge} years</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No career target set yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number | string; subtitle: string; color: string }> = ({ title, value, subtitle, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-4 font-bold text-lg`}>
        {title[0]}
      </div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
};

export default Dashboard;
