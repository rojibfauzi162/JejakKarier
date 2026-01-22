
import React, { useMemo } from 'react';
import { AppData } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PublicReportViewProps {
  data: AppData;
  contextFilter: string;
  userName: string;
}

const PublicReportView: React.FC<PublicReportViewProps> = ({ data, contextFilter, userName }) => {
  const filteredReports = useMemo(() => {
    if (contextFilter === 'all') return data.dailyReports;
    return data.dailyReports.filter(log => log.context === contextFilter);
  }, [data.dailyReports, contextFilter]);

  const monthlyStats = useMemo(() => {
    const stats: Record<string, { month: string, total: number, count: number }> = {};
    filteredReports.forEach(log => {
      const d = new Date(log.date);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!stats[key]) stats[key] = { month: key, total: 0, count: 0 };
      stats[key].total += log.metricValue;
      stats[key].count += 1;
    });
    return Object.values(stats).reverse();
  }, [filteredReports]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Public Header */}
        <header className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">J</div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">JejakKarir <span className="text-blue-600">Report</span></h1>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Performance Overview</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">User: {userName}</span>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Konteks: {contextFilter === 'all' ? 'Seluruh Aktivitas' : contextFilter}</span>
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">✓ Verified Report</span>
            </div>
          </div>
          <div className="bg-blue-600 text-white p-6 rounded-[2rem] text-center min-w-[180px] shadow-2xl shadow-blue-500/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Aktivitas</p>
            <p className="text-4xl font-black tracking-tighter">{filteredReports.length}</p>
          </div>
        </header>

        {/* Visual Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-700 delay-150">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Produktivitas Harian</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredReports.slice(-15)}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="metricValue" stroke="#3b82f6" strokeWidth={3} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Analisis Bulanan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-white overflow-hidden overflow-x-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Detailed Work Log</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Read Only View</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-10 py-5">Tanggal</th>
                <th className="px-10 py-5">Aktivitas Pekerjaan</th>
                <th className="px-10 py-5">Hasil Konkret (Output)</th>
                <th className="px-10 py-5 text-center">Metrik Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.slice().reverse().map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6 text-sm font-bold text-slate-400">{log.date}</td>
                  <td className="px-10 py-6">
                    <div className="font-black text-slate-800 text-sm">{log.activity}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{log.companyName || 'Personal'}</div>
                  </td>
                  <td className="px-10 py-6 text-sm text-slate-600 font-medium italic">"{log.output}"</td>
                  <td className="px-10 py-6 text-center">
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black">
                      {log.metricValue} {log.metricLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <footer className="text-center pb-12">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Generated by JejakKarir Digital Portfolio System</p>
          <div className="mt-6">
            <button onClick={() => window.print()} className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
              Cetak Laporan (PDF)
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicReportView;
