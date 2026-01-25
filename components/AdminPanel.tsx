
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig } from '../types';
import { getAllUsers, updateAdminMetadata, saveUserData, getAiConfig, saveAiConfig } from '../services/firebase';
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
    duration: 30 // Default 1 Bulan
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
      // Cari produk berdasarkan tier yang tercatat di user, atau cari berdasarkan nama jika tidak ketemu
      const userProduct = products.find(p => p.name === selectedUser.plan) || products[0];
      setUserEditDraft({
        name: selectedUser.profile.name,
        email: selectedUser.profile.email,
        planId: userProduct.id,
        status: selectedUser.status,
        duration: 30 // Default reset ke 1 bulan saat mulai mengedit
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

    // Registration Data Aggregation
    const regMap: Record<string, { date: string, paid: number, free: number }> = {};
    const actMap: Record<string, { date: string, active: number }> = {};

    users.forEach(u => {
      const d = u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '?';
      if (!regMap[d]) regMap[d] = { date: d, paid: 0, free: 0 };
      // Check if user has a paid tier
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
      adminStats: { total, activeToday, totalAI },
      registrationChartData: Object.values(regMap).slice(-7),
      activityChartData: Object.values(actMap).slice(-7)
    };
  }, [users]);

  const fetchUsersAndConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, configData] = await Promise.all([
        getAllUsers(),
        getAiConfig()
      ]);
      setUsers(userData);
      if (configData) setAiConfigState(configData);
    } catch (err: any) {
      console.error("Fetch error details:", err);
      setError(err.message || "Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConfig();
  }, []);

  // Fetch OpenRouter Models
  useEffect(() => {
    if (initialMode === 'ai') {
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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.profile.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDeleted = showSoftDeleted ? u.isDeleted : !u.isDeleted;
      return matchesSearch && matchesDeleted;
    });
  }, [users, searchQuery, showSoftDeleted]);

  const filteredModels = useMemo(() => {
    return availableModels.filter(m => 
      m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) || 
      m.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
    );
  }, [availableModels, modelSearchQuery]);

  // Handle User Edit & Create
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
      plan: product.tier, // Gunakan tier dari produk
      status: AccountStatus.ACTIVE,
      activeFrom: activeFrom.toISOString(),
      expiryDate: expiryDate.toISOString(),
      planPermissions: product.allowedModules,
      planLimits: product.limits,
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      dailyReports: [], skills: [], trainings: [], certifications: [], careerPaths: [], achievements: [], contacts: [], monthlyReviews: [], jobApplications: [], personalProjects: [], affirmations: [], workCategories: [], onlineCV: { username: '', themeId: 't-bento', isActive: false, visibleSections: [], selectedItemIds: {}, socialLinks: {} }
    };

    try {
      await saveUserData(newUser.uid!, newUser as AppData);
      triggerToast("User provisioned successfully.");
      fetchUsersAndConfig();
      setIsUserAddModalOpen(false);
    } catch (err) {
      triggerToast("Provisioning process failed.", "error");
    }
  };

  const handleUpdateUserDetails = async (uid: string, fields: any) => {
    try {
      if (!uid) return;
      await updateAdminMetadata(uid, fields);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...fields } : u));
      if (selectedUser?.uid === uid) setSelectedUser({ ...selectedUser, ...fields });
    } catch (err) {
      console.error("User detail update error:", err);
      triggerToast("Failed to update record.", "error");
    }
  };

  const handleSaveProfileDraft = async () => {
    if (!selectedUser || !selectedUser.uid) return;
    
    const product = products.find(p => p.id === userEditDraft.planId);
    if (!product) return;

    // Hitung ulang masa aktif berdasarkan durasi yang dipilih saat ini
    const activeFrom = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(activeFrom.getDate() + userEditDraft.duration);

    // Persiapkan data update menyeluruh
    let updateData: Partial<AppData> = {
      profile: {
        ...selectedUser.profile,
        name: userEditDraft.name,
        email: userEditDraft.email
      },
      status: userEditDraft.status,
      plan: product.tier, // Gunakan tier dari produk template
      activeFrom: activeFrom.toISOString(),
      expiryDate: expiryDate.toISOString(),
      planPermissions: product.allowedModules,
      planLimits: product.limits
    };
    
    await handleUpdateUserDetails(selectedUser.uid, updateData);
    triggerToast("Identity and permissions updated.");
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
        } catch (err) {
          triggerToast("Purge protocol failed.", "error");
        }
        setAdminConfirm(null);
      }
    });
  };

  // Handle Product CRUD
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const modules = Array.from(formData.getAll('modules')) as string[];
    const durations = Array.from(formData.getAll('durations')).map(Number); // Ambil seluruh durasi yang dicentang
    
    const prodData: SubscriptionProduct = {
      id: editingProduct?.id || 'prod-' + Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      tier: (formData.get('tier') as SubscriptionPlan) || editingProduct?.tier || SubscriptionPlan.PRO,
      price: parseInt(formData.get('price') as string),
      enabledDurations: durations,
      durationDays: durations[0] || 30, // Gunakan pilihan pertama sebagai default basis
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

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === prodData.id ? prodData : p));
      triggerToast("Product architecture updated.");
    } else {
      setProducts(prev => [...prev, prodData]);
      triggerToast("New product published.");
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    setAdminConfirm({
      title: "Decommission Product?",
      desc: "Removing this offering will prevent future provisioning. Active users with this plan will remain unaffected until expiry.",
      onConfirm: () => {
        setProducts(prev => prev.filter(p => p.id !== id));
        triggerToast("Product decommissioned.");
        setAdminConfirm(null);
      }
    });
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    try {
      await saveAiConfig(aiConfig);
      triggerToast("AI Architecture redeployed successfully.");
    } catch (err) {
      triggerToast("Deployment failed.", "error");
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* SUCCESS TOAST OVERLAY */}
      {adminToast && (
        <div className="fixed top-10 right-10 z-[1000] animate-in slide-in-from-right-4 duration-500">
           <div className={`px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${adminToast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
             <span className="text-xl">
               {adminToast.type === 'success' ? (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
               ) : (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
               )}
             </span>
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

      {/* 1. RESTORED DASHBOARD ROW - ONLY ON DASHBOARD MODE */}
      {initialMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminStatCard title="Global Citizens" value={adminStats.total} sub="Total Terdaftar" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} color="blue" />
            <AdminStatCard title="Daily Traffic" value={adminStats.activeToday} sub="Login Hari Ini" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>} color="amber" />
            <AdminStatCard title="AI Operations" value={adminStats.totalAI} sub="Total AI Generation" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="8" y="8" width="8" height="8" rx="2"></rect><path d="M16 4h4v4"></path><path d="M20 16v4h-4"></path><path d="M8 20H4v-4"></path></svg>} color="emerald" />
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
                    {filteredUsers.map(user => (
                      <tr key={user.uid} className={`group hover:bg-slate-50/50 transition-colors ${selectedUser?.uid === user.uid ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                              {user.profile.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm">{user.profile.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">{user.plan}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => setSelectedUser(user)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Manage</button>
                        </td>
                      </tr>
                    ))}
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
                  {/* Editable Fields with Draft State */}
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
                                       setAiConfigState({...aiConfig, modelName: model.id});
                                       setIsModelDropdownOpen(false);
                                       setModelSearchQuery('');
                                     }}
                                   >
                                      <p className="font-black text-xs text-slate-800 group-hover:text-blue-600 transition-colors">{model.name}</p>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Max Response Tokens</label>
                          <input 
                            type="number"
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs"
                            value={aiConfig.maxTokens}
                            onChange={e => setAiConfigState({...aiConfig, maxTokens: parseInt(e.target.value) || 0})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Architecture Info</h4>
                    <ul className="space-y-2 text-[11px] font-medium opacity-70 leading-relaxed">
                       <li>• JejakKarir uses OpenRouter as a universal LLM bridge.</li>
                       <li>• Fallback: If Key is empty, system uses default Gemini SDK (process.env.API_KEY).</li>
                       <li>• Token Input: Setting max_tokens ensures predictable cost and speed.</li>
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

      {/* HEALTH MODULE */}
      {initialMode === 'health' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in slide-in-from-bottom-4">
           <div className="xl:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase flex items-center gap-3">
                <span className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </span>
                Error Matrix
              </h3>
              <div className="space-y-4">
                <HealthLog type="AI_FAILURE" msg="Gemini API Quota Exceeded" user="User_442" time="10m ago" />
                <HealthLog type="DB_ERROR" msg="Firestore Permission Denied" user="admin@jejakkarir.com" time="1h ago" />
                <HealthLog type="AUTH_DENIED" msg="Unauthorized Login Attempt" user="IP: 192.168.1.1" time="3h ago" />
              </div>
           </div>
           <div className="xl:col-span-4 space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
                 <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-10">Uptime Reliability</h4>
                 <div className="space-y-10">
                    <HealthMetric label="Gemini AI Gateway" val={98.2} color="emerald" />
                    <HealthMetric label="Cloud Firestore" val={100} color="emerald" />
                    <HealthMetric label="Media Storage" val={94.5} color="amber" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PRODUCT MODAL WITH LIMITS, MODULES & CHECKLIST DURATIONS */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingProduct ? 'Update Product Architecture' : 'Draft New Offering'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <input type="hidden" name="tier" value={editingProduct?.tier || SubscriptionPlan.PRO} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input name="name" required defaultValue={editingProduct?.name} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs" placeholder="e.g. Master Elite" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Price (Monthly Ref)</label>
                  <input name="price" type="number" required defaultValue={editingProduct?.price} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activate Durations (Checklist)</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    {[30, 90, 365].map(d => (
                      <label key={d} className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-lg hover:bg-white transition-colors">
                        <input 
                          type="checkbox" 
                          name="durations" 
                          value={d} 
                          defaultChecked={editingProduct?.enabledDurations?.includes(d)} 
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-indigo-600 transition-colors">
                          {d === 30 ? '1 Bulan' : d === 90 ? '3 Bulan' : '1 Tahun'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Modules</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['dashboard', 'profile', 'daily', 'reports', 'skills', 'loker', 'projects', 'career', 'achievements', 'networking', 'reviews', 'cv_generator', 'online_cv'].map(mod => (
                      <label key={mod} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all">
                        <input type="checkbox" name="modules" value={mod} defaultChecked={editingProduct?.allowedModules.includes(mod)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{mod.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity Limits</p>
                  <div className="space-y-4">
                    <LimitInput name="daily" label="Daily Logs" initial={editingProduct?.limits.dailyLogs} />
                    <LimitInput name="skills" label="Skill Matrix" initial={editingProduct?.limits.skills} />
                    <LimitInput name="projects" label="Personal Projects" initial={editingProduct?.limits.projects} />
                    <LimitInput name="cv" label="CV Generation" initial={editingProduct?.limits.cvExports} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-5 font-black uppercase text-[10px] text-slate-400">Abort Draft</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-lg shadow-indigo-100">Publish Offering</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER PROVISIONING MODAL */}
      {isUserAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in">
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Provision Citizen</h3>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input name="name" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input name="email" required type="email" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select name="role" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs">
                    <option value={UserRole.USER}>Citizen</option>
                    <option value={UserRole.SUPERADMIN}>Overlord</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subscription Plan</label>
                  <select name="plan" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs">
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration Choice</label>
                <select name="duration" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs">
                  <option value="30">1 Bulan</option>
                  <option value="90">3 Bulan</option>
                  <option value="365">1 Tahun</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsUserAddModalOpen(false)} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-lg shadow-rose-100">Execute Provision</button>
              </div>
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

const LimitInput = ({ name, label, initial }: any) => {
  const [unlimited, setUnlimited] = useState(initial === 'unlimited');
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{label}</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name={`unlimited_${name}`} checked={unlimited} onChange={e => setUnlimited(e.target.checked)} className="w-3 h-3 rounded" />
          <span className="text-[9px] font-bold text-slate-400 uppercase">Unlimited</span>
        </label>
      </div>
      {!unlimited && (
        <input name={`limit_${name}`} type="number" defaultValue={initial === 'unlimited' ? 10 : initial} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs" />
      )}
    </div>
  );
};

const HealthLog = ({ type, msg, user, time }: any) => (
  <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex justify-between items-center group hover:bg-rose-50 transition-colors">
    <div className="flex items-center gap-4">
      <div className="px-3 py-1 bg-rose-100 text-rose-600 text-[8px] font-black rounded uppercase tracking-widest">{type}</div>
      <div>
        <p className="text-xs font-black text-slate-800">{msg}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{user} • {time}</p>
      </div>
    </div>
    <button className="text-[10px] font-black uppercase text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Resolve →</button>
  </div>
);

const HealthMetric = ({ label, val, color }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-[10px] font-black uppercase text-emerald-400">{val}%</p>
    </div>
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${val}%` }}></div>
    </div>
  </div>
);

const AdminStatCard = ({ title, value, sub, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className={`bg-white p-8 rounded-[2.5rem] border flex items-center gap-6 shadow-sm hover:shadow-xl transition-all ${colorMap[color]}`}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner bg-white/50">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-[9px] font-bold mt-1 uppercase italic">{sub}</p>
      </div>
    </div>
  );
};

export default AdminPanel;
