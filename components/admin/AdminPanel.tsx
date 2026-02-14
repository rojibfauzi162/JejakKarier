import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig, SubscriptionProduct, DuitkuConfig } from '../../types';
import { getAllUsers, updateAdminMetadata, getAiConfig, saveAiConfig, getProductsCatalog, saveProductsCatalog, getDuitkuConfig, saveDuitkuConfig } from '../../services/firebase';

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

interface AdminPanelProps {
  initialMode?: 'dashboard' | 'users' | 'products' | 'health' | 'ai' | 'admin_transactions' | 'admin_admins' | 'settings' | 'integrations' | 'duitku';
  userRole?: UserRole;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ initialMode = 'dashboard', userRole }) => {
  const [users, setUsers] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // States for User Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppData | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);

  // States for Product Management
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SubscriptionProduct | null>(null);

  const [aiConfig, setAiConfigState] = useState<AiConfig>({
    openRouterKey: '', modelName: 'google/gemini-2.0-pro-exp-02-05:free', maxTokens: 4096
  });

  const [duitkuConfig, setDuitkuConfigState] = useState<DuitkuConfig>({
    merchantCode: '', apiKey: '', environment: 'sandbox'
  });

  const [isSavingAi, setIsSavingAi] = useState(false);
  const [isSavingDuitku, setIsSavingDuitku] = useState(false);
  
  const [dynamicModels, setDynamicModels] = useState<any[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<SubscriptionProduct[]>([
    { 
      id: 'p1', name: 'Paket Gratisan', tier: SubscriptionPlan.FREE, price: 0, durationDays: 3650, enabledDurations: [3650], 
      allowedModules: ['dashboard', 'profile', 'daily', 'skills'], 
      limits: { 
        dailyLogs: 10, 
        skills: 5, 
        projects: 2, 
        cvExports: 1,
        trainingHistory: 5,
        certification: 3,
        careerPath: 1,
        jobTracker: 5,
        networking: 5,
        todoList: 10,
        workExperience: 3,
        education: 2,
        careerCalendar: 5,
        achievements: 5
      } 
    }
  ]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 3000);
  };

  const fetchUsersAndConfig = async (silent = false) => {
    if (userRole !== UserRole.SUPERADMIN) {
      setError("Akses Terbatas: Role 'superadmin' tidak ditemukan pada akun Anda.");
      setLoading(false);
      return;
    }

    if (!silent) {
        setLoading(true);
        setError(null);
    }
    try {
      const usersTask = getAllUsers();
      const configTask = getAiConfig();
      const productsTask = getProductsCatalog();
      const duitkuTask = getDuitkuConfig();

      const [usersData, configData, productsData, duitkuData] = await Promise.all([
        usersTask, configTask, productsTask, duitkuTask
      ]);

      setUsers(usersData);
      if (configData) setAiConfigState(configData);
      if (productsData && productsData.length > 0) setProducts(productsData);
      if (duitkuData) setDuitkuConfigState(duitkuData);
      
      setIsSynced(true);
      if (silent) triggerToast("Data berhasil disinkronkan! ✅");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengambil data dari server.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConfig();
  }, [initialMode, userRole]);

  const filteredUsers = useMemo(() => {
    const emailMap = new Map<string, AppData>();
    const sortedUsers = [...users].sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime());

    sortedUsers.forEach(u => {
      if (!u.isDeleted && u.profile?.email) {
        const email = u.profile.email.toLowerCase().trim();
        if (!emailMap.has(email)) emailMap.set(email, u);
      }
    });

    return Array.from(emailMap.values()).filter(u => 
      (u.profile?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.profile?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    try {
      await saveAiConfig(aiConfig);
      triggerToast("Setingan AI diperbarui! 🚀");
    } catch (err) {
      triggerToast("Gagal simpan setingan AI.", "error");
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
    } catch (err) {
      triggerToast("Gagal simpan konfigurasi Duitku.", "error");
    } finally {
      setIsSavingDuitku(false);
    }
  };

  const handleSaveUserMetadata = async (metadata: Partial<AppData>) => {
    if (!editingUser?.uid) return;
    try {
      const payload = { ...metadata };
      if (!isChangingRole) delete payload.role;
      await updateAdminMetadata(editingUser.uid, payload);
      triggerToast("Berhasil update user! ✅");
      fetchUsersAndConfig(true);
      setIsUserModalOpen(false);
    } catch (e) {
      triggerToast("Gagal update user.", "error");
    }
  };

  const handleSaveProduct = async (productData: SubscriptionProduct) => {
    try {
      const newProducts = editingProduct 
        ? products.map(p => p.id === editingProduct.id ? productData : p)
        : [...products, { ...productData, id: Math.random().toString(36).substr(2, 9) }];
      await saveProductsCatalog(newProducts);
      setProducts(newProducts);
      triggerToast("Katalog produk diperbarui! 📦");
      setIsProductModalOpen(false);
    } catch (e) {
      triggerToast("Gagal simpan katalog produk.", "error");
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    if (!confirm(`Hapus produk "${editingProduct.name}"?`)) return;
    try {
      const newProducts = products.filter(p => p.id !== editingProduct.id);
      await saveProductsCatalog(newProducts);
      setProducts(newProducts);
      triggerToast("Produk berhasil dihapus.");
      setIsProductModalOpen(false);
    } catch (e) {
      triggerToast("Gagal menghapus produk.", "error");
    }
  };

  if (loading) return <div className="h-full flex flex-col items-center justify-center space-y-4"><div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menghubungkan ke pusat data...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-4 lg:px-0">
      {adminToast && (
        <div className="fixed top-10 right-10 z-[3000] animate-in slide-in-from-right-4 duration-500">
           <div className={`px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${adminToast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
             <span className="text-xl">{adminToast.type === 'success' ? '✓' : '⚠️'}</span>
             <span className="font-black text-[10px] uppercase tracking-widest">{adminToast.message}</span>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {initialMode === 'duitku' ? 'Integrasi Duitku' : initialMode === 'admin_transactions' ? 'Manajemen Transaksi' : 'Dashboard Admin'}
          </h2>
          <p className="text-slate-500 font-medium italic">Sistem Administrasi FokusKarir.</p>
        </div>
      </header>

      {/* RENDER MODUL SESUAI MODE */}
      {initialMode === 'dashboard' && <AdminDashboard stats={{ total: users.length, activeToday: 0, totalTokens: 0, totalAiOps: 0 }} users={users} />}
      {initialMode === 'users' && <UserManagement users={filteredUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onManage={(u) => { setEditingUser(u); setIsUserModalOpen(true); setIsChangingRole(false); }} />}
      {initialMode === 'duitku' && <DuitkuIntegration initialConfig={duitkuConfig} onSave={handleSaveDuitkuConfig} isSaving={isSavingDuitku} />}
      {initialMode === 'admin_transactions' && <TransactionManagement users={users} products={products} onUpdateMetadata={async (uid, fields) => { await updateAdminMetadata(uid, fields); fetchUsersAndConfig(true); }} onManageUser={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} />}
      {initialMode === 'products' && <ProductMatrix products={products} setEditingProduct={setEditingProduct} setIsProductModalOpen={setIsProductModalOpen} />}
      {initialMode === 'ai' && <AiArchitecture aiConfig={aiConfig} setAiConfigState={setAiConfigState} handleSaveAiConfig={handleSaveAiConfig} isSavingAi={isSavingAi} isFetchingModels={isFetchingModels} isModelDropdownOpen={isModelDropdownOpen} setIsModelDropdownOpen={setIsModelDropdownOpen} modelSearchTerm={modelSearchTerm} setModelSearchTerm={setModelSearchTerm} filteredOpenRouterModels={[]} handleModelSelect={() => {}} dropdownRef={dropdownRef} />}
      {initialMode === 'settings' && <AdminSettings />}
      {initialMode === 'integrations' && <MayarIntegration />}
      {initialMode === 'admin_admins' && <AdminManagement users={users} onUpdateMetadata={async (uid, fields) => { await updateAdminMetadata(uid, fields); fetchUsersAndConfig(true); }} />}

      {/* MODAL USER */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-start mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase">Kelola User</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black">✕</button>
             </div>
             <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border">
                  <p className="font-black text-slate-800">{editingUser.profile?.name}</p>
                  <p className="text-xs font-bold text-slate-400">{editingUser.profile?.email}</p>
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
                <button onClick={() => handleSaveUserMetadata(editingUser)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Perubahan</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUK (FIX: TAMBAH/EDIT PRODUK) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 lg:p-14 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-start mb-10">
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{editingProduct ? 'Edit Paket Langganan' : 'Buat Paket Baru'}</h3>
                <button onClick={() => setIsProductModalOpen(false)} className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
             </div>
             
             <ProductForm 
                initialData={editingProduct}
                onCancel={() => setIsProductModalOpen(false)}
                onSubmit={handleSaveProduct}
                onDelete={editingProduct ? handleDeleteProduct : undefined}
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;