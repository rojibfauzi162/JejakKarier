
import React from 'react';
import { AppData, SubscriptionProduct, AccountStatus } from '../../types';

interface BillingProps {
  data: AppData;
  products: SubscriptionProduct[];
}

const Billing: React.FC<BillingProps> = ({ data, products }) => {
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  const today = new Date();
  const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : Infinity;
  const isExpired = daysRemaining <= 0;

  const currentProduct = products.find(p => p.tier === data.plan);

  const handlePay = (planName: string, price: number) => {
    const waNumber = "628123456789"; // Ganti dengan nomor Admin
    const message = encodeURIComponent(`Halo Admin FokusKarir, saya ingin berlangganan/perpanjang paket *${planName}* seharga *Rp ${price.toLocaleString('id-ID')}*.\n\nEmail Akun: ${data.profile.email}\nNama: ${data.profile.name}\n\nMohon instruksi pembayarannya.`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 px-4 lg:px-0">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Billing & Subscription</h2>
        <p className="text-slate-500 font-medium italic">"Kelola akses dan upgrade kualifikasi profesional Anda melalui aktivasi manual."</p>
      </header>

      {/* CURRENT SUBSCRIPTION CARD */}
      <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-100">
                     <i className="bi bi-gem"></i>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paket Aktif Saat Ini</p>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{currentProduct?.name || data.plan}</h3>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-[1.75rem] border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Akun</p>
                     <span className={`text-sm font-black uppercase ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isExpired ? 'Expired' : data.status === AccountStatus.ACTIVE ? 'Active' : data.status}
                     </span>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-[1.75rem] border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Berakhir Pada</p>
                     <p className="text-sm font-black text-slate-800 uppercase">
                        {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selamanya'}
                     </p>
                  </div>
               </div>
            </div>

            <div className="md:w-72 bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-center items-center text-center">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Sisa Masa Aktif</p>
               <p className="text-5xl font-black text-indigo-600 tracking-tighter">
                  {daysRemaining === Infinity ? '∞' : Math.max(0, daysRemaining)}
               </p>
               <p className="text-[10px] font-bold text-indigo-400 uppercase mt-2">Hari Tersisa</p>
            </div>
         </div>
         <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* UPGRADE OPTIONS */}
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
            <div>
               <h3 className="text-xl font-black text-slate-900 uppercase">Pilihan Paket Masa Depan</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih paket dan hubungi Admin untuk aktivasi instan.</p>
            </div>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
               Aktivasi Manual via WhatsApp
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.filter(p => p.price > 0).map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden">
                 <div className="flex-1 space-y-8">
                    <div>
                       <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">{p.name}</h4>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100">{p.tier}</span>
                       </div>
                       
                       <div className="space-y-1">
                          {p.originalPrice ? (
                             <p className="text-sm font-bold text-rose-400 line-through">Rp {p.originalPrice.toLocaleString('id-ID')}</p>
                          ) : null}
                          <p className="text-3xl font-black text-slate-900">Rp {p.price.toLocaleString('id-ID')}</p>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Akses selama {p.durationDays} Hari</p>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Fitur & Keuntungan</p>
                       <ul className="space-y-2.5">
                          {p.allowedModules.slice(0, 5).map(m => (
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
                  className="w-full mt-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 z-10"
                 >
                    {data.plan === p.tier ? 'Perpanjang via Admin' : 'Pilih & Hubungi Admin →'}
                 </button>
                 
                 <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors duration-500"></div>
              </div>
            ))}
         </div>
      </div>

      {/* HELP SECTION */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
         <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0"><i className="bi bi-chat-dots-fill"></i></div>
         <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tight mb-1">Butuh Bantuan Aktivasi?</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">Sistem kami menggunakan verifikasi manual untuk keamanan tambahan. Silakan kirimkan bukti transaksi untuk mendapatkan akses premium Anda.</p>
         </div>
         <button onClick={() => window.open('https://wa.me/628123456789', '_blank')} className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-100 transition-all">WhatsApp Support</button>
      </div>
    </div>
  );
};

export default Billing;
