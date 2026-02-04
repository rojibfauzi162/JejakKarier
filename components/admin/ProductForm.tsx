
import React, { useState } from 'react';
import { SubscriptionPlan, SubscriptionProduct } from '../../types';

const ProductForm = ({ initialData, onCancel, onSubmit, onDelete }: any) => {
  const [form, setForm] = useState<Partial<SubscriptionProduct>>(initialData || {
    name: '', tier: SubscriptionPlan.FREE, price: 0, durationDays: 30,
    mayarProductId: '', // Menggunakan field Mayar
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

      {/* MAYAR INTEGRATION FIELD */}
      <div className="p-6 bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-black">M</span>
          <div>
            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Mayar.id Integration</h4>
            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Masukkan Product ID atau Link ID dari Mayar untuk automasi.</p>
          </div>
        </div>
        <div className="space-y-1.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mayar Product ID / Link ID</label>
           <input 
             className="w-full px-5 py-3 rounded-xl bg-white border border-blue-200 outline-none font-mono text-[10px] text-blue-600 focus:border-blue-500 transition-all" 
             placeholder="Contoh: p-XXXXX atau prod-XXXXX"
             value={form.mayarProductId || ''} 
             onChange={e => setForm({...form, mayarProductId: e.target.value})} 
           />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limitasi Data (0 = Unlimited)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(form.limits || {}).map(k => (
            <div key={k} className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase ml-1">{k}</span>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-black" 
                value={(form.limits as any)?.[k] || 0} 
                onChange={e => {
                  const val = Number(e.target.value) || 'unlimited';
                  const nextLimits = { ...(form.limits || {}), [k]: val } as SubscriptionProduct['limits'];
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
