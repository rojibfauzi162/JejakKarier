
import React, { useState, useMemo } from 'react';
import { AppData, UserRole } from '../../types';
import { auth } from '../../services/firebase';

interface AdminManagementProps {
  users: AppData[];
  onUpdateMetadata: (uid: string, fields: Partial<AppData>) => Promise<void>;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ users, onUpdateMetadata }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const currentUserEmail = auth.currentUser?.email?.toLowerCase();
  const isPrimaryAdmin = currentUserEmail === 'admin@fokuskarir.web.id';

  // Daftar admin saat ini
  const admins = useMemo(() => {
    return users.filter(u => u.role === UserRole.SUPERADMIN);
  }, [users]);

  // Cari user yang bisa dipromosikan (bukan admin)
  const candidate = useMemo(() => {
    if (!searchEmail.trim()) return null;
    return users.find(u => u.profile?.email?.toLowerCase() === searchEmail.toLowerCase() && u.role !== UserRole.SUPERADMIN);
  }, [users, searchEmail]);

  const handleRequestPromote = async (uid: string) => {
    if (isPrimaryAdmin) {
      if (!confirm("Langsung berikan hak akses Super Admin ke akun ini?")) return;
      setIsProcessing(true);
      try {
        await onUpdateMetadata(uid, { role: UserRole.SUPERADMIN, isAdminVerified: true });
        setSearchEmail('');
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!confirm("Ajukan permintaan promosi Super Admin untuk akun ini ke Admin Utama?")) return;
      setIsProcessing(true);
      try {
        await onUpdateMetadata(uid, { adminPromotionRequested: true });
        setSearchEmail('');
        alert("Permintaan berhasil dikirim. Menunggu verifikasi admin@fokuskarir.web.id");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleVerifyAdmin = async (uid: string) => {
    if (!isPrimaryAdmin) return;
    setIsProcessing(true);
    try {
      await onUpdateMetadata(uid, { role: UserRole.SUPERADMIN, isAdminVerified: true, adminPromotionRequested: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemote = async (uid: string, email: string) => {
    if (email === 'admin@fokuskarir.web.id') {
      alert("Admin utama tidak dapat dicabut aksesnya.");
      return;
    }
    if (!isPrimaryAdmin && email !== currentUserEmail) {
      alert("Hanya Admin Utama yang bisa mencabut akses Super Admin lain.");
      return;
    }
    if (!confirm("Cabut hak akses Admin dari akun ini? Akun akan kembali menjadi User biasa.")) return;
    setIsProcessing(true);
    try {
      await onUpdateMetadata(uid, { role: UserRole.USER, isAdminVerified: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingApprovals = useMemo(() => {
    return users.filter(u => u.adminPromotionRequested);
  }, [users]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Pending Approvals (Only for Primary Admin) */}
      {isPrimaryAdmin && pendingApprovals.length > 0 && (
        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3 className="text-xl font-black text-amber-900 uppercase">Menunggu Verifikasi Admin</h3>
           </div>
           <div className="space-y-4">
              {pendingApprovals.map(u => (
                <div key={u.uid} className="bg-white p-6 rounded-3xl border border-amber-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black uppercase">
                        {u.profile?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{u.profile?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{u.profile?.email}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleVerifyAdmin(u.uid!)}
                        disabled={isProcessing}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Verifikasi Akun ✅
                      </button>
                      <button 
                        onClick={() => onUpdateMetadata(u.uid!, { adminPromotionRequested: false })}
                        disabled={isProcessing}
                        className="px-6 py-2.5 bg-rose-50 text-rose-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                      >
                        Tolak
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Search & Promote Section */}
      <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-100">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase">{isPrimaryAdmin ? 'Tambah Admin Baru' : 'Ajukan Admin Baru'}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isPrimaryAdmin ? 'Berikan akses Super Admin ke user terdaftar.' : 'Ajukan promosi akun ke Admin Utama.'}
            </p>
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Masukkan email user yang sudah terdaftar..."
              className="w-full pl-6 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-indigo-500 transition-all"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <i className="bi bi-search text-xl"></i>
            </div>
          </div>

          {candidate ? (
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-between animate-in zoom-in duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">
                  {candidate.profile?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{candidate.profile?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{candidate.profile?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => handleRequestPromote(candidate.uid!)}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {isPrimaryAdmin ? 'Promosikan ⚡' : 'Ajukan Verifikasi 🚀'}
              </button>
            </div>
          ) : searchEmail && (
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">
              User tidak ditemukan atau sudah menjadi Admin.
            </p>
          )}
        </div>
      </div>

      {/* Admin List Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Daftar Super Admin</h3>
          <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {admins.length} Pengelola Aktif
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                <th className="px-10 py-5">Administrator</th>
                <th className="px-6 py-5">Tingkat Akses</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-10 py-5 text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map(admin => (
                <tr key={admin.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                        {admin.profile?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{admin.profile?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{admin.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-indigo-950 text-indigo-300 rounded-lg text-[9px] font-black uppercase border border-indigo-900/50 flex items-center gap-2 w-fit">
                      <i className="bi bi-shield-lock-fill"></i> {admin.profile?.email === 'admin@fokuskarir.web.id' ? 'Owner / Primary' : 'Verified Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`flex justify-center items-center gap-2 text-[10px] font-black uppercase ${admin.isAdminVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.isAdminVerified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
                      {admin.isAdminVerified ? 'Verified' : 'Review Required'}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-right">
                    {admin.profile?.email !== 'admin@fokuskarir.web.id' ? (
                      <button 
                        onClick={() => handleDemote(admin.uid!, admin.profile.email)}
                        className="px-4 py-2 bg-rose-50 text-rose-500 font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Hapus / Demosi
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Root Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
