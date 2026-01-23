
import React, { useState } from 'react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainItems = [
    { id: 'dashboard', label: 'Home', icon: '📊' },
    { id: 'daily', label: 'Work', icon: '📝' },
    { id: 'skills', label: 'Skills', icon: '🎓' },
    { id: 'loker', label: 'Jobs', icon: '💼' },
    { id: 'career', label: 'Career', icon: '🚀' },
  ];

  const moreItems = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'projects', label: 'Projects', icon: '🛠️' },
    { id: 'achievements', label: 'Awards', icon: '🏆' },
    { id: 'networking', label: 'Net', icon: '🤝' },
    { id: 'reviews', label: 'Review', icon: '📅' },
    { id: 'cv_generator', label: 'CV Download', icon: '📄' },
    { id: 'online_cv', label: 'CV Online', icon: '🌐' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]">
      {/* More Menu Backdrop */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* More Menu Content */}
      <div className={`absolute bottom-full left-0 right-0 mb-4 px-4 transition-all duration-300 ${isMoreOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-3 gap-4">
            {moreItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMoreOpen(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  activeTab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
            <button
              onClick={onLogout}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rose-50 text-rose-500"
            >
              <span className="text-xl">🚪</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-t border-slate-200 px-2 pt-2 pb-6 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {mainItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMoreOpen(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${
              activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
            isMoreOpen ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <span className="text-2xl">{isMoreOpen ? '✕' : '☰'}</span>
          <span className="text-[9px] font-black uppercase tracking-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileNav;
