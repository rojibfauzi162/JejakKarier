
import React, { useState, useEffect } from 'react';
import { TrackingConfig } from '../../types';
import { getTrackingConfig, saveTrackingConfig } from '../../services/firebase';
import { trackingService } from '../../services/trackingService';

interface TrackingSettingsProps {
  onToast: (m: string, t?: 'success' | 'error') => void;
}

const TrackingSettings: React.FC<TrackingSettingsProps> = ({ onToast }) => {
  const [config, setConfig] = useState<TrackingConfig>({
    metaPixelId: '',
    metaConversionAccessToken: '',
    metaTestCode: '',
    googleAnalyticsId: '',
    tiktokPixelId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTrackingConfig().then(res => {
      if (res) setConfig(res);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveTrackingConfig(config);
      // Re-initialize tracking service immediately
      trackingService.init(config);
      onToast("Pengaturan Tracking berhasil disimpan & diterapkan! 📊", 'success');
    } catch (err) {
      onToast("Gagal menyimpan pengaturan tracking.", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestMeta = async () => {
    if (!config.metaPixelId) {
      onToast("Input Meta Pixel ID terlebih dahulu.", 'error');
      return;
    }
    onToast("Mengirim Test Event (PageView)...", 'success');
    try {
      // Re-init just in case
      trackingService.init(config);
      // Track PageView as test
      trackingService.trackEvent('PageView', { test_event: true });
      
      // If CAPI is configured, it will also try to send Purchase as a more robust test if requested, 
      // but PageView is enough to check Pixel detection.
      onToast("Test Event terkirim! Cek Meta Pixel Helper atau Events Manager.", 'success');
    } catch (err) {
      onToast("Gagal mengirim test event.", 'error');
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Memuat Data Tracking...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
       <div className="bg-white p-8 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-50">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl">
                   <i className="bi bi-bar-chart-steps"></i>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ads Tracking Center</h3>
                   <p className="text-slate-400 font-medium text-sm mt-1">Kelola Pixel & Analytics untuk optimasi kampanye iklan.</p>
                </div>
             </div>
             <button 
               type="button"
               onClick={handleTestMeta}
               className="px-6 py-3 bg-blue-50 text-blue-600 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-100 transition-all active:scale-95"
             >
                <i className="bi bi-send-fill mr-2"></i> Test Pixel
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Meta Pixel & Conversion API */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <i className="bi bi-facebook text-blue-600 text-xl"></i>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Pixel ID</label>
                   </div>
                   <input 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs focus:border-indigo-400 transition-all"
                    placeholder="1234567890..."
                    value={config.metaPixelId || ''}
                    onChange={e => setConfig({...config, metaPixelId: e.target.value.trim()})}
                   />
                   
                   <div className="pt-2 space-y-4">
                      <div className="flex items-center gap-3">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conversion API Access Token</label>
                      </div>
                      <textarea 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-[10px] focus:border-indigo-400 transition-all min-h-[100px]"
                       placeholder="EAAB..."
                       value={config.metaConversionAccessToken || ''}
                       onChange={e => setConfig({...config, metaConversionAccessToken: e.target.value.trim()})}
                      />
                      
                      <div className="flex items-center gap-3">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Test Event Code (Optional)</label>
                      </div>
                      <input 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs focus:border-indigo-400 transition-all"
                       placeholder="TEST12345"
                       value={config.metaTestCode || ''}
                       onChange={e => setConfig({...config, metaTestCode: e.target.value.trim()})}
                      />
                   </div>
                   
                   <p className="text-[8px] text-slate-400 font-medium px-1 uppercase">Event: PageView, InitiateCheckout, Purchase</p>
                </div>

                {/* Google Analytics */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <i className="bi bi-google text-rose-500 text-xl"></i>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GA4 Measurement ID</label>
                   </div>
                   <input 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs focus:border-indigo-400 transition-all"
                    placeholder="G-XXXXXXX"
                    value={config.googleAnalyticsId || ''}
                    onChange={e => setConfig({...config, googleAnalyticsId: e.target.value.trim()})}
                   />
                   <p className="text-[8px] text-slate-400 font-medium px-1 uppercase">Event: page_view, begin_checkout, purchase</p>
                </div>

                {/* TikTok Pixel */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <i className="bi bi-tiktok text-slate-900 text-xl"></i>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TikTok Pixel ID</label>
                   </div>
                   <input 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs focus:border-indigo-400 transition-all"
                    placeholder="CXXXXXXXXXXXX"
                    value={config.tiktokPixelId || ''}
                    onChange={e => setConfig({...config, tiktokPixelId: e.target.value.trim()})}
                   />
                   <p className="text-[8px] text-slate-400 font-medium px-1 uppercase">Event: PageView, InitiateCheckout, CompletePayment</p>
                </div>
             </div>

             <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <i className="bi bi-info-circle-fill"></i> Panduan Integrasi
                </h4>
                <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                   <p>• <b>Landing Page:</b> Menembak event <b>PageView</b> saat diakses.</p>
                   <p>• <b>Checkout Page:</b> Menembak event <b>InitiateCheckout</b> saat form dibuka.</p>
                   <p>• <b>Paid Success:</b> Menembak event <b>Purchase</b> saat status langganan menjadi aktif.</p>
                </div>
             </div>

             <button 
              disabled={saving}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
             >
                {saving ? 'Menyimpan...' : 'Terapkan ID Tracking'}
             </button>
          </form>
       </div>
    </div>
  );
};

export default TrackingSettings;
