
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig } from '../types';
// Add auth to imports
import { getAllUsers, updateAdminMetadata, saveUserData, getAiConfig, saveAiConfig, auth, getProductsCatalog, saveProductsCatalog } from '../services/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface SubscriptionProduct {
  id: string;
  name: string;
  tier: SubscriptionPlan; // Ditambahkan untuk kategori produk
  price: number;
  durationDays: number;
  enabledDurations: number[]; // Ditambahkan untuk menyimpan pilihan durasi yang aktif (checklist)
  allowedModules: string[];
  limits: {
    dailyLogs: number | 'unlimited';
    skills: number | 'unlimited';
    projects: number | 'unlimited';
    cvExports: number | 'unlimited';
  };
}

interface AdminPanelProps {
  initialMode?: 'dashboard' | 'users' | 'products' | 'health' | 'ai';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ initialMode = 'dashboard' }) => {
  const [users, setUsers] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppData | null>(null);
  const [showSoftDeleted, setShowSoftDeleted] = useState(false);

  // UX Feedback states
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [adminConfirm, setAdminConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 3000);
  };

  // Added missing state variables to fix "Cannot find name" errors
  const [isUserAddModalOpen, setIsUserAddModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SubscriptionProduct | null>(null);
  
  // State untuk Draft Edit User (Profil, Paket, Status, dan Durasi)
  const [userEditDraft, setUserEditDraft] = useState({ 
    name: '', 
    email: '', 
    planId: '', 
    status: '' as AccountStatus,
    duration: 30,
    bypassAiLimits: false
  });

  // State untuk AI Config
  const [aiConfig, setAiConfigState] = useState<AiConfig>({
    openRouterKey: '',
    modelName: 'google/gemini-2.0-pro-exp-02-05:free',
    maxTokens: 2000
  });
  const [isSavingAi, setIsSavingAi] = useState(false);

  // New states for OpenRouter Model Selection
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  
  // State baru untuk Health Monitoring OpenRouter
  const [keyUsage, setKeyUsage] = useState<any>(null);
  const [fetchingUsage, setFetchingUsage] = useState(false);

  // State untuk CRUD Produk dengan Tier Category dan Multi-Durasi
  const [products, setProducts] = useState<SubscriptionProduct[]>([
    { 
      id: 'p1', 
      name: 'Free Tier', 
      tier: SubscriptionPlan.FREE,
      price: 0, 
      durationDays: 3650, 
      enabledDurations: [3650],
      allowedModules: ['dashboard', 'profile', 'daily', 'skills'],
      limits: { dailyLogs: 10, skills: 5, projects: 2, cvExports: 1 }
    },
    { 
      id: 'p2', 
      name: 'Premium Monthly', 
      tier: SubscriptionPlan.PRO,
      price: 59000, 
      durationDays: 30, 
      enabledDurations: [30, 90, 365],
      allowedModules: ['dashboard', 'profile', 'daily', 'skills', 'cv_generator', 'online_cv', 'projects', 'networking'],
      limits: { dailyLogs: 'unlimited', skills: 'unlimited', projects: 'unlimited', cvExports: 'unlimited' }
    }
  ]);

  // Sinkronkan draft saat user dipilih
  useEffect(() => {
    if (selectedUser) {
      const userProduct = products.find(p => p.tier === selectedUser.plan) || products[0];
      setUserEditDraft({
        name: selectedUser.profile?.name || '',
        email: selectedUser.profile?.email || '',
        planId: userProduct.id,
        status: selectedUser.status,
        duration: 30,
        bypassAiLimits: !!selectedUser.bypassAiLimits
      });
    }
  }, [selectedUser, products]);

  // Global Admin Stats & Chart Data
  const { adminStats, registrationChartData, activityChartData } = useMemo(() => {
    const total = users.length;
    const activeToday = users.filter(u => {
      if (!u.lastLogin) return false;
      const last = new Date(u.lastLogin);
      return last.toDateString() === new Date().toDateString();
    }).length;
    const totalAI = users.reduce((acc, u) => acc + (u.aiUsage?.cvGenerated || 0) + (u.aiUsage?.careerAnalysis || 0), 0);
    const totalTokensConsumed = users.reduce((acc, u) => acc + (u.aiUsage?.totalTokens || 0), 0);

    // Registration Data Aggregation
    const regMap: Record<string, { date: string, paid: number, free: number }> = {};
    const actMap: Record<string, { date: string, active: number }> = {};

    users.forEach(u => {
      const d = u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '?';
      if (!regMap[d]) regMap[d] = { date: d, paid: 0, free: 0 };
      const isPaid = u.plan === SubscriptionPlan.PRO || u.plan === SubscriptionPlan.ENTERPRISE;
      if (isPaid) regMap[d].paid += 1;
      else regMap[d].free += 1;

      if (u.lastLogin) {
        const ad = new Date(u.lastLogin).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (!actMap[ad]) actMap[ad] = { date: ad, active: 0 };
        actMap[ad].active += 1;
      }
    });

    return { 
      adminStats: { total, activeToday, totalAI, totalTokensConsumed },
      registrationChartData: Object.values(regMap).slice(-7),
      activityChartData: Object.values(actMap).slice(-7)
    };
  }, [users]);

  const fetchUsersAndConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      // Menjalankan fetch secara paralel dan menangkap error masing-masing
      const [usersResult, aiResult, productsResult] = await Promise.allSettled([
        getAllUsers(),
        getAiConfig(),
        getProductsCatalog()
      ]);

      // Modul User
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      } else {
        const err = usersResult.reason;
        console.error("User fetch failed:", err);
        // Jika mode aktif adalah 'users' atau 'dashboard' dan gagal izin, tampilkan error view
        if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission'))) {
           if (initialMode === 'users' || initialMode === 'dashboard') {
             setError("DATABASE_PERMISSION_DENIED");
           }
        } else {
          setError(err.message || "Gagal mengambil data user.");
        }
      }

      // Modul AI
      if (aiResult.status === 'fulfilled') {
        if (aiResult.value) {
          setAiConfigState(aiResult.value);
        }
      } else {
        const err = aiResult.reason;
        if (err && err.code === 'permission-denied' && initialMode === 'ai') {
          setError("DATABASE_PERMISSION_DENIED");
        }
      }

      // Modul Produk
      if (productsResult.status === 'fulfilled' && productsResult.value) {
        setProducts(productsResult.value);
      }
    } catch (err: any) {
      console.error("General Fetch Error:", err);
      setError(err.message || "Gagal menghubungi server database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConfig();
  }, [initialMode]);

  // Fetch OpenRouter Models
  useEffect(() => {
    if (initialMode === 'ai' || initialMode === 'health') {
      const fetchModels = async () => {
        setFetchingModels(true);
        try {
          const response = await fetch("https://openrouter.ai/api/v1/models");
          const json = await response.json();
          setAvailableModels(json.data || []);
        } catch (err) {
          console.error("Gagal mengambil model OpenRouter:", err);
        } finally {
          setFetchingModels(false);
        }
      };
      fetchModels();
    }
  }, [initialMode]);

  // Logic: Monitor OpenRouter Key Health & Auto-switch low balance with periodic sync
  useEffect(() => {
    let interval: any;
    if (initialMode === 'health' && aiConfig.openRouterKey && aiConfig.openRouterKey.length > 5) {
      const checkUsage = async () => {
        setFetchingUsage(true);
        try {
          const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
            headers: {
              "Authorization": `Bearer ${aiConfig.openRouterKey}`
            }
          });
          const json = await response.json();
          if (json.data) {
            setKeyUsage(json.data);

            // Logic Otomatis: Ganti ke model FREE jika sisa kredit kritis (di bawah $0.10)
            const remaining = (json.data.limit || 0) - (json.data.usage || 0);
            const isCritical = json.data.limit !== null && remaining < 0.1;
            
            if (isCritical && !aiConfig.modelName.includes(':free')) {
              console.warn("[SYSTEM] Low credit balance. Triggering auto-switch to FREE model.");
              
              // Cari model dengan label ':free'
              const freeModel = availableModels.find(m => m.id.includes(':free'))?.id || "google/gemini-2.0-flash-exp:free";
              
              const updatedConfig = { ...aiConfig, modelName: freeModel };
              await saveAiConfig(updatedConfig);
              setAiConfigState(updatedConfig);
              triggerToast("Low Credits! Auto-switched to Free Model.", "error");
            }
          }
        } catch (e) {
          console.error("Health Check failed:", e);
        } finally {
          setFetchingUsage(false);
        }
      };
      
      checkUsage();
      // Melakukan sinkronisasi otomatis sisa kredit setiap 30 detik
      interval = setInterval(checkUsage, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [initialMode, aiConfig.openRouterKey, availableModels]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.profile?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.profile?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDeleted = showSoftDeleted ? u.isDeleted : !u.isDeleted;
      return matchesSearch && matchesDeleted;
    });
  }, [users, searchQuery, showSoftDeleted]);

  const filteredModels = useMemo(() => {
    return availableModels.filter(m => 
      (m.id || '').toLowerCase().includes(modelSearchQuery.toLowerCase()) || 
      (m.name || '').toLowerCase().includes(modelSearchQuery.toLowerCase())
    );
  }, [availableModels, modelSearchQuery]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    const selectedPlanId = formData.get('plan') as string;
    const product = products.find(p => p.id === selectedPlanId) || products[0];
    const selectedDuration = parseInt(formData.get('duration') as string) || 30;
    
    const activeFrom = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(activeFrom.getDate() + selectedDuration);

    const newUser: Partial<AppData> = {
      uid: 'man-' + Math.random().toString(36).substr(2, 9),
      profile: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        birthPlace: '', birthDate: '', maritalStatus: '', phone: '', domicile: '',
        mainCareer: '', sideCareer: '', currentCompany: '', currentPosition: '',
        jobDesk: '', shortTermTarget: '', longTermTarget: '', description: ''
      },
      role: formData.get('role') as UserRole,
      plan: product.tier,
      status: AccountStatus.ACTIVE,
      activeFrom: activeFrom.toISOString(),
      expiryDate: expiryDate.toISOString(),
      planPermissions: product.allowedModules,
      planLimits: product.limits,
      bypassAiLimits: false,
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      dailyReports: [], skills: [], trainings: [], certifications: [], careerPaths: [], achievements: [], contacts: [], monthlyReviews: [], jobApplications: [], personalProjects: [], affirmations: [], workCategories: [], onlineCV: { username: '', themeId: 't-bento', isActive: false, visibleSections: [], selectedItemIds: {}, socialLinks: {} }
    };

    try {
      await saveUserData(newUser.uid!, newUser as AppData);
      triggerToast("User provisioned successfully.");
      fetchUsersAndConfig();
      setIsUserAddModalOpen(false);
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        triggerToast("Access Denied: Missing write permissions for citizen collection.", "error");
      } else {
        triggerToast("Provisioning process failed.", "error");
      }
    }
  };

  const handleUpdateUserDetails = async (uid: string, fields: any) => {
    try {
      if (!uid) return;
      await updateAdminMetadata(uid, fields);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...fields } : u));
      if (selectedUser?.uid === uid) setSelectedUser({ ...selectedUser, ...fields });
      triggerToast("Metadata synchronized.");
    } catch (err: any) {
      console.error("User detail update error:", err);
      if (err.code === 'permission-denied') {
        triggerToast("Permission Denied: Unable to update remote document.", "error");
      } else {
        triggerToast("Failed to update record.", "error");
      }
    }
  };

  const handleSaveProfileDraft = async () => {
    if (!selectedUser || !selectedUser.uid) return;
    
    const product = products.find(p => p.id === userEditDraft.planId);
    if (!product) return;

    const activeFrom = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(activeFrom.getDate() + userEditDraft.duration);

    let updateData: Partial<AppData> = {
      profile: {
        ...(selectedUser.profile || {}),
        name: userEditDraft.name,
        email: userEditDraft.email
      } as any,
      status: userEditDraft.status,
      plan: product.tier,
      activeFrom: activeFrom.toISOString(),
      expiryDate: expiryDate.toISOString(),
      planPermissions: product.allowedModules,
      planLimits: product.limits,
      bypassAiLimits: userEditDraft.bypassAiLimits
    };
    
    await handleUpdateUserDetails(selectedUser.uid, updateData);
  };

  const handlePurgeUser = async (uid: string) => {
    setAdminConfirm({
      title: "Purge Citizen Record?",
      desc: "This will move the user to the Recycle Bin and restrict access. This action is irreversible for the user's current session.",
      onConfirm: async () => {
        try {
          await updateAdminMetadata(uid, { isDeleted: true, deletedAt: new Date().toISOString() });
          setUsers(prev => prev.filter(u => u.uid !== uid));
          setSelectedUser(null);
          triggerToast("Citizen purged from active nexus.");
        } catch (err: any) {
          if (err.code === 'permission-denied') {
            triggerToast("Security Rejection: Insufficient purge privileges.", "error");
          } else {
            triggerToast("Purge protocol failed.", "error");
          }
        }
        setAdminConfirm(null);
      }
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const modules = Array.from(formData.getAll('modules')) as string[];
    const durations = Array.from(formData.getAll('durations')).map(Number);
    
    const prodData: SubscriptionProduct = {
      id: editingProduct?.id || 'prod-' + Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      tier: (formData.get('tier') as SubscriptionPlan) || editingProduct?.tier || SubscriptionPlan.PRO,
      price: parseInt(formData.get('price') as string),
      enabledDurations: durations,
      durationDays: durations[0] || 30,
      allowedModules: modules,
      limits: {
        dailyLogs: formData.get('unlimited_daily') ? 'unlimited' : parseInt(formData.get('limit_daily') as string),
        skills: formData.get('unlimited_skills') ? 'unlimited' : parseInt(formData.get('limit_skills') as string),
        projects: formData.get('unlimited_projects') ? 'unlimited' : parseInt(formData.get('limit_projects') as string),
        cvExports: formData.get('unlimited_cv') ? 'unlimited' : parseInt(formData.get('limit_cv') as string),
      }
    };

    if (durations.length === 0) {
      triggerToast("Duration choice required.", "error");
      return;
    }

    try {
      let updatedProducts;
      if (editingProduct) {
        updatedProducts = products.map(p => p.id === prodData.id ? prodData : p);
      } else {
        updatedProducts = [...products, prodData];
      }
      
      await saveProductsCatalog(updatedProducts);
      setProducts(updatedProducts);
      triggerToast(editingProduct ? "Product architecture updated." : "New product published.");
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        triggerToast("Forbidden: system_metadata is write-protected.", "error");
      } else {
        triggerToast("Failed to save product catalog.", "error");
      }
    }
  };

  const deleteProduct = (id: string) => {
    setAdminConfirm({
      title: "Decommission Product?",
      desc: "Removing this offering will prevent future provisioning. Active users with this plan will remain unaffected until expiry.",
      onConfirm: async () => {
        try {
          const updatedProducts = products.filter(p => p.id !== id);
          await saveProductsCatalog(updatedProducts);
          setProducts(updatedProducts);
          triggerToast("Product decommissioned.");
        } catch (e: any) {
          if (e.code === 'permission-denied') {
            triggerToast("Operation Blocked: Missing delete permissions.", "error");
          } else {
            triggerToast("Failed to decommission product.", "error");
          }
        }
        setAdminConfirm(null);
      }
    });
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    try {
      // Validasi input token sebelum kirim
      if (!aiConfig.maxTokens || aiConfig.maxTokens < 1) {
        throw new Error("Token capacity must be at least 1.");
      }

      await saveAiConfig(aiConfig);
      triggerToast("AI Architecture redeployed successfully.");
      
      // Re-fetch untuk memastikan status bar sinkron dengan DB (termasuk metadata timestamp)
      const freshConfig = await getAiConfig();
      if (freshConfig) {
        setAiConfigState(freshConfig);
      }
    } catch (err: any) {
      console.error("Save AI Config failed:", err);
      // Tampilkan error yang lebih deskriptif (seperti permission denied)
      const errorMsg = err.code === 'permission-denied' 
        ? "SECURITY ERROR: Missing write permissions for system_metadata." 
        : (err.message || "Deployment failed.");
      triggerToast(errorMsg, "error");
    } finally {
      setIsSavingAi(false);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Admin Hub...</p>
    </div>
  );

  // Error State UI for Permissions
  if (error === "DATABASE_PERMISSION_DENIED") return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-8 animate-in zoom-in duration-500">
       <div className="max-w-xl w-full bg-white p-12 lg:p-16 rounded-[4rem] border-2 border-rose-100 shadow-2xl text-center">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Database Locked</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-8">
            Akun Anda (<span className="text-rose-600">{auth.currentUser?.email}</span>) telah disetel sebagai admin di aplikasi, 
            namun <span className="text-slate-900">Firestore Security Rules</span> di Firebase Console menolak permintaan baca koleksi global.
          </p>
          <div className="bg-slate-900 p-6 rounded-3xl text-left mb-10 overflow-hidden">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">🛠️ Solusi Perbaikan Manual:</p>
             <ol className="text-[10px] text-slate-400 space-y-2 font-medium">
                <li>1. Buka <span className="text-white">Firebase Console</span>.</li>
                <li>2. Pilih <span className="text-white">Firestore Database &gt; Rules</span>.</li>
                <li>3. Pastikan izin <span className="text-emerald-400">read & write</span> diizinkan bagi user dengan <code className="text-indigo-300">resource.data.role == 'superadmin'</code> atau ubah ke <code className="text-emerald-300">allow read, write: if true;</code> untuk mode pengembangan.</li>
                <li>4. Publish Rules dan <span className="text-white">Refresh Halaman Ini</span>.</li>
             </ol>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Refresh Connection</button>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* SUCCESS TOAST OVERLAY */}
      {adminToast && (
        <div className="fixed top-10 right-10 z-[1000] animate-in slide-in-from-right-4 duration-500">
           <div className={`px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${adminToast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
             <span className="text-xl">{adminToast.type === 'success' ? '✓' : '⚠️'}</span>
             <span className="font-black text-[10px] uppercase tracking-widest">{adminToast.message}</span>
           </div>
        </div>
      )}

      {/* CONFIRMATION MODAL OVERLAY */}
      {adminConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-12 border border-slate-100 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                 <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">{adminConfirm.title}</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10 opacity-70">{adminConfirm.desc}</p>
                 <div className="flex gap-4">
                    <button onClick={() => setAdminConfirm(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] hover:bg-slate-100">Cancel</button>
                    <button onClick={adminConfirm.onConfirm} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl shadow-rose-100 hover:bg-rose-700">Confirm Action</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {initialMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminStatCard title="Global Citizens" value={adminStats.total} sub="Total Terdaftar" icon="👤" color="blue" />
            <AdminStatCard title="Daily Traffic" value={adminStats.activeToday} sub="Login Hari Ini" icon="⚡" color="amber" />
            <AdminStatCard title="AI Operations" value={adminStats.totalAI} sub="Total AI Generation" icon="🤖" color="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Pendaftaran (Paid vs Free)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={registrationChartData}>
                      <XAxis dataKey="date" hide />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="paid" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="free" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">User Aktif (DAU)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityChartData}>
                      <XAxis dataKey="date" hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </>
      )}

      <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4 ${initialMode !== 'dashboard' ? '' : 'border-t border-slate-100'}`}>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {initialMode === 'dashboard' ? 'System Overview' : initialMode === 'users' ? 'User Nexus' : initialMode === 'products' ? 'Product Matrix' : initialMode === 'ai' ? 'AI Architecture' : 'System Pulse'}
          </h2>
          <p className="text-slate-500 font-medium italic">"Managing the core engine."</p>
        </div>
        <div className="flex gap-4">
          {initialMode === 'users' && (
            <button onClick={() => setIsUserAddModalOpen(true)} className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl hover:bg-rose-700 transition-all text-xs uppercase tracking-widest">+ Provision User</button>
          )}
          {initialMode === 'products' && (
            <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest">+ Define Product</button>
          )}
        </div>
      </header>

      {/* USER MANAGEMENT MODULE */}
      {initialMode === 'users' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search citizens..." 
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                      <th className="px-8 py-5">Identity</th>
                      <th className="px-6 py-5 text-center">Plan</th>
                      <th className="px-6 py-5 text-center">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(u => {
                      const displayName = (u.profile?.name && u.profile.name !== 'Alex' ? u.profile.name : u.profile?.email || u.uid) || 'User';
                      const displayEmail = u.profile?.email || 'No email';
                      const initial = displayName.charAt(0).toUpperCase();

                      return (
                        <tr key={u.uid} className={`group hover:bg-slate-50/50 transition-colors ${selectedUser?.uid === u.uid ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-lg">
                                {initial}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm truncate max-w-[200px]">{displayName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{displayEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">{u.plan}</span>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{u.status}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => setSelectedUser(u)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Manage</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="xl:col-span-4">
            {selectedUser ? (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-10 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Identity Hub</h3>
                  <button onClick={() => setSelectedUser(null)} className="text-slate-300 hover:text-slate-900">✕</button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                       <input 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={userEditDraft.name}
                        onChange={e => setUserEditDraft({ ...userEditDraft, name: e.target.value })}
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Alamat Email</label>
                       <input 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={userEditDraft.email}
                        onChange={e => setUserEditDraft({ ...userEditDraft, email: e.target.value })}
                       />
                    </div>
                  </div>

                  {/* AI BYPASS TOGGLE */}
                  <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                     <div className="flex items-center justify-between mb-2">
                        <label className="text-10px font-black text-indigo-600 uppercase tracking-widest">Bypass AI Limits</label>
                        <button 
                          onClick={() => setUserEditDraft({ ...userEditDraft, bypassAiLimits: !userEditDraft.bypassAiLimits })}
                          className={`w-12 h-6 rounded-full relative transition-colors ${userEditDraft.bypassAiLimits ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userEditDraft.bypassAiLimits ? 'left-7' : 'left-1'}`}></div>
                        </button>
                     </div>
                     <p className="text-[9px] text-indigo-400 leading-tight italic">Mengizinkan user generate laporan AI kapanpun (abaikan 1x seminggu/sebulan).</p>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Masa Aktif (Saat Ini)</p>
                    <div className="flex flex-col gap-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Mulai: {selectedUser.activeFrom ? new Date(selectedUser.activeFrom).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                       <p className="text-sm font-black text-white">Sampai: {selectedUser.expiryDate ? new Date(selectedUser.expiryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Lifetime'}</p>
                    </div>
                    {selectedUser.expiryDate && (
                      <p className="text-[9px] font-bold text-blue-400 mt-2 uppercase">
                        {Math.ceil((new Date(selectedUser.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Hari Tersisa
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Plan</label>
                    <select 
                      value={userEditDraft.planId} 
                      onChange={e => setUserEditDraft({ ...userEditDraft, planId: e.target.value })} 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none cursor-pointer hover:bg-slate-100"
                    >
                      <option value="" disabled>Pilih Produk</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Set Duration</label>
                    <select 
                      value={userEditDraft.duration} 
                      onChange={e => setUserEditDraft({ ...userEditDraft, duration: parseInt(e.target.value) })} 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none cursor-pointer hover:bg-slate-100"
                    >
                      <option value="30">1 Bulan</option>
                      <option value="90">3 Bulan</option>
                      <option value="365">1 Tahun</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                    <select 
                      value={userEditDraft.status} 
                      onChange={e => setUserEditDraft({ ...userEditDraft, status: e.target.value as AccountStatus })} 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none cursor-pointer hover:bg-slate-100"
                    >
                      {Object.values(AccountStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={handleSaveProfileDraft}
                      className="w-full py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                    >
                      💾 Simpan Seluruh Perubahan
                    </button>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePurgeUser(selectedUser.uid!)} 
                        className="flex-1 py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black text-[9px] uppercase tracking-widest rounded-2xl transition-all"
                      >
                        🗑️ Recycle Bin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                <span className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <p className="font-black uppercase text-[10px] tracking-widest">Select Citizen to Manage</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT CATALOG MODULE */}
      {initialMode === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {products.map(prod => (
            <div key={prod.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full group hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">{prod.name}</h4>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">{prod.tier} Kategori</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => { setEditingProduct(prod); setIsProductModalOpen(true); }} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">✎</button>
                   <button onClick={() => deleteProduct(prod.id)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-600 hover:text-white transition-colors">✕</button>
                </div>
              </div>
              
              <div className="mb-8">
                <span className="text-3xl font-black text-slate-900">Rp {prod.price.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 ml-1">/ nett</span>
              </div>

              <div className="space-y-4 mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Module Access</p>
                 <div className="flex flex-wrap gap-2">
                    {prod.allowedModules.map(m => (
                      <span key={m} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase">{m}</span>
                    ))}
                 </div>
              </div>

              <div className="space-y-3 flex-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Hard Limits</p>
                 <div className="grid grid-cols-2 gap-4">
                    <LimitLabel label="Logs" val={prod.limits.dailyLogs} />
                    <LimitLabel label="Skills" val={prod.limits.skills} />
                    <LimitLabel label="Projects" val={prod.limits.projects} />
                    <LimitLabel label="CV Exp" val={prod.limits.cvExports} />
                 </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-50">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Enabled Durations (Variants)</p>
                 <div className="flex flex-wrap gap-2">
                    {prod.enabledDurations.map(d => (
                      <span key={d} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase">
                        {d === 30 ? '1 Mo' : d === 90 ? '3 Mo' : d === 365 ? '1 Yr' : `${d} Days`}
                      </span>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI CONFIG MODULE */}
      {initialMode === 'ai' && (
        <div className="max-w-4xl animate-in slide-in-from-bottom-4">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 1-10 10 10 10 0 0 1 10-10z"></path><path d="M12 8V4H8"></path><rect x="8" y="8" width="8" height="8" rx="2"></rect><path d="M16 4h4v4"></path><path d="M20 16v4h-4"></path><path d="M8 20H4v-4"></path></svg>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Architecture Settings</h3>
                    <p className="text-slate-400 font-medium">Configure OpenRouter gateway for global AI intelligence.</p>
                 </div>
              </div>

              {/* ACTIVE CONFIGURATION STATUS BAR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 animate-in fade-in duration-1000">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Active Model</p>
                   <p className="text-xs font-black text-blue-600 truncate">{aiConfig.modelName || 'DEFAULT_GEMINI'}</p>
                </div>
                <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-200 py-3 md:py-0 md:px-6">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Key Integrity</p>
                   <p className="text-xs font-black text-emerald-600">
                     {aiConfig.openRouterKey ? `OR_KEY: ••••${aiConfig.openRouterKey.slice(-4)}` : 'KEY_MISSING (FALLBACK)'}
                   </p>
                </div>
                <div className="space-y-1 md:pl-2">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Token Capacity</p>
                   <p className="text-xs font-black text-slate-700">{aiConfig.maxTokens?.toLocaleString()} Max Tokens</p>
                </div>
              </div>

              <form onSubmit={handleSaveAiConfig} className="space-y-8">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">OpenRouter API Key</label>
                       <input 
                        type="password" 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-4 focus:ring-blue-500/5 transition-all"
                        placeholder="sk-or-v1-..."
                        value={aiConfig.openRouterKey}
                        onChange={e => setAiConfigState({...aiConfig, openRouterKey: e.target.value})}
                       />
                       <p className="text-[9px] text-slate-400 italic ml-1">Kunci ini digunakan untuk mengakses berbagai model LLM melalui OpenRouter.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1.5 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Model Name</label>
                          <div className="relative">
                            <input 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs focus:ring-4 focus:ring-blue-500/5 transition-all"
                              placeholder={fetchingModels ? "Fetching models..." : "Search & Select Model..."}
                              value={isModelDropdownOpen ? modelSearchQuery : aiConfig.modelName}
                              onChange={e => {
                                setModelSearchQuery(e.target.value);
                                if (!isModelDropdownOpen) setIsModelDropdownOpen(true);
                              }}
                              onFocus={() => setIsModelDropdownOpen(true)}
                            />
                            {fetchingModels && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                          
                          {isModelDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1000] max-h-[300px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
                               {filteredModels.length > 0 ? (
                                 filteredModels.map(model => (
                                   <button
                                     key={model.id}
                                     type="button"
                                     className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors group"
                                     onClick={() => {
                                       // OpenRouter models provide context_length. We cap max response tokens at 4096 or the model's limit.
                                       const modelTokens = model.context_length ? Math.min(model.context_length, 4096) : 2000;
                                       setAiConfigState({...aiConfig, modelName: model.id, maxTokens: modelTokens});
                                       setIsModelDropdownOpen(false);
                                       setModelSearchQuery('');
                                     }}
                                   >
                                      <p className="font-black text-xs text-slate-800 group-hover:text-blue-600 transition-colors">{model.name || 'Model Unnamed'}</p>
                                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{model.id}</p>
                                   </button>
                                 ))
                               ) : (
                                 <div className="p-10 text-center text-slate-300 italic font-medium text-xs">
                                   No models found matching "{modelSearchQuery}"
                                 </div>
                               )}
                            </div>
                          )}
                          {isModelDropdownOpen && (
                            <div className="fixed inset-0 z-[999]" onClick={() => setIsModelDropdownOpen(false)}></div>
                          )}
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Max Response Tokens (Auto)</label>
                          <input 
                            type="number"
                            readOnly
                            className="w-full px-6 py-4 rounded-2xl bg-slate-100 border border-slate-200 outline-none font-bold text-xs text-slate-500 cursor-not-allowed"
                            value={aiConfig.maxTokens}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Architecture Info</h4>
                    <ul className="space-y-2 text-[11px] font-medium opacity-70 leading-relaxed">
                       <li>• JejakKarir uses OpenRouter as a universal LLM bridge.</li>
                       <li>• Fallback: If Key is empty, system uses default Gemini SDK (process.env.API_KEY).</li>
                       <li>• Token Input: Max response tokens are now managed automatically based on model specifications to prevent errors.</li>
                    </ul>
                 </div>

                 <div className="flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSavingAi}
                      className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
                    >
                      {isSavingAi ? 'Saving...' : 'Deploy Configuration'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* SYSTEM PULSE MODULE */}
      {initialMode === 'health' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {/* AI TOKEN VITALITY SECTION */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">🤖</div>
                      <div>
                        <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">AI Token Vitality</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OpenRouter Account Health</p>
                      </div>
                   </div>
                   {fetchingUsage && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
                </div>

                {keyUsage ? (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Used (USD)</p>
                           <p className="text-xl font-black text-indigo-600">${keyUsage.usage?.toFixed(4)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Limit (USD)</p>
                           <p className="text-xl font-black text-slate-700">
                              {keyUsage.limit === null ? `∞ (Post-pay)` : `$${keyUsage.limit?.toFixed(2)}`}
                           </p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                           <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">System Request Cap</p>
                           <p className="text-xl font-black text-indigo-800">{aiConfig.maxTokens} <span className="text-[10px] opacity-40">Tokens</span></p>
                           <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">* Limit per generation</p>
                        </div>
                        <div className="p-4 bg-slate-900 rounded-2xl text-white">
                           <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Used In System</p>
                           <p className="text-xl font-black text-white">{(adminStats.totalTokensConsumed / 1000).toFixed(1)}k <span className="text-[10px] opacity-40">Tokens</span></p>
                           <p className="text-[8px] text-indigo-400 mt-1 uppercase font-bold">* All user consumption</p>
                        </div>
                     </div>

                     {keyUsage.limit !== null && (
                       <div className="space-y-6 pt-4 border-t border-slate-100">
                          <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usage Progress</p>
                                <p className="text-[11px] font-black text-indigo-600">
                                  {Math.round((keyUsage.usage / keyUsage.limit) * 100)}%
                                </p>
                             </div>
                             <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                  className={`h-full transition-all duration-1000 ${ (keyUsage.usage / keyUsage.limit) > 0.9 ? 'bg-rose-500' : 'bg-indigo-500' }`}
                                  style={{ width: `${Math.min((keyUsage.usage / keyUsage.limit) * 100, 100)}%` }}
                                ></div>
                             </div>
                          </div>
                       </div>
                     )}

                     <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                           <div>
                              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Model Platform</p>
                              <p className="text-[11px] font-black text-slate-700 uppercase mt-0.5 truncate max-w-[200px]">{aiConfig.modelName}</p>
                           </div>
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${aiConfig.modelName.includes(':free') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                             {aiConfig.modelName.includes(':free') ? 'Eco (Free)' : 'Premium'}
                           </span>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Connect OpenRouter Key to view health</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 h-full">
                <AdminStatCard title="DB Latency" value="124ms" sub="Optimal Performance" icon="⚡" color="emerald" />
                <AdminStatCard title="API Success" value="99.8%" sub="Uptime Verified" icon="🟢" color="blue" />
                <AdminStatCard title="Auth Tokens" value="1.2k" sub="Active Sessions" icon="🔑" color="amber" />
                <AdminStatCard title="Total Flux" value={adminStats.totalTokensConsumed.toLocaleString()} sub="System Throughput" icon="💎" color="indigo" />
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[3rem] text-emerald-400 font-mono text-xs overflow-hidden shadow-2xl border border-white/5">
              <p className="text-white font-black mb-4 uppercase tracking-[0.2em] font-sans">System Real-time Logs</p>
              <div className="space-y-1 opacity-80">
                 <p>[{new Date().toISOString()}] NODE_BOOT: Citizens Nexus Protocol Established.</p>
                 <p>[{new Date().toISOString()}] DB_SYNC: Global Firestore handshake successful.</p>
                 <p>[{new Date().toISOString()}] AI_GATEWAY: OpenRouter heartbeat detected.</p>
                 {keyUsage && <p>[{new Date().toISOString()}] OR_MONITOR: Usage ${keyUsage.usage?.toFixed(6)} / Limit ${keyUsage.limit || 'UNLIMITED'}</p>}
                 <p className="animate-pulse">_</p>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: PROVISION USER */}
      {isUserAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Provision Citizen</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manual account override protocol</p>
                 </div>
                 <button onClick={() => setIsUserAddModalOpen(false)} className="text-slate-300 hover:text-slate-900 font-black text-xl">✕</button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input name="name" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                       <input name="email" type="email" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                    <select name="role" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs">
                       <option value={UserRole.USER}>Standard User</option>
                       <option value={UserRole.SUPERADMIN}>Superadmin Access</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Plan</label>
                       <select name="plan" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs">
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration Paket</label>
                       <select name="duration" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs cursor-pointer">
                          <option value="30">1 Bulan (30 Hari)</option>
                          <option value="90">3 Bulan (90 Hari)</option>
                          <option value="365">1 Tahun (365 Hari)</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-rose-600 text-white font-black rounded-[1.5rem] uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-700 transition-all mt-4">Initiate Account Provision</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: DEFINE PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingProduct ? 'Redefine Product' : 'Architect New Product'}</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configure offering parameters & limits</p>
                 </div>
                 <button onClick={() => setIsProductModalOpen(false)} className="text-slate-300 hover:text-slate-900 font-black text-xl">✕</button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Name</label>
                       <input name="name" defaultValue={editingProduct?.name} required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier Category</label>
                       <select name="tier" defaultValue={editingProduct?.tier || SubscriptionPlan.PRO} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs">
                          {Object.values(SubscriptionPlan).map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (Base IDR)</label>
                       <input name="price" type="number" defaultValue={editingProduct?.price || 0} required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Variants (Days - Multiple)</label>
                       <div className="grid grid-cols-3 gap-2">
                          {[30, 90, 365, 3650].map(d => (
                            <label key={d} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                               <input type="checkbox" name="durations" value={d} defaultChecked={editingProduct?.enabledDurations.includes(d)} className="w-4 h-4 rounded" />
                               <span className="text-[9px] font-black uppercase text-slate-500">{d === 3650 ? 'Life' : d}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Module Access Protocol</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {['dashboard', 'daily', 'skills', 'cv_generator', 'online_cv', 'projects', 'networking', 'reports', 'career'].map(m => (
                         <label key={m} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                            <input type="checkbox" name="modules" value={m} defaultChecked={editingProduct?.allowedModules.includes(m)} className="w-4 h-4 rounded" />
                            <span className="text-[8px] font-black uppercase text-slate-500 truncate">{m}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4 border-t border-slate-50 pt-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Hard Limits</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Daily Logs Limit</label>
                          <div className="flex gap-2">
                             <input name="limit_daily" type="number" defaultValue={typeof editingProduct?.limits.dailyLogs === 'number' ? editingProduct.limits.dailyLogs : 10} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-xs font-bold" />
                             <label className="flex items-center gap-1.5 px-3 bg-slate-900 text-white rounded-xl cursor-pointer">
                               <input type="checkbox" name="unlimited_daily" defaultChecked={editingProduct?.limits.dailyLogs === 'unlimited'} className="w-3 h-3" />
                               <span className="text-[8px] font-black uppercase">Inf</span>
                             </label>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Skills Matrix Limit</label>
                          <div className="flex gap-2">
                             <input name="limit_skills" type="number" defaultValue={typeof editingProduct?.limits.skills === 'number' ? editingProduct.limits.skills : 5} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-xs font-bold" />
                             <label className="flex items-center gap-1.5 px-3 bg-slate-900 text-white rounded-xl cursor-pointer">
                               <input type="checkbox" name="unlimited_skills" defaultChecked={editingProduct?.limits.skills === 'unlimited'} className="w-3 h-3" />
                               <span className="text-[8px] font-black uppercase">Inf</span>
                             </label>
                          </div>
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Publish Product Architecture</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// UI Components
const LimitLabel = ({ label, val }: any) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-black text-slate-800 uppercase">{val === 'unlimited' ? '∞' : val}</span>
  </div>
);

const AdminStatCard = ({ title, value, sub, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };
  return (
    <div className={`bg-white p-8 rounded-[2.5rem] border flex items-center gap-6 shadow-sm hover:shadow-xl transition-all ${colorMap[color]}`}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner bg-white/50 text-xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-[9px] font-bold mt-1 uppercase italic">{sub}</p>
      </div>
    </div>
  );
};

export default AdminPanel;
