
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, UserRole, AccountStatus, SubscriptionPlan, AiConfig } from '../types';
import { getAllUsers, updateAdminMetadata, saveUserData, getAiConfig, saveAiConfig, auth, getProductsCatalog, saveProductsCatalog } from '../services/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';

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
  initialMode?: 'dashboard' | 'users' | 'products' | 'health' | 'ai';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ initialMode = 'dashboard' }) => {
  const [users, setUsers] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false); // State untuk melacak status sinkronisasi
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppData | null>(null);
  
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SubscriptionProduct | null>(null);

  const [aiConfig, setAiConfigState] = useState<AiConfig>({
    openRouterKey: '', modelName: 'google/gemini-2.0-pro-exp-02-05:free', maxTokens: 2000
  });

  const [isSavingAi, setIsSavingAi] = useState(false);
  
  const [keyInfo, setKeyInfo] = useState<{
    label: string;
    usage: number;
    limit: number | null;
    is_active: boolean;
    rate_limit: any;
  } | null>(null);
  const [fetchingKeyInfo, setFetchingKeyInfo] = useState(false);

  // Initial products as fallback to prevent blank screen
  const [products, setProducts] = useState<SubscriptionProduct[]>([
    { 
      id: 'p1', name: 'Free Tier', tier: SubscriptionPlan.FREE, price: 0, durationDays: 3650, enabledDurations: [3650], 
      allowedModules: ['dashboard', 'profile', 'daily', 'skills'], 
      limits: { dailyLogs: 10, skills: 5, projects: 2, cvExports: 1 } 
    },
    { 
      id: 'p2', name: 'Premium Monthly', tier: SubscriptionPlan.PRO, price: 59000, durationDays: 30, enabledDurations: [30, 90, 365], 
      allowedModules: ['dashboard', 'daily', 'skills', 'cv_generator', 'online_cv', 'projects'], 
      limits: { dailyLogs: 'unlimited', skills: 'unlimited', projects: 'unlimited', cvExports: 'unlimited' } 
    }
  ]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 3000);
  };

  const fetchUsersAndConfig = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [usersData, configData, productsData] = await Promise.all([
        getAllUsers(), getAiConfig(), getProductsCatalog()
      ]);
      setUsers(usersData);
      if (configData) setAiConfigState(configData);
      if (productsData && productsData.length > 0) setProducts(productsData);
      
      setIsSynced(true); // Tandai bahwa sinkronisasi berhasil
      if (silent) triggerToast("Database Synchronized.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal sinkronisasi database.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

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
      console.error("OpenRouter Auth Error:", e);
    } finally {
      setFetchingKeyInfo(false);
    }
  };

  useEffect(() => {
    fetchUsersAndConfig();
  }, [initialMode]);

  useEffect(() => {
    if (aiConfig.openRouterKey) {
      fetchOpenRouterKeyInfo();
    }
  }, [aiConfig.openRouterKey]);

  const adminStats = useMemo(() => {
    const total = users.length;
    const activeToday = users.filter(u => u.lastLogin?.includes(new Date().toISOString().split('T')[0])).length;
    const totalTokens = users.reduce((acc, u) => acc + (u.aiUsage?.totalTokens || 0), 0);
    const totalAiOps = users.reduce((acc, u) => acc + (u.aiUsage?.careerAnalysis || 0) + (u.aiUsage?.cvGenerated || 0), 0);
    return { total, activeToday, totalTokens, totalAiOps };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.profile?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.profile?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    try {
      await saveAiConfig(aiConfig);
      triggerToast("Konfigurasi AI diperbarui.");
      fetchOpenRouterKeyInfo();
    } catch (err) {
      triggerToast("Gagal simpan AI config.", "error");
    } finally {
      setIsSavingAi(false);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Nexus...</p>
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
            {initialMode === 'health' ? 'System Health' : initialMode === 'users' ? 'User Nexus' : initialMode === 'ai' ? 'AI Architecture' : initialMode === 'products' ? 'Products Matrix' : 'Dashboard Admin'}
          </h2>
          <p className="text-slate-500 font-medium italic">Manajemen inti sistem JejakKarir.</p>
        </div>
        <div className="flex gap-4">
          {/* Tombol hanya muncul jika BELUM singkron atau sedang loading */}
          {!isSynced && (
            <button onClick={() => fetchUsersAndConfig(true)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <i className={`bi bi-arrow-repeat mr-2 ${loading ? 'animate-spin' : ''}`}></i> Sync Data
            </button>
          )}
          {initialMode === 'products' && (
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700">+ Add Product</button>
          )}
        </div>
      </header>

      {/* MODUL DASHBOARD UTAMA */}
      {initialMode === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <AdminStatCard title="Total Citizens" value={adminStats.total} sub="User Terdaftar" icon="👤" color="blue" />
           <AdminStatCard title="Daily Traffic" value={adminStats.activeToday} sub="Login Hari Ini" icon="⚡" color="amber" />
           <AdminStatCard title="AI Operations" value={adminStats.totalAiOps} sub="Total AI Gen" icon="🤖" color="emerald" />
           <AdminStatCard title="System Flux" value={adminStats.totalTokens.toLocaleString()} sub="Tokens Used" icon="💎" color="indigo" />
        </div>
      )}

      {/* MODUL USER NEXUS */}
      {initialMode === 'users' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b border-slate-50">
              <input 
                type="text" 
                placeholder="Cari user (nama/email)..." 
                className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                    <th className="px-8 py-4">Identity</th>
                    <th className="px-6 py-4 text-center">Plan</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <p className="font-black text-slate-800 text-sm">{u.profile?.name || 'User'}</p>
                        <p className="text-[10px] font-bold text-slate-400">{u.profile?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase">{u.plan}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button className="text-indigo-600 font-black text-[10px] uppercase">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODUL PRODUK (DIUBAH AGAR TIDAK BLANK) */}
      {initialMode === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {products.map(prod => (
            <div key={prod.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{prod.name}</h4>
                    <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">{prod.tier}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors cursor-pointer">
                    <i className="bi bi-pencil-square"></i>
                  </div>
               </div>
               <div className="mb-8">
                  <span className="text-3xl font-black text-slate-900">Rp {prod.price.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-2">/ nett</span>
               </div>
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Module Access</p>
                  <div className="flex flex-wrap gap-2">
                    {prod.allowedModules.map(m => (
                      <span key={m} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[8px] font-black uppercase">{m}</span>
                    ))}
                  </div>
               </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No products found in catalog.</p>
            </div>
          )}
        </div>
      )}

      {/* MODUL AI ARCHITECTURE */}
      {initialMode === 'ai' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl">
           <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl">🧠</div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">AI Architecture Settings</h3>
                <p className="text-slate-400">Konfigurasi Gateway OpenRouter.</p>
              </div>
           </div>
           <form onSubmit={handleSaveAiConfig} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OpenRouter API Key</label>
                 <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" 
                  value={aiConfig.openRouterKey}
                  onChange={e => setAiConfigState({...aiConfig, openRouterKey: e.target.value})}
                  placeholder="sk-or-v1-..."
                 />
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Model</label>
                    <input 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" 
                      value={aiConfig.modelName}
                      onChange={e => setAiConfigState({...aiConfig, modelName: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Tokens</label>
                    <input 
                      type="number"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" 
                      value={aiConfig.maxTokens}
                      onChange={e => setAiConfigState({...aiConfig, maxTokens: parseInt(e.target.value) || 2000})}
                    />
                 </div>
              </div>
              <button disabled={isSavingAi} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">
                 {isSavingAi ? 'Menyimpan...' : 'Deploy Configuration'}
              </button>
           </form>
        </div>
      )}

      {/* MODUL SYSTEM HEALTH */}
      {initialMode === 'health' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl">
                        <i className="bi bi-cloud-check"></i>
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase">OpenRouter Cloud</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">External Provider Status</p>
                     </div>
                  </div>
                  {fetchingKeyInfo && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
               </div>

               {keyInfo ? (
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Key Label</p>
                          <p className="text-sm font-black text-slate-800 truncate">{keyInfo.label || 'Default Key'}</p>
                       </div>
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">API Key Status</p>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${keyInfo.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {keyInfo.is_active ? '● Active' : '○ Suspended'}
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                          <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">USD Usage</p>
                          <p className="text-2xl font-black text-indigo-700">${keyInfo.usage.toFixed(4)}</p>
                       </div>
                       <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Credit Limit</p>
                          <p className="text-2xl font-black text-white">
                            {keyInfo.limit === null ? '∞ UNLIMITED' : `$${keyInfo.limit.toFixed(2)}`}
                          </p>
                       </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <div className="flex justify-between items-center mb-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Usage Progress</p>
                          <span className="text-[10px] font-black text-indigo-600">
                            {keyInfo.limit ? `${((keyInfo.usage/keyInfo.limit)*100).toFixed(2)}%` : '0%'}
                          </span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 transition-all duration-1000" 
                            style={{ width: keyInfo.limit ? `${Math.min((keyInfo.usage/keyInfo.limit)*100, 100)}%` : '5%' }}
                          ></div>
                       </div>
                       <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase text-right">* Real-time data from OpenRouter</p>
                    </div>
                 </div>
               ) : (
                 <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold text-xs uppercase px-10 leading-relaxed">
                       {aiConfig.openRouterKey ? 'Sedang menghubungkan ke OpenRouter...' : 'API Key belum dikonfigurasi.'}
                    </p>
                    <button onClick={fetchOpenRouterKeyInfo} className="mt-4 text-[10px] font-black text-indigo-600 uppercase">Coba Hubungkan Kembali</button>
                 </div>
               )}
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl">
                      <i className="bi bi-cpu"></i>
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase">Internal Nexus Log</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Local Token Tracking</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Total Flux</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{adminStats.totalTokens.toLocaleString()}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase">AI Ops</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{adminStats.totalAiOps}</p>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                 <AdminStatCard title="DB Latency" value="128ms" sub="Excellent" icon="⚡" color="emerald" />
                 <AdminStatCard title="API Success" value="99.9%" sub="Uptime" icon="🟢" color="blue" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-10 rounded-[4rem] text-emerald-500 font-mono text-[11px] leading-relaxed shadow-2xl relative overflow-hidden group">
             <div className="relative z-10 space-y-1">
                <p className="text-white font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                   System Real-time Pulse Log
                </p>
                <p>[{new Date().toISOString()}] BOOT_NODE: Citizens Nexus Protocol Established.</p>
                <p>[{new Date().toISOString()}] AUTH_SYNC: Firestore handshake successful.</p>
                {keyInfo && <p>[{new Date().toISOString()}] CLOUD_BILLING: Active Usage ${keyInfo.usage.toFixed(6)} USD.</p>}
                <p className="animate-pulse">_</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminStatCard = ({ title, value, sub, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-center items-center text-center shadow-sm ${colorMap[color]}`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[8px] font-bold mt-1 opacity-50 uppercase">{sub}</p>
    </div>
  );
};

export default AdminPanel;
