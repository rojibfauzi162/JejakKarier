import React, { useState } from 'react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string, date?: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

// Fix: Defined NavItem interface to handle optional isSpecial property
interface NavItem {
  id: string;
  label: string;
  icon: string;
  isSpecial?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onLogout, isAdmin }) => {
  const [showDailyMenu, setShowDailyMenu] = useState(false);

  // Menu untuk User Biasa
  // Fix: Explicitly typed as NavItem[] to resolve 'isSpecial' property error in mainItems
  const userItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: 'bi-house-door' },
    { id: 'daily_toggle', label: 'Daily Work', icon: 'bi-journal-text', isSpecial: true },
    { id: 'todo_list', label: 'Langkah', icon: 'bi-check2-square' },
    { id: 'mobile_stats', label: 'Stats', icon: 'bi-bar-chart-line' },
  ];

  // Menu Khusus Super Admin
  // Fix: Explicitly typed as NavItem[] to maintain type consistency for mainItems
  const adminItems: NavItem[] = [
    { id: 'admin_dashboard', label: 'Admin', icon: 'bi-speedometer2' },
    { id: 'admin_users', label: 'Users', icon: 'bi-people' },
    { id: 'admin_ai', label: 'AI Build', icon: 'bi-cpu' },
    { id: 'admin_products', label: 'Products', icon: 'bi-box-seam' },
    { id: 'admin_health', label: 'Health', icon: 'bi-activity' },
  ];

  const mainItems = isAdmin ? adminItems : userItems;

  const handleMenuClick = (id: string) => {
    if (id === 'daily_toggle') {
      setShowDailyMenu(!showDailyMenu);
    } else {
      setShowDailyMenu(false);
      setActiveTab(id);
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]">
      {/* MODERN BUBBLE DAILY SUB-MENU (Hanya untuk User) */}
      {!isAdmin && showDailyMenu && (
        <div className="absolute bottom-[calc(100%+12px)] left-0 right-0 px-6 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
           <div className="bg-white/95 backdrop-blur-2xl border border-indigo-100 rounded-[2.5rem] p-3 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.2)] flex flex-col gap-1 relative ring-1 ring-black/5">
              <button 
                onClick={() => { setActiveTab('daily'); setShowDailyMenu(false); }}
                className="flex items-center gap-4 p-4 rounded-3xl hover:bg-indigo-50/50 transition-all active:scale-[0.98] group"
              >
                 <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform"><i className="bi bi-pencil-square"></i></div>
                 <div className="text-left flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">Aktivitas Kerja</p>
                    <p className="text-[10px] font-bold text-slate-400">Log output pekerjaan harian</p>
                 </div>
                 <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              
              <div className="h-px bg-slate-100 mx-4"></div>

              <button 
                onClick={() => { setActiveTab('work_reflection'); setShowDailyMenu(false); }}
                className="flex items-center gap-4 p-4 rounded-3xl hover:bg-rose-50/50 transition-all active:scale-[0.98] group"
              >
                 <div className="w-12 h-12 rounded-[1.25rem] bg-rose-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform"><i className="bi bi-chat-quote"></i></div>
                 <div className="text-left flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">Refleksi Kerja</p>
                    <p className="text-[10px] font-bold text-slate-400">Insight mood & produktivitas</p>
                 </div>
                 <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>

              {/* Speech Bubble Pointer */}
              <div className="absolute -bottom-2 left-[38%] -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-indigo-100 rotate-45"></div>
           </div>
           {/* Global Overlay click outside */}
           <div className="fixed inset-0 z-[-1] bg-slate-950/5" onClick={() => setShowDailyMenu(false)}></div>
        </div>
      )}

      {/* Tactile 3D Bottom Nav Bar */}
      <nav className={`bg-white/95 backdrop-blur-xl border-t-2 border-indigo-500/10 ${isAdmin ? 'px-4' : 'px-6'} pt-3 pb-4 flex items-center justify-between shadow-[0_-12px_40px_rgba(0,0,0,0.08)] relative z-10`}>
        {mainItems.map((item) => {
          // Fix: item.isSpecial is now correctly recognized due to NavItem interface
          const isActive = activeTab === item.id || (item.isSpecial && (activeTab === 'daily' || activeTab === 'work_reflection'));
          return (
            <button
              id={`tour-mobile-${item.id}`}
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`flex flex-col items-center gap-1.5 p-2 transition-all relative group ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <div className={`text-2xl transition-transform ${isActive ? 'scale-125 -translate-y-1' : 'group-active:scale-90'}`}>
                <i className={`bi ${item.icon}`}></i>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
              )}
            </button>
          );
        })}
        
        {!isAdmin && (
          <button
            onClick={() => { setShowDailyMenu(false); setActiveTab('apps_hub'); }}
            className={`flex flex-col items-center gap-1.5 p-2 transition-all group ${
              activeTab === 'apps_hub' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <div className={`text-2xl transition-transform ${activeTab === 'apps_hub' ? 'scale-125 -translate-y-1' : 'group-active:scale-90'}`}>
               <i className="bi bi-grid-fill"></i>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tight transition-all ${activeTab === 'apps_hub' ? 'opacity-100' : 'opacity-40'}`}>
              Apps
            </span>
            {activeTab === 'apps_hub' && (
              <span className="absolute -bottom-1 w-5 h-1 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
            )}
          </button>
        )}
      </nav>
    </div>
  );
};

export default MobileNav;