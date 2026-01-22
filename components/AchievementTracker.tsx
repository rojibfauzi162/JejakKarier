
import React, { useState } from 'react';
import { Achievement, AchievementCategory } from '../types';

interface AchievementTrackerProps {
  achievements: Achievement[];
  onAdd: (a: Achievement) => void;
  onUpdate: (a: Achievement) => void;
  onDelete: (id: string) => void;
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ achievements, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '', date: '', category: AchievementCategory.PROFESIONAL, impact: '', scope: 'Perusahaan'
  });

  const openAddForm = () => {
    setEditingItem(null);
    setFormData({ title: '', date: new Date().toISOString().split('T')[0], category: AchievementCategory.PROFESIONAL, impact: '', scope: 'Perusahaan' });
    setIsFormOpen(true);
  };

  const openEditForm = (item: Achievement) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.impact) return;
    
    if (editingItem) {
      onUpdate({ ...editingItem, ...formData } as Achievement);
    } else {
      onAdd({ ...formData, id: Math.random().toString(36).substr(2, 9) } as Achievement);
    }
    
    setIsFormOpen(false);
  };

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Achievement Tracker</h2>
          <p className="text-slate-500 mt-1">Celebrate your professional and personal milestones.</p>
        </div>
        <button onClick={openAddForm} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          + Log Achievement
        </button>
      </header>

      {/* Summary Box */}
      <div className="flex w-full md:w-[400px] border-2 border-slate-900 overflow-hidden rounded-md shadow-sm">
        <div className="bg-blue-600 text-white px-6 py-2 flex-1 font-black text-xs uppercase tracking-widest flex items-center justify-center border-r-2 border-slate-900">
          TOTAL ACHIEVEMENT
        </div>
        <div className="bg-slate-100 flex-1 flex items-center justify-center text-xl font-black text-slate-900">
          {achievements.length}
        </div>
      </div>

      {/* Modern Spreadsheet View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-white/20 text-center w-16 bg-blue-600">NO <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-44">TANGGAL <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20">PENCAPAIAN <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-40">KATEGORI <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-48">PERUSAHAAN/PERSONAL <FilterIcon /></th>
              <th className="px-6 py-4">DAMPAK / HASIL <FilterIcon /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {achievements.map((ach, index) => (
              <tr key={ach.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-5 border-r border-slate-200 text-center bg-blue-50/20 font-black text-blue-600">{index + 1}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-700 text-sm">{ach.date}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-black text-slate-800 text-sm leading-relaxed">{ach.title}</td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{ach.category}</span>
                </td>
                <td className="px-6 py-5 border-r border-slate-200 text-xs font-black text-slate-500">
                  <div className={`px-3 py-1 rounded-lg inline-block ${ach.scope === 'Perusahaan' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {ach.scope}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{ach.impact}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(ach)} className="p-2 text-slate-400 hover:text-blue-600">✎</button>
                      <button onClick={() => onDelete(ach.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {achievements.length === 0 && (
              <tr><td colSpan={6} className="py-24 text-center text-slate-400 italic font-medium">Belum ada pencapaian. Mulailah mencatat kesuksesanmu!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">{editingItem ? 'Edit Achievement' : 'Log New Achievement'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pencapaian</label>
                <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" placeholder="e.g. Berhasil migrasi database" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal / Range</label>
                  <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" placeholder="e.g. Jan 2024 - Mar 2024" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as AchievementCategory})}>
                    {Object.values(AchievementCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope</label>
                <div className="flex gap-4">
                  {['Perusahaan', 'Personal'].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, scope: s as any})} className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all ${formData.scope === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dampak / Hasil</label>
                <textarea rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none" placeholder="Ceritakan dampak positifnya..." value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">{editingItem ? 'Simpan Update' : 'Simpan Achievement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementTracker;
