
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig, SubscriptionProduct } from '../../types';
import { getAllUsers, updateAdminMetadata, getAiConfig, saveAiConfig, getProductsCatalog, saveProductsCatalog } from '../../services/firebase';

// Sub-modules import
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import AiArchitecture from './AiArchitecture';
import ProductMatrix from './ProductMatrix';
import SystemHealth from './SystemHealth';
import ProductForm from './ProductForm';
import MayarIntegration from './MayarIntegration';
import TransactionManagement from './TransactionManagement';
import AdminManagement from './AdminManagement';
import AdminSettings from './AdminSettings';

interface AdminPanelProps {
  initialMode?: 'dashboard' | 'users' | 'products' | 'health' | 'ai' | 'integrations' | 'admin_transactions' | 'admin_admins' | 'settings';
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

  // States for Product Management
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SubscriptionProduct | null>(null);

  const [aiConfig, setAiConfigState] = useState<AiConfig>({
    openRouterKey: '', modelName: 'google/gemini-2.0-pro-exp-02-05:free', maxTokens: 4096
  });

  const [isSavingAi, setIsSavingAi] = useState(false);
  
  const [dynamicModels, setDynamicModels] = useState<any[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<SubscriptionProduct[]>([
    { 
      id: 'p1', name: 'Paket Gratisan', tier: SubscriptionPlan.FREE, price: 0, durationDays: 3650, enabledDurations: [3650], 
      allowedModules: ['dashboard', 'profile', 'daily', 'skills'], 
      limits: { dailyLogs: 10, skills: 5, projects: 2, cvExports: 1 } 
    }
  ]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 3000);
  };

