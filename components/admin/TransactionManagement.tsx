import React, { useState, useMemo } from 'react';
import { AppData, SubscriptionPlan, AccountStatus, PaymentStatus, ManualTransaction, SubscriptionProduct, UserRole } from '../../types';

interface TransactionManagementProps {
  users: AppData[];
  products: SubscriptionProduct[];
  onUpdateMetadata: (uid: string, fields: Partial<AppData>) => Promise<void>;
  onManageUser: (user: AppData) => void;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({ users, products, onUpdateMetadata, onManageUser }) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingTx, setEditingTx] = useState<{ uid: string, tx: ManualTransaction } | null>(null);
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualForm, setManualForm] = useState({
    amount: 0,
    status: PaymentStatus.UNPAID,
    planTier: SubscriptionPlan.PRO,
    notes: ''
  });

  const transactions = useMemo(() => {
    const list: any[] = [];
    users.forEach(u => {
      if (u.manualTransactions) {
        u.manualTransactions.forEach(t => list.push({ 
          // Set fallback data dari profil user jika data di record transaksi kosong
          userName: u.profile?.name || 'User',
          userEmail: u.profile?.email || 'No Email',
          // Kemudian timpakan dengan data asli dari record transaksi (snapshot saat order)
          ...t, 
          uid: u.uid 
        }));
      }
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [users]);

  const handleAddManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserUid || !selectedProductId) return;
    
    const user = users.find(u => u.uid === selectedUserUid);
    if (!user) return;

    const targetProduct = products.find(p => p.id === selectedProductId);
    if (!targetProduct) return;

    const newTx: ManualTransaction = {
      id: editingTx ? editingTx.tx.id : Math.random().toString(36).substr(2, 9),
      amount: manualForm.amount,
      date: editingTx ? editingTx.tx.date : new Date().toISOString(),
      status: manualForm.status,
      planTier: targetProduct.tier,
      durationDays: targetProduct.durationDays || 30, // Mengambil durasi dari produk spesifik
      paymentMethod: 'Manual',
      notes: manualForm.notes,
      userName: user.profile?.name || 'Manual Order',
      userEmail: user.profile?.email || ''
    };

    let currentTxs = user.manualTransactions || [];
    if (editingTx) {
      currentTxs = currentTxs.map(t => t.id === editingTx.tx.id ? newTx : t);
    } else {
      currentTxs = [...currentTxs, newTx];
    }

    const fields: Partial<AppData> = { manualTransactions: currentTxs };

    if (manualForm.status === PaymentStatus.PAID) {
      fields.plan = targetProduct.tier;
      fields.status = AccountStatus.ACTIVE;
      
      const now = new Date();
      if (!user.activeFrom) fields.activeFrom = now.toISOString();
      
      // LOGIKA AKUMULATIF (ADDITIVE): Tambahkan durasi ke sisa masa aktif jika masih ada
      let baseDate = now;
      if (user.expiryDate) {
        const existingExpiry = new Date(user.expiryDate);
        if (existingExpiry > now) {
          baseDate = existingExpiry;
        }
      }

      const expiry = new Date(baseDate);
      expiry.setDate(expiry.getDate() + (newTx.durationDays || 30));
      fields.expiryDate = expiry.toISOString();
      
      fields.planPermissions = targetProduct.allowedModules;
      fields.planLimits = targetProduct.limits;
    }

    await onUpdateMetadata(selectedUserUid, fields);
    setShowManualModal(false);
    setEditingTx(null);
    setSelectedProductId('');
  };

  const handleUpdatePaymentStatus = async (uid: string, txId: string, newStatus: PaymentStatus) => {
    const user = users.find(u => u.uid === uid);
    if (!user || !user.manualTransactions) return;

    const tx = user.manualTransactions.find(t => t.id === txId);
    if (!tx) return;

    const updatedTxs = user.manualTransactions.map(t => (t.id === txId ? { ...t, status: newStatus } : t));
    const fields: Partial<AppData> = { manualTransactions: updatedTxs };

    if (newStatus === PaymentStatus.PAID) {
      const selectedProduct = products.find(p => p.tier === tx.planTier);
      fields.plan = tx.planTier;
      fields.status = AccountStatus.ACTIVE;
      
      const now = new Date();
      if (!user.activeFrom) fields.activeFrom = now.toISOString();

      // LOGIKA AKUMULATIF (ADDITIVE): Cek apakah user masih memiliki masa aktif
      let baseDate = now;
      if (user.expiryDate) {
        const existingExpiry = new Date(user.expiryDate);
        if (existingExpiry > now) {
          // Jika belum expired, durasi baru ditambahkan setelah tanggal kadaluarsa lama
          baseDate = existingExpiry;
        }
      }

      const duration = tx.durationDays || selectedProduct?.durationDays || 30;
      const expiry = new Date(baseDate);
      expiry.setDate(expiry.getDate() + duration);
      fields.expiryDate = expiry.toISOString();
      
      if (selectedProduct) {
        fields.planPermissions = selectedProduct.allowedModules;
        fields.planLimits = selectedProduct.limits;
      }

      // Hitung total hari baru untuk ditampilkan di alert (konversi ke hari)
      const totalDaysNow = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
      alert(`Status pembayaran diperbarui. Paket ${tx.planTier} (${duration} Hari) telah ditambahkan secara akumulatif.\nTotal masa aktif sekarang: ${totalDaysNow} Hari.`);
    }

    await onUpdateMetadata(uid, fields);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black text-slate-900 uppercase">Manajemen Keuangan</h3>
        <button 
          onClick={() => { setEditingTx(null); setSelectedUserUid(''); setSelectedProductId(''); setShowManualModal(true); }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
        >
          + Tambah Transaksi Manual
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Log Transaksi & Checkout</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
        </div>
        <div className="overflow-x-auto">
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
              {transactions.map(t => {
                const prod = products.find(p => p.tier === t.planTier);
                const displayDuration = t.durationDays || prod?.durationDays || 30;
                return (
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
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Durasi: {displayDuration} Hari</p>
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
                      {(t.status === PaymentStatus.PENDING || t.status === PaymentStatus.UNPAID) && (
                        <button 
                          onClick={() => handleUpdatePaymentStatus(t.uid, t.id, PaymentStatus.PAID)}
                          className="text-emerald-600 font-black text-[9px] uppercase hover:underline mr-4"
                        >
                          Validasi Bayar
                        </button>
                      )}
                      <button onClick={() => onManageUser({ uid: t.uid } as AppData)} className="text-indigo-600 font-black text-[9px] uppercase hover:underline">Detail User</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Belum ada transaksi terdeteksi.</div>}
        </div>
      </div>

      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Tambah Transaksi Manual</h3>
             <form onSubmit={handleAddManualTransaction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih User</label>
                  <select 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs"
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
                        className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs"
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
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.durationDays} Hari)</option>
                        ))}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
                      <input 
                        type="number" 
                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs"
                        value={manualForm.amount}
                        onChange={e => setManualForm({...manualForm, amount: parseInt(e.target.value) || 0})}
                        required
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan</label>
                   <textarea 
                     className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs resize-none"
                     value={manualForm.notes}
                     onChange={e => setManualForm({...manualForm, notes: e.target.value})}
                   />
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