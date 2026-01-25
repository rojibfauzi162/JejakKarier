
import React, { useState } from 'react';
import { updateProfile, updatePassword, User } from '@firebase/auth';
import { auth } from '../services/firebase';

const AccountSettings: React.FC = () => {
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateProfile(user, { displayName: name });
      setMessage({ text: 'Identity label updated successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Security keys do not match.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await updatePassword(user, newPassword);
      setMessage({ text: 'Security key rotation successful.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: 'Security protocol rejected. Please re-authenticate and try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Account Settings</h2>
        <p className="text-slate-500 font-medium italic">"Manage your identity access and security protocols."</p>
      </header>

      {message && (
        <div className={`p-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 border flex items-center gap-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          <span className="text-lg">
            {message.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )}
          </span>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Informasi Dasar */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity Record</h3>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Email (Static)</label>
              <input 
                disabled 
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 font-bold text-xs" 
                value={user?.email || ''} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Label</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Legal Name..."
              />
            </div>
            <button 
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl text-[10px] shadow-xl hover:bg-black transition-all disabled:opacity-50"
            >
              Simpan Identitas
            </button>
          </form>
        </section>

        {/* Keamanan Akun */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security Access</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Security Key</label>
              <input 
                type="password"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Security Key</label>
              <input 
                type="password"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full py-5 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl text-[10px] shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
            >
              Rotate Security Key
            </button>
          </form>
        </section>

        {/* Info Akun Tambahan */}
        <section className="md:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                 <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Vault & Metadata</h4>
                 <p className="text-[10px] text-slate-500 uppercase font-bold">Node Establishment: <span className="text-white ml-2">{user?.metadata.creationTime}</span></p>
              </div>
              <div className="flex gap-4">
                 <button 
                  onClick={() => auth.signOut()}
                  className="px-10 py-4 bg-white/5 border border-white/10 text-rose-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-500"
                 >
                   Terminate All Sessions
                 </button>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AccountSettings;
