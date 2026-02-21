
import React, { useState } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ReminderConfig } from '../../types';

interface AccountSettingsProps {
  reminderConfig: ReminderConfig;
  onUpdateReminders: (config: ReminderConfig) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ reminderConfig, onUpdateReminders }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State modal logout
  
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Account Security</h2>
      </header>
      <div className="bg-white p-20 rounded-[2.5rem] shadow-sm border border-slate-100 text-center text-slate-400 italic">Panel pengaturan keamanan dan profil akun.</div>
      
      {/* Tombol Logout untuk memicu modal */}
      <div className="flex justify-center mt-10">
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="px-10 py-4 bg-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl hover:bg-rose-700 transition-all"
        >
          Keluar Sesi Akun
        </button>
      </div>

      {/* Modal Konfirmasi Logout Settings - Perbaikan Centering */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
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
                onClick={() => { setShowLogoutModal(false); auth.signOut(); }} 
                className="flex-[2] py-4 bg-rose-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
