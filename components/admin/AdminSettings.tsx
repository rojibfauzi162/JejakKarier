
import React, { useState, useEffect } from 'react';
import { LegalConfig } from '../../types';
import { getLegalConfig, saveLegalConfig } from '../../services/firebase';

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<LegalConfig>({
    privacyPolicy: '',
    termsOfService: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await getLegalConfig();
        if (res) setConfig(res);
      } catch (e) {
        console.error("Gagal memuat konfigurasi legal:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveLegalConfig(config);
      setMessage({ text: 'Konfigurasi legal berhasil disimpan ke server! ✅', type: 'success' });
    } catch (e) {
      setMessage({ text: 'Gagal menyimpan konfigurasi legal. Silakan coba lagi.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Memuat Konfigurasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-20">
      {message && (
        <div className={`p-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border flex items-center gap-4 animate-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} text-lg`}></i>
          {message.text}
        </div>
      )}

      <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-12">
        <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
            <i className="bi bi-gear-fill"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pengaturan Legal Publik</h3>
            <p className="text-slate-400 font-medium text-sm">Kelola konten Kebijakan Privasi dan Syarat Layanan aplikasi.</p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Privacy Policy (Kebijakan Privasi)</label>
            <div className="rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 p-6">
              <textarea
                className="w-full min-h-[300px] bg-transparent outline-none font-medium text-sm text-slate-700 leading-relaxed resize-y focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={config.privacyPolicy}
                onChange={(e) => setConfig({ ...config, privacyPolicy: e.target.value })}
                placeholder="Tuliskan kebijakan privasi di sini..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Terms of Service (Syarat Layanan)</label>
            <div className="rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 p-6">
              <textarea
                className="w-full min-h-[300px] bg-transparent outline-none font-medium text-sm text-slate-700 leading-relaxed resize-y focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={config.termsOfService}
                onChange={(e) => setConfig({ ...config, termsOfService: e.target.value })}
                placeholder="Tuliskan syarat layanan di sini..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-arrow-up-fill text-sm"></i>
                Update Konten Legal
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0"><i className="bi bi-info-circle"></i></div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-black uppercase tracking-tight mb-1">Informasi Pembaruan</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">Perubahan pada konten ini akan langsung berdampak pada halaman yang dapat diakses publik melalui link di footer landing page. Pastikan konten yang dimasukkan sudah sesuai dengan standar hukum yang berlaku.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
