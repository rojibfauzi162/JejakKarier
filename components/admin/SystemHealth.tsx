
import React from 'react';

interface SystemHealthProps {
  keyInfo: any;
  fetchingKeyInfo: boolean;
  aiConfig: any;
  totalTokens: number;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ keyInfo, fetchingKeyInfo, aiConfig, totalTokens }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl"><i className="bi bi-cloud-check"></i></div>
                 <h4 className="text-xl font-black text-slate-900 uppercase">OpenRouter Key Status</h4>
              </div>
              {fetchingKeyInfo && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
           </div>

           {keyInfo ? (
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 bg-slate-50 rounded-2xl border">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Terpakai</p>
                      <p className="text-2xl font-black text-indigo-600">${keyInfo.usage.toFixed(4)}</p>
                   </div>
                   <div className="p-5 bg-slate-900 rounded-2xl text-white">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Limit</p>
                      <p className="text-2xl font-black">{keyInfo.limit === null ? '∞' : `$${keyInfo.limit.toFixed(2)}`}</p>
                   </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border text-center">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Status Keaktifan</p>
                    <span className={`text-sm font-black uppercase ${keyInfo.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>{keyInfo.is_active ? 'AKTIF (ON)' : 'ERROR / EXPIRED'}</span>
                </div>
             </div>
           ) : (
             <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed">
                <p className="text-slate-400 font-bold text-xs uppercase px-10">
                   {aiConfig.openRouterKey ? 'Mengecek ke OpenRouter...' : 'API Key belum disetel.'}
                </p>
             </div>
           )}
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Token Lokal</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{totalTokens.toLocaleString()}</p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase mt-4">Statistik Akumulasi Sistem</p>
        </div>
    </div>
  );
};

export default SystemHealth;
