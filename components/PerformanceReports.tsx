
import React, { useState, useMemo } from 'react';
import { AppData, DailyReport } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface PerformanceReportsProps {
  data: AppData;
}

const PerformanceReports: React.FC<PerformanceReportsProps> = ({ data }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'charts'>('daily');
  const [selectedContext, setSelectedContext] = useState<'all' | 'Perusahaan' | 'Personal' | 'Sampingan'>('all');
  const [showShareModal, setShowShareModal] = useState(false);

  // Filtered data based on selected context
  const filteredReports = useMemo(() => {
    if (selectedContext === 'all') return data.dailyReports;
    return data.dailyReports.filter(log => log.context === selectedContext);
  }, [data.dailyReports, selectedContext]);

  // Logic: Grouping for Weekly
  const weeklyStats = useMemo(() => {
    const stats: Record<string, { week: string, total: number, count: number }> = {};
    filteredReports.forEach(log => {
      const d = new Date(log.date);
      const year = d.getFullYear();
      const firstDay = new Date(year, 0, 1);
      const days = Math.floor((d.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((days + firstDay.getDay() + 1) / 7);
      const key = `${year}-W${weekNum}`;
      
      if (!stats[key]) stats[key] = { week: key, total: 0, count: 0 };
      stats[key].total += log.metricValue;
      stats[key].count += 1;
    });
    return Object.values(stats).reverse();
  }, [filteredReports]);

  // Logic: Grouping for Monthly
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

  const handleExport = (format: string) => {
    alert(`Mengekspor laporan dalam format ${format.toUpperCase()}...\nFitur ini akan mengunduh file laporan performa Anda.`);
  };

  const handleSync = () => {
    alert(`Mensinkronisasikan data ke Google Sheets...\nPastikan Anda telah memberikan izin akses Google Drive.`);
  };

  const generateShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'shared_report');
    url.searchParams.set('context', selectedContext);
    url.searchParams.set('name', data.profile.name);
    return url.toString();
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(generateShareLink());
    alert('Tautan laporan berhasil disalin! Berikan tautan ini ke atasan Anda.');
    setShowShareModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance Reports</h2>
          <p className="text-slate-500 font-medium">Analisis produktivitas dan pencapaian metrik kerja.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowShareModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <span>🔗</span> Bagikan Laporan
          </button>
          <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all">Export PDF</button>
          <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">Export Excel</button>
          <button onClick={handleSync} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all">Sync Sheets</button>
        </div>
      </header>

      {/* Context Selection View */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Pilih Konteks Laporan</label>
        <div className="flex flex-wrap gap-2">
          <ContextTab active={selectedContext === 'all'} onClick={() => setSelectedContext('all')} label="Semua Data" color="slate" />
          <ContextTab active={selectedContext === 'Perusahaan'} onClick={() => setSelectedContext('Perusahaan')} label="Kantor (Perusahaan)" color="indigo" />
          <ContextTab active={selectedContext === 'Personal'} onClick={() => setSelectedContext('Personal')} label="Proyek Personal" color="emerald" />
          <ContextTab active={selectedContext === 'Sampingan'} onClick={() => setSelectedContext('Sampingan')} label="Freelance / Sampingan" color="amber" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button onClick={() => setReportType('daily')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'daily' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Harian</button>
        <button onClick={() => setReportType('weekly')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'weekly' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Mingguan</button>
        <button onClick={() => setReportType('monthly')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'monthly' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Bulanan</button>
        <button onClick={() => setReportType('charts')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'charts' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Grafik</button>
      </div>

      {reportType === 'daily' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Aktivitas</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Instansi/Proyek</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Metrik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReports.slice().reverse().map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-500">{log.date}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-800">{log.activity}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-xs">{log.companyName || 'Personal'}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.context}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-700 text-sm">{log.metricValue} {log.metricLabel}</td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">Tidak ada data untuk konteks yang dipilih.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'weekly' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Minggu Ke</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Log</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Akumulasi Metrik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {weeklyStats.map(stat => (
                <tr key={stat.week} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 text-sm font-black text-slate-800">{stat.week}</td>
                  <td className="px-8 py-6 text-center font-bold text-slate-500 text-sm">{stat.count} Aktivitas</td>
                  <td className="px-8 py-6 text-center font-black text-blue-600 text-sm">{stat.total} Points</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'monthly' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Periode Bulan</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Log</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Akumulasi Metrik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlyStats.map(stat => (
                <tr key={stat.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 text-sm font-black text-slate-800">{stat.month}</td>
                  <td className="px-8 py-6 text-center font-bold text-slate-500 text-sm">{stat.count} Aktivitas</td>
                  <td className="px-8 py-6 text-center font-black text-emerald-600 text-sm">{stat.total} Points</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Trend Produktivitas (Daily)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredReports.slice(-10)}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="metricValue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Pertumbuhan Metrik Bulanan</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" fill="#10b981" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 lg:p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Bagikan Laporan</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-300 hover:text-slate-900 font-bold">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Anda akan membagikan laporan dalam mode <span className="font-bold text-indigo-600">Read-Only</span> untuk konteks: 
              <span className="block mt-1 font-black uppercase text-slate-800">{selectedContext === 'all' ? 'Semua Pekerjaan' : selectedContext}</span>
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 break-all">
              <code className="text-[10px] font-bold text-slate-400 select-all">{generateShareLink()}</code>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowShareModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Batal</button>
              <button onClick={copyShareLink} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100">Salin Tautan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContextTab: React.FC<{ active: boolean; onClick: () => void; label: string; color: string }> = ({ active, onClick, label, color }) => {
  const colorClasses: Record<string, string> = {
    slate: active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100',
    indigo: active ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100',
    emerald: active ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100',
    amber: active ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-400 hover:bg-amber-100',
  };

  return (
    <button onClick={onClick} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent ${colorClasses[color]}`}>
      {label}
    </button>
  );
};

export default PerformanceReports;
