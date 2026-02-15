
import React, { useState, useEffect, useRef } from 'react';
import { LegalConfig, LandingPageConfig } from '../../types';
import { getLegalConfig, saveLegalConfig, getLandingPageConfig, saveLandingPageConfig } from '../../services/firebase';

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<LegalConfig>({
    privacyPolicy: '',
    termsOfService: ''
  });
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>({
    videoDemoLinks: {},
    desktopDashboardImg: '',
    mobileDashboardImg: '',
    adminWhatsApp: '628123456789',
    businessEmail: '',
    businessPhone: '',
    businessAddress: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const desktopFileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const ALL_FEATURES = [
    { id: 'daily-growth', label: 'Daily Growth Registry' },
    { id: 'work-reflection', label: 'Work Reflection' },
    { id: 'perf-insight', label: 'Performance Insights' },
    { id: 'steps-growth', label: 'Steps of Growth' },
    { id: 'ai-strategist', label: 'AI Strategist' },
    { id: 'skill-matrix', label: 'Skill Matrix Tracker' },
    { id: 'career-roadmap', label: 'Career Roadmap' },
    { id: 'monthly-review', label: 'Monthly Review' },
    { id: 'digital-presence', label: 'Digital Presence' },
    { id: 'cv-export', label: 'One-Click CV Export' },
    { id: 'job-hunt', label: 'Job Hunt Hub' },
    { id: 'networking', label: 'Networking Vault' },
  ];

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [resLegal, resLanding] = await Promise.all([
          getLegalConfig(),
          getLandingPageConfig()
        ]);
        if (resLegal) setConfig(resLegal);
        if (resLanding) {
          setLandingConfig({
            ...resLanding,
            adminWhatsApp: resLanding.adminWhatsApp || '628123456789',
            businessEmail: resLanding.businessEmail || '',
            businessPhone: resLanding.businessPhone || '',
            businessAddress: resLanding.businessAddress || ''
          });
        }
      } catch (e) {
        console.error("Gagal memuat konfigurasi:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        saveLegalConfig(config),
        saveLandingPageConfig(landingConfig)
      ]);
      setMessage({ text: 'Seluruh konfigurasi berhasil disimpan ke server! ✅', type: 'success' });
    } catch (e) {
      setMessage({ text: 'Gagal menyimpan konfigurasi. Silakan coba lagi.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const updateVideoLink = (featureId: string, url: string) => {
    setLandingConfig(prev => ({
      ...prev,
      videoDemoLinks: {
        ...prev.videoDemoLinks,
        [featureId]: url
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'desktopDashboardImg' | 'mobileDashboardImg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLandingConfig(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

      {/* SECTION: ASSET VISUAL LANDING PAGE */}
      <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border-2 border-indigo-50 space-y-12">
        <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
            <i className="bi bi-images"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Visual Sistem Dashboard</h3>
            <p className="text-slate-400 font-medium text-sm">Update gambar pratinjau sistem untuk laptop dan mobile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dashboard Desktop (Laptop)</label>
              
              {landingConfig.desktopDashboardImg && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 mb-4 bg-slate-50">
                  <img src={landingConfig.desktopDashboardImg} alt="Preview Desktop" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  placeholder="Atau masukkan URL gambar..."
                  value={landingConfig.desktopDashboardImg || ''}
                  onChange={e => setLandingConfig({...landingConfig, desktopDashboardImg: e.target.value})}
                />
                <button 
                  onClick={() => desktopFileRef.current?.click()}
                  className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                >
                  Upload
                </button>
              </div>
              <input type="file" ref={desktopFileRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'desktopDashboardImg')} />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dashboard Mobile (HP)</label>
              
              {landingConfig.mobileDashboardImg && (
                <div className="w-40 mx-auto aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-100 mb-4 bg-slate-50">
                  <img src={landingConfig.mobileDashboardImg} alt="Preview Mobile" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  placeholder="Atau masukkan URL gambar..."
                  value={landingConfig.mobileDashboardImg || ''}
                  onChange={e => setLandingConfig({...landingConfig, mobileDashboardImg: e.target.value})}
                />
                <button 
                  onClick={() => mobileFileRef.current?.click()}
                  className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                >
                  Upload
                </button>
              </div>
              <input type="file" ref={mobileFileRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'mobileDashboardImg')} />
           </div>
        </div>
      </div>

      {/* SECTION: KONTAK ADMIN & IDENTITAS USAHA */}
      <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-indigo-100 space-y-12">
        <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
            <i className="bi bi-shop"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Identitas & Kontak Usaha</h3>
            <p className="text-slate-400 font-medium text-sm">Informasi ini akan ditampilkan di footer Landing Page publik.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Admin (628...)</label>
              <input 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-black text-indigo-600 focus:border-indigo-400 transition-all text-sm"
                placeholder="62812..."
                value={landingConfig.adminWhatsApp || ''}
                onChange={e => setLandingConfig({...landingConfig, adminWhatsApp: e.target.value.replace(/[^0-9]/g, '')})}
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Bisnis</label>
              <input 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-black text-slate-700 focus:border-indigo-400 transition-all text-sm"
                placeholder="support@fokuskarir.com"
                value={landingConfig.businessEmail || ''}
                onChange={e => setLandingConfig({...landingConfig, businessEmail: e.target.value})}
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Telepon Kantor</label>
              <input 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-black text-slate-700 focus:border-indigo-400 transition-all text-sm"
                placeholder="021-xxxxxx"
                value={landingConfig.businessPhone || ''}
                onChange={e => setLandingConfig({...landingConfig, businessPhone: e.target.value})}
              />
           </div>
           <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Usaha</label>
              <textarea 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-black text-slate-700 focus:border-indigo-400 transition-all text-sm resize-none"
                placeholder="Jl. Teknologi No. 123, Jakarta Selatan..."
                rows={3}
                value={landingConfig.businessAddress || ''}
                onChange={e => setLandingConfig({...landingConfig, businessAddress: e.target.value})}
              />
           </div>
        </div>
      </div>

      {/* SECTION: VIDEO DEMO CONFIG */}
      <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-12">
        <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
            <i className="bi bi-play-btn-fill"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Video Demo Landing Page</h3>
            <p className="text-slate-400 font-medium text-sm">Kelola tautan video demo (YouTube/Vimeo/Direct) untuk masing-masing fitur.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {ALL_FEATURES.map(f => (
             <div key={f.id} className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                <input 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="https://www.youtube.com/embed/..."
                  value={landingConfig.videoDemoLinks?.[f.id] || ''}
                  onChange={e => updateVideoLink(f.id, e.target.value)}
                />
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-12">
        <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
            <i className="bi bi-gear-fill"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pengaturan Legal Publik</h3>
            <p className="text-slate-400 font-medium text-sm">Kelola konten Kebijasi Privasi dan Syarat Layanan aplikasi.</p>
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
                Update Seluruh Pengaturan
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0"><i className="bi bi-info-circle"></i></div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-black uppercase tracking-tight mb-1">Informasi Pembaruan</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">Perubahan pada konten ini akan langsung berdampak pada landing page publik. Pastikan link video demo fitur sudah dalam format yang benar (misal embed link untuk YouTube) agar dapat diputar langsung di halaman depan.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
