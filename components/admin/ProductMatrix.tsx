
import React from 'react';
import { SubscriptionProduct } from '../../types';

interface ProductMatrixProps {
  products: SubscriptionProduct[];
  setEditingProduct: (p: SubscriptionProduct | null) => void;
  setIsProductModalOpen: (open: boolean) => void;
}

const ProductMatrix: React.FC<ProductMatrixProps> = ({ products, setEditingProduct, setIsProductModalOpen }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
       <div className="flex justify-between items-center px-4">
          <div className="space-y-1">
             <h3 className="text-xl font-black text-slate-900 uppercase">Subscription Catalog</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atur penawaran paket & limitasi fitur.</p>
          </div>
          <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
            + Tambah Paket
          </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
          {products.map(p => (
            <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h4 className="text-xl font-black text-slate-900 tracking-tight">{p.name}</h4>
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100 mt-2 inline-block">{p.tier}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm">✎</button>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-slate-50 rounded-2xl border">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Harga Utama</p>
                        <p className="text-base font-black text-slate-800">Rp {p.price.toLocaleString('id-ID')}</p>
                        {p.originalPrice ? (
                          <p className="text-[10px] font-bold text-rose-400 line-through">Rp {p.originalPrice.toLocaleString('id-ID')}</p>
                        ) : null}
                     </div>
                     <div className="p-5 bg-slate-50 rounded-2xl border">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Durasi</p>
                        <p className="text-base font-black text-slate-800">{p.durationDays} Hari</p>
                     </div>
                  </div>

                  {/* INFO MAPPING MAYAR */}
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${p.mayarProductId ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${p.mayarProductId ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>M</div>
                    <div className="overflow-hidden">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mayar Link ID / Slug</p>
                      <p className={`text-[10px] font-mono font-bold truncate ${p.mayarProductId ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {p.mayarProductId || 'BELUM TERSETEL'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Limitasi Modul & Data</p>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Daily Logs</span>
                           <span className="text-xs font-black text-slate-700">{p.limits.dailyLogs === 'unlimited' ? '∞' : p.limits.dailyLogs}</span>
                        </div>
                        <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Skills</span>
                           <span className="text-xs font-black text-slate-700">{p.limits.skills === 'unlimited' ? '∞' : p.limits.skills}</span>
                        </div>
                        <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Projects</span>
                           <span className="text-xs font-black text-slate-700">{p.limits.projects === 'unlimited' ? '∞' : p.limits.projects}</span>
                        </div>
                        <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                           <span className="text-[8px] font-black text-slate-400 uppercase">CV Export</span>
                           <span className="text-xs font-black text-slate-700">{p.limits.cvExports === 'unlimited' ? '∞' : p.limits.cvExports}</span>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 flex flex-wrap gap-2">
                    {p.allowedModules.map((m: string) => (
                      <span key={m} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-100">✓ {m}</span>
                    ))}
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
            </div>
          ))}
       </div>
    </div>
  );
};

export default ProductMatrix;
