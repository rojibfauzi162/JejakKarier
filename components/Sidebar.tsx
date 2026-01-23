
import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [dailyDropdownOpen, setDailyDropdownOpen] = useState(activeTab === 'daily' || activeTab === 'reports');
  const [cvDropdownOpen, setCvDropdownOpen] = useState(activeTab === 'cv_generator' || activeTab === 'online_cv');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'User Profile', icon: '👤' },
    { id: 'daily', label: 'Daily Work', icon: '📝', hasSub: true, type: 'daily' },
    { id: 'skills', label: 'Skills & Learning', icon: '🎓' },
    { id: 'loker', label: 'Loker Tracker', icon: '💼' },
    { id: 'projects', label: 'Personal Project', icon: '🛠️' },
    { id: 'career', label: 'Career Path', icon: '🚀' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'networking', label: 'Networking', icon: '🤝' },
    { id: 'reviews', label: 'Monthly Review', icon: '📅' },
    { id: 'cv_root', label: 'CV Generator', icon: '📄', hasSub: true, type: 'cv' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col hidden lg:flex z-50">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">J</div>
          <h1 className="text-xl font-bold tracking-tight">JejakKarir</h1>
        </div>
      </div>
      
      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-2 no-scrollbar">
        {menuItems.map((item) => (
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
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id || 
                (item.type === 'daily' && (activeTab === 'daily' || activeTab === 'reports')) ||
                (item.type === 'cv' && (activeTab === 'cv_generator' || activeTab === 'online_cv'))
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-semibold text-sm tracking-tight">{item.label}</span>
              </div>
              {item.hasSub && (
                <span className={`text-[10px] transition-transform duration-300 ${
                  (item.type === 'daily' && dailyDropdownOpen) || (item.type === 'cv' && cvDropdownOpen) ? 'rotate-180' : ''
                }`}>▼</span>
              )}
            </button>
            
            {/* Submenu Daily */}
            {item.hasSub && item.type === 'daily' && dailyDropdownOpen && (
              <div className="pl-12 space-y-1 animate-in slide-in-from-top-1 duration-300">
                <button 
                  onClick={() => setActiveTab('daily')}
                  className={`w-full text-left px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'daily' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  Log Aktivitas
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className={`w-full text-left px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'reports' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  Laporan Performa
                </button>
              </div>
            )}

            {/* Submenu CV Generator sesuai request */}
            {item.hasSub && item.type === 'cv' && cvDropdownOpen && (
              <div className="pl-12 space-y-1 animate-in slide-in-from-top-1 duration-300">
                <button 
                  onClick={() => setActiveTab('cv_generator')}
                  className={`w-full text-left px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'cv_generator' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  CV Download
                </button>
                <button 
                  onClick={() => setActiveTab('online_cv')}
                  className={`w-full text-left px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'online_cv' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  CV Online
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Action Footer */}
      <div className="p-6 space-y-4 border-t border-white/5 mt-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 font-bold text-xs uppercase tracking-widest group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
          <span>Keluar Akun</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
            JEJAKKARIR v1.0
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
