
import React, { useState } from 'react';
// Fixing modular imports for Firebase Auth named exports using single quotes for consistent module path resolution
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Authenticating user with modular signInWithEmailAndPassword function
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Registering new user with modular createUserWithEmailAndPassword function
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Updating user profile with modular updateProfile function
        await updateProfile(userCredential.user, { displayName: name });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl font-black rounded-2xl shadow-xl shadow-blue-500/20 mb-6">J</div>
          <h1 className="text-3xl font-black text-white tracking-tight">JejakKarir</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Your Intelligence Career Partner</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-xs font-bold mb-6 animate-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text"
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email"
              required
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600"
              placeholder="alex@jejakkarir.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password"
              required
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Masuk Sekarang' : 'Daftar Akun'}
          </button>
        </form>
        
        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-10">
          © 2025 JejakKarir. Protected by SSL.
        </p>
      </div>
    </div>
  );
};

export default Auth;
