
import React, { useState, useEffect } from 'react';
import { MayarConfig } from '../../types';
import { getMayarConfig, saveMayarConfig } from '../../services/firebase';

const WEBHOOK_EVENTS = [
  "payment.success",
  "payment.failed",
  "order.created",
  "order.completed",
  "subscription.created",
  "subscription.cancelled",
  "payout.completed"
];

const MayarIntegration: React.FC = () => {
  const [config, setConfig] = useState<MayarConfig>({ 
    apiKey: '', 
    subdomain: '',
    webhookSecret: '',
    enabledEvents: ['payment.success'],
    environment: 'sandbox'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ m: string, t: 's' | 'e' } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await getMayarConfig();
      if (res) {
        setConfig(res);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMayarConfig(config);
      setToast({ m: "Kredensial & Webhook Mayar diperbarui! 🚀", t: 's' });
    } catch (e) {
      setToast({ m: "Gagal menyimpan konfigurasi.", t: 'e' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const testApiConnection = async () => {
    if (!config.apiKey) {
      alert("Harap isi API Key terlebih dahulu.");
      return;
    }
    
    setTesting(true);
    try {
      const response = await fetch('https://api.mayar.id/hl/v1/product?page=1&pageSize=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'Accept': 'application/json'
        }
      });
      
      const json = await response.json();
      
      if (response.ok) {
        alert(`✅ KONEKSI BERHASIL!\n\nAPI Mayar merespon dengan status 200 OK.\nTotal data terdeteksi: ${json.data?.total_data || 0} produk.`);
      } else {
        alert(`❌ KONEKSI GAGAL!\n\nStatus: ${response.status}\nPesan: ${json.message || 'API Key mungkin salah atau tidak memiliki akses Headless.'}`);
      }
    } catch (e: any) {
      alert(`❌ ERROR SISTEM!\n\nTidak dapat menghubungi API Mayar.\n${e.message}\n\nCatatan: Pastikan browser Anda tidak memblokir request karena CORS (Gunakan Extension CORS Unblock jika testing di localhost).`);
    } finally {
      setTesting(true);
      setTimeout(() => setTesting(false), 500);
    }
  };

  const toggleEvent = (eventName: string) => {
    const currentEvents = config.enabledEvents || [];
    if (currentEvents.includes(eventName)) {
      setConfig({ ...config, enabledEvents: currentEvents.filter(e => e !== eventName) });
    } else {
      setConfig({ ...config, enabledEvents: [...currentEvents, eventName] });
    }
  };

  if (loading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Memuat Kredensial Mayar...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
      {toast && (
        <div className={`fixed top-10 right-10 z-[3000] px-8 py-4 rounded-2xl shadow-2xl border text-white font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-4 ${toast.t === 's' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
           {toast.m}
        </div>
      )}

      <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-50">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl font-black">M</div>
            <div className="flex-1">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Mayar Integration Hub</h3>
               <p className="text-slate-400 font-medium text-sm mt-1">Otomatisasi aktivasi paket berlangganan via Mayar.id.</p>
            </div>
            <button 
              type="button"
              onClick={testApiConnection}
              disabled={testing}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${testing ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
            >
              {testing ? 'Testing...' : 'Test Koneksi API'}
            </button>
         </div>

         <form onSubmit={handleSave} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Environment</label>
                 <select 
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs"
                  value={config.environment}
                  onChange={e => setConfig({...config, environment: e.target.value as any})}
                 >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mayar API Key (Bearer)</label>
                 <input 
                  type="password" 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:border-blue-400 transition-all" 
                  placeholder="Bearer Key..."
                  value={config.apiKey}
                  onChange={e => setConfig({...config, apiKey: e.target.value})}
                  required
                 />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subdomain Mayar Anda</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:border-blue-400 transition-all" 
                    placeholder="Contoh: drevenlight"
                    value={config.subdomain || ''}
                    onChange={e => setConfig({...config, subdomain: e.target.value.trim().toLowerCase()})}
                  />
                  <span className="text-sm font-black text-slate-400">.myr.id</span>
               </div>
               <p className="text-[9px] text-slate-400 italic mt-1 ml-1">Digunakan untuk merangkai link pembayaran (misal: drevenlight.myr.id/plink/...)</p>
            </div>

            <div className="space-y-6">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook Events Configuration</label>
               <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Events</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {WEBHOOK_EVENTS.map(event => (
                       <button 
                        key={event}
                        type="button"
                        onClick={() => toggleEvent(event)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${
                          config.enabledEvents?.includes(event) 
                            ? 'bg-white border-blue-200 shadow-sm' 
                            : 'bg-transparent border-slate-100 opacity-60 grayscale hover:opacity-100'
                        }`}
                       >
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            config.enabledEvents?.includes(event) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
                          }`}>
                             {config.enabledEvents?.includes(event) && <i className="bi bi-check-lg text-white text-[10px]"></i>}
                          </div>
                          <span className={`text-xs font-bold ${config.enabledEvents?.includes(event) ? 'text-slate-900' : 'text-slate-400'}`}>{event}</span>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook Secret Key (Signing Secret)</label>
               <input 
                type="password" 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:border-blue-400 transition-all" 
                placeholder="Masukkan secret untuk validasi x-mayar-signature"
                value={config.webhookSecret || ''}
                onChange={e => setConfig({...config, webhookSecret: e.target.value})}
               />
               <p className="text-[9px] text-slate-400 italic mt-1 ml-1">Digunakan untuk memverifikasi payload menggunakan HMAC SHA256.</p>
            </div>

            <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
               <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4">Webhook Callback URL</h4>
               <div className="flex gap-3">
                  <div className="flex-1 bg-white px-5 py-3 rounded-xl border border-blue-200 font-mono text-[10px] text-blue-600 truncate">
                    {window.location.origin}/api/webhooks/mayar
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/mayar`); alert("URL disalin!"); }} className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-xs hover:bg-blue-50 transition-colors">📋 Copy</button>
               </div>
               <p className="text-[9px] text-blue-400 font-medium mt-4 leading-relaxed">
                  Pasang URL di atas pada dashboard Mayar &gt; Settings &gt; Webhooks. Pastikan event <code>payment.success</code> diaktifkan.
               </p>
            </div>

            <button 
              disabled={saving}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi Mayar'}
            </button>
         </form>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-start gap-6">
         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shrink-0"><i className="bi bi-info-circle"></i></div>
         <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Tips Debugging</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
               Gunakan tombol <b>Test Koneksi API</b> di atas untuk memastikan <i>Bearer Key</i> Anda memiliki akses ke Headless API Mayar. Jika hasil curl sukses tapi integrasi di sini gagal, pastikan ID Produk yang Anda masukkan di <i>Product Matrix</i> adalah <b>Slug</b> atau <b>ID Internal</b> yang valid sesuai data yang ditarik dari API Mayar.
            </p>
         </div>
      </div>
    </div>
  );
};

export default MayarIntegration;
