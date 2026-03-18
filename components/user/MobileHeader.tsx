
import React, { useState, useRef, useEffect } from 'react';
/* Corrected import: 'auth' is exported from services/firebase, not from types */
import { UserProfile } from '../../types';
/* Added import for auth to fix the undefined reference and use proper sign-out method */
import { auth } from '../../services/firebase';

interface MobileHeaderProps {
  profile: UserProfile;
  notificationCount: number;
  onNavigate: (tab: string) => void;
  activeTab: string;
  alerts?: any[];
  logoDarkUrl?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ profile, notificationCount, onNavigate, activeTab, alerts = [], logoDarkUrl }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State baru untuk modal logout
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    // Menggunakan event 'click' agar interaksi tombol di dalam menu tetap terdeteksi sebelum tertutup
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileOpen(false); // Tutup dropdown profil sebelum membuka modal
    setShowLogoutModal(true); // Aktifkan modal konfirmasi
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-[110] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          {logoDarkUrl ? (
            <img src={logoDarkUrl} alt="Logo" className="h-9 object-contain" />
          ) : (
            <>
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                F
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tighter text-slate-900 leading-none">FokusKarir</h1>
                <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">{activeTab.replace('_', ' ')}</span>
              </div>
            </>
          )}
        </div>

        {/* Right Actions: Notifications & Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${isNotifOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:text-indigo-600'}`}
              title="Notifikasi"
            >
              <i className={`bi ${isNotifOpen ? 'bi-bell-fill' : 'bi-bell'} text-lg`}></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white animate-in zoom-in duration-300">
                  {notificationCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl p-4 animate-in slide-in-from-top-2 duration-300 z-[120]"
              >
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Pusat Notifikasi</h4>
                 <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {alerts.length > 0 ? alerts.map((alert, i) => (
                      <button 
                        key={i} 
                        onClick={() => { onNavigate(alert.target); setIsNotifOpen(false); }}
                        className="w-full flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left group"
                      >
                         <div className={`w-8 h-8 rounded-xl bg-${alert.color}-50 text-${alert.color}-600 flex items-center justify-center text-xs shrink-0 border border-${alert.color}-100`}>
                            <i className={`bi ${alert.icon}`}></i>
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{alert.text}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Ketuk untuk Selesaikan</p>
                         </div>
                      </button>
                    )) : (
                      <div className="py-8 text-center">
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada notifikasi baru</p>
                      </div>
                    )}
                 </div>
              </div>
            )}
          </div>

          {/* Profile Shortcut with Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
              className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all shadow-sm ${isProfileOpen ? 'border-indigo-500 scale-110 shadow-indigo-100' : (activeTab === 'profile' ? 'border-indigo-500 scale-110' : 'border-white bg-slate-100')}`}
            >
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl p-2 animate-in slide-in-from-top-2 duration-300 z-[120]"
              >
                 <div className="p-4 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-900 leading-none truncate">{profile.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">User Account</p>
                 </div>
                 <button 
                  onClick={() => { onNavigate('profile'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all"
                 >
                    <i className="bi bi-person-circle text-sm"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Profil Saya</span>
                 </button>
                 <button 
                  onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all"
                 >
                    <i className="bi bi-gear-fill text-sm"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Pengaturan</span>
                 </button>
                 <div className="h-px bg-slate-50 my-1 mx-2"></div>
                 <button 
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-500 transition-all active:bg-rose-100"
                 >
                    <i className="bi bi-box-arrow-right text-sm"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                 </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Konfirmasi Logout Mobile */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                <i className="bi bi-door-open-fill"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Keluar Sesi?</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2 uppercase tracking-widest text-center">Apakah Anda yakin ingin mengakhiri sesi kerja saat ini?</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => { setShowLogoutModal(false); auth.signOut(); }} 
                className="flex-[2] py-4 bg-rose-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* Added export default for MobileHeader to fix "Module has no default export" error in App.tsx */
export default MobileHeader;
