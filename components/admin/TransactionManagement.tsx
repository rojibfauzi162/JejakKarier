
import React, { useState, useMemo } from 'react';
import { AppData, SubscriptionPlan, AccountStatus, PaymentStatus, ManualTransaction, SubscriptionProduct, UserRole, FollowUpConfig } from '../../types';

interface TransactionManagementProps {
  users: AppData[];
  products: SubscriptionProduct[];
  onUpdateMetadata: (uid: string, fields: Partial<AppData>) => Promise<void>;
  onManageUser: (user: AppData) => void;
  followUpConfig?: FollowUpConfig;
}

type TimeFilter = 'all' | 'today' | '7days' | '30days' | '90days' | '365days' | 'custom';

const TransactionManagement: React.FC<TransactionManagementProps> = ({ users, products, onUpdateMetadata, onManageUser, followUpConfig }) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [validatingTx, setValidatingTx] = useState<any | null>(null);
  const [viewingTx, setViewingTx] = useState<any | null>(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for Follow Up Confirmation
  const [followUpConfirm, setFollowUpConfirm] = useState<{
    tx: any;
    text: string;
    phone: string;
  } | null>(null);

  const rawTransactions = useMemo(() => {
    const list: any[] = [];
    users.forEach(u => {
      if (u.manualTransactions) {
        u.manualTransactions.forEach(t => list.push({ 
          userName: u.profile?.name || 'User',
          userEmail: u.profile?.email || 'No Email',
          userPhone: u.profile?.phone || '',
          ...t, 
          uid: u.uid 
        }));
      }
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [users]);

  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter(t => {
      // 1. Text Search
      const matchesSearch = !searchQuery || 
        t.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.reference && t.reference.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      // 3. Plan Filter
      const matchesPlan = planFilter === 'all' || t.planTier === planFilter;

      // 4. Time Filter
      let matchesTime = true;
      const txDate = new Date(t.date);
      const now = new Date();
      now.setHours(0,0,0,0);
      
      const txDay = new Date(t.date);
      txDay.setHours(0,0,0,0);
      
      const diffTime = now.getTime() - txDay.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      if (timeFilter === 'today') {
        matchesTime = txDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
      } else if (timeFilter === '7days') {
        matchesTime = diffDays <= 7;
      } else if (timeFilter === '30days') {
        matchesTime = diffDays <= 30;
      } else if (timeFilter === '90days') {
        matchesTime = diffDays <= 90;
      } else if (timeFilter === '365days') {
        matchesTime = diffDays <= 365;
      } else if (timeFilter === 'custom' && startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        matchesTime = txDate >= s && txDate <= e;
      }

      return matchesSearch && matchesStatus && matchesPlan && matchesTime;
    });
  }, [rawTransactions, searchQuery, statusFilter, planFilter, timeFilter, startDate, endDate]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleUpdatePaymentStatus = async (uid: string, txId: string, newStatus: PaymentStatus) => {
    const user = users.find(u => u.uid === uid);
    if (!user || !user.manualTransactions) return;

    const updatedTxs = user.manualTransactions.map(t => (t.id === txId ? { ...t, status: newStatus } : t));
    const fields: Partial<AppData> = { manualTransactions: updatedTxs };

    if (newStatus === PaymentStatus.PAID) {
      const currentTx = updatedTxs.find(t => t.id === txId);
      const days = currentTx?.durationDays || 30;
      let baseDate = new Date();
      if (user.expiryDate && new Date(user.expiryDate) > baseDate) {
        baseDate = new Date(user.expiryDate);
      }
      const expiry = new Date(baseDate.getTime() + (days * 24 * 60 * 60 * 1000));
      fields.status = AccountStatus.ACTIVE;
      fields.plan = currentTx?.planTier || user.plan;
      fields.expiryDate = expiry.toISOString();
    }

    await onUpdateMetadata(uid, fields);
    setValidatingTx(null);
  };

  const handlePrepareFollowUp = (t: any) => {
    if (!followUpConfig || !t.userPhone) {
      alert("Script follow-up belum dikonfigurasi atau nomor WhatsApp user tidak ada.");
      return;
    }

    let text = followUpConfig.pendingPaymentScript;
    text = text.replace(/\[NAMA\]/g, t.userName);
    text = text.replace(/\[PAKET\]/g, t.planTier);
    text = text.replace(/\[ID_TX\]/g, t.id);

    const cleanPhone = t.userPhone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    setFollowUpConfirm({
      tx: t,
      text,
      phone: finalPhone
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black text-slate-900 uppercase">Manajemen Transaksi</h3>
        <button onClick={() => setShowManualModal(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">+ Transaksi Manual</button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pencarian</label>
            <input 
              placeholder="Cari Order ID, Nama, atau Ref Duitku..." 
              className="w-full px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Paket</label>
            <select 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={planFilter}
              onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Semua Paket</option>
              <option value={SubscriptionPlan.FREE}>Free</option>
              <option value={SubscriptionPlan.PRO}>Pro</option>
              <option value={SubscriptionPlan.ENTERPRISE}>Enterprise</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <select 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Semua Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu</label>
            <select 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={timeFilter}
              onChange={e => { setTimeFilter(e.target.value as TimeFilter); setCurrentPage(1); }}
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="90days">3 Bulan (Quarter)</option>
              <option value="365days">1 Tahun</option>
              <option value="custom">Range Tanggal Kustom</option>
            </select>
          </div>
        </div>

        {timeFilter === 'custom' && (
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex-1 space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Mulai</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold" />
            </div>
            <div className="text-slate-300 mt-4">sampai</div>
            <div className="flex-1 space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Selesai</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">User / Order ID</th>
                <th className="px-6 py-4">Metode / Ref</th>
                <th className="px-6 py-4">Paket / Nominal</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-800 text-sm leading-none">{t.userName}</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{t.id}</p>
                      <p className="text-[8px] text-slate-300 mt-0.5">{new Date(t.date).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${t.paymentMethod === 'Duitku' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {t.paymentMethod || 'Manual'}
                          </span>
                          {t.reference && <p className="text-[10px] font-mono font-bold text-slate-400 select-all">{t.reference}</p>}
                          {t.checkoutUrl && t.status === 'Pending' && (
                            <a href={t.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase hover:underline">Link ↗</a>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700">{t.planTier}</p>
                      <p className="text-[10px] font-bold text-slate-400">Rp {t.amount?.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border inline-block min-w-[80px] ${
                        t.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        t.status === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                         {t.status === 'Pending' && (
                           <button 
                            onClick={() => handlePrepareFollowUp(t)} 
                            className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="Follow Up WhatsApp"
                           >
                             <i className="bi bi-whatsapp"></i>
                           </button>
                         )}
                         {t.status !== 'Paid' && (
                           <button onClick={() => setValidatingTx(t)} className="text-emerald-600 font-black text-[9px] uppercase hover:underline">Validasi</button>
                         )}
                         <button onClick={() => { setViewingTx(t); setShowDetailModal(true); }} className="text-indigo-600 font-black text-[9px] uppercase hover:underline">Detail</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
             <div className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-xs">Data tidak ditemukan</div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="p-6 bg-slate-50/50 border-t flex justify-between items-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Showing {paginatedTransactions.length} of {filteredTransactions.length} items</p>
             <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Prev</button>
                <button disabled={currentPage * itemsPerPage >= filteredTransactions.length} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Next</button>
             </div>
          </div>
        )}
      </div>

      {/* FOLLOW UP CONFIRM MODAL */}
      {followUpConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[5000] p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                    <i className="bi bi-whatsapp"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase">Kirim Pesan Follow Up</h3>
                 <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tight">Kirim template pengingat ke {followUpConfirm.tx.userName}?</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pratinjau Pesan:</p>
                 <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{followUpConfirm.text}"</p>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setFollowUpConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                 <button 
                  onClick={() => { window.open(`https://wa.me/${followUpConfirm.phone}?text=${encodeURIComponent(followUpConfirm.text)}`, '_blank'); setFollowUpConfirm(null); }} 
                  className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-lg shadow-emerald-100"
                 >
                  Buka WhatsApp
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* VALIDATION MODAL */}
      {validatingTx && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[4000] p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="text-center mb-6">
                 <h3 className="text-xl font-black text-slate-900 uppercase">Validasi Pembayaran</h3>
                 <p className="text-slate-400 text-xs mt-2 font-bold uppercase">Konfirmasi pembayaran untuk {validatingTx.userName}?</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border mb-8 space-y-3">
                 <div className="flex justify-between text-xs font-bold"><span>Order ID</span><span className="font-mono">{validatingTx.id}</span></div>
                 <div className="flex justify-between text-xs font-bold"><span>Metode</span><span className="font-black text-indigo-600">{validatingTx.paymentMethod || 'Manual'}</span></div>
                 <div className="flex justify-between text-xs font-bold"><span>Paket</span><span className="font-black">{validatingTx.planTier}</span></div>
                 <div className="flex justify-between text-xs font-bold"><span>Total</span><span>Rp {validatingTx.amount?.toLocaleString()}</span></div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setValidatingTx(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Batal</button>
                 <button onClick={() => handleUpdatePaymentStatus(validatingTx.uid, validatingTx.id, PaymentStatus.PAID)} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100">Konfirmasi Bayar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
