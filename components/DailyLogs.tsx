
import React, { useState, useMemo, useEffect } from 'react';
import { DailyReport } from '../types';

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

const DailyLogs: React.FC<DailyLogsProps> = ({ logs, categories, currentCompany, onAdd, onUpdate, onDelete, onAddCategory, onDeleteCategory, affirmation, targetDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  
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

  const metricChoices = ['Laporan', 'Jam', 'Berkas', 'Persentase (%)', 'Nominal (IDR)', 'Custom'];

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
      setActivityLines(activityLines.filter(l => l.tempId !== tempId));
    }
  };

  const updateLine = (tempId: string, fields: Partial<ActivityLine>) => {
    setActivityLines(activityLines.map(l => l.tempId === tempId ? { ...l, ...fields } : l));
  };

  const handleOpenModal = (log?: DailyReport, asExecute: boolean = false) => {
    setIsExecutingPlan(asExecute);
    if (asExecute && log) {
      setEditingLogId(null);
      setHeaderData({
        date: log.date,
        context: log.context || 'Perusahaan',
        companyName: log.companyName || currentCompany || '',
      });
      
      const dailyLogs = logs.filter(l => l.date === log.date);
      setActivityLines(dailyLogs.map(l => ({
        tempId: l.id,
        activity: l.activity,
        category: l.category,
        output: l.output || l.activity,
        metricValue: l.metricValue,
        targetValue: l.targetValue || 0,
        metricLabel: l.metricLabel,
        metricOption: metricChoices.includes(l.metricLabel) ? l.metricLabel : 'Custom',
        customMetricLabel: metricChoices.includes(l.metricLabel) ? '' : l.metricLabel,
        isPlan: false,
        useCustomOutput: l.output !== l.activity && !!l.output
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
        companyName: currentCompany || '',
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
    const validLines = activityLines.filter(l => l.activity.trim() !== '');
    if (validLines.length === 0) return;

    // Logika Sinkronisasi Penghapusan: Jika dalam mode eksekusi, cek ID yang hilang dari daftar submitted
    if (isExecutingPlan) {
      const submittedIds = new Set(validLines.map(l => l.tempId));
      const originalLogsForDay = logs.filter(l => l.date === headerData.date);
      
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

      const exists = logs.some(l => l.id === line.tempId);
      if (exists) onUpdate(logData);
      else onAdd(logData);
    });
    
    setIsModalOpen(false);
    setIsExecutingPlan(false);
  };

  // Improved Filtering Logic
  const groupedLogsByDate = useMemo(() => {
    let result = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (searchQuery) {
      result = result.filter(l => 
        l.activity.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (l.output && l.output.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterCat !== 'all') {
      result = result.filter(l => l.category === filterCat);
    }

    if (filterTime !== 'all') {
      const now = new Date();
      now.setHours(0,0,0,0);
      const todayStr = now.toISOString().split('T')[0];
      
      result = result.filter(l => {
        const logDate = new Date(l.date);
        logDate.setHours(0,0,0,0);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);

        if (filterTime === 'today') return l.date === todayStr;
        if (filterTime === '7days') return diffDays >= 0 && diffDays <= 7;
        if (filterTime === '30days') return diffDays >= 0 && diffDays <= 30;
        if (filterTime === 'quarter') return diffDays >= 0 && diffDays <= 90;
        if (filterTime === 'range') {
            if (!startDate) return true;
            if (!endDate) return l.date === startDate;
            return l.date >= startDate && l.date <= endDate;
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

  // Logic: Handle Target Date Navigation from Reminder (FIXED)
  useEffect(() => {
    if (targetDate) {
      // Tunggu hingga data groupedLogsByDate terhitung
      const idx = groupedLogsByDate.findIndex(g => g[0] === targetDate);
      if (idx !== -1) {
        setCurrentPage(idx + 1);
      } else {
        // Jika belum ada log di tanggal tsb (karena reminder suruh isi hari ini yang masih kosong)
        // Reset filter agar data muncul
        setFilterTime('all');
        setSearchQuery('');
        // Pastikan header data siap dengan tanggal target
        setHeaderData(prev => ({ ...prev, date: targetDate }));
        // Buka modal secara otomatis jika user datang dari reminder "Hari Ini"
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
      const hasLogs = logs.some(l => l.date === dayStr);

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

      {/* Primary Filters - Unified Row */}
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
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Mulai</p>
                                <p className="text-[10px] font-black text-blue-600">{startDate || 'Pilih...'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Hingga</p>
                                <p className="text-[10px] font-black text-blue-600">{endDate || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center border-t border-slate-200 pt-4">
                        {dayNames.map((d, i) => <div key={i} className="text-[10px] font-black text-slate-300 py-2">{d}</div>)}
                        {renderCalendarGrid()}
                    </div>

                    <div className="flex gap-3 items-center pt-4 border-t border-slate-200">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Presets:</span>
                        <div className="flex gap-2">
                            {[{l:'7 Hari', t:'7days'}, {l:'30 Hari', t:'30days'}, {l:'Quarter', t:'quarter'}].map(p => (
                                <button 
                                    key={p.t}
                                    onClick={() => handleSetTimeFilter(p.t as TimeFilter)}
                                    className={`px-4 py-1.5 border rounded-full text-[9px] font-black uppercase transition-all shadow-sm ${filterTime === p.t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600'}`}
                                >
                                    {p.l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-4 bg-indigo-600 text-white p-8 rounded-[2rem] flex flex-col justify-between shadow-2xl shadow-indigo-200">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Terdeteksi</p>
                        <p className="text-4xl font-black tracking-tighter">{totalPages} <span className="text-lg opacity-40">Hari</span></p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold opacity-80 leading-relaxed italic">"Archive digital Anda siap untuk ditinjau."</p>
                        <button onClick={() => handleSetTimeFilter('all')} className="text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:text-white">× Reset Semua Filter</button>
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            </div>
        )}
      </div>

      {/* Main Content View (Table for Desktop, Cards for Mobile) */}
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
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Laporan Aktivitas Harian</p>
                 </div>
              </div>
              <button 
                onClick={() => handleOpenModal(currentDayGroup[1][0], true)} 
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                🔥 Update Progress
              </button>
            </div>
            
            {/* Desktop Table View */}
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
                            <td className="px-10 py-6 text-center font-black text-slate-300 text-sm">
                            {index + 1}
                            </td>
                            <td className="px-6 py-6">
                            <div className="font-black text-slate-800 text-sm leading-tight">
                                {log.activity}
                                {log.isPlan && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] rounded uppercase font-black tracking-widest not-italic">PLAN</span>}
                            </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block ${
                                log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                log.context === 'Personal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                {log.context}
                                </span>
                            </td>
                            <td className="px-6 py-6 text-center">
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block bg-blue-50 text-blue-600 border-blue-100">
                                {log.category}
                            </span>
                            </td>
                            <td className="px-6 py-6 font-bold text-slate-600 text-[13px] break-words">
                            {log.isPlan ? <span className="text-slate-300 italic">Menunggu Hasil</span> : (log.output || log.activity)}
                            </td>
                            <td className="px-6 py-6">
                            {isPercentage ? (
                                <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase text-blue-600">
                                    <span>{log.isPlan ? 'Target' : 'Terealisasi'}</span>
                                    <span>{log.isPlan ? log.targetValue : log.metricValue}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div className={`h-full transition-all duration-700 ${log.isPlan ? 'bg-amber-400' : 'bg-blue-600'}`} style={{ width: `${Math.min(log.isPlan ? (log.targetValue || 0) : log.metricValue, 100)}%` }}></div>
                                </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                <span className={`px-4 py-2 ${log.isPlan ? 'bg-amber-500' : 'bg-indigo-600'} text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm`}>
                                    {log.isPlan ? `Target: ` : ``}
                                    {log.metricLabel.includes('IDR') ? `Rp ${(log.isPlan ? log.targetValue : log.metricValue)?.toLocaleString()}` : `${log.isPlan ? log.targetValue : log.metricValue} ${log.metricLabel}`}
                                </span>
                                </div>
                            )}
                            </td>
                            <td className="px-10 py-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleOpenModal(log)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm">✎</button>
                                <button onClick={() => onDelete(log.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm">✕</button>
                            </div>
                            </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>

            {/* Mobile Card Mode View */}
            <div className="lg:hidden bg-white">
              {currentDayGroup[1].map((log, index) => {
                const isPercentage = log.metricLabel.includes('%') || log.metricLabel.toLowerCase().includes('persen');
                return (
                  <div key={log.id} className={`p-6 border-b border-slate-50 last:border-none space-y-4 ${log.isPlan ? 'bg-amber-50/5' : ''}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                           <span className="text-[10px] font-black text-slate-300">#{index + 1}</span>
                           <div>
                              <h4 className={`font-black text-slate-800 text-sm leading-tight ${log.isPlan ? 'italic' : ''}`}>
                                 {log.activity}
                                 {log.isPlan && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] rounded uppercase font-black tracking-widest not-italic">PLAN</span>}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-3">
                                 <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                   log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                   log.context === 'Personal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                   'bg-amber-50 text-amber-600 border-amber-100'
                                 }`}>{log.context}</span>
                                 <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-100">{log.category}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-4">
                           <button onClick={() => handleOpenModal(log)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl">✎</button>
                           <button onClick={() => onDelete(log.id)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl">✕</button>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Output / Realita</p>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed">
                             {log.isPlan ? <span className="italic opacity-50">Menunggu Hasil</span> : (log.output || log.activity)}
                          </p>
                       </div>
                       
                       <div className="pt-3 border-t border-slate-200/50 flex justify-between items-center">
                          <div className="flex-1">
                             {isPercentage ? (
                               <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase">
                                     <span className="text-slate-400">{log.isPlan ? 'Target' : 'Capaian'}</span>
                                     <span className="text-blue-600">{log.isPlan ? log.targetValue : log.metricValue}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                     <div className={`h-full transition-all duration-700 ${log.isPlan ? 'bg-amber-400' : 'bg-blue-600'}`} style={{width: `${Math.min(log.isPlan ? (log.targetValue || 0) : log.metricValue, 100)}%`}}></div>
                                  </div>
                               </div>
                             ) : (
                               <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${log.isPlan ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                                 {log.isPlan ? 'TGT: ' : ''}{log.metricLabel.includes('IDR') ? `Rp ${(log.isPlan ? log.targetValue : log.metricValue)?.toLocaleString()}` : `${log.isPlan ? log.targetValue : log.metricValue} ${log.metricLabel}`}
                               </span>
                             )}
                          </div>
                          {log.isPlan && (
                            <button 
                             onClick={() => handleOpenModal(log, true)}
                             className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.1em] shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
                            >
                              🚀 Update
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-6">
             <div className="text-7xl opacity-20 grayscale">🕯️</div>
             <div className="text-center">
                <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Belum Ada Data Log</p>
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest mt-2">Atur ulang filter atau buat entri baru untuk hari ini.</p>
             </div>
             <button onClick={() => handleOpenModal()} className="px-10 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">+ Catat Aktivitas</button>
          </div>
        )}
      </div>

      {/* Archive Navigation */}
      {totalPages > 0 && (
        <div className="bg-white p-8 lg:p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-14 h-14 flex items-center justify-center bg-slate-900 text-white disabled:bg-slate-50 disabled:text-slate-200 rounded-[1.5rem] transition-all shadow-xl shadow-slate-200 font-black text-xl active:scale-90"
                >
                    ←
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Pilih Tanggal</p>
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter">{currentPage} <span className="text-slate-300 font-medium mx-2">DARI</span> {totalPages}</h4>
                </div>
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-14 h-14 flex items-center justify-center bg-slate-900 text-white disabled:bg-slate-50 disabled:text-slate-200 rounded-[1.5rem] transition-all shadow-xl shadow-slate-200 font-black text-xl active:scale-90"
                >
                    →
                </button>
            </div>

            <div className="flex-1 max-w-lg overflow-x-auto no-scrollbar pb-2 flex flex-col items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Navigasi Tanggal</p>
                <div className="flex gap-3 justify-center">
                    {groupedLogsByDate.map((group, i) => (
                        <button 
                            key={group[0]}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`shrink-0 w-11 h-11 rounded-2xl text-[10px] font-black transition-all border flex flex-col items-center justify-center leading-none ${
                                currentPage === i + 1 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-110' 
                                : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                            }`}
                        >
                            <span className="text-[6px] uppercase mb-0.5 opacity-50">Tgl</span>
                            {new Date(group[0]).getDate()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Multi-Activity Modal UI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] p-8 lg:p-14 animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh] no-scrollbar">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                   {isExecutingPlan ? 'Update Progress Pekerjaan' : (editingLogId ? 'Ubah Catatan' : 'Catat Pekerjaan Baru')}
                </h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                   Log Aktivitas Produktivitas v2.0
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors text-xl font-black">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input 
                    type="date" 
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-black text-sm text-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                    value={headerData.date}
                    onChange={e => setHeaderData({ ...headerData, date: e.target.value })}
                    disabled={isExecutingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konteks Pekerjaan</label>
                  <select 
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-black text-sm cursor-pointer shadow-sm"
                    value={headerData.context}
                    onChange={e => setHeaderData({ ...headerData, context: e.target.value as any })}
                    disabled={isExecutingPlan}
                  >
                    <option value="Perusahaan">Kantor (Perusahaan)</option>
                    <option value="Personal">Personal Proyek</option>
                    <option value="Sampingan">Freelance / Sampingan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identitas Instansi</label>
                  <input 
                    placeholder={currentCompany || "Nama Perusahaan"}
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-black text-sm shadow-sm"
                    value={headerData.companyName}
                    onChange={e => setHeaderData({ ...headerData, companyName: e.target.value })}
                    disabled={isExecutingPlan}
                  />
                </div>
              </div>

              {/* Activity Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Daftar Pekerjaan</h4>
                  {(!editingLogId || isExecutingPlan) && (
                    <button 
                      type="button" 
                      onClick={handleAddLine}
                      className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">+</span> Tambah Baris
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {activityLines.map((line) => (
                    <div key={line.tempId} className={`p-8 lg:p-10 border rounded-[3rem] shadow-sm space-y-6 animate-in slide-in-from-top-4 relative group ${line.isPlan ? 'bg-white border-slate-100' : 'bg-emerald-50/10 border-emerald-100'}`}>
                      {activityLines.length > 1 && !editingLogId && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveLine(line.tempId)}
                          className="absolute -top-3 -right-3 w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center font-black shadow-lg hover:bg-rose-500 hover:text-white transition-all z-20"
                        >
                          ✕
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-8 space-y-6">
                          <div className="space-y-2">
                             <div className="flex justify-between items-center px-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktivitas Utama</label>
                               {!line.isPlan && (
                                 <button 
                                   type="button" 
                                   onClick={() => updateLine(line.tempId, { useCustomOutput: !line.useCustomOutput, output: line.useCustomOutput ? '' : line.output })}
                                   className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg transition-all ${line.useCustomOutput ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 border border-indigo-100'}`}
                                 >
                                   {line.useCustomOutput ? '✓ Custom Output Aktif' : '✎ Set Custom Output'}
                                 </button>
                               )}
                             </div>
                             <input 
                              placeholder="Ketik apa yang Anda kerjakan..."
                              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-black text-sm focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                              value={line.activity}
                              onChange={e => updateLine(line.tempId, { activity: e.target.value })}
                             />
                          </div>
                          {!line.isPlan && line.useCustomOutput && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                               <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Hasil Konkret Khusus</label>
                               <input 
                                placeholder="Jelaskan hasil spesifik Anda..."
                                className="w-full px-6 py-4 rounded-2xl border border-emerald-100 outline-none bg-white font-black text-sm text-emerald-800 shadow-sm focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                value={line.output}
                                onChange={e => updateLine(line.tempId, { output: e.target.value })}
                                required={line.useCustomOutput}
                               />
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-4 space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                            <select 
                              className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none shadow-sm cursor-pointer"
                              value={line.category}
                              onChange={e => updateLine(line.tempId, { category: e.target.value })}
                            >
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-3 bg-slate-50 p-1.5 rounded-2xl">
                             <button type="button" onClick={() => updateLine(line.tempId, { isPlan: true })} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${line.isPlan ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Rencana</button>
                             <button type="button" onClick={() => updateLine(line.tempId, { isPlan: false })} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!line.isPlan ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Selesai</button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50 items-end">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Satuan Metrik</label>
                            <select 
                              className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white font-black text-[11px] shadow-sm"
                              value={line.metricOption}
                              onChange={e => updateLine(line.tempId, { metricOption: e.target.value })}
                            >
                              {metricChoices.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            {line.metricOption === 'Custom' && (
                              <input 
                                placeholder="Ketik Satuan (misal: Modul, Berkas, dsb)"
                                className="w-full px-4 py-2 mt-2 rounded-lg border border-indigo-100 bg-white font-bold text-[10px] outline-none animate-in slide-in-from-top-1"
                                value={line.customMetricLabel}
                                onChange={e => updateLine(line.tempId, { customMetricLabel: e.target.value })}
                              />
                            )}
                         </div>
                         
                         <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-2 px-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase">
                                 {line.isPlan ? 'Target Progres' : 'Realisasi Progres'}
                               </label>
                               {!line.isPlan && line.metricOption.includes('%') && (
                                 <button 
                                   type="button" 
                                   onClick={() => updateLine(line.tempId, { metricValue: 100 })}
                                   className="text-[9px] font-black text-emerald-600 uppercase hover:underline"
                                 >
                                   ✓ Tandai Selesai (100%)
                                 </button>
                               )}
                            </div>
                            <input 
                              type="number"
                              className={`w-full px-5 py-3 rounded-xl border font-black text-sm shadow-sm ${line.isPlan ? 'bg-slate-50 border-slate-200' : 'bg-white border-emerald-100 text-emerald-600'}`}
                              value={line.isPlan ? line.targetValue : line.metricValue}
                              onChange={e => {
                                const v = parseInt(e.target.value) || 0;
                                if (line.isPlan) updateLine(line.tempId, { targetValue: v });
                                else updateLine(line.tempId, { metricValue: v });
                              }}
                            />
                         </div>

                         <div className="flex items-center justify-end h-full pb-2">
                           <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                             {line.isPlan ? `TGT: ${line.targetValue}` : `RL: ${line.metricValue}`} {line.metricOption === 'Custom' ? line.customMetricLabel : line.metricOption}
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-6 pt-10 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-[2rem] transition-all text-[11px]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-[11px]"
                >
                  {isExecutingPlan ? '🔥 Simpan Realisasi' : (editingLogId ? 'Simpan Perubahan' : '🚀 Simpan Laporan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE CATEGORIES */}
      {isManageCatsOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[300] p-4">
          <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl p-8 lg:p-10 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kelola Bidang Kerja</h3>
                <button onClick={() => setIsManageCatsOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
             </div>

             <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar mb-8">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <span className="text-sm font-bold text-slate-700">{cat}</span>
                    <button 
                      onClick={() => onDeleteCategory(cat)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <i className="bi bi-trash-fill text-xs"></i>
                    </button>
                  </div>
                ))}
             </div>

             <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Kategori Baru</p>
                <div className="flex gap-2">
                   <input 
                    placeholder="Nama kategori..."
                    className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs"
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter' && newCatInput.trim()) { onAddCategory(newCatInput); setNewCatInput(''); } }}
                   />
                   <button 
                    onClick={() => { if(newCatInput.trim()) { onAddCategory(newCatInput); setNewCatInput(''); } }}
                    className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-blue-100"
                   >
                     Tambah
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogs;
