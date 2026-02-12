
import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, SubscriptionProduct } from '../../types';

const ProductForm = ({ initialData, onCancel, onSubmit, onDelete }: any) => {
  const [form, setForm] = useState<Partial<SubscriptionProduct>>(initialData || {
    name: '', tier: SubscriptionPlan.FREE, price: 0, originalPrice: 0, durationDays: 30,
    isActive: true,
    showOnLanding: true,
    isHighlighted: false,
    allowedModules: ['dashboard', 'profile', 'daily', 'skills', 'todo_list'],
    limits: { 
      dailyLogs: 10, 
      skills: 10, 
      projects: 5, 
      cvExports: 1,
      trainingHistory: 0,
      certification: 0,
      careerPath: 0,
      jobTracker: 0,
      networking: 0,
      todoList: 0,
      workExperience: 0,
      education: 0,
      careerCalendar: 0
    }
  });

  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Daftar Modul Lengkap Sesuai App.tsx
  const APP_MODULES = [
    { id: 'dashboard', label: 'Dashboard Utama' },
    { id: 'profile', label: 'Profil & Bio' },
    { id: 'daily', label: 'Daily Work Log' },
    { id: 'work_reflection', label: 'Work Reflection' },
    { id: 'reports', label: 'Performance Reports' },
    { id: 'ai_insights', label: 'AI Activity Insights' },
    { id: 'todo_list', label: 'Growth Checklist' },
    { id: 'calendar', label: 'Career Calendar' },
    { id: 'skills', label: 'Skill Matrix' },
    { id: 'career', label: 'Career Path Planner' },
    { id: 'networking', label: 'Networking Vault' },
    { id: 'achievements', label: 'Achievement Tracker' },
    { id: 'loker', label: 'Job Hunt Tracker' },
    { id: 'projects', label: 'Personal Project' },
    { id: 'reviews', label: 'Monthly Review' },
    { id: 'cv_generator', label: 'CV PDF Export' },
    { id: 'online_cv', label: 'Digital Landing Page' },
  ];

  useEffect(() => {
    if (form.price !== undefined && form.originalPrice && form.originalPrice > form.price) {
      const pct = Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100);
      setDiscountPercent(pct);
    }
  }, []);

  const toggleModule = (mId: string) => {
    const current = form.allowedModules || [];
    const next = current.includes(mId) ? current.filter(i => i !== mId) : [...current, mId];
    setForm({...form, allowedModules: next});
  };

  const handlePriceChange = (val: number) => {
    setForm({ ...form, price: val });
    // Update original price if discount is set
    if (discountPercent > 0) {
      const original = Math.round(val / (1 - discountPercent / 100));
      setForm(prev => ({ ...prev, price: val, originalPrice: original }));
    }
  };

  const handleDiscountChange = (pct: number) => {
    setDiscountPercent(pct);
    if (pct > 0 && form.price !== undefined) {
      const original = Math.round(form.price / (1 - pct / 100));
      setForm({ ...form, originalPrice: original });
    } else {
      setForm({ ...form, originalPrice: 0 });
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-12">
      {/* 01: IDENTITAS PAKET */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b pb-4">01. Identitas Paket</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Paket Langganan</label>
            <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-indigo-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Misal: Elite Pro Yearly" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori Tier</label>
            <select className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm cursor-pointer" value={form.tier} onChange={e => setForm({...form, tier: e.target.value as SubscriptionPlan})}>
              {Object.values(SubscriptionPlan).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* 02: HARGA & MONETISASI */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b pb-4">02. Strategi Harga</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Harga Jual (Rp)</label>
            <input type="number" className="w-full px-6 py-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 outline-none font-black text-sm text-indigo-600" value={form.price === 0 ? 0 : (form.price || '')} onChange={e => handlePriceChange(Number(e.target.value))} required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Set Diskon (%)</label>
            <input type="number" min="0" max="99" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm" value={discountPercent || ''} onChange={e => handleDiscountChange(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Harga Coret (Otomatis)</label>
            <input className="w-full px-6 py-4 rounded-2xl bg-slate-100 border border-slate-200 outline-none font-bold text-sm text-rose-400" value={form.originalPrice || 0} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Durasi Akses (Hari)</label>
            <input type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={form.durationDays} onChange={e => setForm({...form, durationDays: Number(e.target.value)})} required />
          </div>
        </div>

        <div className="flex flex-wrap gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-200">
           <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" checked={form.isActive !== false} onChange={e => setForm({...form, isActive: e.target.checked})} />
              <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600">Paket Aktif</span>
           </label>
           <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" checked={form.showOnLanding !== false} onChange={e => setForm({...form, showOnLanding: e.target.checked})} />
              <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600">Tampil di Landing</span>
           </label>
           <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" checked={form.isHighlighted === true} onChange={e => setForm({...form, isHighlighted: e.target.checked})} />
              <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600">Rekomendasi (Highlight)</span>
           </label>
        </div>
      </section>

      {/* 03. LIMITASI DATA */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b pb-4">03. Limitasi Database (0 = Tanpa Batas)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.keys(form.limits || {}).map(key => (
            <div key={key} className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{key.replace(/([A-Z])/g, ' $1')}</label>
              <input 
                type="number" 
                className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white font-black text-sm shadow-sm" 
                value={(form.limits as any)[key] === 'unlimited' ? 0 : (form.limits as any)[key]} 
                onChange={e => {
                  const val = Number(e.target.value);
                  const nextLimits = { ...form.limits, [key]: val === 0 ? 'unlimited' : val };
                  setForm({ ...form, limits: nextLimits as any });
                }} 
              />
            </div>
          ))}
        </div>
      </section>

      {/* 04. PERMISSIONS */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b pb-4">04. Hak Akses Modul Aplikasi</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {APP_MODULES.map(m => (
            <button 
              key={m.id} 
              type="button" 
              onClick={() => toggleModule(m.id)} 
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                form.allowedModules?.includes(m.id) 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{m.label}</span>
              {form.allowedModules?.includes(m.id) ? <i className="bi bi-check-circle-fill"></i> : <i className="bi bi-circle"></i>}
            </button>
          ))}
        </div>
      </section>

      <div className="pt-10 flex flex-col md:flex-row gap-4 border-t border-slate-100">
        <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-black transition-all">
          <i className="bi bi-cloud-check mr-2"></i> Update Katalog Produk
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex-1 py-5 bg-rose-50 text-rose-500 font-black rounded-3xl uppercase text-[11px] tracking-widest hover:bg-rose-500 hover:text-white transition-all">Hapus Paket</button>
        )}
        <button type="button" onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-3xl">Batal</button>
      </div>
    </form>
  );
};

export default ProductForm;
