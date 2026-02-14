import React, { useState, useMemo, useEffect } from 'react';
import { Achievement, AchievementCategory, UserProfile, WorkExperience, AppData, SubscriptionPlan } from '../types';

interface AchievementTrackerProps {
  achievements: Achievement[];
  profile: UserProfile;
  workExperiences: WorkExperience[];
  onAdd: (a: Achievement) => void;
  onUpdate: (a: Achievement) => void;
  onDelete: (id: string) => void;
  appData?: AppData;
  onUpgrade?: () => void;
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ achievements, profile, workExperiences, onAdd, onUpdate, onDelete, appData, onUpgrade }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '', date: '', category: AchievementCategory.PROFESIONAL, impact: '', scope: 'Perusahaan', companyName: ''
  });

  // Pagination State (khusus mobile)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Local state for datepicker logic
  const [isRange, setIsRange] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // SINKRONISASI LIMITASI DARI SUPERADMIN
  const limit = useMemo(() => {
    return appData?.planLimits?.achievements || 5;
  }, [appData]);

  const isLimitReached = useMemo(() => {
    if (appData?.plan === SubscriptionPlan.FREE && limit !== 'unlimited') {
      return achievements.length >= Number(limit);
    }
    return false;
  }, [achievements.length, limit, appData?.plan]);

  // Helper to format "2024-01" to "Jan 2024"
  const formatMonthToText = (val: string) => {
    if (!val) return '';
    const [y, m] = val.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Helper to parse "Jan 2024" back to "2024-01"
  const parseTextToMonthVal = (text: string) => {
    if (!text) return '';
    const monthMap: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    const parts = text.split(' ');
    if (parts.length < 2) return '';
    const m = monthMap[parts[0]];
    const y = parts[1];
    return `${y}-${m}`;
  };

  useEffect(() => {
    if (startMonth) {
      const startText = formatMonthToText(startMonth);
      if (isRange && endMonth) {
        const endText = formatMonthToText(endMonth);
        setFormData(prev => ({ ...prev, date: `${startText} - ${endText}` }));
      } else if (!isRange) {
        setFormData(prev => ({ ...prev, date: startText }));
      }
    }
  }, [startMonth, endMonth, isRange]);

  const availableCompanies = useMemo(() => {
    const companies = new Set<string>();
    if (profile.currentCompany) companies.add(profile.currentCompany);
    workExperiences.forEach(exp => {
      if (exp.company) companies.add(exp.company);
    });
    return Array.from(companies);
  }, [profile, workExperiences]);

  const openAddForm = () => {
    if (isLimitReached) {
       alert(`Batas rekam jejak prestasi tercapai (${limit}). Silakan upgrade paket untuk mencatat seluruh pencapaian Anda.`);
       onUpgrade?.();
       return;
    }
    setEditingItem(null);
    setStartMonth('');
    setEndMonth('');
    setIsRange(false);
    setFormData({ 
      title: '', 
      date: '', 
      category: AchievementCategory.PROFESIONAL, 
      impact: '', 
      scope: 'Perusahaan',
      companyName: availableCompanies[0] || ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item: Achievement) => {
    setEditingItem(item);
    setFormData({ ...item });
    const isRangeDate = item.date.includes(' - ');
    setIsRange(isRangeDate);
    if (isRangeDate) {
      const [start, end] = item.date.split(' - ');
      setStartMonth(parseTextToMonthVal(start));
      setEndMonth(parseTextToMonthVal(end));
    } else {
      setStartMonth(parseTextToMonthVal(item.date));
      setEndMonth('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.impact) return;
    const finalData = { ...formData, companyName: formData.scope === 'Personal' ? '' : formData.companyName };
    if (editingItem) onUpdate({ ...editingItem, ...finalData } as Achievement);
    else onAdd({ ...finalData, id: Math.random().toString(36).substr(2, 9) } as Achievement);
    setIsFormOpen(false);
  };

  // Logic: Paginated Data (Urutan Terbaru di Atas)
  const sortedAchievements = useMemo(() => [...achievements].reverse(), [achievements]);
  const totalPages = Math.ceil(sortedAchievements.length / itemsPerPage);
  const paginatedAchievements = sortedAchievements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Achievement Tracker</h2>
          <p className="text-slate-500 mt-1 text-xs lg:text-sm font-medium">Celebrate your professional and personal milestones.</p>
        </div>
        <button onClick={openAddForm} className="w-full md:w-auto px-6 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest">
          + Log Achievement
        </button>
      </header>

      {/* INFO KUOTA (QUOTA BANNER) - HIDDEN FOR PRO USERS */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 mx-1 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-trophy-fill"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Rekam Jejak Prestasi ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {achievements.length} / {limit === 'unlimited' ? '∞' : limit} Pencapaian Terdaftar
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

      {/* DESKTOP VIEW: TABLE */}
      <div className="hidden lg:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-8 py-5">Judul Pencapaian</th>
              <th className="px-6 py-5">Kategori</th>
              <th className="px-6 py-5">Lingkup & Instansi</th>
              <th className="px-6 py-5 text-center">Waktu</th>
              <th className="px-8 py-5">Dampak (Impact)</th>
              <th className="px-8 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedAchievements.map(a => (
              <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <span className="font-bold text-slate-800 text-sm leading-tight block max-w-xs">{a.title}</span>
                </td>
                <td className="px-6 py-6">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">{a.category}</span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{a.scope}</span>
                    {a.companyName && <span className="text-[9px] font-black text-slate-400 uppercase">{a.companyName}</span>}
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{a.date}</span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs text-slate-500 italic line-clamp-2 leading-relaxed">"{a.impact}"</p>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2">
                      <button onClick={() => openEditForm(a)} className="p-2 text-slate-400 hover:text-blue-600 transition-all">✎</button>
                      <button onClick={() => onDelete(a.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-all">✕</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {achievements.length === 0 && (
          <div className="py-24 text-center text-slate-400 italic font-medium">Belum ada pencapaian yang dicatat.</div>
        )}
      </div>

      {/* MOBILE VIEW: CARDS WITH PAGINATION */}
      <div className="lg:hidden space-y-4">
        {paginatedAchievements.map(achievement => (
          <div key={achievement.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">{achievement.category}</p>
                  <h4 className="text-base font-black text-slate-800 leading-tight">{achievement.title}</h4>
               </div>
               <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditForm(achievement)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg">✎</button>
                  <button onClick={() => onDelete(achievement.id)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg">✕</button>
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md">{achievement.scope}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{achievement.date}</span>
               </div>
               
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Impact / Dampak</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">" {achievement.impact} "</p>
               </div>

               {achievement.companyName && (
                  <div className="flex items-center gap-2 px-1">
                     <span className="text-[9px] font-black text-slate-300 uppercase">🏢 {achievement.companyName}</span>
                  </div>
               )}
            </div>
          </div>
        ))}

        {achievements.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-400 italic text-sm">Belum ada data prestasi.</p>
          </div>
        )}

        {/* PAGINATION CONTROLS (MOBILE ONLY) */}
        {totalPages > 1 && (
           <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm mt-6">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30"
              >
                ← Prev
              </button>
              <div className="flex gap-2">
                 {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      {i + 1}
                    </button>
                 ))}
              </div>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30"
              >
                Next →
              </button>
           </div>
        )}
      </div>

      {/* FORM MODAL (ADD/EDIT) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white max-w-2xl w-full rounded-[3.5rem] p-10 border border-slate-100 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingItem ? 'Ubah Data Prestasi' : 'Log New Achievement'}</h3>
               <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pencapaian</label>
                <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:border-indigo-400 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Optimasi Pelaporan Pajak Bulanan" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs outline-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as AchievementCategory})}>
                    {Object.values(AchievementCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lingkup</label>
                  <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs outline-none cursor-pointer" value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value as any})}>
                    <option value="Perusahaan">Perusahaan</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              </div>
              {formData.scope === 'Perusahaan' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instansi / Perusahaan Terkait</label>
                  <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs outline-none cursor-pointer" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}>
                    {availableCompanies.length > 0 ? (
                      availableCompanies.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      <option value="">- Lengkapi Profil Perusahaan Dahulu -</option>
                    )}
                  </select>
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Kejadian</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setIsRange(false)} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${!isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Single</button>
                    <button type="button" onClick={() => setIsRange(true)} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Range</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="month" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={startMonth} onChange={e => setStartMonth(e.target.value)} required />
                  {isRange && (
                    <input type="month" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={endMonth} onChange={e => setEndMonth(e.target.value)} required={isRange} />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dampak Nyata (Impact)</label>
                <textarea rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs resize-none outline-none focus:border-indigo-400 transition-all" value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} placeholder="Jelaskan kontribusi nyata Anda, misal: 'Mengurangi waktu proses sebesar 30%...'" required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Batal</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-black transition-all active:scale-95">Simpan Prestasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementTracker;