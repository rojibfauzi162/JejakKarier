
import React, { useState, useEffect } from 'react';
import { ScalevConfig } from '../../types';
import { getScalevConfig, saveScalevConfig } from '../../services/firebase';

const ScalevIntegration: React.FC = () => {
  const [config, setConfig] = useState<ScalevConfig>({ apiKey: '', webhookSecret: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ m: string, t: 's' | 'e' } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await getScalevConfig();
      if (res) setConfig(res);
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveScalevConfig(config);
      setToast({ m: "Kredensial Scalev diperbarui! 🚀", t: 's' });
    } catch (e) {
      setToast({ m: "Gagal menyimpan konfigurasi.", t: 'e' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Memuat Kredensial...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed top-10 right-10 z-[3000] px-8 py-4 rounded-2xl shadow-2xl border text-white font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-4 ${toast.t === 's' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'}`}>
           {toast.m}
        </div>
      )}

      <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-50">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl font-black">S</div>
            <div>
               <h3 className="text-2xl font-black text-slate-900 uppercase">Scalev Integration Hub</h3>
               <p className="text-slate-400 font-medium">Otomatisasi aktivasi paket berlangganan.</p>
            </div>
         </div>

         <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scalev API Key</label>
               <input 
                type="password" 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:border-indigo-400 transition-all" 
                placeholder="Mulai dengan sc_..."
                value={config.apiKey}
                onChange={e => setConfig({...config, apiKey: e.target.value})}
                required
               />
               <p className="text-[9px] text-slate-400 italic mt-1 ml-1">Dapatkan di Dashboard Scalev > Settings > API Keys.</p>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook Secret (Optional)</label>
               <input 
                type="password" 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:border-indigo-400 transition-all" 
                placeholder="whsec_..."
                value={config.webhookSecret || ''}
                onChange={e => setConfig({...config, webhookSecret: e.target.value})}
               />
               <p className="text-[9px] text-slate-400 italic mt-1 ml-1">Gunakan untuk memverifikasi keaslian payload dari Scalev.</p>
            </div>

            <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
               <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-4">Webhook Endpoint URL</h4>
               <div className="flex gap-3">
                  <div className="flex-1 bg-white px-5 py-3 rounded-xl border border-indigo-200 font-mono text-[10px] text-indigo-600 truncate">
                    {window.location.origin}/api/webhooks/scalev
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/scalev`); alert("URL disalin!"); }} className="px-4 py-3 bg-white border border-indigo-200 rounded-xl text-xs hover:bg-indigo-50">📋</button>
               </div>
               <p className="text-[9px] text-indigo-400 font-medium mt-4 leading-relaxed">
                  Pasang URL di atas pada pengaturan Webhook Scalev Anda. Sistem akan mendengarkan event <code>order.paid</code> atau <code>order.completed</code>.
               </p>
            </div>

            <button 
              disabled={saving}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Update Kredensial Scalev'}
            </button>
         </form>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-start gap-6">
         <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shrink-0"><i className="bi bi-info-circle"></i></div>
         <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Cara Kerja Automasi</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
               Setelah API Key terpasang, pastikan Anda sudah memasukkan <b>Scalev Product ID</b> pada modul "Product Matrix" untuk setiap paket. Ketika pesanan dibayar di Scalev, sistem akan mencari user berdasarkan email dan mengaktifkan paket secara otomatis sesuai durasi yang ditentukan.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ScalevIntegration;
