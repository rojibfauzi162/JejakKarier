
import React, { useState } from 'react';
import { AppData, SubscriptionPlan, FollowUpConfig, UserRole } from '../../types';

interface UserManagementProps {
  users: AppData[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onManage: (user: AppData) => void;
  followUpConfig?: FollowUpConfig;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, searchQuery, setSearchQuery, onManage, followUpConfig }) => {
  const [confirmModal, setConfirmModal] = useState<{
    user: AppData;
    scriptType: 'reminder' | 'expired';
    daysLeft: number;
    text: string;
    phone: string;
  } | null>(null);

  const prepareFollowUp = (u: AppData, daysLeft: number, type: 'reminder' | 'expired') => {
    if (!followUpConfig || !u.profile?.phone) {
      alert("Script follow up belum dikonfigurasi atau nomor WhatsApp user tidak ditemukan.");
      return;
    }

    let text = type === 'reminder' ? followUpConfig.expiryReminderScript : followUpConfig.justExpiredScript;
    text = text.replace(/\[NAMA\]/g, u.profile.name);
    text = text.replace(/\[HARI_SISA\]/g, daysLeft.toString());

    const cleanPhone = u.profile.phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    setConfirmModal({
      user: u,
      scriptType: type,
      daysLeft,
      text,
      phone: finalPhone
    });
  };

  const handleExecuteFollowUp = () => {
    if (!confirmModal) return;
    window.open(`https://wa.me/${confirmModal.phone}?text=${encodeURIComponent(confirmModal.text)}`, '_blank');
    setConfirmModal(null);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
       <div className="p-8 border-b border-slate-50">
          <input 
            type="text" 
            placeholder="Cari user (nama/email)..." 
            className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs"
            value={searchQuery || ''}
            onChange={e => setSearchQuery(e.target.value)}
          />
       </div>

       {/* DESKTOP TABLE */}
       <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Identitas</th>
                <th className="px-6 py-4 text-center">Paket</th>
                <th className="px-6 py-4 text-center">Masa Aktif</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => {
                const isAdmin = u.role === UserRole.SUPERADMIN;
                const expiryDate = u.expiryDate ? new Date(u.expiryDate) : null;
                const today = new Date();
                today.setHours(0,0,0,0);
                
                let daysLeft = 0;
                if (expiryDate) {
                  const expCopy = new Date(expiryDate);
                  expCopy.setHours(0,0,0,0);
                  daysLeft = Math.ceil((expCopy.getTime() - today.getTime()) / (1000 * 3600 * 24));
                }

                const isExpired = !isAdmin && expiryDate !== null && daysLeft <= 0;
                const isCloseToExpiry = !isAdmin && expiryDate !== null && daysLeft <= 7 && daysLeft > 0;

                return (
                  <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <p className={`font-black text-sm ${isAdmin ? 'text-indigo-600' : 'text-slate-800'}`}>{u.profile?.name || 'User'}</p>
                      <p className="text-[10px] font-bold text-slate-400">{u.profile?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${isAdmin ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">PERMANEN / UNLIMITED</span>
                           <span className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">Admin Access</span>
                        </div>
                      ) : expiryDate ? (
                        <div className="flex flex-col items-center">
                          <p className={`text-[10px] font-black uppercase ${isExpired ? 'text-rose-500' : 'text-slate-700'}`}>
                            {expiryDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <span className={`text-[8px] font-bold uppercase mt-0.5 ${isExpired ? 'text-rose-400' : 'text-indigo-500'}`}>
                            {isExpired ? (daysLeft === 0 ? '(HARI INI)' : `(${Math.abs(daysLeft)} hari lalu)`) : `(${daysLeft} hari lagi)`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Free Trial</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                         {isCloseToExpiry && (
                           <button 
                             onClick={() => prepareFollowUp(u, daysLeft, 'reminder')}
                             className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                           >
                             <i className="bi bi-whatsapp"></i>
                           </button>
                         )}
                         <button onClick={() => onManage(u)} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Kelola</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
       </div>

       {/* MOBILE CARD VIEW */}
       <div className="lg:hidden p-4 space-y-4">
          {users.map(u => {
             const isAdmin = u.role === UserRole.SUPERADMIN;
             const expiryDate = u.expiryDate ? new Date(u.expiryDate) : null;
             const today = new Date();
             today.setHours(0,0,0,0);
             
             let daysLeft = 0;
             if (expiryDate) {
               const expCopy = new Date(expiryDate);
               expCopy.setHours(0,0,0,0);
               daysLeft = Math.ceil((expCopy.getTime() - today.getTime()) / (1000 * 3600 * 24));
             }

             const isExpired = !isAdmin && expiryDate !== null && daysLeft <= 0;
             const isCloseToExpiry = !isAdmin && expiryDate !== null && daysLeft <= 7 && daysLeft > 0;

             return (
               <div key={u.uid} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <h4 className={`font-black text-base leading-tight ${isAdmin ? 'text-indigo-600' : 'text-slate-800'}`}>{u.profile?.name || 'User'}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{u.profile?.email}</p>
                     </div>
                     <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{u.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paket</p>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{u.plan}</span>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Masa Aktif</p>
                        {isAdmin ? (
                           <span className="text-[9px] font-black text-indigo-600 uppercase">PERMANEN</span>
                        ) : expiryDate ? (
                           <p className={`text-[10px] font-black ${isExpired ? 'text-rose-500' : 'text-slate-700'}`}>{expiryDate.toLocaleDateString('id-ID', { day:'2-digit', month:'short' })} ({daysLeft}d)</p>
                        ) : (
                           <span className="text-[9px] font-bold text-slate-300">Free Trial</span>
                        )}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/50 flex justify-end gap-2">
                     {isCloseToExpiry && (
                        <button onClick={() => prepareFollowUp(u, daysLeft, 'reminder')} className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg"><i className="bi bi-whatsapp"></i></button>
                     )}
                     <button onClick={() => onManage(u)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Kelola User</button>
                  </div>
               </div>
             );
          })}
       </div>

       {/* Confirmation Modal */}
       {confirmModal && (
         <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[3000] p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 lg:p-10 animate-in zoom-in duration-300">
              <div className="text-center mb-6">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner ${confirmModal.scriptType === 'expired' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <i className="bi bi-whatsapp"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase">Konfirmasi Follow Up</h3>
                 <p className="text-slate-400 text-xs font-bold mt-2 uppercase">Kirim pesan WhatsApp ke {confirmModal.user.profile.name}?</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pratinjau Pesan:</p>
                 <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{confirmModal.text}"</p>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                 <button onClick={handleExecuteFollowUp} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Buka WhatsApp</button>
              </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default UserManagement;
