
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, DailyReport } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { generateCareerInsight } from '../services/geminiService';

interface PublicReportViewProps {
  data: AppData;
  contextFilter: string;
  userName: string;
}

type TimeRange = '1day' | '7days' | '1month' | 'quarter' | 'range';

const PublicReportView: React.FC<PublicReportViewProps> = ({ data, contextFilter, userName }) => {
  const searchParams = new URLSearchParams(window.location.search);
  const isInsightView = searchParams.get('view') === 'shared_insight';
  const sharedAudience = (searchParams.get('audience') as 'self' | 'supervisor') || 'supervisor';
  const sharedPeriod = (searchParams.get('period') as 'weekly' | 'monthly') || 'weekly';

  const [activeView, setActiveView] = useState<'table' | 'chart' | 'insight'>(isInsightView ? 'insight' : 'table');
  const [timeRange, setTimeRange] = useState<TimeRange>('1day');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  const [insightData, setInsightData] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    if (isInsightView) {
      const fetchInsight = async () => {
        setLoadingInsight(true);
        try {
          const res = await generateCareerInsight(data, sharedAudience, sharedPeriod, ['Perusahaan', 'Personal', 'Sampingan']);
          setInsightData(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingInsight(false);
        }
      };
      fetchInsight();
    }
  }, [isInsightView, sharedAudience, sharedPeriod, data]);

  const filteredReports = useMemo(() => {
    let reports = data.dailyReports;
    
    // Filter Konteks
    if (contextFilter !== 'all') {
      reports = reports.filter(log => log.context === contextFilter);
    }

    // Filter Waktu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return reports.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const diffDays = (today.getTime() - logDate.getTime()) / (1000 * 3600 * 24);

      if (timeRange === '1day') return log.date === todayStr;
      if (timeRange === '7days') return diffDays >= 0 && diffDays <= 7;
      if (timeRange === '1month') return diffDays >= 0 && diffDays <= 30;
      if (timeRange === 'quarter') return diffDays >= 0 && diffDays <= 90;
      if (timeRange === 'range' && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        return logDate >= start && logDate <= end;
      }
      return true;
    });
  }, [data.dailyReports, contextFilter, timeRange, customRange]);

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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Public Header Updated with Position and Company */}
        <header className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">F</div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">FokusKarir <span className="text-blue-600">Report</span></h1>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
               {isInsightView ? 'AI Strategic Insights' : 'Performance Overview'}
            </h2>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">User: {userName}</span>
                {!isInsightView && <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Konteks: {contextFilter === 'all' ? 'Seluruh Aktivitas' : contextFilter}</span>}
                {isInsightView && <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{sharedPeriod} {sharedAudience} report</span>}
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">✓ Verified Report</span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Jabatan: <span className="text-slate-800">{data.profile.currentPosition || '-'}</span>
                </p>
                <span className="hidden md:inline text-slate-300">|</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Perusahaan: <span className="text-slate-800">{data.profile.currentCompany || '-'}</span>
                </p>
              </div>
            </div>
          </div>
          {!isInsightView && (
            <div className="bg-blue-600 text-white p-6 rounded-[2rem] text-center min-w-[180px] shadow-2xl shadow-blue-500/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Aktivitas</p>
              <p className="text-4xl font-black tracking-tighter">{filteredReports.length}</p>
            </div>
          )}
        </header>

        {/* Content Area */}
        {isInsightView ? (
           loadingInsight ? (
              <div className="py-32 text-center bg-white rounded-[3rem] shadow-xl space-y-4">
                 <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI sedang menyusun laporan strategis...</p>
              </div>
           ) : insightData ? (
             <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-xl border border-white animate-in zoom-in duration-500 space-y-12">
                <div className="space-y-4 text-center md:text-left">
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{insightData.title}</h3>
                   <p className="text-lg text-slate-500 italic leading-relaxed">"{insightData.summary}"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {insightData.sections.map((s: any, i: number) => (
                      <div key={i} className="space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b pb-2">{s.label}</h4>
                         <p className="text-sm text-slate-600 leading-relaxed font-bold whitespace-pre-line">{s.content}</p>
                      </div>
                   ))}
                </div>

                <div className="pt-10 border-t border-slate-50">
                   <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                      {insightData.metrics.map((m: any, i: number) => (
                        <div key={i} className="text-center md:text-left">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                           <p className="text-2xl font-black text-slate-900 tracking-tight">{m.value}</p>
                        </div>
                      ))}
                   </div>
                </div>

                {sharedAudience === 'self' && (
                  <div className="bg-slate-950 p-10 rounded-[3rem] text-white">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Deep Learning Reflection</p>
                     <p className="text-lg font-medium italic opacity-80 leading-relaxed">"{insightData.aiReflection}"</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="py-20 text-center bg-white rounded-[3rem]">Gagal memuat data insight.</div>
           )
        ) : (
           /* DEFAULT REPORT VIEWS */
           <div className="space-y-8">
             <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 inline-flex">
                  <button onClick={() => setActiveView('table')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>📋 Data Tabel</button>
                  <button onClick={() => setActiveView('chart')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'chart' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>📊 Visualisasi Grafik</button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['1day', '7days', '1month', 'quarter', 'range'].map(id => (
                    <button key={id} onClick={() => setTimeRange(id as TimeRange)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${timeRange === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>{id}</button>
                  ))}
                </div>
             </div>

             {activeView === 'table' ? (
                <div className="bg-white rounded-[3rem] shadow-xl border border-white overflow-hidden overflow-x-auto">
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
                        <tr key={log.id}>
                          <td className="px-10 py-6 text-sm font-bold text-slate-400">{log.date}</td>
                          <td className="px-10 py-6 font-black text-slate-800 text-sm">{log.activity}</td>
                          <td className="px-10 py-6 text-sm text-slate-600 font-medium italic">"{log.output}"</td>
                          <td className="px-10 py-6 text-center"><span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black">{log.metricValue} {log.metricLabel}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-64">
                    <ResponsiveContainer width="100%" height="100%"><AreaChart data={filteredReports.slice(-15)}><XAxis dataKey="date" hide /><YAxis hide /><Tooltip /><Area type="monotone" dataKey="metricValue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} /></AreaChart></ResponsiveContainer>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-64">
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyStats.slice().reverse()}><XAxis dataKey="month" hide /><YAxis hide /><Tooltip /><Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                  </div>
                </div>
             )}
           </div>
        )}

        {/* Footer Info */}
        <footer className="text-center pb-12">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Generated by FokusKarir Digital Portfolio System</p>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => window.print()} className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Download PDF</button>
            <button className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Export Excel</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicReportView;
