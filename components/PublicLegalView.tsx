
import React, { useEffect, useState } from 'react';
import { getLegalConfig } from '../services/firebase';
import { LegalConfig } from '../types';

interface PublicLegalViewProps {
  type: 'privacy' | 'terms';
  onBack?: () => void;
}

const PublicLegalView: React.FC<PublicLegalViewProps> = ({ type, onBack }) => {
  const [config, setConfig] = useState<LegalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk memuat data dari Firebase
  const fetchLegalData = async () => {
    setLoading(true);
    try {
      const res = await getLegalConfig();
      if (res) {
        setConfig(res);
      } else {
        // Fallback jika dokumen tidak ada di Firestore
        setConfig({ privacyPolicy: '', termsOfService: '' });
      }
    } catch (err) {
      console.error("Gagal memuat informasi legal:", err);
      setConfig({ privacyPolicy: '', termsOfService: '' });
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data setiap kali 'type' (privacy/terms) berubah
  useEffect(() => {
    fetchLegalData();
  }, [type]);

  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  
  // Ambil konten yang sesuai berdasarkan tipe props
  const rawContent = type === 'privacy' ? config?.privacyPolicy : config?.termsOfService;
  const safeContent = typeof rawContent === 'string' ? rawContent : '';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Menyinkronkan Dokumen Legal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      {/* Navbar Minimalis */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBack}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">F</div>
            <span className="text-lg font-black tracking-tighter">FokusKarir</span>
          </div>
          <button 
            onClick={handleBack} 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
          >
            Kembali ke Beranda
          </button>
        </div>
      </nav>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto px-6 pt-12 lg:pt-20">
        <div className="bg-white p-8 lg:p-20 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
           <header className="mb-12 pb-12 border-b border-slate-50">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
                Official Release
              </div>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 uppercase leading-none mb-6">{title}</h1>
              <div className="flex items-center gap-4 text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Terakhir Diperbarui: {config?.updatedAt ? new Date(config.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja'}
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                <p className="text-[10px] font-black uppercase tracking-widest">v1.1</p>
              </div>
           </header>

           <article className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-600 leading-[1.8] font-medium text-base lg:text-lg">
                 {safeContent && safeContent.trim() !== '' ? (
                   safeContent
                 ) : (
                   <div className="py-12 px-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                      <p className="text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">Konten {title} sedang dalam pemeliharaan.</p>
                      <p className="text-slate-300 text-[9px] mt-2 font-medium">Administrator belum memasukkan teks resmi untuk bagian ini.</p>
                   </div>
                 )}
              </div>
           </article>

           <div className="mt-20 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <i className="bi bi-shield-lock"></i>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Anda dilindungi oleh protokol keamanan SSL<br/>dan kebijakan privasi terbaru kami.</p>
              </div>
              <button onClick={() => window.print()} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">
                Cetak Dokumen
              </button>
           </div>
        </div>
        
        <footer className="mt-12 text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 FokusKarir Platform. Hak Cipta Dilindungi.</p>
        </footer>
      </main>
    </div>
  );
};

export default PublicLegalView;
