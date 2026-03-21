
import React, { useState, useMemo, useEffect } from 'react';
import { SubscriptionProduct, LandingPageConfig, MayarConfig } from '../types';
import { getLandingPageConfig, getMayarConfig } from '../services/firebase';
import { trackingService } from '../services/trackingService';
import SalesNotificationPopup from './common/SalesNotificationPopup';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onShowLegal?: (type: 'privacy' | 'terms') => void;
  onBuyPlan?: (plan: SubscriptionProduct) => void;
  products?: SubscriptionProduct[];
  initialConfig?: LandingPageConfig | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onShowLegal, onBuyPlan, products, initialConfig }) => {
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig | null>(initialConfig || null);
  const [mayarConfig, setMayarConfig] = useState<MayarConfig | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Sync with initialConfig from parent (real-time updates)
  useEffect(() => {
    if (initialConfig) {
      setLandingConfig(initialConfig);
    }
  }, [initialConfig]);

  // LOGIC: Ambil konfigurasi landing page dari database Firestore
  useEffect(() => {
    // Memastikan pengambilan data segar dari Firestore saat landing page dimuat
    const loadConfig = async () => {
      if (!initialConfig) {
        const res = await getLandingPageConfig();
        if (res) setLandingConfig(res);
      }
      
      const mRes = await getMayarConfig();
      if (mRes) setMayarConfig(mRes);
    };
    
    loadConfig();
    trackingService.trackEvent('PageView');
    trackingService.trackEvent('ViewContent', { 
      content_name: 'Landing Page Plans',
      content_category: 'Subscription'
    });
  }, [initialConfig]);

  const paidProducts = useMemo(() => {
    const list = products || [];
    return list
      .filter(p => p.isActive !== false && p.showOnLanding !== false) 
      .sort((a, b) => a.price - b.price);
  }, [products]);

  const formatDurationLabel = (days: number) => {
    if (days >= 3650) return 'Selamanya';
    if (days >= 365) return `${Math.floor(days / 365)} Tahun`;
    if (days >= 30) return `${Math.floor(days / 30)} Bulan`;
    return `${days} Hari`;
  };

  const handlePay = (plan?: SubscriptionProduct) => {
    if (!plan) {
      alert("Produk ini belum dikonfigurasi.");
      return;
    }

    // Meta Ads: AddToCart
    trackingService.trackEvent('AddToCart', {
      content_ids: [plan.id],
      content_name: plan.name,
      content_type: 'product',
      value: plan.price,
      currency: 'IDR'
    });

    if (onBuyPlan) {
      onBuyPlan(plan);
    } else {
      let finalUrl = plan.mayarProductId || plan.id;
      if (!finalUrl.startsWith('http')) {
         if (mayarConfig?.subdomain) {
            finalUrl = `https://${mayarConfig.subdomain}.myr.id/plink/${finalUrl}`;
         } else {
            finalUrl = `https://mayar.link/pl/${finalUrl}`;
         }
      }
      window.open(finalUrl, '_blank');
    }
  };

  const getDiscountLabel = (plan: SubscriptionProduct) => {
    if (plan.originalPrice && plan.originalPrice > plan.price) {
      const pct = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
      return `Hemat ${pct}%`;
    }
    return "Promo Terbatas";
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
        { id: 'daily-todo', icon: "bi-check2-square", title: "Steps of Growth", desc: "Sistem To-Do list cerdas yang memastikan setiap langkah kecil Anda selaras dengan strategi karir jangka panjang." },
      ]
    },
    {
      id: 'intel',
      name: "Strategic Intelligence",
      desc: "Gunakan sistem pintar untuk merancang jalur karir masa depan.",
      bg: "bg-slate-50",
      features: [
        { id: 'ai-strategist', icon: "bi-cpu", title: "AI Strategist", desc: "Asisten cerdas yang memindai gap skill Anda and memberikan rekomendasi roadmap pelatihan paling relevan." },
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

  const defaultDesktopImg = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop";
  const defaultMobileImg = "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1974&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {landingConfig?.logoDarkUrl ? (
              <img src={landingConfig.logoDarkUrl} alt="Logo" className="max-h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">F</div>
                <span className="text-xl font-black tracking-tighter">FokusKarir</span>
              </>
            )}
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
                      <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Profesional Indonesia Pria" />
                   </div>
                </div>
             </div>
             <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS SECTION */}
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
                title="Lupa Detail Pencapaian Own Record" 
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
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" 
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

      {/* INTRO SYSTEM SECTION */}
      <section className="py-32 bg-white text-center space-y-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          <div className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em]">Kenali Teman Karir Baru Anda</div>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase tracking-tight leading-none">Kenalkan, FokusKarir.</h2>
          <p className="text-lg lg:text-2xl text-slate-600 font-medium leading-relaxed italic px-4">
            "Semua usaha harianmu bakal kami sulap jadi portofolio keren yang bikin karier makin melesat. Gak ada lagi progres yang gak kelihatan!"
          </p>
          <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        {/* SYSTEM MOCKUP / DASHBOARD IMAGES */}
        <div className="max-w-6xl mx-auto px-6 animate-in slide-in-from-bottom-12 duration-1000">
           <div className="relative p-2 bg-slate-200 rounded-[3rem] shadow-inner border-2 border-slate-300">
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 min-h-[300px] lg:min-h-[500px] relative">
                 <img 
                    key={landingConfig?.desktopDashboardImg || 'default-desktop'}
                    src={landingConfig?.desktopDashboardImg || defaultDesktopImg} 
                    alt="FokusKarir Dashboard Desktop" 
                    className="w-full h-auto block object-top"
                    onError={(e: any) => {
                      e.target.src = defaultDesktopImg;
                    }}
                 />
                 <div className="hidden lg:block absolute bottom-10 right-10 w-[240px] p-2 bg-slate-900 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border-4 border-slate-800 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
                    <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                        <img 
                            key={landingConfig?.mobileDashboardImg || 'default-mobile-overlay'}
                            src={landingConfig?.mobileDashboardImg || defaultMobileImg} 
                            alt="FokusKarir Hub Mobile" 
                            className="w-full h-full object-cover object-top"
                            onError={(e: any) => {
                              e.target.src = defaultMobileImg;
                            }}
                        />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* FEATURE SECTIONS */}
      {featureCategories.map((cat, idx) => (
        <section key={cat.id} className={`py-24 ${cat.bg} relative overflow-hidden`}>
           <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-16 relative z-10">
              <div className="px-2 border-l-4 border-indigo-600 pl-6 animate-in slide-in-from-left duration-700">
                 <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">{cat.name}</h3>
                 <p className="text-sm lg:text-base text-slate-500 font-bold uppercase mt-1 tracking-wide">{cat.desc}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {cat.features.map((f) => (
                   <div key={f.id} className="bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between hover:-translate-y-2">
                      <div>
                         <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform shadow-inner bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <i className={`bi ${f.icon}`}></i>
                         </div>
                         <h4 className="text-base lg:text-lg font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">{f.title}</h4>
                         <p className="text-sm lg:text-base text-slate-500 font-medium leading-relaxed mb-10 italic">"{f.desc}"</p>
                      </div>
                      <button onClick={() => {
                           const url = landingConfig?.videoDemoLinks?.[f.id];
                           if(url) setActiveVideo(url);
                           else alert("Video demo untuk fitur " + f.title + " sedang disiapkan oleh Admin! 🎬");
                        }} className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-800 hover:underline transition-all flex items-center gap-2 group/link">
                         <i className="bi bi-play-fill"></i> Lihat Demo Fitur <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      ))}

      {/* TESTIMONIAL SECTION */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Apa Kata Mereka?</h2>
             <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">Testimoni Profesional</h3>
             <p className="text-slate-500 font-medium italic">Ribuan profesional telah membuktikan bagaimana data merubah perjalanan karir mereka.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <TestimonialCard 
                name="Budi Santoso" 
                role="Tax Manager" 
                quote="Dulu rekap laporan bulanan bikin saya lembur sampai 3 jam. Sejak pakai FokusKarir, semua output harian terekam otomatis. Nego bonus jadi jauh lebih mudah karena ada datanya!" 
                avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
             />
             <TestimonialCard 
                name="Siska Amelia" 
                role="Senior Associate" 
                quote="AI Strategist-nya gila banget! Dia kasih tau skill apa yang saya kurang buat naik ke level VP. Sekarang roadmap belajar saya jadi lebih jelas dan nggak asal ikut kursus lagi." 
                avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
             />
             <TestimonialCard 
                name="Ahmad Fauzi" 
                role="Software Engineer" 
                quote="Dulu CV saya berantakan, sekarang tinggal sekali klik langsung jadi PDF profesional. Landing page portfolio digitalnya juga bikin recruiter kagum waktu interview." 
                avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
             />
          </div>
        </div>
      </section>

      {/* PRICING SECTION - SINKRON DENGAN ADMIN */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Investasi Karir</h2>
          <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none uppercase">Pilih Paket Masa Depan Anda.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
          {paidProducts.length > 0 ? (
            paidProducts.map((p) => {
              const monthlyPrice = p.durationDays >= 30 ? Math.round(p.price / (p.durationDays / 30)) : null;
              
              // Highlight logic: Only highlight the yearly package (duration >= 365)
              const isYearly = p.durationDays >= 365;
              const highlight = isYearly;
              let badgeLabel = highlight ? "Paling Hemat" : undefined;
              
              return (
                <PricingCard 
                  key={p.id}
                  title={p.name} 
                  duration={formatDurationLabel(p.durationDays)} 
                  label={badgeLabel}
                  originalPrice={p.originalPrice ? p.originalPrice.toLocaleString('id-ID') : undefined}
                  price={p.price.toLocaleString('id-ID')} 
                  monthlyEquivalent={p.durationDays >= 365 ? monthlyPrice : null}
                  discount={getDiscountLabel(p)}
                  limits={p.limits}
                  moduleCount={p.allowedModules.length}
                  features={p.allowedModules.map(m => m.replace('_', ' ').toUpperCase())}
                  cta="Daftar & Checkout"
                  onPay={() => handlePay(p)}
                  highlight={highlight} 
                />
              );
            })
          ) : (
            <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">📦</div>
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Katalog Produk Kosong</p>
               <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest mt-2">Silakan tambahkan produk baru di Admin Panel untuk mengaktifkan section ini.</p>
            </div>
          )}
        </div>

        {/* SECTION: PREMIUM INCLUSIONS */}
        <div className="mt-24 p-10 lg:p-16 bg-slate-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden animate-in fade-in duration-1000">
           <div className="relative z-10">
              <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
                 <h3 className="text-2xl lg:text-4xl font-black uppercase tracking-tight">Semua Paket Premium Termasuk</h3>
                 <p className="text-slate-400 font-medium italic">Infrastruktur lengkap untuk mengakselerasi kualifikasi profesional Anda tanpa batasan teknis.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-12">
                 <InclusionItem title="AI Career Strategist" desc="Analisis gap skill mendalam dan rekomendasi roadmap karier otomatis berbasis data pasar terkini." icon="bi-cpu-fill" />
                 <InclusionItem title="Unlimited Work Tracking" desc="Dokumentasikan setiap aktivitas, output, and metrik harian tanpa batas kapasitas penyimpanan." icon="bi-infinity" />
                 <InclusionItem title="Digital Presence Hub" desc="Ubah database karier Anda menjadi landing page portfolio publik yang elegan untuk branding." icon="bi-globe-asia-australia" />
                 <InclusionItem title="AI Performance Insight" desc="Laporan performa cerdas mingguan dan bulanan yang siap dipresentasikan untuk kenaikan gaji/jabatan." icon="bi-bar-chart-fill" />
                 <InclusionItem title="One-Click CV Generator" desc="Ekspor data karier Anda menjadi CV PDF profesional dengan berbagai pilihan template modern." icon="bi-file-earmark-pdf-fill" />
                 <InclusionItem title="Networking & CRM" desc="Kelola database relasi profesional, mentor, dan HR dalam satu tempat yang aman dan privat." icon="bi-people-fill" />
                 <InclusionItem title="Skill Matrix Dashboard" desc="Visualisasikan penguasaan kompetensi Anda dalam radar chart untuk melihat area pengembangan." icon="bi-bullseye" />
                 <InclusionItem title="Career Roadmap Tracker" desc="Petakan perjalanan karier Anda dari posisi saat ini hingga jabatan impian dengan target waktu." icon="bi-rocket-takeoff-fill" />
                 <InclusionItem title="Job Hunt Hub" desc="Pantau status lamaran kerja Anda secara real-time di berbagai perusahaan dalam satu dashboard." icon="bi-briefcase-fill" />
                 <InclusionItem title="Work Reflection AI" desc="Analisis psikologis harian untuk mendeteksi tingkat kebahagiaan, energi, dan potensi burnout." icon="bi-magic" />
                 <InclusionItem title="Monthly Strategic Review" desc="Evaluasi bulanan terstruktur untuk memastikan setiap langkah Anda selaras dengan visi karier." icon="bi-calendar-check-fill" />
                 <InclusionItem title="Career Calendar" desc="Jadwalkan interview, tenggat sertifikasi, dan evaluasi dalam kalender karir yang terintegrasi." icon="bi-calendar3" />
              </div>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-slate-100 bg-slate-50/50 px-6 lg:px-12 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              {landingConfig?.logoDarkUrl ? (
                <img src={landingConfig.logoDarkUrl} alt="Logo" className="max-h-10 w-auto object-contain" />
              ) : (
                <>
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">F</div>
                  <span className="text-xl font-black tracking-tighter text-slate-900">FokusKarir</span>
                </>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                 <i className="bi bi-geo-alt-fill text-indigo-600 mt-1 shrink-0"></i>
                 <p className="text-sm font-medium text-slate-500 leading-relaxed">
                   {landingConfig?.businessAddress || 'Mutihan, RT.02, Wirokerten, Banguntapan Bantul'}
                 </p>
              </div>
              
              <div className="flex gap-3 items-center">
                 <i className="bi bi-whatsapp text-emerald-500 shrink-0"></i>
                 <p className="text-sm font-bold text-slate-600">
                    <a href={`https://wa.me/${landingConfig?.adminWhatsApp || '62895321367374'}`} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">+{landingConfig?.adminWhatsApp || '62895-3213-67374'} (WhatsApp Support)</a>
                 </p>
              </div>

              <div className="flex gap-3 items-center">
                 <i className="bi bi-telephone-fill text-indigo-600 shrink-0"></i>
                 <p className="text-sm font-bold text-slate-600">
                    <a href={`tel:${landingConfig?.businessPhone || '62895321367374'}`} className="hover:text-indigo-600 transition-colors">+{landingConfig?.businessPhone || '62895-3213-67374'}</a>
                 </p>
              </div>

              <div className="flex gap-3 items-center">
                 <i className="bi bi-envelope-at-fill text-indigo-600 shrink-0"></i>
                 <p className="text-sm font-bold text-slate-600">
                    <a href={`mailto:${landingConfig?.businessEmail || 'support@fokuskarir.web.id'}`} className="hover:text-indigo-600 transition-colors">{landingConfig?.businessEmail || 'support@fokuskarir.web.id'}</a>
                 </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigasi</h4>
            <ul className="space-y-4">
              <li><button type="button" onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Masuk Akun</button></li>
              <li><button type="button" onClick={onStart} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Daftar Baru</button></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Legalitas</h4>
            <ul className="space-y-4 relative z-30">
              <li>
                <a 
                  href="/privacy" 
                  onClick={(e) => { e.preventDefault(); onShowLegal?.('privacy'); }} 
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  onClick={(e) => { e.preventDefault(); onShowLegal?.('terms'); }} 
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Syarat & Layanan
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connect With Us</h4>
             <div className="flex gap-4">
                <a href={`https://wa.me/${landingConfig?.adminWhatsApp || '62895321367374'}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl text-emerald-600 shadow-sm hover:shadow-lg transition-all"><i className="bi bi-whatsapp"></i></a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl text-indigo-600 shadow-sm hover:shadow-lg transition-all"><i className="bi bi-instagram"></i></a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl text-blue-600 shadow-sm hover:shadow-lg transition-all"><i className="bi bi-linkedin"></i></a>
             </div>
             <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight pt-4">© 2025 Intelligent Performance System.<br/>Built for ambitious professionals.</p>
          </div>
        </div>
      </footer>

      {activeVideo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setActiveVideo(null)}></div>
           <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 border-4 border-white/10">
              <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-50 text-xl font-black transition-all backdrop-blur-md">✕</button>
              <iframe src={`${activeVideo}${activeVideo.includes('?') ? '&' : '?'}autoplay=1`} title="Feature Demo Video" className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
           </div>
        </div>
      )}
      <SalesNotificationPopup />
    </div>
  );
};

const InclusionItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-6">
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl text-indigo-400 shrink-0 shadow-inner group hover:scale-110 transition-transform">
      <i className={`bi ${icon}`}></i>
    </div>
    <div className="space-y-2">
      <h4 className="text-sm font-black uppercase tracking-tight text-white leading-none">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
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

const TestimonialCard = ({ name, role, quote, avatar }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group">
    <div className="flex items-center gap-4 mb-6">
       <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100" />
       <div>
          <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{name}</h4>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{role}</p>
       </div>
    </div>
    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{quote}"</p>
  </div>
);

const PricingCard = ({ title, duration, originalPrice, price, monthlyEquivalent, discount, features, highlight, cta, onPay, limits, moduleCount, label }: any) => (
  <div className={`p-8 lg:p-10 rounded-[3.5rem] border-2 flex flex-col h-full transition-all duration-700 relative ${highlight ? 'bg-slate-900 text-white border-slate-900 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] scale-105 z-10' : 'bg-white text-slate-900 border-slate-100 hover:border-indigo-100 shadow-sm'}`}>
    {label && (
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap animate-bounce ${label === "Paling Hemat" ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
        {label}
      </div>
    )}
    <div className="flex-1">
      <div className="flex justify-between items-start mb-4">
        <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{duration}</p>
        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${highlight ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{discount}</span>
      </div>
      <h4 className="text-xl font-black uppercase tracking-tight mb-6 leading-none">{title}</h4>
      <div className="mb-8">
        {originalPrice && <p className={`text-sm font-bold line-through mb-1 ${highlight ? 'text-rose-400' : 'text-rose-500'}`}>Rp {originalPrice}</p>}
        <span className="text-4xl font-black tracking-tighter">Rp {price}</span>
        {monthlyEquivalent && (
          <p className={`text-[11px] font-bold mt-2 italic ${highlight ? 'text-indigo-300' : 'text-slate-400'}`}>
            (Setara Rp {monthlyEquivalent.toLocaleString('id-ID')} / bulan)
          </p>
        )}
      </div>
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
         <p className={`text-[9px] font-black uppercase tracking-widest ${highlight ? 'text-indigo-300' : 'text-indigo-600'}`}>Benefit Unggulan</p>
         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${highlight ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>TOP PRIORITY</span>
      </div>
      <ul className="space-y-3.5 mb-10">
        {features.slice(0, 4).map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-[10px] font-bold tracking-tight">
            <span className={highlight ? 'text-indigo-400' : 'text-indigo-600'}>✓</span>
            <span className={highlight ? 'opacity-80' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
        {features.length > 4 && (
           <li className={`text-[9px] font-bold uppercase tracking-widest pl-6 ${highlight ? 'text-indigo-300' : 'text-slate-400'}`}>
             + {features.length - 4} Fitur Tambahan
           </li>
        )}
      </ul>
    </div>
    <button onClick={onPay} className={`w-full py-4 rounded-[1.75rem] font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${highlight ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl' : 'bg-slate-900 text-white hover:bg-black'}`}>
      {cta}
    </button>
  </div>
);

export default LandingPage;
