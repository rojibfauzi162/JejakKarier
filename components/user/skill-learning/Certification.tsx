import React, { useState, useMemo } from 'react';
import { Certification, Skill, TrainingStatus } from '../../../types';

interface CertificationProps {
  certs: Certification[];
  skills: Skill[];
  onAddCert: (c: Certification) => void;
  onUpdateCert: (c: Certification) => void;
  onDeleteCert: (id: string) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}

const CertificationModule: React.FC<CertificationProps> = ({ certs, skills, onAddCert, onUpdateCert, onDeleteCert, showToast }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certification | null>(null);

  const stats = useMemo(() => {
    const total = certs.length;
    const completed = certs.filter(c => (c.status || TrainingStatus.COMPLETED) === TrainingStatus.COMPLETED).length;
    return { total, completed };
  }, [certs]);

  const isOverdue = (c: Certification) => {
    if ((c.status === TrainingStatus.PLANNED || c.status === TrainingStatus.ON_PROCESS) && c.deadline) {
       return new Date(c.deadline) < new Date();
    }
    return false;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📜</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Sertifikasi</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🏆</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Berhasil Diraih</p>
            <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-1">
        <button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ Add Cert</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Nama Sertifikasi</th>
                <th className="px-6 py-5">Penerbit & Nomor</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center">Deadline Target</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {certs.map(c => {
                const overdue = isOverdue(c);
                return (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="font-bold text-slate-800 text-sm leading-tight">{c.name}</p>
                       <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{c.relatedSkill}</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-600">{c.issuer}</p>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">{c.certNumber || 'ID Belum Set'}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                         (c.status || TrainingStatus.COMPLETED) === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>{c.status || 'Completed'}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <p className={`text-[10px] font-black uppercase ${overdue ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                         {overdue ? '⚠️ TERLEWAT' : (c.deadline || '-')}
                       </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingItem(c); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all">✎</button>
                        <button onClick={() => { onDeleteCert(c.id); showToast("Sertifikat dihapus.", "info"); }} className="p-2 text-slate-400 hover:text-rose-600 transition-all">✕</button>
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
           {certs.map(c => {
             const overdue = isOverdue(c);
             return (
               <div key={c.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="flex-1 mr-4">
                        <h4 className="font-black text-slate-800 text-base leading-tight">{c.name}</h4>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{c.relatedSkill}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(c); setIsFormOpen(true); }} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">✎</button>
                        <button onClick={() => onDeleteCert(c.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">✕</button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Penerbit</p>
                        <p className="text-[11px] font-bold text-slate-700 truncate">{c.issuer}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block border ${
                          (c.status || TrainingStatus.COMPLETED) === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{c.status || 'Completed'}</span>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID / Nomor</p>
                     <p className="text-[10px] font-mono font-bold text-slate-500 break-all">{c.certNumber || 'Tidak ada nomor'}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Deadline / Terbit</span>
                     <span className={`text-[10px] font-black uppercase ${overdue ? 'text-rose-500' : 'text-slate-600'}`}>
                        {overdue ? '⚠️ Terlewat' : (c.deadline || c.date || '-')}
                     </span>
                  </div>
               </div>
             );
           })}
           {certs.length === 0 && (
             <div className="py-20 text-center text-slate-400 italic text-sm">Belum ada data sertifikasi.</div>
           )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingItem ? 'Ubah Data Sertifikasi' : 'Tambah Sertifikasi Baru'}</h3>
             <CertForm 
               initialData={editingItem} 
               onSubmit={(data: any) => {
                 if (editingItem) onUpdateCert({ ...editingItem, ...data } as Certification);
                 else onAddCert({ ...data, id: Math.random().toString(36).substr(2,9) } as Certification);
                 setIsFormOpen(false);
                 showToast("Sertifikat diperbarui!");
               }}
               onCancel={() => setIsFormOpen(false)}
             />
          </div>
        </div>
      )}
    </div>
  );
};

const CertForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initialData || { name: '', issuer: '', date: new Date().toISOString().split('T')[0], status: TrainingStatus.COMPLETED, deadline: '', cost: 0, progress: 100, relatedSkill: '', certNumber: '', category: '', fileLink: '' });
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({...form, fileLink: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Sertifikasi</label>
        <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penerbit (Issuer)</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Sertifikat</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.certNumber} onChange={e => setForm({...form, certNumber: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Terbit</label>
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
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biaya Ujian (IDR)</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.cost} onChange={e => setForm({...form, cost: parseInt(e.target.value) || 0})} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keahlian Terkait</label>
        <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.relatedSkill} onChange={e => setForm({...form, relatedSkill: e.target.value})} placeholder="Misal: Akuntansi, Tax Planning, dsb" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Fisik (Link / Gambar)</label>
        <div className="flex gap-4">
           <input className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.fileLink} onChange={e => setForm({...form, fileLink: e.target.value})} placeholder="https://..." />
           <label className="px-6 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase cursor-pointer hover:bg-black transition-all">
             Upload
             <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
           </label>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
        <button type="button" onClick={() => onSubmit(form)} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Sertifikat</button>
      </div>
    </div>
  );
};

export default CertificationModule;