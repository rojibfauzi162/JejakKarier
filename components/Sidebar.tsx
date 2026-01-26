
import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, isAdmin }) => {
  const [dailyDropdownOpen, setDailyDropdownOpen] = useState(activeTab === 'daily' || activeTab === 'reports' || activeTab === 'ai_insights');
  const [cvDropdownOpen, setCvDropdownOpen] = useState(activeTab === 'cv_generator' || activeTab === 'online_cv');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: 'profile', label: 'User Profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
    { id: 'daily', label: 'Daily Work', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>, hasSub: true, type: 'daily' },
    { id: 'reminders', label: 'Reminders', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> },
    { id: 'skills', label: 'Skills & Learning', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5"></path></svg> },
    { id: 'loker', label: 'Loker Tracker', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> },
    { id: 'projects', label: 'Personal Project', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> },
    { id: 'career', label: 'Career Path', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> },
    { id: 'achievements', label: 'Achievements', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg> },
    { id: 'networking', label: 'Networking', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
    { id: 'reviews', label: 'Monthly Review', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
    { id: 'cv_root', label: 'CV Generator', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, hasSub: true, type: 'cv' },
    { id: 'settings', label: 'Settings', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-slate-950 text-white flex flex-col hidden lg:flex z-50 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      {/* Header Branding */}
      <div className="p-8 pt-10">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-105 transition-transform duration-300">J</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">JejakKarir</h1>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Pro Tracker</span>
          </div>
        </div>
      </div>
      
      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-1.5 no-scrollbar pb-10">
        {isAdmin && (
          <div className="space-y-1.5 mb-8 animate-in slide-in-from-left duration-500">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-4 ml-3 opacity-80">Operational Hub</p>
            <SidebarItem 
              id="admin_dashboard" 
              active={activeTab === 'admin_dashboard'} 
              onClick={() => setActiveTab('admin_dashboard')} 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>} 
              label="Admin Core" 
              color="blue"
            />
            <SidebarItem 
              id="admin_users" 
              active={activeTab === 'admin_users'} 
              onClick={() => setActiveTab('admin_users')} 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} 
              label="User Nexus" 
              color="rose"
            />
            <SidebarItem 
              id="admin_products" 
              active={activeTab === 'admin_products'} 
              onClick={() => setActiveTab('admin_products')} 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>} 
              label="Market Catalog" 
              color="indigo"
            />
            <SidebarItem 
              id="admin_ai" 
              active={activeTab === 'admin_ai'} 
              onClick={() => setActiveTab('admin_ai')} 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z"></path><path d="M12 6v6l4 2"></path></svg>} 
              label="AI Architecture" 
              color="cyan"
            />
            <SidebarItem 
              id="admin_health" 
              active={activeTab === 'admin_health'} 
              onClick={() => setActiveTab('admin_health')} 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>} 
              label="System Pulse" 
              color="emerald"
            />
          </div>
        )}

        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4 ml-3 opacity-80">Navigator</p>
        {!isAdmin && menuItems.map((item) => (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => {
                if (item.hasSub) {
                  if (item.type === 'daily') setDailyDropdownOpen(!dailyDropdownOpen);
                  if (item.type === 'cv') setCvDropdownOpen(!cvDropdownOpen);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id || 
                (item.type === 'daily' && (activeTab === 'daily' || activeTab === 'reports' || activeTab === 'ai_insights')) ||
                (item.type === 'cv' && (activeTab === 'cv_generator' || activeTab === 'online_cv'))
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform group-hover:scale-110 duration-300 ${
                   activeTab === item.id ? 'text-indigo-400' : 'opacity-60 group-hover:opacity-100'
                }`}>{item.icon}</span>
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              {item.hasSub && (
                <span className={`text-[10px] transition-transform duration-300 opacity-40 ${
                  (item.type === 'daily' && dailyDropdownOpen) || (item.type === 'cv' && cvDropdownOpen) ? 'rotate-180' : ''
                }`}>▼</span>
              )}
            </button>
            
            {/* Submenu Daily */}
            {item.hasSub && item.type === 'daily' && dailyDropdownOpen && (
              <div className="pl-12 space-y-1.5 mt-1.5 animate-in slide-in-from-top-2 duration-300">
                <SubMenuButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} label="Log Aktivitas" />
                <SubMenuButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Performa Data" />
                <SubMenuButton active={activeTab === 'ai_insights'} onClick={() => setActiveTab('ai_insights')} label="AI Insight Activity" />
              </div>
            )}

            {/* Submenu CV Generator */}
            {item.hasSub && item.type === 'cv' && cvDropdownOpen && (
              <div className="pl-12 space-y-1.5 mt-1.5 animate-in slide-in-from-top-2 duration-300">
                <SubMenuButton active={activeTab === 'cv_generator'} onClick={() => setActiveTab('cv_generator')} label="PDF Export" />
                <SubMenuButton active={activeTab === 'online_cv'} onClick={() => setActiveTab('online_cv')} label="Digital Page" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer Branding */}
      <div className="p-8 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest group"
        >
          <span className="group-hover:rotate-12 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </span>
          <span>Terminate Session</span>
        </button>
      </div>
    </nav>
  );
};

const SidebarItem = ({ id, active, onClick, icon, label, color }: any) => {
  const colorMap: any = {
    blue: 'text-blue-400 group-hover:text-blue-300',
    rose: 'text-rose-400 group-hover:text-rose-300',
    indigo: 'text-indigo-400 group-hover:text-indigo-300',
    cyan: 'text-cyan-400 group-hover:text-cyan-300',
    emerald: 'text-emerald-400 group-hover:text-emerald-300',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 border group ${
        active 
          ? 'bg-white/5 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
          : 'text-slate-500 hover:bg-white/5 hover:text-white border-transparent'
      }`}
    >
      <span className={`transition-colors ${colorMap[color]}`}>{icon}</span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
};

const SubMenuButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
      active ? 'text-indigo-400' : 'text-slate-600 hover:text-white'
    }`}
  >
    {label}
  </button>
);

export default Sidebar;
