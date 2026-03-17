
import React, { useState, useMemo, useEffect } from 'react';
import { ToDoTask, AppData, SubscriptionPlan } from '../types';

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
  appData?: AppData;
  onUpgrade?: () => void;
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
  targetDate,
  appData,
  onUpgrade
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
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.todoList || 10;
    if (appData?.plan === SubscriptionPlan.FREE && limit !== 'unlimited' && tasks.length >= Number(limit)) {
      alert(`Batas langkah pengembangan tercapai (${limit}). Silakan upgrade paket untuk perencanaan tanpa batas.`);
      onUpgrade?.();
      return;
    }

    const newTask: ToDoTask = {
      id: Math.random().toString(36).substr(2, 9),
      task: newTaskText,
      description: newTaskDesc,
      category: selectedCategory,
      status: 'Pending',
      createdAt: new Date(newTaskDate).toISOString(),
      source: 'Manual',
      isFocusToday: false
    };

    onAdd(newTask);
    setNewTaskText('');
    setNewTaskDesc('');
    setNewTaskDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1); // Jump to first page to see the new task
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) {
      alert("Kategori sudah ada!");
      return;
    }
    onAddCategory?.(newCatName.trim());
    setNewCatName('');
  };

  const handleUpdateCategory = () => {
    if (!editingCat || !editingCat.next.trim()) return;
    if (categories.includes(editingCat.next.trim()) && editingCat.next.trim() !== editingCat.old) {
      alert("Nama kategori sudah digunakan!");
      return;
    }
    onUpdateCategory?.(editingCat.old, editingCat.next.trim());
    setEditingCat(null);
  };

  const handleDeleteCategory = (cat: string) => {
    if (window.confirm(`Hapus kategori "${cat}"? Langkah pengembangan dengan kategori ini tidak akan terhapus, namun kategorinya mungkin hilang.`)) {
      onDeleteCategory?.(cat);
    }
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

    // VALIDASI LIMIT DATABASE PAKET FREE UNTUK DUPLIKAT
    const limit = appData?.planLimits?.todoList || 10;
    if (appData?.plan === SubscriptionPlan.FREE && limit !== 'unlimited' && tasks.length >= Number(limit)) {
      alert(`Batas langkah pengembangan tercapai (${limit}). Tidak bisa menduplikat.`);
      onUpgrade?.();
      return;
    }
    
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

  const limit = appData?.planLimits?.todoList || 10;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Langkah Pengembangan</h2>
          <p className="text-slate-500 font-medium italic">"Kelola langkah-langkah kecil menuju target besar Anda."</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setActiveView('checklist')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'checklist' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Checklist</button>
           <button onClick={() => setActiveView('categories')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'categories' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Kategori</button>
        </div>
      </header>

      {/* INFO KUOTA (QUOTA BANNER) - HIDDEN FOR PAID PLANS */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 mx-1 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-list-check"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Checklist Proyek ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {tasks.length} / {limit === 'unlimited' ? '∞' : limit} Langkah Terdaftar
                 </p>
              </div>
           </div>
           <button 
              onClick={onUpgrade}
              className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95"
           >
              🚀 Upgrade Plan
           </button>
        </div>
      )}

      {activeView === 'checklist' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bidang Pengembangan</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                      value={selectedCategory || ''}
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
                      value={newTaskText || ''}
                      onChange={(e) => setNewTaskText(e.target.value)}
                    />
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Detil (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="Berikan deskripsi atau catatan tambahan..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all"
                      value={newTaskDesc || ''}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Target</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all"
                      value={newTaskDate || ''}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                    />
                 </div>
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

              {isFilterVisible && (
                <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Langkah</label>
                      <div className="relative">
                         <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                         <input 
                           type="text" 
                           placeholder="Cari..." 
                           className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/10"
                           value={searchQuery || ''}
                           onChange={(e) => setSearchQuery(e.target.value)}
                         />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Kategori</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/10"
                        value={filterCat || ''}
                        onChange={(e) => setFilterCat(e.target.value)}
                      >
                        <option value="all">Semua Kategori</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/10"
                        value={filterStatus || ''}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">Semua Status</option>
                        <option value="Pending">Belum Selesai</option>
                        <option value="Completed">Selesai</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/10"
                        value={filterTime || ''}
                        onChange={(e) => setFilterTime(e.target.value as TimeFilter)}
                      >
                        <option value="all">Semua Waktu</option>
                        <option value="today">Hari Ini</option>
                        <option value="7days">7 Hari Terakhir</option>
                        <option value="30days">30 Hari Terakhir</option>
                        <option value="range">Rentang Tanggal</option>
                      </select>
                   </div>
                   
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/10"
                        value={searchMonth || ''}
                        onChange={(e) => setSearchMonth(e.target.value)}
                      >
                        {monthsList.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500/10"
                        value={searchYear || ''}
                        onChange={(e) => setSearchYear(e.target.value)}
                      >
                        <option value="all">Semua Tahun</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>
                   </div>

                   {filterTime === 'range' && (
                      <div className="md:col-span-2 lg:col-span-4 pt-4 border-t border-slate-50">
                         <div className="flex justify-between items-center mb-4">
                            <button type="button" onClick={() => setCalDate(new Date(calDate.setMonth(calDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-lg"><i className="bi bi-chevron-left"></i></button>
                            <span className="font-black text-sm uppercase tracking-widest">{monthsList.find(m => m.v === calDate.getMonth().toString())?.l} {calDate.getFullYear()}</span>
                            <button type="button" onClick={() => setCalDate(new Date(calDate.setMonth(calDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-lg"><i className="bi bi-chevron-right"></i></button>
                         </div>
                         <div className="grid grid-cols-7 gap-2">
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                               <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2">{d}</div>
                            ))}
                            {renderCalendarGrid()}
                         </div>
                      </div>
                   )}
                </div>
              )}
            </form>
          </div>

          <div className="space-y-6">
            {currentDayGroup ? (
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Checklist Tanggal {new Date(currentDayGroup.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                  <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30">←</button>
                    {/* Fixed typo: changed setCurrentDate to setCurrentPage */}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30">→</button>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                   {currentDayGroup.list.map(task => (
                      <div key={task.id} className={`p-6 flex items-center gap-6 group transition-all ${task.status === 'Completed' ? 'bg-slate-50/30' : ''}`}>
                         <button onClick={() => toggleStatus(task)} className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-200 text-transparent hover:border-indigo-400'}`}>
                           <i className="bi bi-check-lg text-lg"></i>
                         </button>
                         <div className="flex-1">
                            <div className="flex items-center gap-3">
                               <p className={`text-sm font-black text-slate-800 uppercase ${task.status === 'Completed' ? 'line-through text-slate-300' : ''}`}>{task.task}</p>
                               {task.isFocusToday && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">Focus Today</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.category} {task.source === 'AI' && <span className="text-indigo-400 ml-2">✨ AI Generated</span>}</p>
                              <span className="text-[10px] font-bold text-slate-300">•</span>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <i className="bi bi-calendar-event"></i> {new Date(task.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleFocus(task)} className={`p-2 rounded-lg border ${task.isFocusToday ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Set as Focus Today"><i className="bi bi-lightning-fill"></i></button>
                            <button onClick={() => setDuplicatingTask(task)} className="p-2 bg-slate-50 border border-slate-100 text-slate-300 rounded-lg hover:text-indigo-600"><i className="bi bi-files"></i></button>
                            <button onClick={() => onDelete(task.id)} className="p-2 bg-slate-50 border border-slate-100 text-slate-300 rounded-lg hover:text-rose-600"><i className="bi bi-trash"></i></button>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 italic">Belum ada langkah pengembangan.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tambah Kategori Baru</label>
                <input 
                  type="text"
                  placeholder="Nama kategori..."
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={newCatName || ''}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Tambah
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                {editingCat?.old === cat ? (
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      autoFocus
                      className="flex-1 bg-slate-50 px-3 py-2 rounded-xl text-sm font-bold outline-none border border-indigo-200"
                      value={editingCat.next || ''}
                      onChange={(e) => setEditingCat({...editingCat, next: e.target.value})}
                    />
                    <button onClick={handleUpdateCategory} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><i className="bi bi-check-lg"></i></button>
                    <button onClick={() => setEditingCat(null)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100"><i className="bi bi-x-lg"></i></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-sm">
                        {cat.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{cat}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingCat({old: cat, next: cat})} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><i className="bi bi-pencil-square"></i></button>
                      <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><i className="bi bi-trash"></i></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToDoList;
