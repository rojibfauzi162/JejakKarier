
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'User Profile', icon: '👤' },
    { id: 'daily', label: 'Daily Work', icon: '📝' },
    { id: 'skills', label: 'Skills & Learning', icon: '🎓' },
    { id: 'career', label: 'Career Path', icon: '🚀' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'networking', label: 'Networking', icon: '🤝' },
    { id: 'reviews', label: 'Monthly Review', icon: '📅' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden lg:block z-50">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">P</div>
        <h1 className="text-xl font-bold tracking-tight">PathPulse</h1>
      </div>
      
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="absolute bottom-10 left-6 right-6">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">PRO PLAN</p>
          <p className="text-sm font-semibold mb-3">Unlock AI Insights</p>
          <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
