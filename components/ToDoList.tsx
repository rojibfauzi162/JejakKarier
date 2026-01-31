
import React, { useState, useMemo, useEffect } from 'react';
import { ToDoTask } from '../types';

interface ToDoListProps {
  tasks: ToDoTask[];
  categories: string[];
  onAdd: (task: ToDoTask) => void;
  onUpdate: (task: ToDoTask) => void;
  onDelete: (id: string) => void;
  onAddCategory?: (cat: string) => void;
  onUpdateCategory?: (old: string, next: string) => void;
  onDeleteCategory?: (cat: string) => void;
  targetDate?: string;
}

const FIXED_CATEGORIES = ['Pendukung Kerja', 'Pengembangan Diri', 'Buka Peluang', 'Keseimbangan Hidup'];

type TimeFilter = 'all' | 'today' | '7days' | '30days' | 'range';

const ToDoList: React.FC<ToDoListProps> = ({ 
  tasks, 
  categories, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory,
  targetDate
}) => {
  const [activeView, setActiveView] = useState<'checklist' | 'categories'>('checklist');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || FIXED_CATEGORIES[0]);
  
  // Filters Visibility State
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTime, setFilterTime] = useState<TimeFilter>('all');

  // Month & Year Search Filter States
  const [searchMonth, setSearchMonth] = useState('all');
  const [searchYear, setSearchYear] = useState('2026');

  // Pagination State for Daily View
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calendar Range States
  const [startDate, setStartDateFilter] = useState('');
  const [endDate, setEndDateFilter] = useState('');
  const [calDate, setCalDate] = useState(new Date());

  // Duplicate Logic State
  const [duplicatingTask, setDuplicatingTask] = useState<ToDoTask | null>(null);
  const [duplicateTargetDate, setDuplicateTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // Category Management States
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{old: string, next: string} | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: ToDoTask = {
      id: Math.random().toString(36).substr(2, 9),
      task: newTaskText,
      description: newTaskDesc,
      category: selectedCategory,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      source: 'Manual',
      isFocusToday: false
    };

    onAdd(newTask);
    setNewTaskText('');
    setNewTaskDesc('');
    setCurrentPage(1); // Jump to first page to see the new task
  };

  const toggleStatus = (task: ToDoTask) => {
    onUpdate({
      ...task,
      status: task.status === 'Pending' ? 'Completed' : 'Pending'
    });
  };

  const toggleFocus = (task: ToDoTask) => {
    const focusCount = tasks.filter(t => t.isFocusToday).length;
    if (!task.isFocusToday && focusCount >= 3) {
      alert("Maksimal 3 tugas 'Fokus Hari Ini'. Selesaikan tugas fokus sebelumnya terlebih dahulu.");
      return;
    }
    onUpdate({
      ...task,
      isFocusToday: !task.isFocusToday
    });
  };

  const handleExecuteDuplicate = () => {
    if (!duplicatingTask) return;
    
    const targetDate = new Date(duplicateTargetDate);
    const duplicatedTask: ToDoTask = {
      ...duplicatingTask,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: targetDate.toISOString(),
      status: 'Pending',
      isFocusToday: false,
      source: 'Manual'
    };

    onAdd(duplicatedTask);
    alert(`Tugas berhasil diduplikasi ke tanggal ${targetDate.toLocaleDateString('id-ID')}`);
    setDuplicatingTask(null);
  };

  // Calendar Logic
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
  };

  const renderCalendarGrid = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding days (Senin start)
    const padding = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < padding; i++) {
      days.push(<div key={`pad-${i}`} className="h-10"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayStr = dateObj.toISOString().split('T')[0];
      const isSelectedStart = startDate === dayStr;
      const isSelectedEnd = endDate === dayStr;
      const isInRange = startDate && endDate && dayStr > startDate && dayStr < endDate;

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => handleDayClick(dayStr)}
          className={`h-10 w-full flex items-center justify-center rounded-xl text-[11px] font-black transition-all relative
            ${isSelectedStart || isSelectedEnd ? 'bg-blue-600 text-white shadow-lg z-10' : ''}
            ${isInRange ? 'bg-blue-50 text-blue-600' : ''}
            ${!isSelectedStart && !isSelectedEnd && !isInRange ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-700'}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  // Logic Filtering & Grouping by Date with Pagination Support
  const groupedTasks = useMemo(() => {
    let result = [...tasks];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.task.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }

    // Category
    if (filterCat !== 'all') {
      result = result.filter(t => t.category === filterCat);
    }

    // Status
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Month & Year Search Filter
    if (searchMonth !== 'all') {
        result = result.filter(t => new Date(t.createdAt).getMonth().toString() === searchMonth);
    }
    if (searchYear !== 'all') {
        result = result.filter(t => new Date(t.createdAt).getFullYear().toString() === searchYear);
    }

    // Time Presets
    if (filterTime !== 'all') {
      const now = new Date();
      now.setHours(0,0,0,0);
      const todayStr = now.toISOString().split('T')[0];

      result = result.filter(t => {
        const itemDate = new Date(t.createdAt);
        itemDate.setHours(0,0,0,0);
        const itemDateStr = itemDate.toISOString().split('T')[0];
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        
        if (filterTime === 'today') return itemDateStr === todayStr;
        if (filterTime === '7days') return diffDays <= 7;
        if (filterTime === '30days') return diffDays <= 30;
        if (filterTime === 'range') {
            if (!startDate) return true;
            if (!endDate) return itemDateStr === startDate;
            return itemDateStr >= startDate && itemDateStr <= endDate;
        }
        return true;
      });
    }

    // Grouping by Date
    const groups: Record<string, ToDoTask[]> = {};
    result.forEach(task => {
      const dateStr = new Date(task.createdAt).toISOString().split('T')[0];
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });

    // Sort dates descending, but within groups sort focus first
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, list]) => {
      const sortedList = [...list].sort((a, b) => {
        if (a.isFocusToday && !b.isFocusToday) return -1;
        if (!a.isFocusToday && b.isFocusToday) return 1;
        return 0;
      });
      return { date, list: sortedList };
    });
  }, [tasks, searchQuery, filterCat, filterStatus, filterTime, startDate, endDate, searchMonth, searchYear]);

  // Pagination Logic
  const totalPages = groupedTasks.length;
  const currentDayGroup = groupedTasks[currentPage - 1];

  // Logic: Handle Target Date Navigation from Reminder
  useEffect(() => {
    if (targetDate && groupedTasks.length > 0) {
      const idx = groupedTasks.findIndex(g => g.date === targetDate);
      if (idx !== -1) {
        setCurrentPage(idx + 1);
      }
    }
  }, [targetDate, groupedTasks.length]);

  const monthsList = [
    {v: 'all', l: 'Seluruh Bulan'},
    {v: '0', l: 'Januari'}, {v: '1', l: 'Februari'}, {v: '2', l: 'Maret'}, 
    {v: '3', l: 'April'}, {v: '4', l: 'Mei'}, {v: '5', l: 'Juni'}, 
    {v: '6', l: 'Juli'}, {v: '7', l: 'Agustus'}, {v: '8', l: 'September'}, 
    {v: '9', l: 'Oktober'}, {v: '10', l: 'November'}, {v: '11', l: 'Desember'}
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Langkah Pengembangan</h2>
          <p className="text-slate-500 font-medium italic">"Kelola langkah-langkah kecil menuju target besar Anda."</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setActiveView('checklist')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'checklist' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Checklist</button>
           <button onClick={() => setActiveView('categories')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'categories' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Kategori</button>
        </div>
      </header>

      {activeView === 'checklist' ? (
        <>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bidang Pengembangan</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Langkah Utama</label>
                    <input 
                      type="text"
                      placeholder="Ketik langkah baru untuk hari ini..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                    />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Detil (Opsional)</label>
                 <textarea 
                  rows={2}
                  placeholder="Berikan deskripsi atau catatan tambahan..."
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                 />
              </div>
              <div className="flex justify-between items-center">
                <button 
                  type="button"
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${isFilterVisible ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                >
                  <i className={`bi ${isFilterVisible ? 'bi-funnel-fill' : 'bi-funnel'}`}></i>
                  {isFilterVisible ? 'Sembunyikan Filter' : 'Opsi Filter'}
                </button>
                <button type="submit" className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">
                  + Tambah Langkah
                </button>
              </div>
            </form>
          </div>

          {/* Unified Filter Bar - Collapsible */}
          {isFilterVisible && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
               <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 lg:col-span-4 space-y-1.5">
                          <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Cari Langkah</label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input 
                              type="text" 
                              placeholder="Cari aktivitas atau deskripsi..." 
                              className="w-full pl-12 pr-6 py-4 rounded-2xl border-none bg-white font-bold text-xs outline-none focus:ring-4 focus:ring-white/20 transition-all"
                              value={searchQuery}
                              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                          </div>
                      </div>
                      <div className="md:col-span-6 lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Bulan</label>
                          <select 
                            className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none font-bold text-xs cursor-pointer"
                            value={searchMonth}
                            onChange={e => { setSearchMonth(e.target.value); setCurrentPage(1); }}
                          >
                            {monthsList.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                          </select>
                      </div>
                      <div className="md:col-span-6 lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Tahun</label>
                          <select 
                            className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none font-bold text-xs cursor-pointer"
                            value={searchYear}
                            onChange={e => { setSearchYear(e.target.value); setCurrentPage(1); }}
                          >
                            <option value="all">Semua Tahun</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                          </select>
                      </div>
                      <div className="md:col-span-6 lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Kategori</label>
                          <select 
                            className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none font-bold text-xs cursor-pointer"
                            value={filterCat}
                            onChange={e => { setFilterCat(e.target.value); setCurrentPage(1); }}
                          >
                            <option value="all">Semua Bidang</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div className="md:col-span-6 lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Rentang Waktu</label>
                          <select 
                            className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none font-bold text-xs cursor-pointer"
                            value={filterTime}
                            onChange={e => { setFilterTime(e.target.value as TimeFilter); setCurrentPage(1); }}
                          >
                            <option value="all">Kustom (Filter Atas)</option>
                            <option value="today">Hari Ini</option>
                            <option value="7days">7 Hari Terakhir</option>
                            <option value="30days">30 Hari Terakhir</option>
                            <option value="range">Kustom Kalender</option>
                          </select>
                      </div>
                  </div>

                  {/* Calendar Range Selection - Styled like DailyLogs.tsx with White Background fix */}
                  {filterTime === 'range' && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-white/20 grid grid-cols-1 md:grid-cols-12 gap-8 relative overflow-hidden animate-in zoom-in duration-300">
                        <div className="md:col-span-8 space-y-6 relative z-10">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1))} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">←</button>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight w-32 text-center">
                                        {calDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button type="button" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1))} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">→</button>
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

                            <div className="grid grid-cols-7 gap-1 text-center border-t border-slate-50 pt-4">
                                {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => <div key={i} className="text-[10px] font-black text-slate-300 py-2">{d}</div>)}
                                {renderCalendarGrid()}
                            </div>

                            <div className="flex gap-3 items-center pt-4 border-t border-slate-50">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Presets:</span>
                                <div className="flex gap-2">
                                    {[{l:'7 Hari', t:'7days'}, {l:'30 Hari', t:'30days'}].map(p => (
                                        <button 
                                            key={p.t}
                                            type="button"
                                            onClick={() => { setFilterTime(p.t as any); setStartDateFilter(''); setEndDateFilter(''); setCurrentPage(1); }}
                                            className="px-4 py-1.5 border border-slate-100 rounded-full text-[9px] font-black uppercase text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all"
                                        >
                                            {p.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-4 bg-indigo-600 text-white p-8 rounded-[2rem] flex flex-col justify-between shadow-2xl">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Terdeteksi</p>
                                <p className="text-4xl font-black tracking-tighter">{groupedTasks.reduce((acc, g) => acc + g.list.length, 0)} <span className="text-lg opacity-40">Langkah</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold opacity-80 leading-relaxed italic">"Archive langkah pengembangan Anda siap untuk ditinjau."</p>
                                <button type="button" onClick={() => { setFilterTime('all'); setStartDateFilter(''); setEndDateFilter(''); setCurrentPage(1); }} className="text-[9px] font-black uppercase tracking-widest text-indigo-200 hover:text-white transition-colors">× Reset Rentang Waktu</button>
                            </div>
                        </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Daily Structured View with Single Day Pagination */}
          <div className="space-y-10">
            {currentDayGroup ? (
                <div key={currentDayGroup.date} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700">
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100">📅</div>
                        <div>
                           <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                               {new Date(currentDayGroup.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                           </h3>
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Registry Langkah Pengembangan</p>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">{currentDayGroup.list.filter(t => t.status === 'Pending').length} Pending</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{currentDayGroup.list.filter(t => t.status === 'Completed').length} Done</span>
                     </div>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {currentDayGroup.list.map(task => (
                      <div key={task.id} className={`p-6 flex items-start gap-6 group hover:bg-slate-50/50 transition-all ${task.status === 'Completed' ? 'opacity-60' : ''} ${task.isFocusToday ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex flex-col gap-2 pt-1 shrink-0">
                           <button 
                            onClick={() => toggleStatus(task)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              task.status === 'Completed' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-transparent hover:border-emerald-400'
                            }`}
                          >
                            <i className="bi bi-check-lg text-lg"></i>
                          </button>
                          <button 
                            onClick={() => toggleFocus(task)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              task.isFocusToday ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-white border-2 border-slate-100 text-slate-200 hover:text-amber-300'
                            }`}
                            title="Tandai Fokus Hari Ini"
                          >
                            <i className={`bi ${task.isFocusToday ? 'bi-star-fill' : 'bi-star'} text-sm`}></i>
                          </button>
                        </div>
                        
                        <div className="flex-1">
                           <div className="flex items-center gap-3">
                              <p className={`text-base font-black text-slate-800 ${task.status === 'Completed' ? 'line-through decoration-slate-400 text-slate-400' : ''}`}>
                                {task.task}
                              </p>
                              {task.isFocusToday && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded uppercase tracking-widest border border-amber-200">Fokus Hari Ini</span>}
                           </div>
                           
                           {task.description && (
                             <p className={`text-[13px] font-medium text-slate-500 mt-1 leading-relaxed ${task.status === 'Completed' ? 'line-through opacity-40' : ''}`}>
                               {task.description}
                             </p>
                           )}

                           <div className="flex flex-wrap gap-3 mt-4 items-center">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${FIXED_CATEGORIES.includes(task.category) ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {task.category}
                              </span>
                              <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${task.source === 'AI' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-white border-slate-950'}`}>
                                {task.source}
                              </span>
                           </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all pt-1">
                          <button 
                            onClick={() => setDuplicatingTask(task)} 
                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm"
                            title="Duplikat Langkah"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                          <button 
                            onClick={() => onDelete(task.id)} 
                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm"
                            title="Hapus Tugas"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            ) : (
              <div className="py-24 text-center space-y-6 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 animate-in fade-in duration-1000 flex flex-col items-center">
                 <div className="text-7xl grayscale opacity-20"><i className="bi bi-search"></i></div>
                 <div className="text-center">
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Tidak ada langkah ditemukan pada periode ini.</p>
                    <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest mt-2">Gunakan form di atas untuk membuat rencana pengembangan Anda.</p>
                 </div>
                 {(searchQuery || filterCat !== 'all' || filterStatus !== 'all' || filterTime !== 'all' || searchMonth !== 'all') && (
                   <button onClick={() => { setSearchQuery(''); setFilterCat('all'); setFilterStatus('all'); setFilterTime('all'); setStartDateFilter(''); setEndDateFilter(''); setSearchMonth('all'); setCurrentPage(1); }} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Reset Semua Filter</button>
                 )}
              </div>
            )}

            {/* Pagination Controls - Perbaikan Navigasi Label "Tanggal" */}
            {totalPages > 1 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-black transition-all"
                >
                    <i className="bi bi-arrow-left"></i> Hari Sebelumnya
                </button>
                
                <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Navigasi Tanggal</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[250px] md:max-w-md">
                        {groupedTasks.map((g, i) => (
                           <button 
                            key={g.date}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`shrink-0 min-w-[60px] h-12 px-3 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center justify-center leading-none ${currentPage === i + 1 ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                           >
                             <span className="text-[7px] uppercase mb-0.5 opacity-60">Tanggal</span>
                             {new Date(g.date).getDate()}
                           </button>
                        ))}
                    </div>
                </div>

                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-black transition-all"
                >
                    Hari Berikutnya <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl">⚙️</div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Manajemen Kategori</h3>
                   <p className="text-slate-400 font-medium">Atur kelompok langkah pengembangan sesuai kebutuhan Anda.</p>
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kategori Aktif</label>
                <div className="grid grid-cols-1 gap-3">
                   {categories.map(cat => {
                     const isFixed = FIXED_CATEGORIES.includes(cat);
                     return (
                       <div key={cat} className={`flex items-center justify-between p-5 rounded-2xl border group transition-all ${isFixed ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'}`}>
                          <div className="flex items-center gap-4">
                             <span className="font-black text-sm text-slate-700">{cat}</span>
                             {isFixed && <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded">Sistem (Permanen)</span>}
                          </div>
                          
                          {!isFixed && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                onClick={() => setEditingCat({ old: cat, next: cat })}
                                className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                               >
                                 <i className="bi bi-pencil"></i>
                               </button>
                               <button 
                                onClick={() => onDeleteCategory?.(cat)}
                                className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                               >
                                 <i className="bi bi-trash"></i>
                               </button>
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Tambah Kategori Kustom</p>
                <div className="flex gap-4">
                   <input 
                    placeholder="Nama kategori baru..."
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                   />
                   <button 
                    onClick={() => { if(newCatName.trim()){ onAddCategory?.(newCatName); setNewCatName(''); } }}
                    className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                   >
                     + Tambahkan
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Duplicate Task Modal (Calendar View Selection) */}
      {duplicatingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[500] p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 lg:p-12 animate-in zoom-in duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                   <i className="bi bi-copy"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Duplikat Langkah</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2 uppercase tracking-widest">Pilih tanggal target untuk mengulang tugas ini:</p>
              </div>

              <div className="space-y-6">
                 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-xs text-center leading-relaxed">
                   "{duplicatingTask.task}"
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tanggal (Calendar)</label>
                    <input 
                      type="date" 
                      className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 outline-none font-black text-blue-600 focus:border-blue-500 transition-all cursor-pointer"
                      value={duplicateTargetDate}
                      onChange={e => setDuplicateTargetDate(e.target.value)}
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setDuplicatingTask(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] hover:bg-slate-100 transition-all">Batal</button>
                    <button onClick={handleExecuteDuplicate} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Konfirmasi Duplikat</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCat && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[200] p-6">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full animate-in zoom-in duration-300">
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Ubah Nama Kategori</h4>
              <input 
                autoFocus
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm mb-8"
                value={editingCat.next}
                onChange={e => setEditingCat({ ...editingCat, next: e.target.value })}
              />
              <div className="flex gap-4">
                 <button onClick={() => setEditingCat(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                 <button 
                  onClick={() => { onUpdateCategory?.(editingCat.old, editingCat.next); setEditingCat(null); }}
                  className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl"
                 >
                   Simpan
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ToDoList;
