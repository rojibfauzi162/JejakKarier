
import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, SubscriptionProduct } from '../../types';

const ProductForm = ({ initialData, onCancel, onSubmit, onDelete }: any) => {
  const [form, setForm] = useState<Partial<SubscriptionProduct>>(initialData || {
    name: '', tier: SubscriptionPlan.FREE, price: 0, originalPrice: 0, durationDays: 30,
    mayarProductId: '',
    allowedModules: ['dashboard', 'profile', 'daily', 'skills'],
    limits: { dailyLogs: 10, skills: 10, projects: 5, cvExports: 1 }
  });

  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    if (form.price && form.originalPrice && form.originalPrice > form.price) {
      const calculatedDiscount = Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100);
      setDiscount(calculatedDiscount);
    }
  }, []);

  const tiers = Object.values(SubscriptionPlan);
  const modules = ['dashboard', 'profile', 'daily', 'skills', 'todo', 'career', 'loker', 'cv', 'networking', 'projects', 'reviews', 'ai_insights', 'calendar'];

  const toggleModule = (m: string) => {
    const currentModules = form.allowedModules || [];
    const next = currentModules.includes(m) 
      ? currentModules.filter((i: string) => i !== m) 
      : [...currentModules, m];
    setForm({...form, allowedModules: next});
  };

  const handlePriceChange = (newPrice: number) => {
    const updatedForm = { ...form, price: newPrice };
    if (discount > 0 && discount < 100) {
      updatedForm.originalPrice = Math.round(newPrice / (1 - discount / 100));
    }
    setForm(updatedForm);
  };

  const handleDiscountChange = (percent: number) => {
    setDiscount(percent);
    if (percent > 0 && percent < 100 && form.price) {
      const calculatedOriginal = Math.round(form.price / (1 - percent / 100));
      setForm({ ...form, originalPrice: calculatedOriginal });
    } else if (percent === 0) {
      setForm({ ...form, originalPrice: 0 });
    }
  };

  const testMayarLink = () => {
    const id = form.mayarProductId;
    if (!id) return alert("Isi ID Mayar terlebih dahulu.");
    
    let url = id;
    if (!id.startsWith('http')) {
       url = id.startsWith('p-') ? `https://mayar.link/p/${id}` : `https://mayar.link/pl/${id}`;
    }
    window.open(url, '_blank');
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Paket</label>
          <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>
        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier</label>
          <select className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs" value={form.tier} onChange={e => setForm({...form, tier: e.target.value as SubscriptionPlan})}>
            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
          <input 
            type="number"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:border-indigo-400" 
            value={form.price || 0} 
            onChange={e => handlePriceChange(Number(e.target.value))} 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Diskon (%)</label>
          <input 
            type="number"
            min="0"
            max="99"
            className="w-full px-5 py-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 outline-none font-bold text-xs" 
            value={discount || ''} 
            onChange={e => handleDiscountChange(Number(e.target.value))} 
          />
        </div>

        <div className="space-y-2 col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Harga Sebelum Diskon (Otomatis)</label>
          <input 
            type="number"
            className="w-full px-5 py-4 rounded-2xl bg-slate-100 border border-slate-200 outline-none font-bold text-xs text-rose-500" 
            value={form.originalPrice || 0} 
            readOnly
          />
        </div>

        <div className="space-y-2 col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Masa Aktif (Hari)</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.durationDays} onChange={e => setForm({...form, durationDays: Number(e.target.value)})} required />
        </div>
      </div>

      <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] space-y-6">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-4">
              <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">M</span>
              <p className="text-xs font-black text-blue-900 uppercase">Mayar.id Link / ID</p>
           </div>
           <button type="button" onClick={testMayarLink} className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-[9px] font-black uppercase hover:bg-blue-50 transition-all">Test Link ↗</button>
        </div>
        
        <input 
          className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-blue-200 outline-none font-mono text-xs text-blue-600 focus:border-blue-500 transition-all" 
          placeholder="ID Produk, Slug, atau URL Lengkap"
          value={form.mayarProductId || ''} 
          onChange={e => setForm({...form, mayarProductId: e.target.value})} 
        />
        
        <div className="space-y-2">
           <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">PANDUAN PEMILIHAN ID:</p>
           <ul className="text-[10px] text-slate-500 space-y-1 font-medium italic">
             <li>• <b>Payment Link</b>: Masukkan Slug (misal: <code>ABCDEF</code>) &rarr; Link: <code>mayar.link/pl/ABCDEF</code></li>
             <li>• <b>Product</b>: Masukkan Slug (misal: <code>p-GXYZ</code>) &rarr; Link: <code>mayar.link/p/p-GXYZ</code></li>
             <li>• <b>Headless/Custom</b>: Masukkan URL lengkap jika Anda menggunakan link khusus.</li>
             <li className="text-rose-500 font-bold">• PENTING: Gunakan 'Internal ID' (UUID) jika ingin webhook lebih stabil.</li>
           </ul>
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
                  const nextLimits = { ...currentLimits, [k]: val === 0 ? 'unlimited' : val } as SubscriptionProduct['limits'];
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
            <button key={m} type="button" onClick={() => toggleModule(m)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${form.allowedModules?.includes(m) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-300'}`}>{m.replace('_', ' ')}</button>
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
