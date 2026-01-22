
import React, { useState, useMemo } from 'react';
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
}

type TimeFilter = 'all' | 'today' | '7days' | '30days' | 'quarter' | 'annual';

const DailyLogs: React.FC<DailyLogsProps> = ({ logs, categories, currentCompany, onAdd, onUpdate, onDelete, onAddCategory, onDeleteCategory, affirmation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterTime, setFilterTime] = useState<TimeFilter>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    category: categories[0] || 'Operasional',
    context: 'Perusahaan' as 'Perusahaan' | 'Personal' | 'Sampingan',
    companyName: currentCompany || '',
    output: '',
    metricValue: 0,
    metricLabel: 'Laporan',
    customMetricLabel: ''
  });

  const [metricOption, setMetricOption] = useState('Laporan');
  const metricChoices = ['Laporan', 'Jam', 'Berkas', 'Persentase (%)', 'Nominal (IDR)', 'Custom'];

  const handleOpenModal = (log?: DailyReport) => {
    if (log) {
      setEditingLogId(log.id);
      setFormData({
        date: log.date,
        activity: log.activity,
        category: log.category,
        context: log.context || 'Perusahaan',
        companyName: log.companyName || currentCompany || '',
        output: log.output,
        metricValue: log.metricValue,
        metricLabel: log.metricLabel,
        customMetricLabel: metricChoices.includes(log.metricLabel) ? '' : log.metricLabel
      });
      setMetricOption(metricChoices.includes(log.metricLabel) ? log.metricLabel : 'Custom');
    } else {
      setEditingLogId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        activity: '',
        category: categories[0] || 'Operasional',
        context: 'Perusahaan',
        companyName: currentCompany || '',
        output: '',
        metricValue: 0,
        metricLabel: 'Laporan',
        customMetricLabel: ''
      });
      setMetricOption('Laporan');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity || !formData.output) return;
    
    const finalMetricLabel = metricOption === 'Custom' ? formData.customMetricLabel : metricOption;
    
    const logData: DailyReport = {
      ...formData,
      metricLabel: finalMetricLabel,
      id: editingLogId || Math.random().toString(36).substr(2, 9),
      reflection: '' 
    };

    if (editingLogId) {
      onUpdate(logData);
    } else {
      onAdd(logData);
    }
    
    setIsModalOpen(false);
  };

  // Logic Filtering
  const filteredLogs = useMemo(() => {
    let result = [...logs].reverse();

    // Search
    if (searchQuery) {
      result = result.filter(l => 
        l.activity.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.output.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category
    if (filterCat !== 'all') {
      result = result.filter(l => l.category === filterCat);
    }

    // Time
    if (filterTime !== 'all') {
      const now = new Date();
      result = result.filter(l => {
        const d = new Date(l.date);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (filterTime === 'today') return d.toDateString() === now.toDateString();
        if (filterTime === '7days') return diffDays <= 7;
        if (filterTime === '30days') return diffDays <= 30;
        if (filterTime === 'quarter') return diffDays <= 90;
        if (filterTime === 'annual') return diffDays <= 365;
        return true;
      });
    }

    return result;
  }, [logs, searchQuery, filterCat, filterTime]);

  // Logic Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-blue-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">Daily Work Performance</h2>
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
              + Log Baru
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pencarian</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Cari aktivitas..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full lg:w-44">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kategori</label>
          <select 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-full lg:w-44">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Waktu</label>
          <select 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value as TimeFilter)}
          >
            <option value="all">Kapanpun</option>
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="quarter">Quarter (3 Bln)</option>
            <option value="annual">Tahunan</option>
          </select>
        </div>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px] table-fixed">
          <thead>
            <tr className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-white/20 text-center w-16 bg-blue-600">NO <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-48">TANGGAL <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-72">AKTIVITAS UTAMA <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-44 text-center">KONTEKS <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-40 text-center">KATEGORI <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-52">OUTPUT <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-56 text-center">METRIC / PROGRESS <FilterIcon /></th>
              <th className="px-6 py-4 w-32 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedLogs.map((log, index) => {
              const isPercentage = log.metricLabel.includes('%') || log.metricLabel.toLowerCase().includes('persen');
              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-5 border-r border-slate-200 text-center bg-blue-50/20 font-black text-blue-600">
                    {filteredLogs.length - ((currentPage - 1) * itemsPerPage + index)}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-500 text-xs">
                    {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="font-black text-slate-800 text-sm leading-tight">{log.activity}</div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200 text-center">
                    <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                      log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      log.context === 'Personal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {log.context || 'Personal'}
                    </span>
                    {log.context === 'Perusahaan' && log.companyName && (
                      <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight truncate px-1">
                        {log.companyName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200 text-center">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block bg-blue-50 text-blue-600 border-blue-100">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-600 text-[13px] break-words">
                    {log.output}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    {isPercentage ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-blue-600">
                          <span>Progress</span>
                          <span>{log.metricValue}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${Math.min(log.metricValue, 100)}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm">
                          {log.metricLabel.includes('IDR') ? `Rp ${log.metricValue.toLocaleString()}` : `${log.metricValue} ${log.metricLabel}`}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenModal(log)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">✎</button>
                      <button onClick={() => onDelete(log.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {paginatedLogs.map((log, index) => {
          const isPercentage = log.metricLabel.includes('%') || log.metricLabel.toLowerCase().includes('persen');
          return (
            <div key={log.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xs">
                    #{filteredLogs.length - ((currentPage - 1) * itemsPerPage + index)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <span className={`mt-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border inline-block ${
                      log.context === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      log.context === 'Personal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {log.context || 'Personal'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(log)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">✎</button>
                  <button onClick={() => onDelete(log.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">✕</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-black text-slate-800 text-base leading-snug">{log.activity}</h4>
                  {log.context === 'Perusahaan' && log.companyName && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">@ {log.companyName}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Output & Progress</p>
                  <p className="font-bold text-slate-700 text-xs mb-3">"{log.output}"</p>
                  
                  {isPercentage ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-blue-600">
                        <span>Completion</span>
                        <span>{log.metricValue}%</span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-blue-600" style={{ width: `${Math.min(log.metricValue, 100)}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {log.metricLabel.includes('IDR') ? `Rp ${log.metricValue.toLocaleString()}` : `${log.metricValue} ${log.metricLabel}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {log.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 lg:px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                  currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Category Management Modal */}
      {isManageCatsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Master Kategori</h3>
              <button onClick={() => setIsManageCatsOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors">✕</button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar mb-6">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-700 text-sm">{cat}</span>
                  <button onClick={() => onDeleteCategory(cat)} className="text-rose-400 hover:text-rose-600 p-2 transition-all">✕</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                placeholder="Kategori baru..." 
                className="flex-1 px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
              />
              <button 
                onClick={() => { if(newCatInput) { onAddCategory(newCatInput); setNewCatInput(''); } }}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl p-6 lg:p-10 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{editingLogId ? 'Update Log' : 'Daily Log Entry'}</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] lg:text-[10px] tracking-widest mt-1">Dokumentasikan progres kerja harian Anda</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 text-2xl font-black transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Aktivitas</label>
                  <select 
                    className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold cursor-pointer hover:bg-slate-50 transition-all text-xs"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konteks Pekerjaan</label>
                  <select 
                    className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold cursor-pointer text-xs"
                    value={formData.context}
                    onChange={e => {
                      const val = e.target.value as 'Perusahaan' | 'Personal' | 'Sampingan';
                      setFormData({ 
                        ...formData, 
                        context: val,
                        companyName: val === 'Perusahaan' ? (currentCompany || formData.companyName) : formData.companyName
                      });
                    }}
                  >
                    <option value="Perusahaan">Perusahaan (Kantor)</option>
                    <option value="Personal">Personal Proyek</option>
                    <option value="Sampingan">Sampingan / Freelance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {formData.context === 'Perusahaan' ? 'Nama Perusahaan / Instansi' : 'Nama Proyek / Client'}
                  </label>
                  <input 
                    placeholder={formData.context === 'Perusahaan' ? currentCompany || 'Nama Perusahaan' : 'Nama Proyek'}
                    className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aktivitas Utama</label>
                  <input 
                    placeholder="Apa yang Anda kerjakan hari ini?"
                    className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                    value={formData.activity}
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasil Konkret (Output)</label>
                  <input 
                    placeholder="Apa hasil dari aktivitas tersebut?"
                    className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                    value={formData.output}
                    onChange={e => setFormData({ ...formData, output: e.target.value })}
                    required
                  />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Metrik</label>
                    <select 
                      className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold cursor-pointer text-xs"
                      value={metricOption}
                      onChange={e => setMetricOption(e.target.value)}
                    >
                      {metricChoices.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  
                  {metricOption === 'Custom' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Satuan</label>
                      <input 
                        placeholder="e.g. Dokumen"
                        className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                        value={formData.customMetricLabel}
                        onChange={e => setFormData({ ...formData, customMetricLabel: e.target.value })}
                      />
                    </div>
                  )}

                  <div className={`space-y-1.5 ${metricOption === 'Custom' ? '' : 'md:col-span-2'}`}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {metricOption.includes('%') ? 'Nilai Persentase (0-100)' : 'Nilai Numerik'}
                    </label>
                    <input 
                      type="number"
                      className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                      value={formData.metricValue}
                      onChange={e => setFormData({ ...formData, metricValue: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 lg:py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 lg:py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-xs"
                >
                  {editingLogId ? 'Update Log' : 'Simpan Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogs;
