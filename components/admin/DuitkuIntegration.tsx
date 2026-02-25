
import React, { useState, useEffect } from 'react';
import { DuitkuConfig } from '../../types';
import { getDuitkuConfig } from '../../services/firebase';

interface DuitkuIntegrationProps {
  initialConfig: DuitkuConfig;
  onSave: (config: DuitkuConfig) => void;
  isSaving: boolean;
}

const DuitkuIntegration: React.FC<DuitkuIntegrationProps> = ({ initialConfig, onSave, isSaving }) => {
  const [form, setForm] = useState<DuitkuConfig>(initialConfig);
  
  // URL Default berdasarkan hasil deploy Cloud Functions
  const DEFAULT_CALLBACK = "https://us-central1-jejakkarir-11379.cloudfunctions.net/duitkuCallback";
  const DEFAULT_RETURN = window.location.origin + "/billing";

  useEffect(() => {
    // Memastikan jika config kosong, gunakan default
    if (!form.callbackUrl) setForm(prev => ({ ...prev, callbackUrl: DEFAULT_CALLBACK }));
    if (!form.returnUrl) setForm(prev => ({ ...prev, returnUrl: DEFAULT_RETURN }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("URL disalin ke clipboard!");
  };

  return (
    <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-4xl animate-in fade-in duration-500">
       <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
             <i className="bi bi-credit-card-2-front-fill"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Duitku API Integration</h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Otomatisasi pembayaran via Duitku Payment Gateway.</p>
          </div>
          <a 
            href={form.environment === 'sandbox' ? "https://sandbox.duitku.com/merchant" : "https://passport.duitku.com/merchant"} 
            target="_blank" 
            rel="noreferrer"
            className={`px-5 py-2.5 border rounded-xl text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-2 ${form.environment === 'sandbox' ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {form.environment === 'sandbox' ? 'Login Sandbox Dashboard ↗' : 'Login Production Dashboard ↗'}
          </a>
       </div>

       <form onSubmit={handleSubmit} className="space-y-8">
          {/* Warning Alert */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${form.environment === 'sandbox' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
            <i className={`bi ${form.environment === 'sandbox' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} text-lg`}></i>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest">{form.environment === 'sandbox' ? 'Mode Sandbox (Testing)' : 'Mode Production (Live)'}</p>
              <p className="text-xs leading-relaxed opacity-90">
                {form.environment === 'sandbox' 
                  ? "Transaksi hanya akan muncul di Dashboard Sandbox. Gunakan kartu kredit test / simulator Duitku. Jangan gunakan uang asli." 
                  : "Transaksi akan muncul di Dashboard Production (Passport). Pastikan Merchant Code & API Key adalah versi Production."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Merchant Code</label>
                <input 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-indigo-400 transition-all" 
                  value={form.merchantCode}
                  onChange={e => setForm({...form, merchantCode: e.target.value})}
                  placeholder="DXXXXX"
                  required
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key (Merchant Key)</label>
                <input 
                  type="password"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-indigo-400 transition-all" 
                  value={form.apiKey}
                  onChange={e => setForm({...form, apiKey: e.target.value})}
                  placeholder="Karakter API Key Anda..."
                  required
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Environment</label>
             <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setForm({...form, environment: 'sandbox'})}
                  className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${form.environment === 'sandbox' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  Sandbox (Testing)
                </button>
                <button 
                  type="button" 
                  onClick={() => setForm({...form, environment: 'production'})}
                  className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${form.environment === 'production' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  Production (Live)
                </button>
             </div>
          </div>

          <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 space-y-6">
             <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                <i className="bi bi-info-circle-fill"></i> Callback Configuration
             </h4>
             
             <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Webhook URL (Duitku Callback)</span>
                      <button type="button" onClick={() => copyToClipboard(form.callbackUrl || DEFAULT_CALLBACK)} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Copy URL</button>
                   </div>
                   <input 
                      className="w-full px-5 py-3 rounded-xl border border-blue-200 bg-white font-mono text-[10px] text-blue-600 outline-none"
                      value={form.callbackUrl || DEFAULT_CALLBACK}
                      onChange={e => setForm({...form, callbackUrl: e.target.value})}
                   />
                   <p className="text-[8px] text-slate-400 italic">Masukkan URL ini di Dashboard Duitku &gt; Project &gt; Callback URL.</p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Return URL (Redirect setelah bayar)</span>
                   </div>
                   <input 
                      className="w-full px-5 py-3 rounded-xl border border-blue-200 bg-white font-mono text-[10px] text-slate-600 outline-none"
                      value={form.returnUrl || DEFAULT_RETURN}
                      onChange={e => setForm({...form, returnUrl: e.target.value})}
                   />
                </div>
             </div>
          </div>

          <button 
            disabled={isSaving}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi Duitku'}
          </button>
       </form>
    </div>
  );
};

export default DuitkuIntegration;
