import React from 'react';
import { SubscriptionProduct } from '../../types';

interface ProductMatrixProps {
  products: SubscriptionProduct[];
  setEditingProduct: (p: SubscriptionProduct | null) => void;
  setIsProductModalOpen: (open: boolean) => void;
}

const ProductMatrix: React.FC<ProductMatrixProps> = ({ products, setEditingProduct, setIsProductModalOpen }) => {
  // Fixed list of limit keys to ensure all are shown in catalog for consistency
  const LIMIT_KEYS = [
    'skills', 'certification', 'projects', 'careerPath',
    'workExperience', 'education', 'dailyLogs', 'todoList',
    'careerCalendar', 'cvExports', 'trainingHistory', 'jobTracker',
    'networking', 'achievements'
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Katalog Paket & Lisensi</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontrol akses fitur, limitasi data, dan strategi harga.</p>
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} 
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <i className="bi bi-plus-lg mr-2"></i> Buat Paket Baru
          </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
          {products.map(p => (
            <div 
              key={p.id} 
              onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }}
              className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative group overflow-hidden flex flex-col h-full cursor-pointer hover:-translate-y-1 active:scale-95"
            >
               {/* Product Header Status */}
               <div className="p-8 pb-0">
                  <div className="flex justify-between items-start mb-6">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <h4 className="text-xl font-black text-slate-900 tracking-tight">{p.name}</h4>
                           {p.isHighlighted && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                           <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded tracking-widest">{p.tier}</span>
                           {p.isActive === false ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black uppercase rounded border border-rose-100">Non-Aktif</span>
                           ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-100">Live</span>
                           )}
                           {p.showOnLanding !== false && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded border border-blue-100">Public</span>
                           )}
                        </div>
                     </div>
                     <div 
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm border border-slate-100"
                     >
                        <i className="bi bi-pencil-square"></i>
                     </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-8">
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">Rp {p.price.toLocaleString('id-ID')}</p>
                     {p.originalPrice && p.originalPrice > p.price && (
                        <p className="text-sm font-bold text-rose-400 line-through">Rp {p.originalPrice.toLocaleString('id-ID')}</p>
                     )}
                  </div>
               </div>
               
               <div className="flex-1 p-8 pt-0 space-y-6">
                  {/* LIMITS GRID - UPDATED TO SHOW ALL KEYS CONSISTENTLY */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Limitasi Database</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                       {LIMIT_KEYS.map(key => {
                         const val = (p.limits as any)?.[key];
                         return (
                           <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                              <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 truncate">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="text-[11px] font-black text-slate-700">{val === 'unlimited' ? '∞' : (val ?? 0)}</p>
                           </div>
                         );
                       })}
                    </div>
                  </div>

                  {/* MODULES SUMMARY */}
                  <div className="space-y-3 pt-2 border-t border-slate-50">
                     <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Modul Terbuka</p>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{p.allowedModules.length} Modul</span>
                     </div>
                     <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto no-scrollbar">
                        {p.allowedModules.map((m: string) => (
                          <span key={m} className="px-2 py-1 bg-white border border-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded shadow-sm">
                             {m.replace('_', ' ')}
                          </span>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>
            </div>
          ))}

          {products.length === 0 && (
             <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                <div className="text-5xl mb-6 grayscale opacity-20">📦</div>
                <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Katalog Masih Kosong</p>
             </div>
          )}
       </div>
    </div>
  );
};

export default ProductMatrix;