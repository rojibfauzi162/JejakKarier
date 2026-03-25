import React, { useState, useEffect } from 'react';
import { FeatureRequest, FeatureRequestStatus } from '../types';
import { getFeatureRequests, createFeatureRequest, voteFeatureRequest } from '../services/featureRequestService';
import { auth } from '../services/firebase';

const FeatureRequests: React.FC = () => {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'feature' | 'bugfix'>('feature');
  const [module, setModule] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('votes');

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getFeatureRequests();
    // Filter out hidden requests for users
    setRequests(data.filter(r => !r.isHidden));
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || (type === 'bugfix' && !module)) {
      showToast('Harap lengkapi semua field yang diperlukan.', 'error');
      return;
    }
    if (description.length < 20) {
      showToast('Deskripsi minimal 20 karakter.', 'error');
      return;
    }

    setIsSubmitting(true);
    const userName = auth.currentUser?.displayName || 'User';
    const result = await createFeatureRequest(title, description, type, type === 'bugfix' ? module : undefined, userName);
    
    if (result.success) {
      showToast(result.message, 'success');
      setTitle('');
      setDescription('');
      setType('feature');
      setModule('');
      fetchRequests();
    } else {
      showToast(result.message, 'error');
    }
    setIsSubmitting(false);
  };

  const handleVote = async (requestId: string) => {
    const result = await voteFeatureRequest(requestId);
    if (result.success) {
      showToast(result.message, 'success');
      fetchRequests();
    } else {
      showToast(result.message, 'error');
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.voteCount - a.voteCount;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getStatusBadge = (status: FeatureRequestStatus) => {
    switch (status) {
      case FeatureRequestStatus.PENDING: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">Pending</span>;
      case FeatureRequestStatus.UNDER_REVIEW: return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase">Under Review</span>;
      case FeatureRequestStatus.PLANNED: return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase">Planned</span>;
      case FeatureRequestStatus.IN_PROGRESS: return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] font-black uppercase">In Progress</span>;
      case FeatureRequestStatus.COMPLETED: return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase">Completed</span>;
      case FeatureRequestStatus.REJECTED: return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-black uppercase">Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {toast && (
        <div className="fixed top-10 right-10 z-[3000] animate-in slide-in-from-right-4">
           <div className={`px-6 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-50 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
             <span className="font-black text-[10px] uppercase tracking-widest">{toast.message}</span>
           </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">
            <i className="bi bi-lightbulb-fill"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Request Fitur & Perbaikan</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bantu kami meningkatkan sistem ini</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'feature' | 'bugfix')}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-700"
              >
                <option value="feature">Request Fitur Baru</option>
                <option value="bugfix">Perbaikan Sistem (Bug)</option>
              </select>
            </div>
            {type === 'bugfix' && (
              <div className="flex-1">
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-700"
                  required={type === 'bugfix'}
                >
                  <option value="" disabled>Pilih Modul...</option>
                  <option value="dashboard">Dashboard</option>
                  <option value="daily_logs">Tugas Harian</option>
                  <option value="todo_list">To-Do List</option>
                  <option value="calendar">Kalender</option>
                  <option value="cv_generator">CV Generator</option>
                  <option value="online_cv">Online CV</option>
                  <option value="interview">Interview Script</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <input 
              type="text" 
              placeholder={type === 'feature' ? "Judul Request (contoh: Tambahkan fitur Dark Mode)" : "Judul Perbaikan (contoh: Tombol simpan tidak berfungsi)"}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <textarea 
              placeholder="Deskripsikan fitur atau perbaikan yang Anda inginkan secara detail (minimal 20 karakter)..." 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm min-h-[100px] resize-y"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            ></textarea>
            <p className="text-[10px] font-bold text-slate-400 mt-1 text-right">{description.length} karakter</p>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || description.length < 20}
              className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Request'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Daftar Request</h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setSortBy('votes')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'votes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Vote Terbanyak
            </button>
            <button 
              onClick={() => setSortBy('newest')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Terbaru
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <i className="bi bi-inbox text-4xl text-slate-300 mb-3 block"></i>
            <p className="text-sm font-bold text-slate-500">Belum ada request fitur.</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Jadilah yang pertama membuat request!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRequests.map(request => (
              <div key={request.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => handleVote(request.id!)}
                    className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <i className="bi bi-caret-up-fill text-slate-400 group-hover:text-indigo-600 text-lg leading-none"></i>
                  </button>
                  <span className="font-black text-slate-700">{request.voteCount}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {request.type === 'bugfix' ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-widest">Perbaikan</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">Fitur Baru</span>
                      )}
                      {request.module && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">{request.module.replace('_', ' ')}</span>
                      )}
                    </div>
                    <h4 className="font-black text-slate-800 text-base">{request.title}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-slate-600 font-medium mb-3 leading-relaxed">{request.description}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Oleh: {request.userName}</span>
                    <span>•</span>
                    <span>{new Date(request.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureRequests;
