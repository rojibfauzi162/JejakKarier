
import React, { useState, useEffect } from 'react';
import { SalesNotification, SalesPopupConfig } from '../../types';
import { 
  getSalesNotifications, 
  saveSalesNotification, 
  deleteSalesNotification, 
  getSalesPopupConfig, 
  saveSalesPopupConfig 
} from '../../services/firebase';

const SalesNotificationManager: React.FC = () => {
  const [config, setConfig] = useState<SalesPopupConfig | null>(null);
  const [notifications, setNotifications] = useState<SalesNotification[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<Partial<SalesNotification>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [conf, notifs] = await Promise.all([
      getSalesPopupConfig(),
      getSalesNotifications()
    ]);
    setConfig(conf);
    // Ensure all notifications have an ID to avoid issues with adding/editing
    const sanitizedNotifs = notifs.map((n, i) => ({
      ...n,
      id: n.id || `notif_legacy_${i}_${Date.now()}`
    }));
    setNotifications(sanitizedNotifs);
    setIsLoading(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config) {
      await saveSalesPopupConfig(config);
      alert('Konfigurasi berhasil disimpan!');
    }
  };

  const handleSaveNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentNotif.nama && currentNotif.paket) {
      const notifToSave = {
        ...currentNotif,
        id: currentNotif.id || `manual_${Date.now()}`,
        createdAt: currentNotif.createdAt || new Date().toISOString(),
        aksi: currentNotif.aksi || 'baru saja bergabung'
      } as SalesNotification;

      await saveSalesNotification(notifToSave);
      setIsEditing(false);
      setCurrentNotif({});
      loadData();
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (window.confirm('Hapus notifikasi ini?')) {
      await deleteSalesNotification(id);
      loadData();
    }
  };

  if (isLoading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pengaturan Sales Popup</h2>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('test-sales-popup'));
              alert('Sinyal test dikirim! Jika Anda membuka Landing Page di tab lain, popup akan muncul segera.');
            }}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-all"
          >
            Test Popup
          </button>
        </div>
        {config && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input 
                  type="checkbox" 
                  checked={config.isEnabled} 
                  onChange={e => setConfig({...config, isEnabled: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Aktifkan Popup</label>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input 
                  type="checkbox" 
                  checked={config.maskName} 
                  onChange={e => setConfig({...config, maskName: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Samarkan Nama (A***)</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode Sumber Data</label>
                <select 
                  value={config.mode} 
                  onChange={e => setConfig({...config, mode: e.target.value as any})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="real">Real Data Only</option>
                  <option value="manual">Manual Data Only</option>
                  <option value="mix">Mix (Real + Manual)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interval Muncul (Min - Max Detik)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={config.intervalMin} 
                    onChange={e => setConfig({...config, intervalMin: parseInt(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    value={config.intervalMax} 
                    onChange={e => setConfig({...config, intervalMax: parseInt(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi Tampil (Detik)</label>
                <input 
                  type="number" 
                  value={config.displayDuration} 
                  onChange={e => setConfig({...config, displayDuration: parseInt(e.target.value)})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                />
              </div>
            </div>

            {config.mode === 'mix' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rasio Data Manual (%)</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={config.manualRatio} 
                  onChange={e => setConfig({...config, manualRatio: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>REAL DATA</span>
                  <span className="text-indigo-600 font-black">{config.manualRatio}% MANUAL</span>
                </div>
              </div>
            )}

            <button type="submit" className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
              Simpan Konfigurasi
            </button>
          </form>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Manual (Dummy)</h2>
          <button 
            onClick={() => { setIsEditing(true); setCurrentNotif({}); }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
          >
            Tambah Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paket</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Label</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {notifications.map(notif => (
                <tr key={notif.id}>
                  <td className="py-4 text-sm font-bold text-slate-700">{notif.nama}</td>
                  <td className="py-4 text-sm text-slate-500">{notif.paket}</td>
                  <td className="py-4 text-sm text-slate-500">{notif.aksi || '-'}</td>
                  <td className="py-4">
                    {notif.label && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                        {notif.label}
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setIsEditing(true); setCurrentNotif(notif); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button onClick={() => handleDeleteNotif(notif.id!)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">
              {currentNotif.id ? 'Edit Data Manual' : 'Tambah Data Manual'}
            </h3>
            <form onSubmit={handleSaveNotif} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama User</label>
                <input 
                  type="text" 
                  value={currentNotif.nama || ''} 
                  onChange={e => setCurrentNotif({...currentNotif, nama: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                  placeholder="Contoh: Ahmad"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paket</label>
                <input 
                  type="text" 
                  value={currentNotif.paket || ''} 
                  onChange={e => setCurrentNotif({...currentNotif, paket: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                  placeholder="Contoh: Paket Tahunan"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi (Opsional)</label>
                <input 
                  type="text" 
                  value={currentNotif.aksi || ''} 
                  onChange={e => setCurrentNotif({...currentNotif, aksi: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                  placeholder="Contoh: baru saja membeli"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Label Tambahan (Opsional)</label>
                <input 
                  type="text" 
                  value={currentNotif.label || ''} 
                  onChange={e => setCurrentNotif({...currentNotif, label: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                  placeholder="Contoh: Hemat 80%"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesNotificationManager;
