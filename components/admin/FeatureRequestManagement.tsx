import React, { useState, useEffect } from 'react';
import { FeatureRequest, FeatureRequestStatus } from '../../types';
import { getFeatureRequests, updateFeatureRequestStatus, toggleFeatureRequestVisibility, deleteFeatureRequest } from '../../services/featureRequestService';

const FeatureRequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('votes');

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getFeatureRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (requestId: string, status: FeatureRequestStatus) => {
    try {
      await updateFeatureRequestStatus(requestId, status);
      showToast('Status berhasil diubah.', 'success');
      fetchRequests();
    } catch (error) {
      showToast('Gagal mengubah status.', 'error');
    }
  };

  const handleToggleVisibility = async (requestId: string, isHidden: boolean) => {
    try {
      await toggleFeatureRequestVisibility(requestId, !isHidden);
      showToast(`Request berhasil di${!isHidden ? 'sembunyikan' : 'tampilkan'}.`, 'success');
      fetchRequests();
    } catch (error) {
      showToast('Gagal mengubah visibilitas.', 'error');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus request ini?')) return;
    try {
      await deleteFeatureRequest(requestId);
      showToast('Request berhasil dihapus.', 'success');
      fetchRequests();
    } catch (error) {
      showToast('Gagal menghapus request.', 'error');
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.voteCount - a.voteCount;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-10 right-10 z-[3000] animate-in slide-in-from-right-4">
           <div className={`px-6 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-50 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
             <span className="font-black text-[10px] uppercase tracking-widest">{toast.message}</span>
           </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">
              <i className="bi bi-list-task"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manajemen Request Fitur</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelola masukan dan perbaikan dari user</p>
            </div>
          </div>
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                  <th className="px-6 py-4">Request</th>
                  <th className="px-6 py-4 text-center">Vote</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Visibilitas</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedRequests.map(request => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        {request.type === 'bugfix' ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-widest">Perbaikan</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">Fitur Baru</span>
                        )}
                        {request.module && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">{request.module.replace('_', ' ')}</span>
                        )}
                      </div>
                      <p className="font-black text-sm text-slate-800 mb-1">{request.title}</p>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-2">{request.description}</p>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{request.userName}</span>
                        <span>•</span>
                        <span>{new Date(request.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg font-black text-sm">
                        {request.voteCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.id!, e.target.value as FeatureRequestStatus)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-700 outline-none"
                      >
                        <option value={FeatureRequestStatus.PENDING}>Pending</option>
                        <option value={FeatureRequestStatus.UNDER_REVIEW}>Under Review</option>
                        <option value={FeatureRequestStatus.PLANNED}>Planned</option>
                        <option value={FeatureRequestStatus.IN_PROGRESS}>In Progress</option>
                        <option value={FeatureRequestStatus.COMPLETED}>Completed</option>
                        <option value={FeatureRequestStatus.REJECTED}>Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleVisibility(request.id!, request.isHidden)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${request.isHidden ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                      >
                        {request.isHidden ? 'Hidden' : 'Visible'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(request.id!)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm ml-auto"
                        title="Hapus Request"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureRequestManagement;
