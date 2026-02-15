
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig, SubscriptionProduct, DuitkuConfig, FollowUpConfig } from '../../types';
import { getAllUsers, updateAdminMetadata, getAiConfig, saveAiConfig, getProductsCatalog, saveProductsCatalog, getDuitkuConfig, saveDuitkuConfig, getFollowUpConfig, saveFollowUpConfig } from '../../services/firebase';

// Sub-modules import
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import AiArchitecture from './AiArchitecture';
import ProductMatrix from './ProductMatrix';
import SystemHealth from './SystemHealth';
import ProductForm from './ProductForm';
import TransactionManagement from './TransactionManagement';
import AdminManagement from './AdminManagement';
import AdminSettings from './AdminSettings';
import MayarIntegration from './MayarIntegration';
import DuitkuIntegration from './DuitkuIntegration';
import FollowUpManager from './FollowUpManager';
import TrackingSettings from './TrackingSettings';

interface AdminPanelProps {
  initialMode?: 'dashboard' | 'users' | 'products' | 'health' | 'ai' | 'admin_transactions' | 'admin_admins' | 'settings' | 'integrations' | 'duitku' | 'followup' | 'tracking';
  userRole?: UserRole;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ initialMode = 'dashboard', userRole }) => {
  const [users, setUsers] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppData | null>(null);

  const [aiConfig, setAiConfigState] = useState<AiConfig>({
    openRouterKey: '', modelName: 'google/gemini-2.0-pro-exp-02-05:free', maxTokens: 4096
  });

  const [duitkuConfig, setDuitkuConfigState] = useState<DuitkuConfig>({
    merchantCode: '', apiKey: '', environment: 'sandbox'
  });

  const [followUpConfig, setFollowUpConfigState] = useState<FollowUpConfig>({
    pendingPaymentScript: 'Halo [NAMA], pembayaran paket [PAKET] Anda masih pending. Ada kendala? Hubungi kami ya.',
    expiryReminderScript: 'Halo [NAMA], paket Anda akan berakhir dalam [HARI_SISA] hari. Yuk perpanjang sekarang!',
    justExpiredScript: 'Halo [NAMA], paket Anda baru saja berakhir hari ini. Segera perpanjang agar data tidak terkunci.'
  });

  const [isSavingAi, setIsSavingAi] = useState(false);
  const [isSavingDuitku, setIsSavingDuitku] = useState(false);
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 3000);
  };

  const fetchUsersAndConfig = async (silent = false) => {
    if (userRole !== UserRole.SUPERADMIN) {
      setError("Akses Terbatas: Role 'superadmin' tidak ditemukan.");
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const [usersData, configData, productsData, duitkuData, followUpData] = await Promise.all([
        getAllUsers(), getAiConfig(), getProductsCatalog(), getDuitkuConfig(), getFollowUpConfig()
      ]);

      setUsers(usersData);
      if (configData) setAiConfigState(configData);
      if (productsData) setProducts(productsData);
      if (duitkuData) setDuitkuConfigState(duitkuData);
      if (followUpData) setFollowUpConfigState(followUpData);
      
      setIsSynced(true);
      if (silent) triggerToast("Data berhasil disinkronkan! ✅");
    } catch (err: any) {
      console.error(err);
      setError("Gagal mengambil data dari server.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConfig();
  }, [initialMode, userRole]);

  // LOGIKA FILTER DAN DEDUPLIKASI EMAIL
  const filteredUsers = useMemo(() => {
    const emailMap = new Map<string, AppData>();
    
    // 1. Sort semua user: Prioritaskan yang expiryDate-nya paling jauh (terlama)
    const sortedRaw = [...users].sort((a, b) => {
      const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
      const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
      return dateB - dateA; // Descending: 2028 akan di atas 2026
    });

    // 2. Masukkan ke Map berdasarkan email. Karena sudah disort, 
    // email yang pertama masuk adalah yang punya expiryDate paling lama.
    sortedRaw.forEach(u => {
      if (u.profile?.email && !u.isDeleted) {
        const emailKey = u.profile.email.toLowerCase().trim();
        if (!emailMap.has(emailKey)) {
          emailMap.set(emailKey, u);
        }
      }
    });

    // 3. Filter berdasarkan search query
    const uniqueUsers = Array.from(emailMap.values());
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return uniqueUsers;

    return uniqueUsers.filter(u => 
      u.profile?.name?.toLowerCase().includes(query) || 
      u.profile?.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    try {
      await saveAiConfig(aiConfig);
      triggerToast("Setingan AI diperbarui! 🚀");
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleSaveDuitkuConfig = async (config: DuitkuConfig) => {
    setIsSavingDuitku(true);
    try {
      await saveDuitkuConfig(config);
      setDuitkuConfigState(config);
      triggerToast("Konfigurasi Duitku diperbarui! 💳");
    } finally {
      setIsSavingDuitku(false);
    }
  };

  const handleSaveFollowUpConfig = async (config: FollowUpConfig) => {
    setIsSavingFollowUp(true);
    try {
      await saveFollowUpConfig(config);
      setFollowUpConfigState(config);
      triggerToast("Follow-up Script diperbarui! 💬");
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleSaveUserMetadata = async (metadata: Partial<AppData>) => {
    if (!editingUser?.uid) return;
    try {
      await updateAdminMetadata(editingUser.uid, metadata);
      triggerToast("Berhasil update user! ✅");
      fetchUsersAndConfig(true);
      setIsUserModalOpen(false);
    } catch (e) {
      triggerToast("Gagal update user.", "error");
    }
  };

  if (loading) return <div className="h-full flex flex-col items-center justify-center p-20"><div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-4 lg:px-0">
      {adminToast && (
        <div className="fixed top-10 right-10 z-[3000] animate-in slide-in-from-right-4">
           <div className={`px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${adminToast.type === 'success' ? 'bg-emerald-600 border-emerald-50 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
             <span className="font-black text-[10px] uppercase tracking-widest">{adminToast.message}</span>
           </div>
        </div>
      )}

      {initialMode === 'dashboard' && <AdminDashboard stats={{ total: users.length, activeToday: 0, totalTokens: 0, totalAiOps: 0 }} users={users} />}
      {initialMode === 'users' && <UserManagement users={filteredUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onManage={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} followUpConfig={followUpConfig} />}
      {initialMode === 'duitku' && <DuitkuIntegration initialConfig={duitkuConfig} onSave={handleSaveDuitkuConfig} isSaving={isSavingDuitku} />}
      {initialMode === 'tracking' && <TrackingSettings onToast={triggerToast} />}
      {initialMode === 'followup' && <FollowUpManager initialConfig={followUpConfig} onSave={handleSaveFollowUpConfig} isSaving={isSavingFollowUp} />}
      {initialMode === 'admin_transactions' && <TransactionManagement users={users} products={products} onUpdateMetadata={async (uid, fields) => { await updateAdminMetadata(uid, fields); fetchUsersAndConfig(true); }} onManageUser={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} followUpConfig={followUpConfig} />}
      {initialMode === 'products' && <ProductMatrix products={products} setEditingProduct={()=>{}} setIsProductModalOpen={()=>{}} />}
      {initialMode === 'ai' && <AiArchitecture aiConfig={aiConfig} setAiConfigState={setAiConfigState} handleSaveAiConfig={handleSaveAiConfig} isSavingAi={isSavingAi} isFetchingModels={false} isModelDropdownOpen={false} setIsModelDropdownOpen={()=>{}} modelSearchTerm="" setModelSearchTerm={()=>{}} filteredOpenRouterModels={[]} handleModelSelect={()=>{}} dropdownRef={dropdownRef} />}
      {initialMode === 'settings' && <AdminSettings />}
      {initialMode === 'integrations' && <MayarIntegration />}
      {initialMode === 'admin_admins' && <AdminManagement users={users} onUpdateMetadata={async (uid, fields) => { await updateAdminMetadata(uid, fields); fetchUsersAndConfig(true); }} />}

      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase">Kelola User</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black">✕</button>
             </div>
             <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border">
                  <p className="font-black text-slate-800">{editingUser.profile?.name}</p>
                  <p className="text-xs font-bold text-slate-400">{editingUser.profile?.email}</p>
                  <p className="text-[8px] font-mono text-slate-300 mt-2 uppercase">UID: {editingUser.uid}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status Akun</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as AccountStatus })}>
                      {Object.values(AccountStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Paket</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" value={editingUser.plan} onChange={e => setEditingUser({ ...editingUser, plan: e.target.value as SubscriptionPlan })}>
                      {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Expiry Date (Masa Aktif)</label>
                   <input 
                     type="date" 
                     className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" 
                     value={editingUser.expiryDate?.split('T')[0] || ''} 
                     onChange={e => setEditingUser({ ...editingUser, expiryDate: new Date(e.target.value).toISOString() })} 
                   />
                </div>
                <button onClick={() => handleSaveUserMetadata(editingUser)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Perubahan</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
