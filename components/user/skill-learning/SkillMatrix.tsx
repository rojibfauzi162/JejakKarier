
import React, { useState, useMemo } from 'react';
import { Skill, SkillStatus, SkillCategory, SkillPriority, AppData, SubscriptionPlan } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SkillMatrixProps {
  skills: Skill[];
  onAddSkill: (s: Skill) => void;
  onUpdateSkill: (s: Skill) => void;
  onDeleteSkill: (id: string) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
  appData?: AppData;
  onUpgrade?: () => void;
}

const SkillMatrix: React.FC<SkillMatrixProps> = ({ skills, onAddSkill, onUpdateSkill, onDeleteSkill, showToast, appData, onUpgrade }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Skill | null>(null);

  // LOGIC LIMITASI - HANYA UNTUK PAKET FREE
  const limit = appData?.planLimits?.skills || 10;
  const isLimitReached = appData?.plan === SubscriptionPlan.FREE && limit !== 'unlimited' && skills.length >= Number(limit);

  const chartData = useMemo(() => {
    const hard = skills.filter(s => s.category === SkillCategory.HARD).length;
    const soft = skills.filter(s => s.category === SkillCategory.SOFT).length;
    const total = hard + soft || 1;
    return [
      { name: 'Hard Skill', value: hard, percent: ((hard / total) * 100).toFixed(0) },
      { name: 'Soft Skill', value: soft, percent: ((soft / total) * 100).toFixed(0) }
    ];
  }, [skills]);

  const COLORS = ['#6366f1', '#10b981'];

  const openAddForm = () => {
    if (isLimitReached) {
      alert(`Limit skill Anda (${limit} skill) telah tercapai. Silakan upgrade untuk menambah lebih banyak kompetensi.`);
      onUpgrade?.();
      return;
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: Skill) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const getFriendlyStatus = (status: SkillStatus) => {
    switch(status) {
      case SkillStatus.ACHIEVED: return 'Sudah Dikuasai ✅';
      case SkillStatus.ON_PROGRESS: return 'Sedang Diasah ⏳';
      case SkillStatus.GAP: return 'Ingin Dipelajari 🎯';
      default: return status;
    }
  };

  const getStatusStyle = (status: SkillStatus) => {
    switch(status) {
      case SkillStatus.ACHIEVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case SkillStatus.ON_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-100';
      case SkillStatus.GAP: return 'bg-slate-50 text-slate-400 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* LIMIT ALERT BAR - HANYA UNTUK USER FREE */}
      {isLimitReached && appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mx-1">
           <div className="flex items-center gap-4 text-center md:text-left">
              <span className="text-3xl">🎯</span>
              <div>
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Matrix Skill Terbatas</p>
                 <p className="text-sm font-bold text-slate-800">Anda telah mencatat {skills.length} dari {limit} skill di paket {appData?.plan}.</p>
              </div>
           </div>
           <button 
            onClick={onUpgrade}
            className="px-8 py-3 bg-amber-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
           >
             Upgrade Level Karir →
           </button>
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center overflow-hidden">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Komposisi Skill</h4>
           <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <Pie 
                    data={chartData} 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={5} 
                    dataKey="value"
                    cx="50%"
                    cy="45%"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} Skill (${props.payload.percent}%)`, name]} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="lg:col-span-2 bg-indigo-600 p-10 rounded-[3rem] shadow-xl text-white flex flex-col justify-center">
           <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Ringkasan Matrix</h3>
           <p className="text-sm opacity-80 leading-relaxed font-medium">
             Anda memiliki total <span className="font-black underline">{skills.length}</span> keahlian yang tercatat. 
             Fokus saat ini adalah memperkuat <span className="font-black">{chartData[0].percent}% Hard Skill</span> untuk mendukung target karir utama Anda.
           </p>
           <div className="mt-8 flex gap-4">
              <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                 <p className="text-[8px] font-black uppercase opacity-60">Paling Dikuasai</p>
                 <p className="text-xs font-black">{skills.filter(s => s.status === SkillStatus.ACHIEVED).length} Skill</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                 <p className="text-[8px] font-black uppercase opacity-60">Target Relevansi</p>
                 <p className="text-xs font-black">{skills.filter(s => s.isRelevant).length} Skill</p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-900 uppercase">Daftar Kompetensi</h3>
        <button onClick={openAddForm} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ Add Skill</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Nama Skill</th>
                <th className="px-6 py-5 text-center">Tingkat Ahli</th>
                <th className="px-8 py-5">Visualisasi Progres</th>
                <th className="px-6 py-5 text-center">Masih Relevan?</th>
                <th className="px-6 py-5">Status Saat Ini</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {skills.map(skill => (
                <tr key={skill.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-base">{skill.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{skill.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-black text-sm text-slate-700">{skill.currentLevel}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full transition-all duration-1000 ${skill.currentLevel >= 4 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${(skill.currentLevel / 5) * 100}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {skill.isRelevant ? (
                      <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">YA ✅</span>
                    ) : (
                      <span className="text-rose-400 text-xs font-black uppercase tracking-widest">TIDAK 🛑</span>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(skill.status)}`}>{getFriendlyStatus(skill.status)}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditForm(skill)} className="p-2 text-slate-400 hover:text-blue-600 transition-all">✎</button>
                      <button onClick={() => { onDeleteSkill(skill.id); showToast("Skill dihapus.", "info"); }} className="p-2 text-slate-400 hover:text-rose-600 transition-all">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {skills.length === 0 && <div className="py-24 text-center text-slate-400 italic">Belum ada skill yang dicatat. Mari mulai bangun portofolio Anda!</div>}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingItem ? 'Edit Skill' : 'Tambah Skill Baru'}</h3>
             <SkillForm 
               initialData={editingItem} 
               onSubmit={(data: any) => {
                 if (editingItem) onUpdateSkill({ ...editingItem, ...data } as Skill);
                 else onAddSkill({ ...data, id: Math.random().toString(36).substr(2,9) } as Skill);
                 setIsFormOpen(false);
                 showToast("Data Skill diperbarui!");
               }}
               onCancel={() => setIsFormOpen(false)}
             />
          </div>
        </div>
      )}
    </div>
  );
};

const SkillForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initialData || { name: '', category: SkillCategory.HARD, currentLevel: 3, status: SkillStatus.ON_PROGRESS, priority: SkillPriority.MEDIUM, isRelevant: true });
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Skill</label>
        <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            {Object.values(SkillCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Masih Relevan?</label>
          <div className="flex gap-2">
             <button type="button" onClick={() => setForm({...form, isRelevant: true})} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase ${form.isRelevant ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Ya</button>
             <button type="button" onClick={() => setForm({...form, isRelevant: false})} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase ${!form.isRelevant ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Tidak</button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkat Keahlian (1-5)</label>
          <input type="number" min="1" max="5" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.currentLevel} onChange={e => setForm({...form, currentLevel: parseInt(e.target.value)})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value={SkillStatus.GAP}>Ingin Dipelajari</option>
            <option value={SkillStatus.ON_PROGRESS}>Sedang Diasah</option>
            <option value={SkillStatus.ACHIEVED}>Sudah Dikuasai</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
        <button onClick={() => onSubmit(form)} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Skill</button>
      </div>
    </div>
  );
};

export default SkillMatrix;
