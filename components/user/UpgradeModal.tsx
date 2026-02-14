
import React from 'react';
import { SubscriptionProduct, SubscriptionPlan } from '../../types';

interface UpgradeModalProps {
  products: SubscriptionProduct[];
  currentPlan: SubscriptionPlan;
  onClose: () => void;
  onSelectPlan: (p: SubscriptionProduct) => void;
  userEmail?: string;
  userName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ products, currentPlan, onClose, onSelectPlan, userEmail, userName }) => {
  const premiumProducts = products.filter(p => p.price > 0).sort((a, b) => a.price - b.price);

  const formatDurationLabel = (days: number) => {
    if (days >= 3650) return 'Selamanya';
    if (days >= 365) return `${Math.floor(days / 365)} Tahun`;
    if (days >= 30) return `${Math.floor(days / 30)} Bulan`;
    return `${days} Hari`;
  };

  const getDiscountLabel = (plan: SubscriptionProduct) => {
    if (plan.originalPrice && plan.originalPrice > plan.price) {
      const pct = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
      return `Hemat ${pct}%`;
    }
    return "Promo Terbatas";
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 lg:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-5xl rounded-[3rem] lg:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col">
        {/* Header Section */}
        <div className="bg-indigo-600 p-8 lg:p-14 text-white relative overflow-hidden shrink-0">
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner"><i className="bi bi-rocket-takeoff"></i></div>
                <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/20 rounded-full flex items-center justify-center transition-all font-black text-xs">✕</button>
              </div>
              <h2 className="text-2xl lg:text-5xl font-black tracking-tighter uppercase leading-none mb-4">Akses Unlimited <span className="text-indigo-200">FokusKarir Pro</span></h2>
              <p className="text-indigo-100 text-sm lg:text-lg font-medium italic opacity-80">Aktifkan potensi penuh karier Anda dengan analisis cerdas dan rekam jejak tanpa batas.</p>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        {/* Content Section - Redesigned to match Landing Page Aesthetics */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-14 no-scrollbar bg-white">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch pb-4">
              {premiumProducts.map(p => {
                const isYearly = p.durationDays >= 365;
                const monthlyPrice = p.durationDays >= 30 ? Math.round(p.price / (p.durationDays / 30)) : null;

                return (
                  <div key={p.id} className={`p-8 rounded-[3.5rem] border-2 flex flex-col h-full transition-all duration-700 relative group hover:shadow-2xl ${isYearly ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-900 border-slate-100 hover:border-indigo-600'}`}>
                    
                    {/* LABELS */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      {isYearly && (
                        <div className="px-4 py-1 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap animate-bounce">
                           Paling Hemat
                        </div>
                      )}
                      <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md whitespace-nowrap ${isYearly ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        {getDiscountLabel(p)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isYearly ? 'text-indigo-400' : 'text-slate-400'}`}>{formatDurationLabel(p.durationDays)}</p>
                      </div>
                      
                      <h4 className="text-xl font-black uppercase tracking-tight mb-6 leading-none">{p.name}</h4>
                      
                      <div className="mb-8">
                        {p.originalPrice && (
                          <p className={`text-sm font-bold line-through mb-1 ${isYearly ? 'text-rose-400' : 'text-rose-500'}`}>
                            Rp {p.originalPrice.toLocaleString('id-ID')}
                          </p>
                        )}
                        <span className="text-4xl font-black tracking-tighter">Rp {p.price.toLocaleString('id-ID')}</span>
                        {isYearly && monthlyPrice && (
                          <p className="text-[11px] font-bold mt-2 italic text-indigo-300">
                            (Setara Rp {monthlyPrice.toLocaleString('id-ID')} / bulan)
                          </p>
                        )}
                      </div>

                      <div className={`flex justify-between items-center mb-4 border-b pb-2 ${isYearly ? 'border-white/10' : 'border-slate-50'}`}>
                         <p className={`text-[9px] font-black uppercase tracking-widest ${isYearly ? 'text-indigo-300' : 'text-indigo-600'}`}>Benefit Premium</p>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isYearly ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>TOP PRIORITY</span>
                      </div>

                      <ul className="space-y-3.5 mb-10">
                        {p.allowedModules.slice(0, 4).map((m: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-[10px] font-bold tracking-tight">
                            <span className={isYearly ? 'text-indigo-400' : 'text-indigo-600'}>✓</span>
                            <span className={isYearly ? 'opacity-80' : 'text-slate-600 uppercase'}>{m.replace('_', ' ')}</span>
                          </li>
                        ))}
                        <li className="flex items-start gap-3 text-[10px] font-bold tracking-tight">
                           <span className={isYearly ? 'text-indigo-400' : 'text-indigo-600'}>✓</span>
                           <span className={isYearly ? 'opacity-80' : 'text-slate-600 uppercase'}>{p.limits.dailyLogs === 'unlimited' ? 'UNLIMITED LOGS' : `${p.limits.dailyLogs} LOGS PER BULAN`}</span>
                        </li>
                      </ul>
                    </div>

                    <button 
                      onClick={() => onSelectPlan(p)}
                      className={`w-full py-4 rounded-[1.75rem] font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isYearly ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-slate-900 text-white hover:bg-black'}`}
                    >
                      Daftar & Checkout →
                    </button>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
