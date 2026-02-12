
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
  const [manualForm, setManualForm] = useState({
    amount: 0,
    status: PaymentStatus.UNPAID,
    planTier: SubscriptionPlan.PRO,
    notes: ''
  });

  const transactions = useMemo(() => {
    const list: any[] = [];
    users.forEach(u => {
      // Data Transaksi Manual
      if (u.manualTransactions) {
        u.manualTransactions.forEach(t => list.push({ 
          ...t, 
          source: 'Manual',
          userName: u.profile?.name, 
          userEmail: u.profile?.email, 
          uid: u.uid 
        }));
      }
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [users]);

  const handleAddManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserUid) return;
    
    const user = users.find(u => u.uid === selectedUserUid);
    if (!user) return;

    const newTx: ManualTransaction = {
      id: editingTx ? editingTx.tx.id : Math.random().toString(36).substr(2, 9),
      amount: manualForm.amount,
      date: editingTx ? editingTx.tx.date : new Date().toISOString(),
      status: manualForm.status,
      planTier: manualForm.planTier,
      notes: manualForm.notes
    };

    let currentTxs = user.manualTransactions || [];
    if (editingTx) {
      currentTxs = currentTxs.map(t => t.id === editingTx.tx.id ? newTx : t);
    } else {
      currentTxs = [...currentTxs, newTx];
    }

    const fields: Partial<AppData> = { manualTransactions: currentTxs };

    // KUNCI KEAMANAN: Memastikan role tidak berubah saat aktivasi paket
    if (manualForm.status === PaymentStatus.PAID) {
      const selectedProduct = products.find(p => p.tier === manualForm.planTier);
      fields.plan = manualForm.planTier;
      fields.status = AccountStatus.ACTIVE;
      fields.activeFrom = new Date().toISOString();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (selectedProduct?.durationDays || 30));
      fields.expiryDate = expiry.toISOString();
      
      // Update permissions & limits berdasarkan produk terpilih
      if (selectedProduct) {
        fields.planPermissions = selectedProduct.allowedModules;
        fields.planLimits = selectedProduct.limits;
      }

      // Explicitly keep role as user unless already admin
      if (user.role !== UserRole.SUPERADMIN) {
        fields.role = UserRole.USER;
      }
    }

    await onUpdateMetadata(selectedUserUid, fields);
    setShowManualModal(false);
    setEditingTx(null);
    alert(editingTx ? "Transaksi diperbarui." : "Transaksi manual berhasil dicatat. User tetap memiliki role Member.");
  };

  const handleEditClick = (uid: string, tx: ManualTransaction) => {
    setEditingTx({ uid, tx });
    setSelectedUserUid(uid);
    setManualForm({
      amount: tx.amount,
      status: tx.status,
      planTier: tx.planTier,
      notes: tx.notes || ''
    });
    setShowManualModal(true);
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
      fields.activeFrom = new Date().toISOString();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (selectedProduct?.durationDays || 30));
      fields.expiryDate = expiry.toISOString();
      
      if (selectedProduct) {
        fields.planPermissions = selectedProduct.allowedModules;
        fields.planLimits = selectedProduct.limits;
      }

      // Explicitly keep role as user unless already admin
      if (user.role !== UserRole.SUPERADMIN) {
        fields.role = UserRole.USER;
      }
    }

    await onUpdateMetadata(uid, fields);
    alert(`Status pembayaran diperbarui menjadi ${newStatus}. Hak akses user telah diaktifkan.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black text-slate-900 uppercase">Daftar Transaksi Manual</h3>
        <button 
          onClick={() => { setEditingTx(null); setSelectedUserUid(''); setManualForm({ amount: 0, status: PaymentStatus.UNPAID, planTier: SubscriptionPlan.PRO, notes: '' }); setShowManualModal(true); }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
        >
          + Tambah Transaksi Manual
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Log Transaksi & Billing</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">User</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-black text-slate-800 text-sm">{t.userName}</p>
                    <p className="text-[10px] font-bold text-slate-400">{t.userEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase border border-indigo-100">{t.planTier}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-700">Rp {t.amount?.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${t.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {t.status === PaymentStatus.UNPAID && (
                      <button 
                        onClick={() => handleUpdatePaymentStatus(t.uid, t.id, PaymentStatus.PAID)}
                        className="text-emerald-600 font-black text-[9px] uppercase hover:underline mr-4"
                      >
                        Set Sudah Bayar
                      </button>
                    )}
                    <button onClick={() => handleEditClick(t.uid, t)} className="text-slate-400 font-black text-[9px] uppercase hover:underline mr-4">Edit</button>
                    <button onClick={() => onManageUser({ uid: t.uid } as AppData)} className="text-indigo-600 font-black text-[9px] uppercase hover:underline">Detail User</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingTx ? 'Edit Transaksi' : 'Transaksi Manual'}</h3>
             <form onSubmit={handleAddManualTransaction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih User</label>
                  <select 
                    disabled={!!editingTx}
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
                      <input 
                        type="number" 
                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs"
                        value={manualForm.amount}
                        onChange={e => setManualForm({...manualForm, amount: parseInt(e.target.value) || 0})}
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Paket</label>
                      <select 
                        className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs"
                        value={manualForm.planTier}
                        onChange={e => {
                            const tier = e.target.value as SubscriptionPlan;
                            const price = products.find(p => p.tier === tier)?.price || 0;
                            setManualForm({...manualForm, planTier: tier, amount: price});
                        }}
                      >
                        {products.map(p => (
                            <option key={p.id} value={p.tier}>{p.name} ({p.tier})</option>
                        ))}
                      </select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Pembayaran</label>
                   <select 
                     className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs"
                     value={manualForm.status}
                     onChange={e => setManualForm({...manualForm, status: e.target.value as PaymentStatus})}
                   >
                      <option value={PaymentStatus.UNPAID}>BELUM BAYAR</option>
                      <option value={PaymentStatus.PAID}>SUDAH BAYAR</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan</label>
                   <textarea 
                     className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs"
                     value={manualForm.notes}
                     onChange={e => setManualForm({...manualForm, notes: e.target.value})}
                   />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => { setShowManualModal(false); setEditingTx(null); }} className="flex-1 py-4 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                   <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Transaksi</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
