
import React, { useState } from 'react';
import { SubscriptionPlan, SubscriptionProduct } from '../../types';

const ProductForm = ({ initialData, onCancel, onSubmit, onDelete }: any) => {
  const [form, setForm] = useState<Partial<SubscriptionProduct>>(initialData || {
    name: '', tier: SubscriptionPlan.FREE, price: 0, durationDays: 30,
    mayarProductId: '',
    allowedModules: ['dashboard', 'profile', 'daily', 'skills'],
    limits: { dailyLogs: 10, skills: 10, projects: 5, cvExports: 1 }
  });

  const tiers = Object.values(SubscriptionPlan);
  const modules = ['dashboard', 'profile', 'daily', 'skills', 'todo', 'career', 'loker', 'cv', 'networking', 'projects', 'reviews', 'ai_insights'];

  const toggleModule = (m: string) => {
    const currentModules = form.allowedModules || [];
    const next = currentModules.includes(m) 
      ? currentModules.filter((i: string) => i !== m) 
      : [...currentModules, m];
    setForm({...form, allowedModules: next});
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Paket</label>
          <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier</label>
          <select className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs" value={form.tier} onChange={e => setForm({...form, tier: e.target.value as SubscriptionPlan})}>
            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (IDR)</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Masa Aktif (Hari)</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.durationDays} onChange={e => setForm({...form, durationDays: Number(e.target.value)})} required />
        </div>
      </div>

      {/* MAYAR INTEGRATION FIELD - UPDATED WITH HELPERS */}
      <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] space-y-6">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200">M</span>
          <div>
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">Mayar.id Automation</h4>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Sinkronisasi Transaksi & Aktivasi Akun Otomatis</p>
          </div>
        </div>
        
        <div className="space-y-3">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Mayar Link ID / Slug</label>
           <input 
             className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-blue-200 outline-none font-mono text-xs text-blue-600 focus:border-blue-500 transition-all placeholder:text-slate-300" 
             placeholder="Contoh: p-abcd123 atau slug-link-anda"
             value={form.mayarProductId || ''} 
             onChange={e => setForm({...form, mayarProductId: e.target.value})} 
           />
           
           <div className="bg-white/60 p-4 rounded-xl border border-blue-100 space-y-2">
              <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <i className="bi bi-info-circle-fill"></i> CARA MENDAPATKAN ID:
              </p>
              <ul className="text-[10px] text-slate-500 space-y-1 font-medium italic list-disc ml-4">
                <li>Buka Dashboard Mayar &gt; Pilih Link Pembayaran / Produk.</li>
                <li>ID adalah <b>Slug</b> di akhir URL. (Misal: mayar.id/pl/<b>ABCDE</b> &rarr; Isikan <b>ABCDE</b>).</li>
                <li>Atau jika menggunakan fitur "Product", gunakan ID yang tertera di URL edit produk.</li>
              </ul>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limitasi Data (0 = Unlimited)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['dailyLogs', 'skills', 'projects', 'cvExports'].map(k => (
            <div key={k} className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase ml-1">{k}</span>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-black" 
                value={form.limits ? (form.limits as any)[k] === 'unlimited' ? 0 : (form.limits as any)[k] : 0} 
                onChange={e => {
                  const val = Number(e.target.value) || 'unlimited';
                  const currentLimits = form.limits || { dailyLogs: 10, skills: 10, projects: 5, cvExports: 1 };
                  const nextLimits = { ...currentLimits, [k]: val } as SubscriptionProduct['limits'];
                  setForm({ ...form, limits: nextLimits });
                }} 
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modul Diizinkan</label>
        <div className="flex flex-wrap gap-2">
          {modules.map(m => (
            <button key={m} type="button" onClick={() => toggleModule(m)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${form.allowedModules?.includes(m) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-300'}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="pt-8 flex gap-4">
        {onDelete && <button type="button" onClick={onDelete} className="px-8 py-4 bg-rose-50 text-rose-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Hapus</button>}
        <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">Simpan Katalog</button>
        <button type="button" onClick={onCancel} className="px-8 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Batal</button>
      </div>
    </form>
  );
};

export default ProductForm;
