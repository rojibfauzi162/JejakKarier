
import React, { useState, useMemo, useEffect } from 'react';
import { Achievement, AchievementCategory, UserProfile, WorkExperience } from '../types';

interface AchievementTrackerProps {
  achievements: Achievement[];
  profile: UserProfile;
  workExperiences: WorkExperience[];
  onAdd: (a: Achievement) => void;
  onUpdate: (a: Achievement) => void;
  onDelete: (id: string) => void;
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ achievements, profile, workExperiences, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '', date: '', category: AchievementCategory.PROFESIONAL, impact: '', scope: 'Perusahaan', companyName: ''
  });

  // Local state for datepicker logic
  const [isRange, setIsRange] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

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

  // Synchronize formData.date when datepicker states change
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

  // Unique companies from profile and work history
  const availableCompanies = useMemo(() => {
    const companies = new Set<string>();
    if (profile.currentCompany) companies.add(profile.currentCompany);
    workExperiences.forEach(exp => {
      if (exp.company) companies.add(exp.company);
    });
    return Array.from(companies);
  }, [profile, workExperiences]);

  const openAddForm = () => {
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
    
    // Parse existing date
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
    
    const finalData = {
      ...formData,
      companyName: formData.scope === 'Personal' ? '' : formData.companyName
    };

    if (editingItem) {
      onUpdate({ ...editingItem, ...finalData } as Achievement);
    } else {
      onAdd({ ...finalData, id: Math.random().toString(36).substr(2, 9) } as Achievement);
    }
    
    setIsFormOpen(false);
  };

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Achievement Tracker</h2>
          <p className="text-slate-500 mt-1 text-xs lg:text-sm font-medium">Celebrate your professional and personal milestones.</p>
        </div>
        <button onClick={openAddForm} className="w-full md:w-auto px-6 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest">
          + Log Achievement
        </button>
      </header>

      {/* Summary Box */}
      <div className="flex w-full md:w-[400px] border-2 border-slate-900 overflow-hidden rounded-2xl shadow-sm">
        <div className="bg-blue-600 text-white px-4 lg:px-6 py-2.5 flex-1 font-black text-[10px] lg:text-xs uppercase tracking-widest flex items-center justify-center border-r-2 border-slate-900">
          ACHIEVEMENT COUNT
        </div>
        <div className="bg-slate-100 flex-1 flex items-center justify-center text-lg lg:text-xl font-black text-slate-900">
          {achievements.length}
        </div>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-white/20 text-center w-16 bg-blue-600">NO <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-52">TANGGAL <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20">PENCAPAIAN <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-44">KATEGORI <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-52">PERUSAHAAN/PERSONAL <FilterIcon /></th>
              <th className="px-6 py-4">DAMPAK / HASIL <FilterIcon /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {achievements.map((ach, index) => (
              <tr key={ach.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-5 border-r border-slate-200 text-center bg-blue-50/20 font-black text-blue-600">{index + 1}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-700 text-sm whitespace-pre-wrap">{ach.date}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-black text-slate-800 text-sm leading-relaxed">{ach.title}</td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{ach.category}</span>
                </td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <div className={`px-3 py-1 rounded-lg inline-block text-[10px] font-black uppercase tracking-widest ${ach.scope === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {ach.scope}
                  </div>
                  {ach.scope === 'Perusahaan' && ach.companyName && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{ach.companyName}</p>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{ach.impact}</p>
                    <div className="flex gap-1 opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(ach)} className="p-2 text-slate-400 hover:text-blue-600">✎</button>
                      <button onClick={() => onDelete(ach.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Achievement Cards */}
      <div className="lg:hidden space-y-4">
        {achievements.map((ach, index) => (
          <div key={ach.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xs">#{index + 1}</div>
                <div>
                  <h4 className="font-black text-slate-800 text-base leading-snug">{ach.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{ach.date}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditForm(ach)} className="p-2 text-slate-300">✎</button>
                <button onClick={() => onDelete(ach.id)} className="p-2 text-slate-300">✕</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase border border-slate-100">{ach.category}</span>
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${ach.scope === 'Perusahaan' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                  {ach.scope} {ach.companyName && `• ${ach.companyName}`}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Impact / Result</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">" {ach.impact} "</p>
              </div>
            </div>
          </div>
        ))}
        {achievements.length === 0 && <div className="py-16 text-center text-slate-400 italic font-medium">Mulai catat prestasi Anda!</div>}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-6 lg:p-10 animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight mb-8">{editingItem ? 'Edit Achievement' : 'Log New Achievement'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pencapaian</label>
                <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold placeholder:text-slate-300 text-xs" placeholder="Judul..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setIsRange(false)} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${!isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Single</button>
                    <button type="button" onClick={() => setIsRange(true)} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Range</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <input type="month" className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={startMonth} onChange={e => setStartMonth(e.target.value)} required />
                  </div>
                  {isRange && (
                    <div className="space-y-1 animate-in slide-in-from-left-2 duration-300">
                      <input type="month" className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={endMonth} onChange={e => setEndMonth(e.target.value)} required={isRange} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                <select className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as AchievementCategory})}>
                  {Object.values(AchievementCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope</label>
                <div className="flex gap-4">
                  {['Perusahaan', 'Personal'].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, scope: s as any, companyName: s === 'Perusahaan' ? (availableCompanies[0] || '') : ''})} className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${formData.scope === s ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {formData.scope === 'Perusahaan' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perusahaan</label>
                  <select className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required>
                    {availableCompanies.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                    <option value="Lainnya">Input Manual...</option>
                  </select>
                  {formData.companyName === 'Lainnya' && (
                    <input className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold mt-2 text-xs" placeholder="Nama perusahaan..." onChange={e => setFormData({...formData, companyName: e.target.value})} required />
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Impact / Result</label>
                <textarea rows={3} className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-xs" placeholder="Hasil konkret..." value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 lg:py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl text-xs">Batal</button>
                <button type="submit" className="flex-1 py-4 lg:py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black text-xs">{editingItem ? 'Simpan' : 'Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementTracker;
