
import React, { useState, useMemo } from 'react';
import { AppData, SubscriptionPlan, AccountStatus, PaymentStatus, ManualTransaction, SubscriptionProduct, UserRole, FollowUpConfig } from '../../types';

interface TransactionManagementProps {
  users: AppData[];
  products: SubscriptionProduct[];
  onUpdateMetadata: (uid: string, fields: Partial<AppData>) => Promise<void>;
  onManageUser: (user: AppData) => void;
  followUpConfig?: FollowUpConfig;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({ users, products, onUpdateMetadata, onManageUser, followUpConfig }) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [validatingTx, setValidatingTx] = useState<any | null>(null);
  const [viewingTx, setViewingTx] = useState<any | null>(null);
  const [editingTx, setEditingTx] = useState<{ uid: string, tx: ManualTransaction } | null>(null);
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualForm, setManualForm] = useState({
    amount: 0,
    status: PaymentStatus.UNPAID,
    planTier: SubscriptionPlan.PRO,
    notes: ''
  });

  const [followUpConfirm, setFollowUpConfirm] = useState<{
    tx: any;
    text: string;
    phone: string;
  } | null>(null);

  // States for Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [timeFilterMode, setTimeFilterMode] = useState('all'); 
  const [customStartDate, setCustomStartDate] = useState(''); 
  const [customEndDate, setCustomEndDate] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  const rawTransactions = useMemo(() => {
    const list: any[] = [];
    users.forEach(u => {
      if (u.manualTransactions) {
        u.manualTransactions.forEach(t => list.push({ 
          userName: u.profile?.name || 'User',
          userEmail: u.profile?.email || 'No Email',
          userPhone: u.profile?.phone || '',
          ...t, 
          uid: u.uid, 
          role: u.role 
        }));
      }
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [users]);

  // Apply Filters
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter(t => {
      const matchesSearch = !searchQuery || 
        t.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPlan = planFilter === 'all' || t.planTier === planFilter;
      
      let matchesTime = true;
      if (timeFilterMode !== 'all') {
        const txDate = new Date(t.date);
        const now = new Date();
        const diffMs = now.getTime() - txDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch(timeFilterMode) {
          case 'today': 
            matchesTime = t.date.split('T')[0] === now.toISOString().split('T')[0]; 
            break;
          case '7days': 
            matchesTime = diffDays <= 7; 
            break;
          case '30days': 
            matchesTime = diffDays <= 30; 
            break;
          case '3months': 
            matchesTime = diffDays <= 90; 
            break;
          case '1year': 
            matchesTime = diffDays <= 365; 
            break;
          case 'range':
            const start = customStartDate ? customStartDate : '0000-00-00';
            const end = customEndDate ? customEndDate : '9999-99-99';
            const txSimpleDate = t.date.split('T')[0];
            matchesTime = txSimpleDate >= start && txSimpleDate <= end;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesPlan && matchesTime;
    });
  }, [rawTransactions, searchQuery, statusFilter, planFilter, timeFilterMode, customStartDate, customEndDate]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const getSafeDuration = (tx: ManualTransaction): number => {
    if (tx.durationDays && tx.durationDays > 0) return tx.durationDays;
    if (tx.planTier === SubscriptionPlan.PRO) {
      if (tx.amount >= 140000) return 365;
      if (tx.amount >= 90000) return 90;
      return 30;
    }
    return 30;
  };

  const handleUpdatePaymentStatus = async (uid: string, txId: string, newStatus: PaymentStatus) => {
    const user = users.find(u => u.uid === uid);
    if (!user || !user.manualTransactions) {
      alert("Error: User pemilik transaksi tidak ditemukan.");
      return;
    }

    const updatedTxs = user.manualTransactions.map(t => (t.id === txId ? { ...t, status: newStatus } : t));
    const fields: Partial<AppData> = { manualTransactions: updatedTxs };

    if (newStatus === PaymentStatus.PAID) {
      if (user.role === UserRole.SUPERADMIN) {
        fields.activeFrom = user.activeFrom || new Date().toISOString();
        fields.plan = SubscriptionPlan.PRO;
        fields.status = AccountStatus.ACTIVE;
        alert(`Validasi Berhasil!\n\nUser adalah Administrator. Akses disetel sebagai PERMANEN.`);
      } else {
        const allPaidTxs = updatedTxs.filter(t => t.status === PaymentStatus.PAID);
        const totalPaidDays = allPaidTxs.reduce((acc, curr) => acc + getSafeDuration(curr), 0);
        
        const currentTx = updatedTxs.find(t => t.id === txId);
        const selectedProduct = products.find(p => p.tier === currentTx?.planTier);
        
        const now = new Date();
        const sortedPaid = [...allPaidTxs].sort((a,b) => a.date.localeCompare(b.date));
        const baseDateStr = user.activeFrom || (sortedPaid.length > 0 ? sortedPaid[0].date : now.toISOString());
        
        const baseDate = new Date(baseDateStr);
        const expiryTime = baseDate.getTime() + (totalPaidDays * 24 * 60 * 60 * 1000);
        const expiry = new Date(expiryTime);
        
        fields.activeFrom = baseDateStr;
        fields.plan = currentTx?.planTier || user.plan;
        fields.status = AccountStatus.ACTIVE;
        fields.expiryDate = expiry.toISOString();
        
        if (selectedProduct) {
          fields.planPermissions = Array.from(new Set([...(user.planPermissions || []), ...(selectedProduct.allowedModules || [])]));
          fields.planLimits = selectedProduct.limits;
        }

        const daysRemainingNow = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
        alert(`Validasi Berhasil!\n\nTarget Update: ${user.profile?.email}\nTotal Akumulasi: ${totalPaidDays} Hari\nBerlaku s/d: ${expiry.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}\nSisa Masa Aktif: ${daysRemainingNow} Hari.`);
      }
    }

    await onUpdateMetadata(uid, fields);
    setValidatingTx(null);
  };

  const handleAddManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserUid || !selectedProductId) return;
    
    const user = users.find(u => u.uid === selectedUserUid);
    if (!user) return;

    const targetProduct = products.find(p => p.id === selectedProductId);
    if (!targetProduct) return;

    const newTx: ManualTransaction = {
      id: `TX-M-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: manualForm.amount,
      date: new Date().toISOString(),
      status: manualForm.status,
      planTier: targetProduct.tier,
      durationDays: targetProduct.durationDays || 30,
      paymentMethod: 'Manual',
      notes: manualForm.notes,
      userName: user.profile?.name || 'Manual Order',
      userEmail: user.profile?.email || ''
    };

    let updatedTxs = user.manualTransactions || [];
    updatedTxs = [...updatedTxs, newTx];

    const fields: Partial<AppData> = { manualTransactions: updatedTxs };

    if (manualForm.status === PaymentStatus.PAID) {
      if (user.role === UserRole.SUPERADMIN) {
        fields.activeFrom = user.activeFrom || new Date().toISOString();
        fields.plan = targetProduct.tier;
        fields.status = AccountStatus.ACTIVE;
      } else {
        const allPaidTxs = updatedTxs.filter(t => t.status === PaymentStatus.PAID);
        const totalPaidDays = allPaidTxs.reduce((sum, tx) => sum + getSafeDuration(tx), 0);
        const now = new Date();
        const baseDateStr = user.activeFrom || now.toISOString();
        const baseDate = new Date(baseDateStr);
        const expiry = new Date(baseDate.getTime() + (totalPaidDays * 24 * 60 * 60 * 1000));
        
        fields.activeFrom = baseDateStr;
        fields.plan = targetProduct.tier;
        fields.status = AccountStatus.ACTIVE;
        fields.expiryDate = expiry.toISOString();
        fields.planPermissions = targetProduct.allowedModules;
        fields.planLimits = targetProduct.limits;
      }
    }

    await onUpdateMetadata(selectedUserUid, fields);
    setShowManualModal(false);
    setSelectedUserUid('');
  };

  const prepareFollowUp = (t: any) => {
    if (!followUpConfig || !t.userPhone) return;
    let text = followUpConfig.pendingPaymentScript;
    text = text.replace(/\[NAMA\]/g, t.userName);
    text = text.replace(/\[PAKET\]/g, t.planTier);
    text = text.replace(/\[ID_TX\]/g, t.id);
    const cleanPhone = t.userPhone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    setFollowUpConfirm({ tx: t, text, phone: finalPhone });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black text-slate-900 uppercase">Manajemen Keuangan</h3>
        <button 
          onClick={() => { setSelectedUserUid(''); setShowManualModal(true); }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
        >
          + Tambah Transaksi Manual
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Log Transaksi & Checkout</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTransactions.length} Records Terfilter</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cari User / ID</label>
                 <input 
                    type="text" 
                    placeholder="Nama, email, atau ID..." 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px] focus:border-indigo-400"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</label>
                 <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px]"
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                 >
                    <option value="all">Semua Status</option>
                    {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Pilih Paket</label>
                 <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px]"
                    value={planFilter}
                    onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
                 >
                    <option value="all">Semua Paket</option>
                    {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Waktu Transaksi</label>
                 <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px]"
                    value={timeFilterMode}
                    onChange={e => { setTimeFilterMode(e.target.value); setCurrentPage(1); }}
                 >
                    <option value="all">Semua Waktu</option>
                    <option value="today">Hari Ini</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="30days">30 Hari Terakhir</option>
                    <option value="3months">3 Bulan Terakhir</option>
                    <option value="1year">1 Tahun Terakhir</option>
                    <option value="range">Range Tanggal (Custom)</option>
                 </select>
              </div>
           </div>

           {timeFilterMode === 'range' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Mulai Dari</label>
                   <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px]"
                      value={customStartDate}
                      onChange={e => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Hingga Tanggal</label>
                   <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px]"
                      value={customEndDate}
                      onChange={e => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                   />
                </div>
             </div>
           )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">User & Metode</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Tgl Transaksi</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-800 text-sm">{t.userName}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.paymentMethod === 'Duitku' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                           {t.paymentMethod || 'Manual'}
                         </span>
                         <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{t.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase border border-indigo-100 w-fit">{t.planTier}</span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Durasi: {getSafeDuration(t)} Hari</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-700">Rp {t.amount?.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                        t.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 
                        t.status === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-600 animate-pulse' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</p>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                         {t.status === PaymentStatus.PENDING && (
                           <button onClick={() => prepareFollowUp(t)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><i className="bi bi-whatsapp"></i></button>
                         )}
                         {(t.status === PaymentStatus.PENDING || t.status === PaymentStatus.UNPAID) && (
                           <button onClick={() => setValidatingTx(t)} className="text-emerald-600 font-black text-[9px] uppercase hover:underline">Validasi Bayar</button>
                         )}
                         <button onClick={() => { setViewingTx(t); setShowDetailModal(true); }} className="text-indigo-600 font-black text-[9px] uppercase hover:underline">Detail</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="lg:hidden p-4 space-y-4">
           {paginatedTransactions.map(t => (
             <div key={t.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-slate-800 text-base leading-tight">{t.userName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${t.paymentMethod === 'Duitku' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                           {t.paymentMethod || 'Manual'}
                         </span>
                         <p className="text-[9px] font-bold text-slate-400 truncate max-w-[150px]">{t.userEmail}</p>
                      </div>
                   </div>
                   <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${
                     t.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                     t.status === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                     'bg-rose-50 text-rose-600 border-rose-100'
                   }`}>
                      {t.status}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paket & Durasi</p>
                      <p className="text-[11px] font-black text-indigo-600 uppercase">{t.planTier}</p>
                      <p className="text-[9px] font-bold text-slate-500">{getSafeDuration(t)} Hari</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Jumlah Bayar</p>
                      <p className="text-sm font-black text-slate-900">Rp {t.amount?.toLocaleString('id-ID')}</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                   <span className="text-[9px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</span>
                   <div className="flex gap-2">
                      {t.status === PaymentStatus.PENDING && (
                         <button onClick={() => prepareFollowUp(t)} className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg"><i className="bi bi-whatsapp"></i></button>
                      )}
                      {(t.status === PaymentStatus.PENDING || t.status === PaymentStatus.UNPAID) && (
                         <button onClick={() => setValidatingTx(t)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase">Validasi</button>
                      )}
                      <button onClick={() => { setViewingTx(t); setShowDetailModal(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase">Detail</button>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {filteredTransactions.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Data transaksi tidak ditemukan.</div>}

        {/* Pagination UI */}
        <div className="p-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between bg-slate-50/30 gap-6">
           <div className="flex items-center gap-6">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 Halaman {currentPage} dari {totalPages || 1}
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tampilkan:</span>
                 <select 
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none cursor-pointer"
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                 >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                 </select>
              </div>
           </div>

           {totalPages > 1 && (
              <div className="flex gap-2">
                 <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
                 >
                    Sebelumnya
                 </button>
                 <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                       <button 
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                       >
                          {page}
                       </button>
                    )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                 </div>
                 <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
                 >
                    Berikutnya
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* VALIDATION CONFIRMATION MODAL */}
      {validatingTx && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[4000] p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="text-center mb-6">
                 <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                    <i className="bi bi-patch-check-fill"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase">Konfirmasi Validasi</h3>
                 <p className="text-slate-400 text-xs font-bold mt-2 uppercase text-center leading-relaxed">
                   Anda akan memvalidasi pembayaran untuk: <br/>
                   <span className="text-indigo-600 font-black">{validatingTx.userEmail}</span>
                 </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 space-y-3">
                 <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase">Pelanggan</span><span className="text-xs font-bold text-slate-800">{validatingTx.userName}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase">Paket</span><span className="text-xs font-black text-indigo-600 uppercase">{validatingTx.planTier}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase">Total</span><span className="text-sm font-black text-slate-900">Rp {validatingTx.amount?.toLocaleString('id-ID')}</span></div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setValidatingTx(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                 <button onClick={() => handleUpdatePaymentStatus(validatingTx.uid, validatingTx.id, PaymentStatus.PAID)} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Konfirmasi Valid</button>
              </div>
           </div>
        </div>
      )}

      {showDetailModal && viewingTx && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[3000] p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-8">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Detail Transaksi</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {viewingTx.id}</p>
                 </div>
                 <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center font-black">✕</button>
              </div>

              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                       <p className="text-10px font-black text-slate-400 uppercase">Target Akun</p>
                       <div className="text-right">
                          <p className="text-sm font-black text-slate-800">{viewingTx.userName}</p>
                          <p className="text-[10px] font-bold text-slate-500">{viewingTx.userEmail}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Paket</p>
                          <p className="text-xs font-black text-indigo-600 uppercase">{viewingTx.planTier}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Durasi</p>
                          <p className="text-xs font-black text-slate-700">{getSafeDuration(viewingTx)} Hari</p>
                       </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Total Bayar</p>
                       <p className="text-xl font-black text-slate-900">Rp {viewingTx.amount?.toLocaleString('id-ID')}</p>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button onClick={() => { onManageUser({ uid: viewingTx.uid } as AppData); setShowDetailModal(false); }} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Kelola User Ini</button>
                    <button onClick={() => setShowDetailModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Tutup</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Tambah Transaksi Manual</h3>
             <form onSubmit={handleAddManualTransaction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Target User</label>
                  <select 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs cursor-pointer"
                    value={selectedUserUid}
                    onChange={e => setSelectedUserUid(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih User --</option>
                    {users.map(u => <option key={u.uid} value={u.uid}>{u.profile?.name} ({u.profile?.email})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Produk</label>
                      <select 
                        className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm"
                        value={selectedProductId}
                        onChange={e => {
                            const pId = e.target.value;
                            setSelectedProductId(pId);
                            const prod = products.find(p => p.id === pId);
                            if (prod) setManualForm({...manualForm, amount: prod.price, planTier: prod.tier});
                        }}
                        required
                      >
                        <option value="">-- Pilih Produk --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.durationDays} Hari)</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
                      <input type="number" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={manualForm.amount} onChange={e => setManualForm({...manualForm, amount: parseInt(e.target.value) || 0})} required />
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowManualModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                   <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan & Aktifkan</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
