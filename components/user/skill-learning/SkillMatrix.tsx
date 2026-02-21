import React, { useState, useMemo } from 'react';
import { Skill, SkillStatus, SkillCategory, SkillPriority, AppData, SubscriptionPlan, Training, Certification } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SkillMatrixProps {
  skills: Skill[];
  trainings?: Training[];
  certifications?: Certification[];
  onAddSkill: (s: Skill) => void;
  onUpdateSkill: (s: Skill) => void;
  onDeleteSkill: (id: string) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
  appData?: AppData;
  onUpgrade?: () => void;
}

const SkillMatrix: React.FC<SkillMatrixProps> = ({ skills, trainings = [], certifications = [], onAddSkill, onUpdateSkill, onDeleteSkill, showToast, appData, onUpgrade }) => {
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
                  <Tooltip formatter={(value: any, name: string, props: any) => [`${value} Skill (${props.payload.percent}%)`, name]} />
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

      {/* INFO KUOTA (QUOTA BANNER) - HIDDEN FOR PRO USERS */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 mx-1 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-bullseye"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Matriks Skill ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {skills.length} / {limit === 'unlimited' ? '∞' : limit} Kompetensi Terdaftar
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

      {/* LIMIT ALERT BAR - HANYA UNTUK USER FREE */}
      {isLimitReached && appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mx-1">
           <div className="flex items-center gap-4 text-center md:text-left">
              <span className="text-3xl">⚠️</span>
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

      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Daftar Kompetensi</h3>
        <button onClick={openAddForm} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ Add Skill</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{skill.category}</span>
                        {skill.relatedTrainingId && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                              <i className="bi bi-journal-bookmark mr-1"></i>
                              {trainings.find(t => t.id === skill.relatedTrainingId)?.name || 'Training'}
                            </span>
                          </>
                        )}
                        {skill.relatedCertId && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                              <i className="bi bi-patch-check mr-1"></i>
                              {certifications.find(c => c.id === skill.relatedCertId)?.name || 'Sertifikasi'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-black text-sm text-slate-700">{skill.currentLevel}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full transition-all duration-1000 ${skill.currentLevel >= 4 ? 'bg-emerald-50' : skill.currentLevel >= 3 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${(skill.currentLevel / 5) * 100}%` }}></div>
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
        </div>

        {/* Mobile Card View - FIXED VISIBILITY */}
        <div className="lg:hidden p-4 space-y-4">
           {skills.map(skill => (
             <div key={skill.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-slate-800 text-base leading-tight">{skill.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{skill.category}</p>
                         {skill.relatedTrainingId && (
                           <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                             {trainings.find(t => t.id === skill.relatedTrainingId)?.name || 'Training'}
                           </span>
                         )}
                         {skill.relatedCertId && (
                           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                             {certifications.find(c => c.id === skill.relatedCertId)?.name || 'Sertifikasi'}
                           </span>
                         )}
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => openEditForm(skill)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100">✎</button>
                      <button onClick={() => onDeleteSkill(skill.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-rose-600 shadow-sm border border-slate-100">✕</button>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mastery Level</span>
                      <span className="text-xs font-black text-indigo-600">{skill.currentLevel} / 5</span>
                   </div>
                   <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${skill.currentLevel >= 4 ? 'bg-emerald-50' : 'bg-indigo-600'}`} style={{ width: `${(skill.currentLevel/5)*100}%` }}></div>
                   </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                   <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${getStatusStyle(skill.status)}`}>
                     {getFriendlyStatus(skill.status)}
                   </span>
                   {skill.isRelevant && <span className="text-[9px] font-black text-emerald-600 uppercase">Relevan ✨</span>}
                </div>
             </div>
           ))}
           {skills.length === 0 && (
             <div className="py-20 text-center text-slate-400 italic text-sm">Belum ada skill yang dicatat.</div>
           )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingItem ? 'Edit Skill' : 'Tambah Skill Baru'}</h3>
             <SkillForm 
               initialData={editingItem} 
               trainings={trainings}
               certifications={certifications}
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

const SkillForm = ({ initialData, trainings = [], certifications = [], onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initialData || { name: '', category: SkillCategory.HARD, currentLevel: 3, status: SkillStatus.ON_PROGRESS, priority: SkillPriority.MEDIUM, isRelevant: true, relatedTrainingId: '', relatedCertId: '' });
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Skill</label>
        <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Related Training (Optional)</label>
          <select 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" 
            value={form.relatedTrainingId || ''} 
            onChange={e => setForm({...form, relatedTrainingId: e.target.value})}
          >
            <option value="">-- Pilih Training Terkait --</option>
            {trainings.map((t: Training) => (
              <option key={t.id} value={t.id}>{t.name} ({t.provider})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Related Certification (Optional)</label>
          <select 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" 
            value={form.relatedCertId || ''} 
            onChange={e => setForm({...form, relatedCertId: e.target.value})}
          >
            <option value="">-- Pilih Sertifikasi Terkait --</option>
            {certifications.map((c: Certification) => (
              <option key={c.id} value={c.id}>{c.name} ({c.issuer})</option>
            ))}
          </select>
        </div>
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