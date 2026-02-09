
import React, { useState, useMemo, useEffect } from 'react';
import { SubscriptionProduct, LandingPageConfig } from '../types';
import { getLandingPageConfig } from '../services/firebase';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onShowLegal?: (type: 'privacy' | 'terms') => void;
  products?: SubscriptionProduct[];
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onShowLegal, products }) => {
  // Logic: Diubah ke true agar semua fitur tampil otomatis tanpa interaksi user
  const [showAllFeatures, setShowAllFeatures] = useState(true);
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // LOGIC: Sync all plans from admin data if available
  const monthlyPlan = useMemo(() => products?.find(p => p.durationDays >= 25 && p.durationDays <= 35 && p.price > 0), [products]);
  const quarterlyPlan = useMemo(() => products?.find(p => p.durationDays >= 85 && p.durationDays <= 100 && p.price > 0), [products]);
  const annualPlan = useMemo(() => products?.find(p => p.durationDays >= 350 && p.price > 0), [products]);

  // Load landing page config for video links
  useEffect(() => {
    getLandingPageConfig().then(res => {
      if (res) setLandingConfig(res);
    });
  }, []);

  const getDiscountLabel = (plan: any, fallback: string) => {
    if (plan && plan.originalPrice && plan.originalPrice > plan.price) {
      const pct = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
      const nominal = (plan.originalPrice - plan.price).toLocaleString('id-ID');
      // Tampilkan nominal diskon untuk menarik minat
      return `Hemat Rp ${nominal} (${pct}%)`;
    }
    return fallback;
  };

  const getPriceFormatted = (plan: any, fallback: string) => {
    return plan ? plan.price.toLocaleString('id-ID') : fallback;
  };

  const getOriginalPriceFormatted = (plan: any, fallback: string) => {
    return plan && plan.originalPrice ? plan.originalPrice.toLocaleString('id-ID') : fallback;
  };

  // CATEGORIZED FEATURES DATA
  const featureCategories = [
    {
      id: 'core',
      name: "Core Growth Engine",
      desc: "Infrastruktur utama untuk mendokumentasikan performa harian Anda.",
      bg: "bg-white",
      features: [
        { id: 'daily-growth', icon: "bi-journal-text", title: "Daily Growth Registry", desc: "Catat setiap aktivitas dan output harian untuk membangun basis data performa yang tervalidasi secara objektif." },
        { id: 'work-reflection', icon: "bi-chat-quote", title: "Work Reflection", desc: "Sesi refleksi harian untuk mendeteksi pola mood, energi, dan mencegah burnout secara dini." },
        { id: 'ai-reflection', icon: "bi-magic", title: "AI Work Reflection", desc: "Sistem cerdas yang menganalisis pola refleksi Anda untuk memberikan insight emosional dan mental." },
        { id: 'calendar', icon: "bi-calendar3", title: "Career Calendar", desc: "Jadwalkan interview, tenggat sertifikasi, dan evaluasi berkala dalam satu kalender karir terintegrasi." },
        { id: 'perf-insight', icon: "bi-graph-up-arrow", title: "Performance Insights", desc: "Visualisasi tren produktivitas berkala yang memudahkan Anda saat sesi performance review tahunan." },
        { id: 'steps-growth', icon: "bi-check2-square", title: "Steps of Growth", desc: "Sistem To-Do list cerdas yang memastikan setiap langkah kecil Anda selaras dengan strategi karir jangka panjang." },
      ]
    },
    {
      id: 'intel',
      name: "Strategic Intelligence",
      desc: "Gunakan sistem pintar untuk merancang jalur karir masa depan.",
      bg: "bg-slate-50",
      features: [
        { id: 'ai-strategist', icon: "bi-cpu", title: "AI Strategist", desc: "Asisten cerdas yang memindai gap skill Anda dan memberikan rekomendasi roadmap pelatihan paling relevan." },
        { id: 'skill-matrix', icon: "bi-bullseye", title: "Skill Matrix Tracker", desc: "Petakan tingkat penguasaan kompetensi Anda dalam bentuk radar chart untuk melihat area yang perlu ditingkatkan." },
        { id: 'career-roadmap', icon: "bi-rocket-takeoff", title: "Career Roadmap", desc: "Visualisasikan perjalanan karir Anda dari posisi saat ini hingga target jabatan impian di masa depan." },
        { id: 'monthly-review', icon: "bi-calendar-check", title: "Monthly Review", desc: "Evaluasi bulanan terstruktur yang merangkum pencapaian dan kegagalan untuk rencana pertumbuhan yang lebih baik." },
      ]
    },
    {
      id: 'reach',
      name: "Professional Reach",
      desc: "Perluas pengaruh dan kredibilitas Anda di mata industri.",
      bg: "bg-indigo-50/40",
      features: [
        { id: 'ai-insight-activity', icon: "bi-file-earmark-bar-graph", title: "AI Insight Activity", desc: "Resume laporan pekerjaan otomatis berbasis AI untuk validasi kontribusi profesional Anda." },
        { id: 'digital-presence', icon: "bi-globe", title: "Digital Presence", desc: "Ubah rekam jejak Anda menjadi landing page portofolio profesional yang siap dibagikan kapan saja." },
        { id: 'cv-export', icon: "bi-file-earmark-pdf", title: "One-Click CV Export", desc: "Ekspor seluruh kualifikasi Anda menjadi CV PDF dengan desain modern hanya dalam hitungan detik." },
        { id: 'job-hunt', icon: "bi-briefcase", title: "Job Hunt Hub", desc: "Pantau setiap status lamaran kerja Anda agar tidak ada peluang karir yang terlewatkan." },
        { id: 'networking', icon: "bi-people", title: "Networking Vault", desc: "Kelola database relasi profesional dan mentor untuk menjaga kualitas hubungan networking jangka panjang." },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">F</div>
            <span className="text-xl font-black tracking-tighter">FokusKarir</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={onLogin} className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Masuk</button>
            <button onClick={onStart} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Mulai Sekarang</button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              Intelligence Career Assistant v2.0
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[1] text-slate-900 uppercase">
              Ubah Data Kerja Anda Menjadi <span className="text-indigo-600">Aset Karir</span> Berharga.
            </h1>
            <p className="text-base lg:text-lg text-slate-500 font-medium leading-relaxed max-w-xl italic">
              "Karier yang hebat tidak dibangun dalam semalam, tapi melalui setiap kontribusi harian yang tercatat secara cerdas."
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStart} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-[2rem] uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group">
                Buat Portofolio Anda 
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
              <div className="flex items-center gap-4 px-2">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-200"></div>)}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Digunakan oleh 1,200+<br/>Profesional Ambisius</p>
              </div>
            </div>
          </div>
          <div className="relative">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                   <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Profesional Indonesia Wanita" />
                   </div>
                   <div className="aspect-square rounded-[2.5rem] bg-indigo-600 p-6 flex flex-col justify-end text-white shadow-xl shadow-indigo-200">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Success Rate</p>
                      <p className="text-2xl font-black">94% <span className="text-[10px] font-bold block opacity-40">Career Improvement</span></p>
                   </div>
                </div>
                <div className="pt-8 space-y-4">
                   <div className="aspect-square rounded-[2.5rem] bg-slate-900 p-6 flex flex-col justify-center items-center text-center text-white shadow-xl">
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-lg mb-3 italic">✨</div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] leading-relaxed italic opacity-80">"Data mengalahkan asumsi."</p>
                   </div>
                   <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Profesional Indonesia Pria" />
                   </div>
                </div>
             </div>
             <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS SECTION - UPDATED HEADLINE & IMAGE TO INDONESIAN PROFILE */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-600">The Struggle is Real</h2>
              <h3 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                Sering Merasa Kerja Sudah Capek, Tapi Karier <span className="text-rose-600">Gitu-Gitu Aja?</span>
              </h3>
              <p className="text-slate-500 font-medium text-lg italic leading-relaxed">
                "Kami paham kok, rasanya capek kalau sudah kerja maksimal tapi progres karier kayak jalan di tempat karena data pencapaian kita nggak terkelola."
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <PainPointCard 
                title="Laporan Masih Manual & Berantakan" 
                desc="Menghabiskan waktu berjam-jam hanya untuk merekap laporan harian, mingguan, hingga bulanan yang data-nya tercerai-berai." 
                icon="bi-file-earmark-excel"
              />
              <PainPointCard 
                title="Karier Jalan, Tapi Terasa Stagnan" 
                desc="Anda bekerja keras setiap hari, namun tidak punya indikator progres yang jelas. Semua terasa seperti 'sibuk' tanpa ada pertumbuhan nyata." 
                icon="bi-graph-down"
              />
              <PainPointCard 
                title="Lupa Detail Pencapaian Sendiri" 
                desc="Saat disuruh menceritakan kontribusi di depan HR atau atasan, pikiran mendadak 'blank' karena tidak ada catatan skill yang tervalidasi." 
                icon="bi-journal-x"
              />
              <PainPointCard 
                title="Tools Terlalu Banyak & Tak Nyambung" 
                desc="To-do list di aplikasi A, CV di B, refleksi di C. Tidak ada satu sistem yang merangkai 'cerita utuh' perjalanan karier Anda." 
                icon="bi-puzzle"
              />
            </div>
          </div>
          
          <div className="relative">
             <div className="aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1543269664-566a597a4a44?q=80&w=800&auto=format&fit=crop" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                  alt="Indonesian Professional Stressed and Exhausted at Office" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-12">
                   <p className="text-white text-xl font-black italic">"Kapan terakhir kali aku bangga dengan kinerjaku sendiri?"</p>
                </div>
             </div>
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-[200px] animate-bounce">
                <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Career Alert</p>
                <p className="text-xs font-bold text-slate-800">74% profesional lupa 60% pencapaian mereka dalam 1 tahun.</p>
             </div>
          </div>
        </div>
      </section>

      {/* INTRO SYSTEM SECTION - REFINED SINKRONISASI GAMBAR */}
      <section className="py-32 bg-white text-center space-y-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          <div className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em]">Kenali Teman Karir Baru Anda</div>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase tracking-tight leading-none">Kenalkan, FokusKarir.</h2>
          <p className="text-lg lg:text-2xl text-slate-600 font-medium leading-relaxed italic px-4">
            "Ngerasa kerjaan berantakan? Tenang, kami bantu beresin! Di FokusKarir, semua usaha harianmu bakal kami sulap jadi portofolio keren yang bikin karier makin melesat. Gak ada lagi progres yang gak kelihatan!"
          </p>
          <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        {/* SYSTEM MOCKUP / DASHBOARD IMAGES RESPONSIVE FIX */}
        <div className="max-w-6xl mx-auto px-6 animate-in slide-in-from-bottom-12 duration-1000">
           {/* Desktop Only View */}
           <div className="hidden lg:block relative p-2 bg-slate-200 rounded-[3rem] shadow-inner border-2 border-slate-300">
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 min-h-[300px] flex items-center justify-center">
                 <img 
                    src={landingConfig?.desktopDashboardImg || "https://static.re-chat.com/agent/47596b42-7065-4f7f-a681-420364952002/98a0058b-f41e-4505-ba2e-f78a8767e7c5.png"} 
                    alt="FokusKarir Dashboard Desktop" 
                    className="w-full h-auto block object-contain"
                    onError={(e: any) => { e.target.src = "https://static.re-chat.com/agent/47596b42-7065-4f7f-a681-420364952002/98a0058b-f41e-4505-ba2e-f78a8767e7c5.png"; }}
                 />
              </div>
           </div>
           
           {/* Mobile Only View */}
           <div className="lg:hidden relative max-w-[320px] mx-auto p-1.5 bg-slate-200 rounded-[2.5rem] shadow-inner border border-slate-300">
              <div className="bg-white rounded-[2.2rem] overflow-hidden shadow-2xl border border-slate-100 min-h-[400px] flex items-center justify-center">
                 <img 
                    src={landingConfig?.mobileDashboardImg || "https://static.re-chat.com/agent/47596b42-7065-4f7f-a681-420364952002/d58309a4-ec6a-4933-87f5-a0c49f854b42.png"} 
                    alt="FokusKarir Hub Mobile" 
                    className="w-full h-auto block object-contain"
                    onError={(e: any) => { e.target.src = "https://static.re-chat.com/agent/47596b42-7065-4f7f-a681-420364952002/d58309a4-ec6a-4933-87f5-a0c49f854b42.png"; }}
                 />
              </div>
           </div>
        </div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 -z-10"></div>
      </section>

      {/* GAIN SECTION - MAPPED TO NEW PAIN POINTS */}
      <section className="py-24 bg-emerald-50/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">The Solution</h2>
            <h3 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">Bangun Masa Depan Berbasis Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GainCard 
              title="Laporan Otomatis & Terstruktur" 
              desc="Lupakan rekap manual yang melelahkan. Dapatkan laporan harian hingga bulanan yang tersaji indah dan siap dipresentasikan kapan saja." 
              icon="bi-lightning-charge-fill"
            />
            <GainCard 
              title="Bukti Kontribusi Terpercaya" 
              desc="Setiap kontribusi kecil tercatat rapi sebagai bukti kuat kualifikasi profesional Anda, memudahkan Anda saat interview atau nego gaji." 
              icon="bi-shield-check"
            />
            <GainCard 
              title="Ekosistem Karir Terintegrasi" 
              desc="Satu tempat untuk semuanya: Agenda, CV Digital, hingga AI Insight. Bangun cerita utuh karier Anda tanpa terpencar di banyak aplikasi." 
              icon="bi-grid-1x2-fill"
            />
          </div>
        </div>
      </section>

      {/* INTRO TO FEATURES */}
      <section className="pt-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center space-y-6">
          <div className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-100">
            What We Do Best
          </div>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-none uppercase">
            Satu Platform, <br className="hidden md:block" /> <span className="text-indigo-600">Akselerasi Tanpa Batas.</span>
          </h2>
          <p className="text-base lg:text-lg text-slate-500 font-medium max-w-2xl mx-auto italic">
            "Kami mengintegrasikan dokumentasi performa harian dengan sistem pintar untuk merancang masa depan kualifikasi Anda."
          </p>
        </div>
      </section>

      {/* FEATURE SECTIONS PER CATEGORY */}
      {featureCategories.map((cat, idx) => (
        <section key={cat.id} className={`py-24 ${cat.bg} relative overflow-hidden`}>
           {/* Decorative elements for context */}
           {idx % 2 !== 0 && (
             <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(#6366f122 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
           )}
           
           <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-16 relative z-10">
              <div className="px-2 border-l-4 border-indigo-600 pl-6 animate-in slide-in-from-left duration-700">
                 <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">{cat.name}</h3>
                 <p className="text-sm lg:text-base text-slate-500 font-bold uppercase mt-1 tracking-wide">{cat.desc}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {cat.features.map((f) => (
                   <div 
                     key={f.id} 
                     className={`bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between hover:-translate-y-2`}
                   >
                      <div>
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform shadow-inner bg-indigo-50 text-indigo-600 border border-indigo-100`}>
                            <i className={`bi ${f.icon}`}></i>
                         </div>
                         <h4 className="text-base lg:text-lg font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">{f.title}</h4>
                         <p className="text-sm lg:text-base text-slate-500 font-medium leading-relaxed mb-10 italic">
                            "{f.desc}"
                         </p>
                      </div>
                      
                      <button 
                        onClick={() => {
                           const url = landingConfig?.videoDemoLinks?.[f.id];
                           if(url) setActiveVideo(url);
                           else alert("Video demo untuk fitur " + f.title + " sedang disiapkan oleh Admin! 🎬");
                        }}
                        className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-800 hover:underline transition-all flex items-center gap-2 group/link"
                      >
                         <i className="bi bi-play-fill"></i> Lihat Demo Fitur <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      ))}

      {/* WHY CHOOSE US SECTION - MOVED AFTER FEATURES */}
      <section className="relative pt-24 pb-32">
        <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-br from-slate-900 to-indigo-950 z-0"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Keunggulan Kami</h2>
            <h3 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">Kenapa Memilih FokusKarir?</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WhyCard 
              icon="bi-lightning-charge" 
              title="Easy to use" 
              desc="Antarmuka intuitif yang dirancang khusus untuk profesional sibuk. Fokus pada input data, bukan navigasi yang rumit." 
            />
            <WhyCard 
              icon="bi-clock-history" 
              title="Quick setup" 
              desc="Hanya butuh 5 menit untuk mulai mendokumentasikan karir Anda. Impor data profil dan biarkan AI kami melakukan sisanya." 
            />
            <WhyCard 
              icon="bi-people" 
              title="Multi-user support" 
              desc="Gunakan satu akun untuk berbagai device atau kelola tim profesional Anda dengan dashboard kolaborasi yang kuat." 
            />
          </div>
        </div>
      </section>

      {/* VIDEO MODAL POPUP */}
      {activeVideo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setActiveVideo(null)}></div>
           <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 border-4 border-white/10">
              <button 
                onClick={() => setActiveVideo(null)} 
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-50 text-xl font-black transition-all backdrop-blur-md"
              >
                 ✕
              </button>
              <iframe 
                 src={`${activeVideo}${activeVideo.includes('?') ? '&' : '?'}autoplay=1`}
                 title="Feature Demo Video"
                 className="w-full h-full border-none"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
              ></iframe>
           </div>
        </div>
      )}

      {/* PRICING SECTION */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Investasi Karir</h2>
          <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none uppercase">Pilih Paket Masa Depan Anda.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative items-center">
          <PricingCard 
            title="Bulanan" 
            duration="1 Bulan" 
            originalPrice={getOriginalPriceFormatted(monthlyPlan, "49.000")}
            price={getPriceFormatted(monthlyPlan, "39.000")} 
            discount={getDiscountLabel(monthlyPlan, "Hemat 20%")}
            features={["Unlimited Daily Logs", "Skill Matrix Mapping", "Basic Performance Chart", "Reminder Harian"]}
            cta="Mulai Berprogres"
            onStart={onStart}
          />
          
          <PricingCard 
            title="3 Bulan" 
            duration="90 Hari" 
            originalPrice={getOriginalPriceFormatted(quarterlyPlan, "165.000")}
            price={getPriceFormatted(quarterlyPlan, "99.000")} 
            discount={getDiscountLabel(quarterlyPlan, "Hemat 40%")}
            features={["Semua fitur Bulanan", "AI Career Insight", "Strategy Roadmap v2.0", "Priority Support"]}
            cta="Mulai Berprogres"
            onStart={onStart}
          />

          <PricingCard 
            title="Tahunan" 
            duration="1 Tahun" 
            label="Paling Hemat"
            originalPrice={getOriginalPriceFormatted(annualPlan, "499.000")}
            price={getPriceFormatted(annualPlan, "149.000")} 
            discount={getDiscountLabel(annualPlan, "Hemat 70%")}
            breakdown="Hanya Rp 12rb-an / bulan"
            features={["Akses Unlimited 1 Tahun", "Personal Landing Page Link", "E-Book Roadmap Karir", "Annual Performance Report"]}
            highlight={true}
            cta="Mulai Berprogres"
            onStart={onStart}
          />
        </div>
        <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-12 animate-pulse">🔥 Penawaran terbatas: Harga promo khusus bulan ini!</p>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 space-y-12">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Suara Profesional</h2>
                <h3 className="text-3xl lg:text-4xl font-black tracking-tight uppercase leading-none">Kata Mereka Tentang FokusKarir.</h3>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TestimonialCard 
                name="Andini" 
                role="HR Manager, Tech Industry" 
                quote="FokusKarir membantu tim saya memvalidasi kontribusi individu dengan data objektif saat performance review. Sangat profesional!" 
              />
              <TestimonialCard 
                name="Budi" 
                role="Senior Software Engineer" 
                quote="Saya tidak lagi bingung saat harus update CV mendadak. Semua rekam jejak pekerjaan saya sudah rapi terdokumentasi di sini." 
              />
              <TestimonialCard 
                name="Siti" 
                role="Creative Freelancer" 
                quote="Fitur Digital Presence Page-nya sangat menolong saat pitching ke klien baru. Kesannya jauh lebih berkelas dibanding PDF biasa." 
              />
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-slate-100 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">F</div>
            <span className="text-lg font-black tracking-tighter">FokusKarir</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 Intelligent Performance System. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
             <button 
                onClick={(e) => { e.preventDefault(); onShowLegal?.('privacy'); }}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
             >
                Privacy
             </button>
             <button 
                onClick={(e) => { e.preventDefault(); onShowLegal?.('terms'); }}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
             >
                Terms
             </button>
             <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const WhyCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 group">
    <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-8 border border-indigo-100 group-hover:scale-110 transition-transform">
      <i className={`bi ${icon}`}></i>
    </div>
    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed font-medium">"{desc}"</p>
  </div>
);

const PainPointCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-sm transition-all duration-500 hover:shadow-lg flex flex-col items-start text-left group">
    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl mb-6 border border-rose-100 group-hover:scale-110 transition-transform">
      <i className={`bi ${icon}`}></i>
    </div>
    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-3">{title}</h4>
    <p className="text-sm lg:text-base text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const GainCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm transition-all duration-500 hover:shadow-lg flex flex-col items-start text-left group">
    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
      <i className={`bi ${icon}`}></i>
    </div>
    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-3">{title}</h4>
    <p className="text-sm lg:text-base text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const PricingCard = ({ title, duration, originalPrice, price, discount, features, highlight, cta, onStart, breakdown, label }: any) => (
  <div className={`p-8 lg:p-10 rounded-[3.5rem] border-2 flex flex-col h-full transition-all duration-700 relative ${highlight ? 'bg-slate-900 text-white border-slate-900 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] scale-105 z-10' : 'bg-white text-slate-900 border-slate-100 hover:border-indigo-100 shadow-sm'}`}>
    {label && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap animate-bounce">
        {label}
      </div>
    )}
    <div className="flex-1">
      <div className="flex justify-between items-start mb-4">
        <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{duration}</p>
        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${highlight ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{discount}</span>
      </div>
      <h4 className="text-xl font-black uppercase tracking-tight mb-6 leading-none">{title}</h4>
      <div className="mb-10">
        {originalPrice ? (
          <p className={`text-sm font-bold line-through mb-1 ${highlight ? 'text-rose-400' : 'text-rose-500'}`}>Rp {originalPrice}</p>
        ) : null}
        <span className="text-4xl font-black tracking-tighter">Rp {price}</span>
        {breakdown && <p className={`text-[10px] font-black mt-1 ${highlight ? 'text-indigo-400' : 'text-indigo-600'}`}>{breakdown}</p>}
        <p className={`text-[8px] font-bold uppercase mt-2 ${highlight ? 'opacity-40' : 'text-slate-400'}`}>Akses Penuh Selama {duration}</p>
      </div>
      <ul className="space-y-3.5 mb-10">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-[10px] font-bold tracking-tight">
            <span className={highlight ? 'text-indigo-400' : 'text-indigo-600'}>✓</span>
            <span className={highlight ? 'opacity-80' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
    <button onClick={onStart} className={`w-full py-4 rounded-[1.75rem] font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${highlight ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-slate-900 text-white hover:bg-black'}`}>
      {cta}
    </button>
  </div>
);

const TestimonialCard = ({ name, role, quote }: any) => (
  <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors duration-500">
    <p className="text-base font-medium italic opacity-90 leading-relaxed mb-6">"{quote}"</p>
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest">{name}</p>
        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{role}</p>
      </div>
    </div>
  </div>
);

export default LandingPage;
