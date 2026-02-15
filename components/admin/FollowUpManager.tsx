import React, { useState } from 'react';
import { FollowUpConfig } from '../../types';

interface FollowUpManagerProps {
  initialConfig: FollowUpConfig;
  onSave: (config: FollowUpConfig) => void;
  isSaving: boolean;
}

const FollowUpManager: React.FC<FollowUpManagerProps> = ({ initialConfig, onSave, isSaving }) => {
  const [form, setForm] = useState<FollowUpConfig>(initialConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-4xl">
       <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
             <i className="bi bi-chat-left-dots-fill"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Follow Up Script Manager</h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Kelola template pesan otomatis untuk menyapa pelanggan.</p>
          </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template: Pembayaran Pending</label>
                   <span className="text-[8px] font-bold text-indigo-400 uppercase">Var: [NAMA], [PAKET], [ID_TX]</span>
                </div>
                <textarea 
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-bold text-xs focus:border-rose-400 transition-all min-h-[120px] resize-none" 
                  value={form.pendingPaymentScript}
                  onChange={e => setForm({...form, pendingPaymentScript: e.target.value})}
                  placeholder="Ketik template pesan di sini..."
                  required
                />
             </div>

             <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template: Masa Aktif Hampir Habis (3 Hari Lagi)</label>
                   <span className="text-[8px] font-bold text-indigo-400 uppercase">Var: [NAMA], [HARI_SISA]</span>
                </div>
                <textarea 
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-bold text-xs focus:border-rose-400 transition-all min-h-[120px] resize-none" 
                  value={form.expiryReminderScript}
                  onChange={e => setForm({...form, expiryReminderScript: e.target.value})}
                  placeholder="Ketik template pesan di sini..."
                  required
                />
             </div>

             <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template: Masa Aktif Telah Habis (1 Hari)</label>
                   <span className="text-[8px] font-bold text-indigo-400 uppercase">Var: [NAMA]</span>
                </div>
                <textarea 
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-bold text-xs focus:border-rose-400 transition-all min-h-[120px] resize-none" 
                  value={form.justExpiredScript}
                  onChange={e => setForm({...form, justExpiredScript: e.target.value})}
                  placeholder="Ketik template pesan di sini..."
                  required
                />
             </div>
          </div>

          <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
             <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="bi bi-info-circle-fill"></i> Panduan Variabel
             </h4>
             <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Gunakan kurung siku untuk memasukkan data dinamis secara otomatis: <br/>
                <b>[NAMA]</b> : Nama lengkap user. <br/>
                <b>[PAKET]</b> : Nama paket yang di-order. <br/>
                <b>[ID_TX]</b> : ID Transaksi order. <br/>
                <b>[HARI_SISA]</b> : Jumlah hari tersisa sebelum expired.
             </p>
          </div>

          <button 
            disabled={isSaving}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Template Script'}
          </button>
       </form>
    </div>
  );
};

export default FollowUpManager;