
import React, { useState } from 'react';
import { DuitkuConfig } from '../../types';

interface DuitkuIntegrationProps {
  initialConfig: DuitkuConfig;
  onSave: (config: DuitkuConfig) => void;
  isSaving: boolean;
}

const DuitkuIntegration: React.FC<DuitkuIntegrationProps> = ({ initialConfig, onSave, isSaving }) => {
  const [form, setForm] = useState<DuitkuConfig>(initialConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-4xl">
       <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
             <i className="bi bi-credit-card-2-front-fill"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Duitku API Integration</h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Otomatisasi pembayaran via Duitku Payment Gateway.</p>
          </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-8">
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

          <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
             <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="bi bi-info-circle-fill"></i> Callback Configuration
             </h4>
             <div className="space-y-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Webhook URL (Callback)</span>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-white px-5 py-3 rounded-xl border border-blue-200 font-mono text-[10px] text-blue-600 truncate">{window.location.origin}/api/callback/duitku</div>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/callback/duitku`); alert("URL disalin!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Copy</button>
                   </div>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Return URL (Redirect)</span>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-white px-5 py-3 rounded-xl border border-blue-200 font-mono text-[10px] text-blue-600 truncate">{window.location.origin}/dashboard</div>
                   </div>
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
