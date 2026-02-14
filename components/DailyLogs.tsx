import React, { useState, useMemo, useEffect } from 'react';
import { DailyReport, AppData, SubscriptionPlan } from '../types';

interface DailyLogsProps {
  logs: DailyReport[];
  categories: string[];
  currentCompany?: string;
  onAdd: (log: DailyReport) => void;
  onUpdate: (log: DailyReport) => void;
  onDelete: (id: string) => void;
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (cat: string) => void;
  affirmation: string;
  targetDate?: string;
  appData?: AppData;
  onUpgrade?: () => void;
}

type TimeFilter = 'all' | 'today' | '7days' | '30days' | 'quarter' | 'range';

interface ActivityLine {
  tempId: string;
  activity: string;
  category: string;
  output: string;
  metricValue: number;
  targetValue: number;
  metricLabel: string;
  metricOption: string;
  customMetricLabel: string;
  isPlan: boolean;
  useCustomOutput?: boolean;
}

const DailyLogs: React.FC<DailyLogsProps> = ({ logs, categories, currentCompany, onAdd, onUpdate, onDelete, onAddCategory, onDeleteCategory, affirmation, targetDate, appData, onUpgrade }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  
  // History Modal States
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterTime, setFilterTime] = useState<TimeFilter>('all');
  const [startDate, setStartDateFilter] = useState('');
  const [endDate, setEndDateFilter] = useState('');

  // Calendar State
  const [calDate, setCalDate] = useState(new Date());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // LOGIC LIMITASI DATA - HANYA UNTUK PAKET FREE
  const limit = appData?.planLimits?.dailyLogs || 10;
  const isLimitReached = appData?.plan === SubscriptionPlan.FREE && limit !== 'unlimited' && logs.length >= (Number(limit));

  const metricChoices = ['Laporan', 'Jam', 'Berkas', 'Persentase (%)', 'Nominal (IDR)', 'Custom'];

  // LOGIC: Map riwayat aktivitas terbatas seminggu terakhir dari hari ini
  const pastActivitiesMap = useMemo(() => {
    const map: Record<string, { category: string, metricLabel: string, metricValue: number, targetValue: number }> = {};
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentLogs = [...logs]
      .filter(l => new Date(l.date) >= oneWeekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    recentLogs.forEach(l => {
      if (!map[l.activity]) {
        map[l.activity] = { 
          category: l.category, 
          metricLabel: l.metricLabel,
          metricValue: l.metricValue,
          targetValue: l.targetValue || 0
        };
      }
    });
    return map;
  }, [logs]);

  const pastActivityTitles = useMemo(() => Object.keys(pastActivitiesMap), [pastActivitiesMap]);

  // State untuk form
  const [headerData, setHeaderData] = useState({
    date: new Date().toISOString().split('T')[0],
    context: 'Perusahaan' as 'Perusahaan' | 'Personal' | 'Sampingan',
    companyName: currentCompany || '',
  });

  const [activityLines, setActivityLines] = useState<ActivityLine[]>([
    {
      tempId: Math.random().toString(36).substr(2, 9),
      activity: '',
      category: categories[0] || 'Operasional',
      output: '',
      metricValue: 0,
      targetValue: 0,
      metricLabel: 'Laporan',
      metricOption: 'Laporan',
      customMetricLabel: '',
      isPlan: true,
      useCustomOutput: false
    }
  ]);

  // AUTO-FILL LOGIC: Kantor (Perusahaan) -> Profile Current Company
  useEffect(() => {
    if (headerData.context === 'Perusahaan' && appData?.profile.currentCompany) {
      setHeaderData(prev => ({ ...prev, companyName: appData.profile.currentCompany }));
    }
  }, [headerData.context, appData?.profile.currentCompany]);

  const handleAddLine = () => {
    setActivityLines([...activityLines, {
      tempId: Math.random().toString(36).substr(2, 9),
      activity: '',
      category: categories[0] || 'Operasional',
      output: '',
      metricValue: 0,
      targetValue: 0,
      metricLabel: 'Laporan',
      metricOption: 'Laporan',
      customMetricLabel: '',
      isPlan: !isExecutingPlan,
      useCustomOutput: false
    }]);
  };

  const handleRemoveLine = (tempId: string) => {
    if (activityLines.length > 1) {
      setActivityLines(activityLines.filter(line => line.tempId !== tempId));
    }
  };

  const updateLine = (tempId: string, fields: Partial<ActivityLine>) => {
    setActivityLines(activityLines.map(line => line.tempId === tempId ? { ...line, ...fields } : line));
  };

  const handleOpenModal = (log?: DailyReport, asExecute: boolean = false) => {
    if (!log && isLimitReached) {
       alert("Limit data harian Anda telah mencapai batas maksimal paket saat ini. Silakan upgrade untuk menambah lebih banyak data.");
       onUpgrade?.();
       return;
    }

    setIsExecutingPlan(asExecute);
    setShowHistoryFor(null);
    setHistorySearch('');
    setHistoryPage(1);

    if (asExecute && log) {
      setEditingLogId(null);
      setHeaderData({
        date: log.date,
        context: log.context || 'Perusahaan',
        companyName: log.companyName || currentCompany || '',
      });
      
      const dailyLogs = logs.filter(item => item.date === log.date);
      setActivityLines(dailyLogs.map(item => ({
        tempId: item.id,
        activity: item.activity,
        category: item.category,
        output: item.output || item.activity,
        metricValue: item.metricValue,
        targetValue: item.targetValue || 0,
        metricLabel: item.metricLabel,
        metricOption: metricChoices.includes(item.metricLabel) ? item.metricLabel : 'Custom',
        customMetricLabel: metricChoices.includes(item.metricLabel) ? '' : item.metricLabel,
        isPlan: false,
        useCustomOutput: item.output !== item.activity && !!item.output
      })));
    } else if (log) {
      setEditingLogId(log.id);
      setHeaderData({
        date: log.date,
        context: log.context || 'Perusahaan',
        companyName: log.companyName || currentCompany || '',
      });
      setActivityLines([{
        tempId: log.id,
        activity: log.activity,
        category: log.category,
        output: log.output,
        metricValue: log.metricValue,
        targetValue: log.targetValue || 0,
        metricLabel: log.metricLabel,
        metricOption: metricChoices.includes(log.metricLabel) ? log.metricLabel : 'Custom',
        customMetricLabel: metricChoices.includes(log.metricLabel) ? '' : log.metricLabel,
        isPlan: (log.isPlan ?? false),
        useCustomOutput: log.output !== log.activity && !!log.output
      }]);
    } else {
      setEditingLogId(null);
      setHeaderData({
        date: targetDate || new Date().toISOString().split('T')[0],
        context: 'Perusahaan',
        companyName: (headerData.context === 'Perusahaan' && appData?.profile.currentCompany) ? appData.profile.currentCompany : (currentCompany || ''),
      });
      setActivityLines([{
        tempId: Math.random().toString(36).substr(2, 9),
        activity: '',
        category: categories[0] || 'Operasional',
        output: '',
        metricValue: 0,
        targetValue: 0,
        metricLabel: 'Laporan',
        metricOption: 'Laporan',
        customMetricLabel: '',
        isPlan: true,
        useCustomOutput: false
      }]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = activityLines.filter(line => line.activity.trim() !== '');
    if (validLines.length === 0) return;

    if (isExecutingPlan) {
      const submittedIds = new Set(validLines.map(line => line.tempId));
      const originalLogsForDay = logs.filter(oldLog => oldLog.date === headerData.date);
      
      originalLogsForDay.forEach(oldLog => {
        if (!submittedIds.has(oldLog.id)) {
          onDelete(oldLog.id);
        }
      });
    }

    validLines.forEach(line => {
      const finalMetricLabel = line.metricOption === 'Custom' ? line.customMetricLabel : line.metricOption;
      const logData: DailyReport = {
        id: line.tempId,
        date: headerData.date,
        context: headerData.context,
        companyName: headerData.companyName,
        activity: line.activity,
        category: line.category,
        output: (!line.isPlan && !line.useCustomOutput) ? line.activity : line.output,
        metricValue: line.metricValue,
        targetValue: line.targetValue,
        metricLabel: finalMetricLabel,
        isPlan: line.isPlan,
        reflection: '' 
      };

      const exists = logs.some(item => item.id === line.tempId);
      if (exists) onUpdate(logData);
      else onAdd(logData);
    });
    
    setIsModalOpen(false);
    setIsExecutingPlan(false);
  };

  const groupedLogsByDate = useMemo(() => {
    let result = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (searchQuery) {
      result = result.filter((item) => 
        item.activity.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.output && item.output.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterCat !== 'all') {
      result = result.filter((item) => item.category === filterCat);
    }

    if (filterTime !== 'all') {
      const now = new Date();
      now.setHours(0,0,0,0);
      const todayStr = now.toISOString().split('T')[0];
      
      result = result.filter((item) => {
        const logDate = new Date(item.date);
        logDate.setHours(0,0,0,0);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);

        if (filterTime === 'today') return item.date === todayStr;
        if (filterTime === '7days') return diffDays >= 0 && diffDays <= 7;
        if (filterTime === '30days') return diffDays >= 0 && diffDays <= 30;
        if (filterTime === 'quarter') return diffDays >= 0 && diffDays <= 90;
        if (filterTime === 'range') {
            if (!startDate) return true;
            if (!endDate) return item.date === startDate;
            return item.date >= startDate && item.date <= endDate;
        }
        return true;
      });
    }

    const groups: Record<string, DailyReport[]> = {};
    result.forEach(log => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [logs, searchQuery, filterCat, filterTime, startDate, endDate]);

  const totalPages = groupedLogsByDate.length;
  const currentDayGroup = groupedLogsByDate[currentPage - 1];

  useEffect(() => {
    if (targetDate) {
      const idx = groupedLogsByDate.findIndex(group => group[0] === targetDate);
      if (idx !== -1) {
        setCurrentPage(idx + 1);
      } else {
        setFilterTime('all');
        setSearchQuery('');
        setHeaderData(prev => ({ ...prev, date: targetDate }));
        if (targetDate === new Date().toISOString().split('T')[0]) {
           handleOpenModal();
        }
      }
    }
  }, [targetDate, groupedLogsByDate.length]);

  const handleSetTimeFilter = (type: TimeFilter) => {
    setFilterTime(type);
    setCurrentPage(1);
    if (type !== 'range') {
        setStartDateFilter('');
        setEndDateFilter('');
    }
  };

  const handleDayClick = (dayStr: string) => {
    if (filterTime !== 'range') setFilterTime('range');
    
    if (!startDate || (startDate && endDate)) {
      setStartDateFilter(dayStr);
      setEndDateFilter('');
    } else {
      if (dayStr < startDate) {
        setStartDateFilter(dayStr);
        setEndDateFilter(startDate);
      } else {
        setEndDateFilter(dayStr);
      }
    }
    setCurrentPage(1);
  };

  const renderCalendarGrid = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(<div key={`pad-${i}`} className="h-10"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayStr = dateObj.toISOString().split('T')[0];
      const isSelectedStart = startDate === dayStr;
      const isSelectedEnd = endDate === dayStr;
      const isInRange = startDate && endDate && dayStr > startDate && dayStr < endDate;
      const hasLogs = logs.some(logEntry => logEntry.date === dayStr);

      days.push(
        <button
          key={d}
          onClick={() => handleDayClick(dayStr)}
          className={`h-10 w-full flex flex-col items-center justify-center rounded-xl text-[11px] font-black transition-all relative group
            ${isSelectedStart || isSelectedEnd ? 'bg-blue-600 text-white shadow-lg' : ''}
            ${isInRange ? 'bg-blue-50 text-blue-600' : ''}
            ${!isSelectedStart && !isSelectedEnd && !isInRange ? 'hover:bg-slate-100 text-slate-600' : ''}
          `}
        >
          {d}
          {hasLogs && !isSelectedStart && !isSelectedEnd && (
            <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isInRange ? 'bg-blue-400' : 'bg-indigo-300'}`}></div>
          )}
        </button>
      );
    }
    return days;
  };

  // Logic: Filter and Paginate History list inside modal
  const filteredHistory = useMemo(() => {
    return pastActivityTitles.filter(t => t.toLowerCase().includes(historySearch.toLowerCase()));
  }, [pastActivityTitles, historySearch]);

  const totalHistoryPages = Math.ceil(filteredHistory.length / historyPerPage);
  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);
  }, [filteredHistory, historyPage]);

  const dayNames = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-blue-500/10">
        <div className="relative z-10 senior-header-content flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">Aktivitas Harian</h2>
            <p className="opacity-80 max-w-lg mt-2 italic text-xs lg:text-sm font-medium">"{affirmation}"</p>
          </div>
          <div className="flex gap-2 lg:gap-3">
            <button 
              onClick={() => setIsManageCatsOpen(true)}
              className="flex-1 lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black rounded-xl lg:rounded-2xl hover:bg-white/20 transition-all active:scale-95 text-[10px] lg:text-xs uppercase tracking-widest"
            >
              ⚙️ Kategori
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 bg-white text-blue-600 font-black rounded-xl lg:rounded-2xl shadow-lg hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest text-[10px] lg:text-xs"
            >
              🚀 + Tambah Rencana
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      {/* INFO KUOTA - HIDDEN FOR PRO */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 mx-1 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-database-fill"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Daily Work Log ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {logs.length} / {limit === 'unlimited' ? '∞' : limit} Slot Aktivitas Digunakan
                 </p>
              </div>
           </div>
           <button 
              onClick={onUpgrade}
              className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95"
           >
              🚀 Upgrade Kuota
           </button>
        </div>
      )}

      {/* Primary Filters */}
      <div className="bg-white p-6 lg:p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-6 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pencarian Aktivitas</label>
                <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Apa yang Anda cari hari ini?" 
                        className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/50 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>
            <div className="lg:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                <select 
                    className="w-full px-6 py-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/50 text-sm font-bold outline-none cursor-pointer"
                    value={filterCat}
                    onChange={(e) => { setFilterCat(e.target.value); setCurrentPage(1); }}
                >
                    <option value="all">Semua Bidang</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="lg:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Navigasi Waktu</label>
                <select 
                    className="w-full px-6 py-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/50 text-sm font-bold outline-none cursor-pointer"
                    value={filterTime}
                    onChange={(e) => handleSetTimeFilter(e.target.value as TimeFilter)}
                >
                    <option value="all">Kapanpun</option>
                    <option value="today">Hari Ini</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="30days">1 Bulan Terakhir</option>
                    <option value="quarter">Quarter (3 Bulan)</option>
                    <option value="range">Kustom Kalender</option>
                </select>
            </div>
        </div>

        {/* Modern Range Calendar Interface */}
        {(filterTime === 'range' || filterTime !== 'all') && (
            <div className="animate-in slide-in-from-top-4 duration-500 bg-slate-50 p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8 relative overflow-hidden">
                <div className="md:col-span-8 space-y-6 relative z-10">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex gap-2">
                            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1))} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400">←</button>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight w-32 text-center">
                                {calDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                            </h4>
                            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1))} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400">→</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center border-t border-slate-200 pt-4">
                        {dayNames.map((d, i) => <div key={i} className="text-[10px] font-black text-slate-300 py-2">{d}</div>)}
                        {renderCalendarGrid()}
                    </div>
                </div>
                <div className="md:col-span-4 bg-indigo-600 text-white p-8 rounded-[2rem] flex flex-col justify-between shadow-2xl shadow-indigo-200">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Terdeteksi</p>
                        <p className="text-4xl font-black tracking-tighter">{totalPages} <span className="text-lg opacity-40">Hari</span></p>
                    </div>
                    <button onClick={() => handleSetTimeFilter('all')} className="text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:text-white">× Reset Filter</button>
                </div>
            </div>
        )}
      </div>

      {/* Main Content View */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
        {currentDayGroup ? (
          <div className="animate-in fade-in duration-700 flex-1">
            <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100">📅</div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                        {new Date(currentDayGroup[0]).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                 </div>
              </div>
              <button 
                onClick={() => handleOpenModal(currentDayGroup[1][0], true)} 
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                🔥 Update Progress
              </button>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px] table-fixed">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white border-b border-slate-50">
                    <th className="px-10 py-6 text-center w-20">No</th>
                    <th className="px-6 py-6 w-80">Aktivitas Utama</th>
                    <th className="px-6 py-6 w-48 text-center">Konteks</th>
                    <th className="px-6 py-6 w-44 text-center">Kategori</th>
                    <th className="px-6 py-6 w-64">Output / Realita</th>
                    <th className="px-6 py-6 w-60 text-center">Metric / Progress</th>
                    <th className="px-10 py-6 w-28 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {currentDayGroup[1].map((log, index) => {
                    const isPercentage = log.metricLabel.includes('%') || log.metricLabel.toLowerCase().includes('persen');
                    return (
                        <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors group ${log.isPlan ? 'bg-amber-50/5 italic' : ''}`}>
                            <td className="px-10 py-6 text-center font-black text-slate-300 text-sm">{index + 1}</td>
                            <td className="px-6 py-6"><div className="font-black text-slate-800 text-sm leading-tight">{log.activity}</div></td>
                            <td className="px-6 py-6 text-center"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block ${log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{log.context}</span></td>
                            <td className="px-6 py-6 text-center"><span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block bg-blue-50 text-blue-600 border-blue-100">{log.category}</span></td>
                            <td className="px-6 py-6 font-bold text-slate-600 text-[13px] break-words">{log.isPlan ? <span className="text-slate-300 italic">Menunggu Hasil</span> : (log.output || log.activity)}</td>
                            <td className="px-6 py-6 text-center"><span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">{log.metricValue} {log.metricLabel}</span></td>
                            <td className="px-10 py-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleOpenModal(log)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm">✎</button>
                                  <button onClick={() => onDelete(log.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm">✕</button>
                              </div>
                            </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-6">
             <div className="text-7xl opacity-20 grayscale">🕯️</div>
             <button onClick={() => handleOpenModal()} className="px-10 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">+ Catat Aktivitas</button>
          </div>
        )}
      </div>

      {/* MULTI-ACTIVITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl p-8 lg:p-14 animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh] no-scrollbar">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editingLogId ? 'Ubah Catatan' : 'Catat Pekerjaan Baru'}</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Log Aktivitas Produktivitas v2.0</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors text-xl font-black">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input type="date" className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm text-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={headerData.date} onChange={e => setHeaderData({ ...headerData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konteks Pekerjaan</label>
                  <select className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm cursor-pointer shadow-sm" value={headerData.context} onChange={e => setHeaderData({ ...headerData, context: e.target.value as any })}>
                    <option value="Perusahaan">Kantor (Perusahaan)</option>
                    <option value="Personal">Personal Proyek</option>
                    <option value="Sampingan">Freelance / Sampingan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identitas Instansi</label>
                  <input placeholder="Nama Perusahaan" className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm shadow-sm" value={headerData.companyName} onChange={e => setHeaderData({ ...headerData, companyName: e.target.value })} />
                </div>
              </div>

              {/* Activity Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Daftar Pekerjaan</h4>
                  <button type="button" onClick={handleAddLine} className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2">
                    <span className="text-lg">+</span> Tambah Baris
                  </button>
                </div>

                <div className="space-y-6">
                  {activityLines.map((line) => (
                    <div key={line.tempId} className={`p-8 lg:p-10 border rounded-[3rem] shadow-sm space-y-6 animate-in slide-in-from-top-4 relative group ${line.isPlan ? 'bg-white border-slate-100' : 'bg-emerald-50/10 border-emerald-100'}`}>
                      {activityLines.length > 1 && (
                        <button type="button" onClick={() => handleRemoveLine(line.tempId)} className="absolute -top-3 -right-3 w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center font-black shadow-lg hover:bg-rose-500 hover:text-white transition-all z-20">✕</button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-8 space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aktivitas Utama</label>
                             <div className="relative">
                               <input placeholder="Ketik apa yang Anda kerjakan..." className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm pr-24" value={line.activity} onChange={e => updateLine(line.tempId, { activity: e.target.value })} />
                               <button type="button" onClick={() => setShowHistoryFor(showHistoryFor === line.tempId ? null : line.tempId)} className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">🕒 RIWAYAT</button>

                               {showHistoryFor === line.tempId && (
                                 <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[100] p-4 max-h-[350px] overflow-hidden animate-in slide-in-from-top-2 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilih dari Riwayat (Seminggu Terakhir)</p>
                                       <input 
                                         placeholder="Cari..." 
                                         className="px-3 py-1 rounded-lg border text-[10px] outline-none w-32" 
                                         value={historySearch} 
                                         onChange={e => {setHistorySearch(e.target.value); setHistoryPage(1);}} 
                                         onClick={e => e.stopPropagation()} 
                                       />
                                    </div>
                                    <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                                      {paginatedHistory.length > 0 ? (
                                        paginatedHistory.map(title => (
                                          <button key={title} type="button" onClick={() => { updateLine(line.tempId, { activity: title, category: pastActivitiesMap[title].category, metricOption: metricChoices.includes(pastActivitiesMap[title].metricLabel) ? pastActivitiesMap[title].metricLabel : 'Custom', customMetricLabel: metricChoices.includes(pastActivitiesMap[title].metricLabel) ? '' : pastActivitiesMap[title].metricLabel, metricValue: pastActivitiesMap[title].metricValue, targetValue: pastActivitiesMap[title].targetValue }); setShowHistoryFor(null); }} className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl text-[10px] font-bold text-slate-700 flex justify-between items-center group transition-colors">
                                            <span>{title}</span>
                                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded uppercase">{pastActivitiesMap[title].category}</span>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="p-10 text-center text-[10px] text-slate-400 italic">Data tidak ditemukan</div>
                                      )}
                                    </div>
                                    {totalHistoryPages > 1 && (
                                      <div className="mt-4 pt-4 border-t flex justify-center gap-2">
                                        {Array.from({ length: totalHistoryPages }).map((_, i) => (
                                          <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setHistoryPage(i + 1); }} className={`w-6 h-6 rounded-md text-[8px] font-black transition-all ${historyPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>{i + 1}</button>
                                        ))}
                                      </div>
                                    )}
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>

                        <div className="md:col-span-4 space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                            <select className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none shadow-sm cursor-pointer" value={line.category} onChange={e => updateLine(line.tempId, { category: e.target.value })}>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-3 bg-slate-50 p-1.5 rounded-2xl">
                             <button type="button" onClick={() => updateLine(line.tempId, { isPlan: true })} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${line.isPlan ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Rencana</button>
                             <button type="button" onClick={() => updateLine(line.tempId, { isPlan: false })} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!line.isPlan ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Selesai</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-6 pt-10 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-[2rem] text-[11px]">Batal</button>
                <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-blue-500/20 hover:bg-blue-700 transition-all text-[11px]">🚀 Simpan Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogs;