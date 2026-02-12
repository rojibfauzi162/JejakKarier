
import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, isAdmin }) => {
  const [dailyDropdownOpen, setDailyDropdownOpen] = useState(activeTab === 'daily' || activeTab === 'reports' || activeTab === 'ai_insights' || activeTab === 'work_reflection');
  const [cvDropdownOpen, setCvDropdownOpen] = useState(activeTab === 'cv_generator' || activeTab === 'online_cv');
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State baru untuk modal logout mobile
  
  // State untuk kontrol kategori utama - Default terbuka untuk Aktivitas & Pengembangan
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({
    aktivitas: true,
    pengembangan: true,
    karir: false,
    proyek: false
  });

  const toggleGroup = (key: string) => {
    setGroupsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuGroups = [
    {
      id: 'aktivitas',
      label: 'Aktivitas Harian',
      items: [
        { id: 'daily_root', label: 'Daily Work', icon: <i className="bi bi-pencil-square"></i>, hasSub: true, type: 'daily' },
        { id: 'todo_list', label: 'Langkah Pengembangan', icon: <i className="bi bi-check2-square"></i> },
        { id: 'calendar', label: 'Career Calendar', icon: <i className="bi bi-calendar3"></i> }, // NEW MENU
      ]
    },
    {
      id: 'pengembangan',
      label: 'Pengembangan Diri',
      items: [
        { id: 'skills', label: 'Skills & Learning', icon: <i className="bi bi-mortarboard"></i> },
        { id: 'career', label: 'Career Path', icon: <i className="bi bi-rocket-takeoff"></i> },
        { id: 'achievements', label: 'Achievements', icon: <i className="bi bi-trophy"></i> },
      ]
    },
    {
      id: 'karir',
      label: 'Lowongan & Karir',
      items: [
        { id: 'loker', label: 'Loker Tracker', icon: <i className="bi bi-briefcase"></i> },
        { id: 'cv_root', label: 'CV Generator', icon: <i className="bi bi-file-earmark-pdf"></i>, hasSub: true, type: 'cv' },
        { id: 'networking', label: 'Networking', icon: <i className="bi bi-people"></i> },
      ]
    },
    {
      id: 'proyek',
      label: 'Proyek & Review',
      items: [
        { id: 'projects', label: 'Personal Project', icon: <i className="bi bi-tools"></i> },
        { id: 'reviews', label: 'Monthly Review', icon: <i className="bi bi-calendar-check"></i> },
      ]
    }
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-slate-950 text-white flex flex-col hidden lg:flex z-50 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      {/* Header Branding */}
      <div className="p-8 pt-10">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-105 transition-transform duration-300">F</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">FokusKarir</h1>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Pro Tracker</span>
          </div>
        </div>
      </div>
      
      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 no-scrollbar pb-10 flex flex-col">
        {isAdmin && (
          <div className="space-y-1.5 animate-in slide-in-from-left duration-500">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-4 ml-3 opacity-80">Admin Hub</p>
            <SidebarItem id="admin_dashboard" active={activeTab === 'admin_dashboard'} onClick={() => setActiveTab('admin_dashboard')} icon={<i className="bi bi-speedometer2"></i>} label="Dashboard Admin" color="blue" />
            <SidebarItem id="admin_users" active={activeTab === 'admin_users'} onClick={() => setActiveTab('admin_users')} icon={<i className="bi bi-people"></i>} label="Kelola User" color="rose" />
            <SidebarItem id="admin_admins" active={activeTab === 'admin_admins'} onClick={() => setActiveTab('admin_admins')} icon={<i className="bi bi-shield-lock"></i>} label="Kelola Admin" color="rose" />
            <SidebarItem id="admin_transactions" active={activeTab === 'admin_transactions'} onClick={() => setActiveTab('admin_transactions')} icon={<i className="bi bi-currency-dollar"></i>} label="Kelola Transaksi" color="blue" />
            <SidebarItem id="admin_ai" active={activeTab === 'admin_ai'} onClick={() => setActiveTab('admin_ai')} icon={<i className="bi bi-cpu"></i>} label="AI Architecture" color="blue" />
            <SidebarItem id="admin_products" active={activeTab === 'admin_products'} onClick={() => setActiveTab('admin_products')} icon={<i className="bi bi-box-seam"></i>} label="Product Matrix" color="blue" />
            <SidebarItem id="admin_settings" active={activeTab === 'admin_settings'} onClick={() => setActiveTab('admin_settings')} icon={<i className="bi bi-gear-fill"></i>} label="Pengaturan Admin" color="blue" />
            <SidebarItem id="admin_health" active={activeTab === 'admin_health'} onClick={() => setActiveTab('admin_health')} icon={<i className="bi bi-activity"></i>} label="System Health" color="rose" />
          </div>
        )}

        {!isAdmin && (
          <>
            {/* Top Level Group - Dashboard & Profile */}
            <div className="space-y-1 mb-2">
              <SidebarStandaloneItem 
                id="tour-sidebar-dashboard"
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<i className="bi bi-grid-1x2"></i>} 
                label="Dashboard" 
              />
              <SidebarStandaloneItem 
                id="tour-sidebar-profile"
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
                icon={<i className="bi bi-person-circle"></i>} 
                label="Profil Saya" 
              />
            </div>

            {/* Menu Groups */}
            {menuGroups.map(group => (
              <div key={group.id} className="space-y-1.5">
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 mb-1 group"
                >
                  <p className="text-[11px] font-bold text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-wider">{group.label}</p>
                  <span className={`text-[8px] transition-transform duration-300 opacity-30 ${groupsOpen[group.id] ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {groupsOpen[group.id] && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {group.items.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <button
                          id={item.id === 'daily_root' ? 'tour-sidebar-parent-daily' : `tour-sidebar-${item.id}`}
                          onClick={() => {
                            if (item.hasSub) {
                              if (item.type === 'daily') setDailyDropdownOpen(!dailyDropdownOpen);
                              if (item.type === 'cv') setCvDropdownOpen(!cvDropdownOpen);
                            } else {
                              setActiveTab(item.id);
                            }
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                            activeTab === item.id || 
                            (item.type === 'daily' && (activeTab === 'daily' || activeTab === 'reports' || activeTab === 'ai_insights' || activeTab === 'work_reflection')) ||
                            (item.type === 'cv' && (activeTab === 'cv_generator' || activeTab === 'online_cv'))
                              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                              : 'text-slate-500 hover:bg-white/5 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="opacity-60 group-hover:opacity-100 transition-opacity text-sm">{item.icon}</span>
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                          </div>
                          {item.hasSub && (
                            <span className={`text-[10px] transition-transform duration-300 opacity-40 ${
                              (item.type === 'daily' && dailyDropdownOpen) || (item.type === 'cv' && cvDropdownOpen) ? 'rotate-180' : ''
                            }`}>▼</span>
                          )}
                        </button>
                        
                        {/* Nested Sub-Sub-Menus */}
                        {item.hasSub && item.type === 'daily' && dailyDropdownOpen && (
                          <div className="pl-6 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-300 border-l border-white/5 ml-4">
                            <SubMenuButton id="tour-sidebar-daily" active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} label="Tugas Harian" icon="bi bi-card-text" />
                            <SubMenuButton id="tour-sidebar-work_reflection" active={activeTab === 'work_reflection'} onClick={() => setActiveTab('work_reflection')} label="Refleksi kerja" icon="bi bi-chat-quote" />
                            <SubMenuButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Laporan pekerjaan" icon="bi bi-graph-up" />
                            <SubMenuButton active={activeTab === 'ai_insights'} onClick={() => setActiveTab('ai_insights')} label="AI Insight activity" icon="bi bi-cpu" />
                          </div>
                        )}

                        {item.hasSub && item.type === 'cv' && cvDropdownOpen && (
                          <div className="pl-6 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-300 border-l border-white/5 ml-4">
                            <SubMenuButton active={activeTab === 'cv_generator'} onClick={() => setActiveTab('cv_generator')} label="PDF Export" icon="bi bi-file-pdf" />
                            <SubMenuButton active={activeTab === 'online_cv'} onClick={() => setActiveTab('online_cv')} label="Digital Page" icon="bi bi-globe" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bottom Group - Settings & Billing */}
            <div className="mt-auto pt-2 space-y-1">
              <SidebarStandaloneItem 
                active={activeTab === 'billing'} 
                onClick={() => setActiveTab('billing')} 
                icon={<i className="bi bi-credit-card"></i>} 
                label="Billing & Plan" 
              />
              <SidebarStandaloneItem 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
                icon={<i className="bi bi-gear"></i>} 
                label="Pengaturan" 
              />
            </div>
          </>
        )}
      </div>
      
      {/* Footer Session */}
      <div className="p-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-rose-50/5 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest group"
        >
          <span className="group-hover:rotate-12 transition-transform text-xs">
            <i className="bi bi-box-arrow-right"></i>
          </span>
          <span>Logout</span>
        </button>
      </div>

      {/* Modal Konfirmasi Logout - Perbaikan Centering */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                <i className="bi bi-door-open-fill"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Keluar Sesi?</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2 uppercase tracking-widest">Apakah Anda yakin ingin mengakhiri sesi kerja saat ini?</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => { setShowLogoutModal(false); onLogout(); }} 
                className="flex-[2] py-4 bg-rose-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const SidebarItem = ({ id, active, onClick, icon, label, color }: any) => {
  const colorMap: any = {
    blue: 'text-blue-400 group-hover:text-blue-300',
    rose: 'text-rose-400 group-hover:text-rose-300',
  };
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border group ${
        active 
          ? 'bg-white/5 border-white/10 text-white' 
          : 'text-slate-500 hover:bg-white/5 hover:text-white border-transparent'
      }`}
    >
      <span className={`transition-colors text-sm ${colorMap[color]}`}>{icon}</span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
};

const SidebarStandaloneItem = ({ id, active, onClick, icon, label }: any) => (
  <button
    id={id}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group ${
      active ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-white border-transparent'
    }`}
  >
    <span className="opacity-60 group-hover:opacity-100 transition-opacity text-sm">{icon}</span>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const SubMenuButton = ({ id, active, onClick, label, icon }: any) => (
  <button 
    id={id}
    onClick={onClick}
    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all duration-300 rounded-lg flex items-center gap-3 ${
      active ? 'text-indigo-400 bg-white/5' : 'text-slate-600 hover:text-white hover:bg-white/5'
    }`}
  >
    <span className="text-[10px] opacity-60"><i className={icon}></i></span>
    <span>{label}</span>
  </button>
);

export default Sidebar;
