
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth, signInWithGoogle } from '../services/firebase';

import { trackingService } from '../services/trackingService';

interface AuthProps {
  onBack?: () => void;
  logoUrl?: string;
  logoDarkUrl?: string;
}

const Auth: React.FC<AuthProps> = ({ onBack, logoUrl, logoDarkUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // State baru untuk reset password
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackingService.trackEvent('PageView', { page_path: '/login', page_title: 'Login' });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // DEMO MODE BYPASS
        if (email === 'demo@fokuskarir.com' && password === 'demo123') {
          localStorage.setItem('demo_mode', 'true');
          window.location.reload();
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        localStorage.setItem('pending_registration', JSON.stringify({ name, email, phone }));
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Meta Ads: CompleteRegistration & Lead
        trackingService.trackEvent('CompleteRegistration', { content_name: 'Email Registration' }, 'registrationSuccess');
        trackingService.trackEvent('Lead', { content_name: 'New User Registration', status: 'Registered' });

        try {
          await sendEmailVerification(userCredential.user);
        } catch (mailErr: any) {
          console.warn("Gagal mengirim email verifikasi:", mailErr.message);
        }
      }
    } catch (err: any) {
      console.error("[AUTH DEBUG] Full Error:", err);
      let friendlyMessage = 'Terjadi kesalahan saat menghubungi server. Silakan coba lagi.';
      const code = err.code || '';
      setErrorCode(code);
      
      switch (code) {
        case 'auth/invalid-email': 
          friendlyMessage = 'Format alamat email tidak benar. Pastikan email ditulis dengan benar (contoh: nama@email.com).'; 
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': 
          friendlyMessage = 'Email atau Password salah. Silakan periksa kembali detail login Anda.'; 
          break;
        case 'auth/email-already-in-use': 
          friendlyMessage = 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun yang sudah ada.'; 
          break;
        case 'auth/weak-password': 
          friendlyMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter untuk keamanan akun Anda.'; 
          break;
        case 'auth/network-request-failed':
          friendlyMessage = 'Gagal terhubung ke server (Network Error). Pastikan koneksi internet Anda stabil. Jika Anda menggunakan VPN atau AdBlocker, coba matikan sementara. Pastikan juga domain "firebaseapp.com" tidak diblokir oleh provider internet Anda.';
          break;
        case 'auth/too-many-requests':
          friendlyMessage = 'Terlalu banyak percobaan masuk yang gagal. Silakan tunggu beberapa saat sebelum mencoba lagi.';
          break;
        case 'auth/operation-not-allowed':
          friendlyMessage = 'Metode masuk ini belum diaktifkan. Silakan hubungi administrator.';
          break;
        default: 
          friendlyMessage = err.message || 'Maaf, terjadi kendala teknis. Silakan coba beberapa saat lagi.';
      }
      setError(friendlyMessage);
      if (!isLogin) localStorage.removeItem('pending_registration');
      setLoading(false);
    }
    // Jika sukses, loading tidak perlu di-false-kan secara manual karena komponen akan unmount oleh App.tsx
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Harap masukkan alamat email Anda.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.');
    } catch (err: any) {
      let msg = 'Gagal mengirim email reset.';
      if (err.code === 'auth/user-not-found') msg = 'Akun dengan email ini tidak ditemukan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      
      // Meta Ads: CompleteRegistration & Lead (jika user baru)
      const isNewUser = (result as any)._tokenResponse?.isNewUser;
      if (isNewUser) {
        trackingService.trackEvent('CompleteRegistration', { content_name: 'Google Registration' }, 'registrationSuccess');
        trackingService.trackEvent('Lead', { content_name: 'New User Registration', status: 'Registered' });
      }
    } catch (err: any) {
      const code = err.code || '';
      setErrorCode(code);
      let msg = 'Gagal masuk dengan Google.';
      if (code === 'auth/popup-closed-by-user') msg = 'Proses login dibatalkan karena jendela popup ditutup.';
      else if (code === 'auth/network-request-failed') msg = 'Koneksi internet terganggu. Silakan coba lagi.';
      else if (code === 'auth/cancelled-popup-request') msg = 'Permintaan login dibatalkan.';
      
      setError(msg || err.message);
      setLoading(false);
    }
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in duration-500">
        
        {onBack && !isForgotPassword && !isStandalone && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors text-[10px] font-black uppercase tracking-widest group"
          >
            <i className="bi bi-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            Kembali
          </button>
        )}

        {isForgotPassword && (
          <button 
            onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors text-[10px] font-black uppercase tracking-widest group"
          >
            <i className="bi bi-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            Batal
          </button>
        )}

        <div className="text-center mb-10 mt-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-6 object-contain drop-shadow-xl" />
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl font-black rounded-2xl shadow-xl shadow-blue-500/20 mb-6">F</div>
              <h1 className="text-3xl font-black text-white tracking-tight">FokusKarir</h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">Your Intelligence Career Partner</p>
            </>
          )}
        </div>

        {!isForgotPassword && (
          <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
            <button onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Login</button>
            <button onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Register</button>
          </div>
        )}

        {isForgotPassword && (
          <div className="text-center mb-8">
             <h2 className="text-xl font-black text-white uppercase tracking-tight">Reset Password</h2>
             <p className="text-slate-400 text-xs mt-2 font-bold leading-relaxed uppercase tracking-widest">Masukkan email Anda untuk menerima instruksi pemulihan.</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-xs font-bold mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-2">
              <span>⚠️</span>
              <div className="flex-1">
                <p>{error}</p>
                {errorCode === 'auth/network-request-failed' && (
                  <div className="mt-3 flex flex-col gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.getRegistrations().then(registrations => {
                            for (const registration of registrations) {
                              registration.unregister();
                            }
                            window.location.reload();
                          });
                        } else {
                          window.location.reload();
                        }
                      }}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <i className="bi bi-arrow-clockwise"></i> Refresh Halaman (Clear Cache)
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setEmail('demo@fokuskarir.com');
                        setPassword('demo123');
                        setError('');
                        setSuccessMsg('Gunakan email: demo@fokuskarir.com & password: demo123 untuk mencoba Demo Mode.');
                      }}
                      className="text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <i className="bi bi-play-circle-fill"></i> Gunakan Demo Mode?
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs font-bold mb-6 animate-in slide-in-from-top-2">
            ✅ {successMsg}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600" placeholder="alex@fokuskarir.com" value={email || ''} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4">
              {loading ? 'Sending...' : 'Kirim Link Pemulihan'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600" placeholder="Alex Johnson" value={name || ''} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
                <input type="tel" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600" placeholder="08123456789" value={phone || ''} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600" placeholder="alex@fokuskarir.com" value={email || ''} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Lupa Password?</button>
                )}
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600 pr-12" placeholder="••••••••" value={password || ''} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`}></i>
                </button>
              </div>
            </div>

            <button disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4">
              {loading ? 'Processing...' : isLogin ? 'Masuk Sekarang' : 'Daftar Akun'}
            </button>
          </form>
        )}

        {!isForgotPassword && (
          <>
            <div className="relative my-8">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
               <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]"><span className="bg-[#0f172a] px-4 text-slate-500">Atau gunakan</span></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              Masuk dengan Google
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
