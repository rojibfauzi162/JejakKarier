
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig } from '../types';
import { getAllUsers, updateAdminMetadata, getAiConfig, saveAiConfig, getProductsCatalog, saveProductsCatalog } from '../services/firebase';

// Sub-modules import
import AdminDashboard from './admin/AdminDashboard';
import UserManagement from './admin/UserManagement';
import AiArchitecture from './admin/AiArchitecture';
import ProductMatrix from './admin/ProductMatrix';
import SystemHealth from './admin/SystemHealth';
import ProductForm from './admin/ProductForm';
import ScalevIntegration from './admin/ScalevIntegration';

interface SubscriptionProduct {
  id: string;
  name: string;
  tier: SubscriptionPlan;
  price: number;
  durationDays: number;
  enabledDurations: number[];
  allowedModules: string[];
  limits: {
    dailyLogs: number | 'unlimited';
    skills: number | 'unlimited';
    projects: number | 'unlimited';
    cvExports: number | 'unlimited';
  };
}

interface AdminPanelProps {
  initialMode?: 'dashboard' | 'users' | 'products' | 'health' | 'ai' | 'integrations';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ initialMode = 'dashboard' }) => {
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
    if (!silent) {
        setLoading(true);
        setError(null);
    }
    try {
      const [usersData, configData, productsData] = await Promise.all([
        getAllUsers(), getAiConfig(), getProductsCatalog()
      ]);
      setUsers(usersData);
      if (configData) setAiConfigState(configData);
      if (productsData && productsData.length > 0) setProducts(productsData);
      
      setIsSynced(true);
      if (silent) triggerToast("Data berhasil disinkronkan! ✅");
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        setError("Firebase Permission Denied. Pastikan role 'superadmin' sudah tersemat di document user Anda di Firestore dan Rules sudah diperbarui.");
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
  }, [initialMode]);

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
      triggerToast("Setingan AI berhasil diperbarui! 🚀");
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
      await updateAdminMetadata(editingUser.uid, metadata);
      triggerToast("Berhasil update user! ✅");
      fetchUsersAndConfig(true);
      setIsUserModalOpen(false);
    } catch (e) {
      triggerToast("Gagal update user. Cek Firestore Rules.", "error");
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
            {initialMode === 'health' ? 'Kesehatan Sistem' : initialMode === 'users' ? 'Kelola User' : initialMode === 'ai' ? 'Arsitektur AI' : initialMode === 'products' ? 'Matriks Produk' : initialMode === 'integrations' ? 'Integrasi Layanan' : 'Dashboard Admin Hub'}
          </h2>
          <p className="text-slate-500 font-medium italic">Manajemen sistem JejakKarir.</p>
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
      {initialMode === 'dashboard' && <AdminDashboard stats={adminStats} />}
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
      {initialMode === 'integrations' && <ScalevIntegration />}

      {/* MODAL USER */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Kelola User</h3>
             <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border">
                  <p className="font-black text-slate-800">{editingUser.profile?.name}</p>
                  <p className="text-xs font-bold text-slate-400">{editingUser.profile?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Role</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}>
                      <option value={UserRole.USER}>User Bias/Gratis</option>
                      <option value={UserRole.SUPERADMIN}>Superadmin (Akses Penuh)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border text-xs font-bold" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as AccountStatus })}>
                      {Object.values(AccountStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button onClick={() => handleDeleteUser(editingUser.uid!)} className="px-6 py-4 bg-rose-50 text-rose-500 font-black rounded-2xl text-[10px] uppercase">Hapus</button>
                  <button onClick={() => handleSaveUserMetadata({ role: editingUser.role, status: editingUser.status })} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl">Simpan Perubahan</button>
                  <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase">Batal</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh] no-scrollbar">
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