  const fetchUsersAndConfig = async (silent = false) => {
    // Safety check: Jangan lanjutkan jika role user bukan superadmin
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
      const usersTask = getAllUsers().catch(e => { 
        if (e.code === 'permission-denied') return [] as AppData[];
        throw e;
      });
      const configTask = getAiConfig().catch(e => { console.error(e); return null; });
      const productsTask = getProductsCatalog().catch(e => { console.error(e); return [] as SubscriptionProduct[]; });

      const [usersData, configData, productsData] = await Promise.all([
        usersTask, configTask, productsTask
      ]);

      setUsers(usersData);
      if (configData) setAiConfigState(configData);
      if (productsData && productsData.length > 0) setProducts(productsData);
      
      setIsSynced(true);
      if (silent) triggerToast("Data berhasil disinkronkan! ✅");
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        setError("Firebase Permission Denied. Pastikan role 'superadmin' sudah tersemat di database Firestore.");
      } else {
        setError(err.message || "Gagal mengambil data dari server.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchModelsFromOpenRouter = async () => {
    setIsFetchingModels(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      if (response.ok) {
        const json = await response.json();
        setDynamicModels(json.data || []);
      }
    } catch (e) {
      console.error("Gagal ambil list model OpenRouter:", e);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const filteredOpenRouterModels = useMemo(() => {
    return dynamicModels.filter(m => 
      m.name.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearchTerm.toLowerCase())
    );
  }, [dynamicModels, modelSearchTerm]);

  const [keyInfo, setKeyInfo] = useState<{
    label: string;
    usage: number;
    limit: number | null;
    is_active: boolean;
  } | null>(null);
  const [fetchingKeyInfo, setFetchingKeyInfo] = useState(false);

  const fetchOpenRouterKeyInfo = async () => {
    if (!aiConfig.openRouterKey || aiConfig.openRouterKey.length < 10) return;
    setFetchingKeyInfo(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: { "Authorization": `Bearer ${aiConfig.openRouterKey}` }
      });
      if (response.ok) {
        const json = await response.json();
        setKeyInfo(json.data);
      } else {
        setKeyInfo(null);
      }
    } catch (e) {
      setKeyInfo(null);
    } finally {
      setFetchingKeyInfo(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConfig();
    fetchModelsFromOpenRouter();
  }, [initialMode, userRole]);

  useEffect(() => {
    if (aiConfig.openRouterKey) fetchOpenRouterKeyInfo();
  }, [aiConfig.openRouterKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adminStats = useMemo(() => {
    const total = users.length;
    const activeToday = users.filter(u => u.lastLogin?.includes(new Date().toISOString().split('T')[0])).length;
    const totalTokens = users.reduce((acc, u) => acc + (u.aiUsage?.totalTokens || 0), 0);
    const totalAiOps = users.reduce((acc, u) => acc + (u.aiUsage?.careerAnalysis || 0) + (u.aiUsage?.cvGenerated || 0), 0);
    return { total, activeToday, totalTokens, totalAiOps };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      !u.isDeleted && (
        (u.profile?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.profile?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [users, searchQuery]);

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    try {
      await saveAiConfig(aiConfig);
      triggerToast("Setingan AI diperbarui! 🚀");
      fetchOpenRouterKeyInfo();
    } catch (err) {
      triggerToast("Gagal simpan setingan AI.", "error");
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleModelSelect = (model: any) => {
    setAiConfigState({
      ...aiConfig,
      modelName: model.id,
      maxTokens: 4096 
    });
    setIsModelDropdownOpen(false);
    setModelSearchTerm('');
  };

  const handleSaveUserMetadata = async (metadata: Partial<AppData>) => {
    if (!editingUser?.uid) return;
    try {
      // Pastikan tidak ada undefined yang lolos ke updateAdminMetadata
      await updateAdminMetadata(editingUser.uid, metadata);
      triggerToast("Berhasil update user! ✅");
      fetchUsersAndConfig(true);
      setIsUserModalOpen(false);
    } catch (e) {
      triggerToast("Gagal update user.", "error");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Nonaktifkan user ini?")) return;
    try {
      await updateAdminMetadata(uid, { isDeleted: true });
      triggerToast("User dinonaktifkan.");
      fetchUsersAndConfig(true);
      setIsUserModalOpen(false);
    } catch (e) {
      triggerToast("Gagal hapus user.", "error");
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

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menghubungkan ke pusat data...</p>
    </div>
  );

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
       <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner">⚠️</div>
       <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Akses Ditolak</h2>
       <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed mb-8">{error}</p>
       <button onClick={() => fetchUsersAndConfig()} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Coba Refresh Data</button>
    </div>
  );

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
            {initialMode === 'health' ? 'Kesehatan Sistem' : initialMode === 'users' ? 'Kelola User' : initialMode === 'ai' ? 'Arsitektur AI' : initialMode === 'products' ? 'Matriks Produk' : initialMode === 'integrations' ? 'Integrasi Mayar' : initialMode === 'admin_admins' ? 'Kelola Admin' : initialMode === 'admin_transactions' ? 'Manajemen Keuangan' : initialMode === 'settings' ? 'Global Settings' : 'Dashboard Admin Hub'}
          </h2>
          <p className="text-slate-500 font-medium italic">Sistem Administrasi FokusKarir.</p>
        </div>
        <div className="flex gap-4">
          {!isSynced && (
            <button onClick={() => fetchUsersAndConfig(true)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <i className={`bi bi-arrow-repeat mr-2 ${loading ? 'animate-spin' : ''}`}></i> Sinkron Ulang
            </button>
          )}
        </div>
      </header>

      {/* RENDER MODUL SESUAI MODE */}
      {initialMode === 'dashboard' && <AdminDashboard stats={adminStats} users={users} />}
      {initialMode === 'users' && <UserManagement users={filteredUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onManage={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} />}
      {initialMode === 'ai' && (
        <AiArchitecture 
          aiConfig={aiConfig} setAiConfigState={setAiConfigState} 
          handleSaveAiConfig={handleSaveAiConfig} isSavingAi={isSavingAi}
          isFetchingModels={isFetchingModels} isModelDropdownOpen={isModelDropdownOpen}
          setIsModelDropdownOpen={setIsModelDropdownOpen} modelSearchTerm={modelSearchTerm}
          setModelSearchTerm={setModelSearchTerm} filteredOpenRouterModels={filteredOpenRouterModels}
          handleModelSelect={handleModelSelect} dropdownRef={dropdownRef}
        />
      )}
      {initialMode === 'products' && <ProductMatrix products={products} setEditingProduct={setEditingProduct} setIsProductModalOpen={setIsProductModalOpen} />}
      {initialMode === 'health' && <SystemHealth keyInfo={keyInfo} fetchingKeyInfo={fetchingKeyInfo} aiConfig={aiConfig} totalTokens={adminStats.totalTokens} />}
      {initialMode === 'integrations' && <MayarIntegration />}
      {initialMode === 'admin_transactions' && (
        <TransactionManagement 
          users={users} 
          products={products}
          onUpdateMetadata={async (uid, fields) => { await updateAdminMetadata(uid, fields); triggerToast("Data Keuangan Diperbarui ✅"); fetchUsersAndConfig(true); }} 
          onManageUser={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} 
        />
      )}
      {initialMode === 'admin_admins' && (
        <AdminManagement 
          users={users} 
          onUpdateMetadata={async (uid, fields) => { await updateAdminMetadata(uid, fields); triggerToast("Identitas Admin Diperbarui ✅"); fetchUsersAndConfig(true); }} 
        />
      )}
      {initialMode === 'settings' && <AdminSettings />}

      {/* MODAL USER */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Kelola User</h3>
             <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border">
                  <p className="font-black text-slate-800">{editingUser.profile?.name}</p>
                  <p className="text-xs font-bold text-slate-400">{editingUser.profile?.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Role Utama</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}>
                      <option value={UserRole.USER}>User Biasa / Member</option>
                      <option value={UserRole.SUPERADMIN}>Superadmin (Full Access)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status Akun</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as AccountStatus })}>
                      {Object.values(AccountStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subscription Control</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Pilih Paket (Matriks Produk)</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold bg-white" 
                                value={products.find(p => p.tier === editingUser.plan)?.id || ''}
                                onChange={e => {
                                    const p = products.find(prod => prod.id === e.target.value);
                                    if(p) setEditingUser({ ...editingUser, plan: p.tier, planPermissions: p.allowedModules, planLimits: p.limits });
                                }}
                            >
                                <option value="">Pilih Paket Produk...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.tier})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Berakhir Pada (Expiry)</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold bg-slate-50" 
                                value={editingUser.expiryDate ? editingUser.expiryDate.split('T')[0] : ''}
                                onChange={e => setEditingUser({ ...editingUser, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                            />
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Extension Engine</p>
                            <p className="text-[11px] font-bold text-indigo-700">Perpanjang durasi berdasarkan paket terpilih.</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => {
                                const p = products.find(prod => prod.tier === editingUser.plan);
                                if(!p) { alert("Silakan pilih paket produk terlebih dahulu sebelum memperpanjang."); return; }
                                const currentExpiry = editingUser.expiryDate ? new Date(editingUser.expiryDate) : new Date();
                                const now = new Date();
                                const baseDate = currentExpiry > now ? currentExpiry : now;
                                baseDate.setDate(baseDate.getDate() + p.durationDays);
                                
                                setEditingUser({ 
                                    ...editingUser, 
                                    expiryDate: baseDate.toISOString(), 
                                    status: AccountStatus.ACTIVE,
                                    activeFrom: now.toISOString()
                                });
                                alert(`Akses user berhasil diperpanjang selama ${p.durationDays} hari hingga ${baseDate.toLocaleDateString('id-ID')}`);
                            }}
                            className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            ⚡ Perpanjang Masa Aktif
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button onClick={() => handleDeleteUser(editingUser.uid!)} className="px-6 py-4 bg-rose-50 text-rose-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Hapus</button>
                  <button onClick={() => handleSaveUserMetadata({ 
                      role: editingUser.role, 
                      status: editingUser.status,
                      plan: editingUser.plan,
                      expiryDate: editingUser.expiryDate,
                      planPermissions: editingUser.planPermissions,
                      planLimits: editingUser.planLimits,
                      activeFrom: editingUser.activeFrom
                  })} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl hover:bg-black transition-all">Simpan Perubahan</button>
                  <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Batal</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 uppercase">Konfigurasi Paket</h3>
                <button onClick={() => setIsProductModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black">✕</button>
             </div>
             
             <ProductForm 
               initialData={editingProduct} 
               onCancel={() => setIsProductModalOpen(false)} 
               onSubmit={handleSaveProduct}
               onDelete={editingProduct ? () => {
                 if(confirm("Hapus produk ini?")) {
                   const newList = products.filter(p => p.id !== editingProduct.id);
                   saveProductsCatalog(newList);
                   setProducts(newList);
                   setIsProductModalOpen(false);
                 }
               } : undefined}
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
