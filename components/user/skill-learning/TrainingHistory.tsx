import React, { useState, useMemo } from 'react';
import { Training, TrainingStatus, SkillPriority } from '../../../types';

interface TrainingHistoryProps {
  trainings: Training[];
  onAddTraining: (t: Training) => void;
  onUpdateTraining: (t: Training) => void;
  onDeleteTraining: (id: string) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}

const TrainingHistory: React.FC<TrainingHistoryProps> = ({ trainings, onAddTraining, onUpdateTraining, onDeleteTraining, showToast }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Training | null>(null);

  const stats = useMemo(() => {
    const total = trainings.length;
    const completed = trainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
    const ongoing = trainings.filter(t => t.status === TrainingStatus.ON_PROCESS).length;
    const cost = trainings.reduce((acc, t) => acc + (t.cost || 0), 0);
    return { total, completed, ongoing, cost };
  }, [trainings]);

  const isOverdue = (t: Training) => {
    if ((t.status === TrainingStatus.PLANNED || t.status === TrainingStatus.ON_PROCESS) && t.deadline) {
       return new Date(t.deadline) < new Date();
    }
    return false;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget title="Total Course" value={stats.total} icon="📚" color="blue" />
        <StatWidget title="In Progress" value={stats.ongoing} icon="⏳" color="amber" />
        <StatWidget title="Achievement" value={stats.completed} icon="🔥" color="emerald" />
        <StatWidget title="Investment" value={`Rp ${(stats.cost/1000).toFixed(0)}k`} icon="💎" color="purple" />
      </div>

      <div className="flex justify-end px-1">
        <button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ Add Course</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Detail Pelatihan</th>
                <th className="px-6 py-5">Kategori & Platform</th>
                <th className="px-6 py-5 text-center">Status & Progres</th>
                <th className="px-6 py-5 text-center">Masa Berlaku</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trainings.map(t => {
                const overdue = isOverdue(t);
                return (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Rp {t.cost?.toLocaleString('id-ID')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.category || 'General'}</p>
                      <p className="text-[10px] font-medium text-slate-400">{t.provider}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="inline-flex flex-col gap-2 items-center min-w-[120px]">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                           t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>{t.status}</span>
                         {t.status === TrainingStatus.ON_PROCESS && (
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <p className={`text-[10px] font-black uppercase ${overdue ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                        {overdue ? '⚠️ TERLEWAT' : (t.deadline || 'Bebas')}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingItem(t); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all">✎</button>
                        <button onClick={() => { onDeleteTraining(t.id); showToast("Data pelatihan dihapus.", "info"); }} className="p-2 text-slate-400 hover:text-rose-600 transition-all">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
           {trainings.map(t => {
             const overdue = isOverdue(t);
             return (
               <div key={t.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="flex-1 mr-4">
                        <h4 className="font-black text-slate-800 text-base leading-tight">{t.name}</h4>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Rp {t.cost?.toLocaleString('id-ID')}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(t); setIsFormOpen(true); }} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">✎</button>
                        <button onClick={() => onDeleteTraining(t.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">✕</button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Platform</p>
                        <p className="text-[11px] font-bold text-slate-700 truncate">{t.provider}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block border ${
                          t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{t.status}</span>
                     </div>
                  </div>

                  {t.status === TrainingStatus.ON_PROCESS && (
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                          <span className="text-[10px] font-black text-blue-600">{t.progress}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                       </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Masa Berlaku</span>
                     <span className={`text-[10px] font-black uppercase ${overdue ? 'text-rose-500' : 'text-slate-600'}`}>
                        {overdue ? '⚠️ Terlewat' : (t.deadline || 'Bebas')}
                     </span>
                  </div>
               </div>
             );
           })}
           {trainings.length === 0 && (
             <div className="py-20 text-center text-slate-400 italic text-sm">Belum ada riwayat pelatihan.</div>
           )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingItem ? 'Ubah Rencana Belajar' : 'Tambah Pelatihan Baru'}</h3>
             <TrainingForm 
               initialData={editingItem} 
               onSubmit={(data: any) => {
                 if (editingItem) onUpdateTraining({ ...editingItem, ...data } as Training);
                 else onAddTraining({ ...data, id: Math.random().toString(36).substr(2,9) } as Training);
                 setIsFormOpen(false);
                 showToast("Data pelatihan diperbarui!");
               }}
               onCancel={() => setIsFormOpen(false)}
             />
          </div>
        </div>
      )}
    </div>
  );
};

const StatWidget = ({ title, value, icon, color }: any) => {
  const colors: any = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className={`p-6 rounded-[2rem] border flex items-center gap-4 bg-white shadow-sm ${colors[color]}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{title}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const TrainingForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initialData || { name: '', provider: '', topic: '', status: TrainingStatus.ON_PROCESS, cost: 0, date: new Date().toISOString().split('T')[0], deadline: '', progress: 0, category: '', certLink: '' });
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({...form, certLink: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pelatihan / Kursus</label>
        <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Misal: IT, Keuangan, Soft Skill" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform / Provider</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Mulai</label>
          <input type="date" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Selesai (Deadline)</label>
          <input type="date" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {Object.values(TrainingStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biaya Investasi (IDR)</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.cost} onChange={e => setForm({...form, cost: parseInt(e.target.value) || 0})} />
        </div>
      </div>
      {form.status === TrainingStatus.ON_PROCESS && (
        <div className="space-y-3 p-6 bg-blue-50 rounded-3xl animate-in slide-in-from-top-2">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Progres Belajar</label>
              <span className="text-xs font-black text-blue-600">{form.progress}%</span>
           </div>
           <input type="range" min="0" max="100" className="w-full h-2 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-600" value={form.progress} onChange={e => setForm({...form, progress: parseInt(e.target.value)})} />
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Sertifikat (Link / Upload)</label>
        <div className="flex gap-4">
           <input className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.certLink} onChange={e => setForm({...form, certLink: e.target.value})} placeholder="https://..." />
           <label className="px-6 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase cursor-pointer hover:bg-black transition-all">
             Upload
             <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
           </label>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
        <button type="button" onClick={() => onSubmit(form)} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Data</button>
      </div>
    </div>
  );
};

export default TrainingHistory;