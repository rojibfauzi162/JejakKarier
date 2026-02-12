
import React, { useState, useEffect } from 'react';
import { SubscriptionProduct, SubscriptionPlan } from '../../types';

interface UpgradeModalProps {
  products: SubscriptionProduct[];
  currentPlan: SubscriptionPlan;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ products, currentPlan, onClose, userEmail, userName }) => {
  const premiumProducts = products.filter(p => p.price > 0);

  const handlePay = (planName: string, price: number) => {
    const waNumber = "628123456789"; 
    const message = encodeURIComponent(`Halo Admin, saya mau upgrade ke paket *${planName}* seharga *Rp ${price.toLocaleString('id-ID')}*.\n\nEmail: ${userEmail || '-'}\nNama: ${userName || '-'}`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="bg-indigo-600 p-10 lg:p-14 text-white relative overflow-hidden shrink-0">
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner"><i className="bi bi-rocket-takeoff"></i></div>
                <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">✕</button>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none mb-4">Akses Unlimited <span className="text-indigo-200">FokusKarir Pro</span></h2>
              <p className="text-indigo-100 text-lg font-medium italic opacity-80">Buka seluruh potensi AI Intelligence melalui aktivasi manual admin.</p>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-14 no-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {premiumProducts.map(p => (
                <div key={p.id} className="bg-slate-50 p-8 rounded-[3.5rem] border-2 border-slate-100 hover:border-indigo-600 hover:bg-white transition-all duration-500 flex flex-col group relative overflow-hidden hover:shadow-2xl">
                   <div className="flex-1 space-y-8">
                      <div>
                         <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">{p.name}</h4>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100">{p.tier}</span>
                         </div>
                         <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900">Rp {p.price.toLocaleString('id-ID')}</p>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Akses selama {p.durationDays} Hari</p>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Keuntungan Utama</p>
                         <ul className="space-y-2.5">
                            {p.allowedModules.slice(0, 6).map(m => (
                              <li key={m} className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                 <i className="bi bi-check-circle-fill text-emerald-500"></i>
                                 <span className="uppercase">{m.replace('_', ' ')}</span>
                              </li>
                            ))}
                         </ul>
                      </div>
                   </div>

                   <button 
                    onClick={() => handlePay(p.name, p.price)}
                    className="w-full mt-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 z-10"
                   >
                      Pilih & Chat Admin →
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
