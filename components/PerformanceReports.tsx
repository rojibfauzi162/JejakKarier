import React, { useState, useMemo } from 'react';
import { AppData, DailyReport } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface PerformanceReportsProps {
  data: AppData;
}

type TimeFilter = 'today' | '7days' | '1month' | '3months' | '6months' | '1year' | 'range' | 'all';

const PerformanceReports: React.FC<PerformanceReportsProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedContext, setSelectedContext] = useState<'all' | 'Perusahaan' | 'Personal' | 'Sampingan'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPeriodLogs, setSelectedPeriodLogs] = useState<{ title: string, logs: DailyReport[] } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // New Date Filter States
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Filtered data based on selected context and custom date range
  const filteredReports = useMemo(() => {
    let reports = [...data.dailyReports].sort((a, b) => a.date.localeCompare(b.date));
    
    if (selectedContext !== 'all') {
      reports = reports.filter(log => log.context === selectedContext);
    }

    let start = dateStart;
    let end = dateEnd;

    if (timeFilter !== 'range' && timeFilter !== 'all') {
      const now = new Date();
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      
      if (timeFilter === 'today') {
        // Start is today 00:00
      } else if (timeFilter === '7days') {
        d.setDate(d.getDate() - 7);
      } else if (timeFilter === '1month') {
        d.setMonth(d.getMonth() - 1);
      } else if (timeFilter === '3months') {
        d.setMonth(d.getMonth() - 3);
      } else if (timeFilter === '6months') {
        d.setMonth(d.getMonth() - 6);
      } else if (timeFilter === '1year') {
        d.setFullYear(d.getFullYear() - 1);
      }
      
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    }

    if (timeFilter !== 'all') {
      if (start) reports = reports.filter(log => log.date >= start);
      if (end) reports = reports.filter(log => log.date <= end);
    }

    return reports;
  }, [data.dailyReports, selectedContext, timeFilter, dateStart, dateEnd]);

  // Summary Stats for the selected period
  const summaryStats = useMemo(() => {
    const totalMetrik = filteredReports.reduce((sum, log) => sum + log.metricValue, 0);
    const avgMetrik = filteredReports.length > 0 ? totalMetrik / filteredReports.length : 0;
    const uniqueDays = new Set(filteredReports.map(log => log.date)).size;
    const productivityScore = uniqueDays > 0 ? (filteredReports.length / uniqueDays) * 10 : 0;

    return {
      total: totalMetrik,
      avg: avgMetrik.toFixed(1),
      days: uniqueDays,
      score: productivityScore.toFixed(1)
    };
  }, [filteredReports]);

  // Logic: Grouping for Charts (Adaptive)
  const chartData = useMemo(() => {
    if (timeFilter === 'today' || timeFilter === '7days') {
      // Group by day
      const stats: Record<string, { label: string, value: number }> = {};
      filteredReports.forEach(log => {
        if (!stats[log.date]) stats[log.date] = { label: log.date, value: 0 };
        stats[log.date].value += log.metricValue;
      });
      return Object.values(stats);
    } else {
      // Group by month for longer periods
      const stats: Record<string, { label: string, value: number }> = {};
      filteredReports.forEach(log => {
        const d = new Date(log.date);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!stats[key]) stats[key] = { label: key, value: 0 };
        stats[key].value += log.metricValue;
      });
      return Object.values(stats);
    }
  }, [filteredReports, timeFilter]);

  const handleExport = (format: string) => {
    setIsExporting(true);
    setTimeout(() => {
      alert(`Berhasil membuat file laporan ${format.toUpperCase()}.\nMenyiapkan pengunduhan...`);
      setIsExporting(false);
    }, 1500);
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
        <div className="px-1">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Performance Reports</h2>
            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse">VERSI 2.0</span>
          </div>
          <p className="text-slate-500 font-medium">Analisis produktivitas dan pencapaian metrik kerja.</p>
        </div>
        <div className="flex flex-wrap gap-3 px-1">
          <button onClick={() => setShowShareModal(true)} className="flex-1 md:flex-none px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            <span>🔗</span> Bagikan Laporan
          </button>
          
          {/* CONSOLIDATED EXPORT DROPDOWN */}
          <div className="relative group flex-1 md:flex-none">
            <button className="w-full md:w-auto px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all">
               <span>📥</span> Export Data {isExporting ? '...' : '▼'}
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
               <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors flex items-center gap-3">
                  <i className="bi bi-file-earmark-pdf"></i> Format PDF
               </button>
               <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-3">
                  <i className="bi bi-file-earmark-excel"></i> Format Excel
               </button>
               <button onClick={() => handleExport('word')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-3">
                  <i className="bi bi-file-earmark-word"></i> Format Word
               </button>
            </div>
          </div>

          <button onClick={handleSync} className="flex-1 md:flex-none px-5 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all">Sync Sheets</button>
        </div>
      </header>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        <StatCard label="Total Capaian" value={summaryStats.total} subValue="Unit Metrik" icon="🎯" color="indigo" />
        <StatCard label="Rata-rata Harian" value={summaryStats.avg} subValue="Per Aktivitas" icon="📈" color="emerald" />
        <StatCard label="Hari Aktif" value={summaryStats.days} subValue="Hari Kerja" icon="📅" color="blue" />
        <StatCard label="Skor Produktivitas" value={summaryStats.score} subValue="Skala 1-10" icon="⚡" color="amber" />
      </div>

      {/* FILTER CONTROLS - Context & Date Range */}
      <div className="bg-white p-6 lg:p-10 rounded-[3rem] shadow-sm border border-slate-100 mx-1 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-6 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Pilih Konteks Laporan</label>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <ContextTab active={selectedContext === 'all'} onClick={() => setSelectedContext('all')} label="Semua Data" color="slate" />
              <ContextTab active={selectedContext === 'Perusahaan'} onClick={() => setSelectedContext('Perusahaan')} label="Kantor" color="indigo" />
              <ContextTab active={selectedContext === 'Personal'} onClick={() => setSelectedContext('Personal')} label="Personal" color="emerald" />
              <ContextTab active={selectedContext === 'Sampingan'} onClick={() => setSelectedContext('Sampingan')} label="Freelance" color="amber" />
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Dari Tanggal</label>
                <input 
                  type="date" 
                  disabled={timeFilter !== 'range'}
                  className={`w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${timeFilter !== 'range' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={dateStart || ''}
                  onChange={e => setDateStart(e.target.value)}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hingga Tanggal</label>
                <input 
                  type="date" 
                  disabled={timeFilter !== 'range'}
                  className={`w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${timeFilter !== 'range' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={dateEnd || ''}
                  onChange={e => setDateEnd(e.target.value)}
                />
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Filter Waktu</label>
          <div className="flex flex-wrap gap-2">
            <TimeTab active={timeFilter === 'today'} onClick={() => setTimeFilter('today')} label="Hari Ini" />
            <TimeTab active={timeFilter === '7days'} onClick={() => setTimeFilter('7days')} label="7 Hari" />
            <TimeTab active={timeFilter === '1month'} onClick={() => setTimeFilter('1month')} label="1 Bulan" />
            <TimeTab active={timeFilter === '3months'} onClick={() => setTimeFilter('3months')} label="3 Bulan" />
            <TimeTab active={timeFilter === '6months'} onClick={() => setTimeFilter('6months')} label="6 Bulan" />
            <TimeTab active={timeFilter === '1year'} onClick={() => setTimeFilter('1year')} label="1 Tahun" />
            <TimeTab active={timeFilter === 'all'} onClick={() => setTimeFilter('all')} label="Semua" />
            <TimeTab active={timeFilter === 'range'} onClick={() => setTimeFilter('range')} label="Range Tanggal" />
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md mx-1">
        <button onClick={() => setViewMode('list')} className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
          <i className="bi bi-list-ul mr-2"></i> Daftar Aktivitas
        </button>
        <button onClick={() => setViewMode('charts')} className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'charts' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
          <i className="bi bi-graph-up mr-2"></i> Analisis Grafik
        </button>
      </div>

      <div className="px-1">
        {viewMode === 'list' && (
          <div className="space-y-6">
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Aktivitas</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Instansi/Proyek</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Metrik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.slice().reverse().map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">{log.date}</td>
                      <td className="px-8 py-6 text-sm font-black text-slate-800 leading-tight">{log.activity}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{log.companyName || 'Personal'}</span>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.context}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-slate-700 text-sm whitespace-nowrap">
                        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl border border-blue-100">
                          {log.metricValue} {log.metricLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Mode */}
            <div className="lg:hidden space-y-4">
              {filteredReports.slice().reverse().map(log => (
                <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.date}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                      log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      log.context === 'Personal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {log.context}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm leading-tight">{log.activity}</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">{log.companyName || 'Personal Project'}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Hasil / Metrik</span>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-[10px] border border-blue-100">
                      {log.metricValue} {log.metricLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <div className="bg-white rounded-[3rem] p-20 text-center text-slate-400 italic font-medium uppercase tracking-widest text-xs border border-slate-100 shadow-sm">
                Tidak ada data ditemukan untuk kriteria ini.
              </div>
            )}
          </div>
        )}

        {viewMode === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Trend Capaian Metrik</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" hide={timeFilter === 'all' || timeFilter === '1year'} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Distribusi Performa</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 lg:p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bagikan Laporan</h3>
              <button onClick={() => setShowShareModal(false)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 font-bold transition-colors">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Anda akan membagikan laporan dalam mode <span className="font-black text-indigo-600">Read-Only</span> untuk konteks: 
              <span className="block mt-1 font-black uppercase text-slate-800">{selectedContext === 'all' ? 'Seluruh Aktivitas Pekerjaan' : selectedContext}</span>
            </p>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 break-all shadow-inner">
              <code className="text-[10px] font-bold text-slate-400 select-all leading-tight">{generateShareLink()}</code>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowShareModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-50">Batal</button>
              <button onClick={copyShareLink} className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Salin Tautan 🔗</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPeriodLogs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col overflow-hidden">
            <div className="p-8 lg:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedPeriodLogs.title}</h3>
                <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest">{selectedPeriodLogs.logs.length} Aktivitas Ditemukan</p>
              </div>
              <button onClick={() => setSelectedPeriodLogs(null)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              <div className="space-y-4">
                {selectedPeriodLogs.logs.map((log, idx) => (
                  <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.date}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                            log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            log.context === 'Personal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {log.context}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">{log.activity}</h4>
                        {log.description && <p className="text-xs text-slate-500 font-medium line-clamp-2">{log.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-slate-50 px-2 py-1 rounded-md">{log.companyName || 'Personal Project'}</span>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight bg-indigo-50 px-2 py-1 rounded-md">{log.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-[120px]">
                        <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 font-black text-sm">
                          {log.metricValue} {log.metricLabel}
                        </span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Capaian Metrik</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-8 lg:p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end">
              <button onClick={() => setSelectedPeriodLogs(null)} className="px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95">Tutup Detail</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; subValue: string; icon: string; color: string }> = ({ label, value, subValue, icon, color }) => {
  const colorClasses: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-slate-900">{value}</h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase">{subValue}</span>
      </div>
      <div className={`h-1 w-12 rounded-full ${colorClasses[color].split(' ')[1]}`}></div>
    </div>
  );
};

const TimeTab: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${active ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
      {label}
    </button>
  );
};

const ContextTab: React.FC<{ active: boolean; onClick: () => void; label: string; color: string }> = ({ active, onClick, label, color }) => {
  const colorClasses: Record<string, string> = {
    slate: active ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100',
    indigo: active ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100',
    emerald: active ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100',
    amber: active ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
  };

  return (
    <button onClick={onClick} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent whitespace-nowrap ${colorClasses[color]}`}>
      {label}
    </button>
  );
};

export default PerformanceReports;