import React, { useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const features = [
    { icon: "bi-journal-text", title: "Daily Growth Registry", desc: "Catat aktivitas harian untuk membangun basis data performa yang tervalidasi.", isMain: true },
    { icon: "bi-cpu", title: "AI Strategist", desc: "Asisten cerdas yang merekomendasikan roadmap skill & sertifikasi sesuai target pasar.", isMain: true, highlight: true },
    { icon: "bi-globe", title: "Digital Presence", desc: "Ubah portofolio Anda menjadi website landing page profesional yang siap dibagikan.", isMain: true, highlight: true },
    { icon: "bi-bullseye", title: "Skill Matrix Tracker", desc: "Visualisasikan penguasaan kompetensi Anda dan deteksi gap skill yang perlu diperbaiki.", isMain: true },
    { icon: "bi-rocket-takeoff", title: "Career Roadmap", desc: "Petakan target posisi impian dan pantau kesiapan kompetensi Anda menuju ke sana.", isMain: true },
    { icon: "bi-file-earmark-pdf", title: "One-Click CV Export", desc: "Generate CV profesional format PDF dengan berbagai template modern secara instan.", isMain: true },
    { icon: "bi-briefcase", title: "Job Hunt Hub", desc: "Pantau status seluruh lamaran kerja Anda mulai dari apply hingga tahap wawancara.", isMain: false },
    { icon: "bi-people", title: "Networking Vault", desc: "Simpan catatan interaksi dengan mentor dan relasi profesional untuk menjaga kualitas hubungan.", isMain: false },
    { icon: "bi-graph-up-arrow", title: "Performance Insights", desc: "Laporan grafik produktivitas berkala untuk memvalidasi kenaikan nilai profesional Anda.", isMain: false },
    { icon: "bi-check2-square", title: "Steps of Growth", desc: "Daftar tugas harian (ToDo) yang terintegrasi dengan rekomendasi strategi dari AI.", isMain: false },
    { icon: "bi-chat-quote", title: "Work Reflection", desc: "Insight harian untuk mendeteksi pola mood, energi, dan burnout selama bekerja.", isMain: false },
    { icon: "bi-calendar-check", title: "Monthly Review", desc: "Evaluasi bulanan terstruktur untuk merencanakan target pertumbuhan di bulan depan.", isMain: false },
  ];

  const visibleFeatures = showAllFeatures ? features : features.filter(f => f.isMain);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">J</div>
            <span className="text-xl font-black tracking-tighter">JejakKarir</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={onLogin} className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Masuk</button>
            <button onClick={onStart} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Mulai Sekarang</button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              Intelligence Career Assistant v2.0
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-slate-900 uppercase">
              Ubah Data Kerja Anda Menjadi <span className="text-indigo-600">Aset Karir</span> Berharga.
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed max-w-xl italic">
              "Karier yang hebat tidak dibangun dalam semalam, tapi melalui setiap kontribusi harian yang tercatat secara cerdas."
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStart} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group">
                Buat Portofolio Anda 
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
              <div className="flex items-center gap-4 px-2">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200"></div>)}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Digunakan oleh 1,200+<br/>Profesional Ambisius</p>
              </div>
            </div>
          </div>
          <div className="relative">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                   <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Profesional Indonesia Wanita" />
                   </div>
                   <div className="aspect-square rounded-[3rem] bg-indigo-600 p-8 flex flex-col justify-end text-white shadow-xl shadow-indigo-200">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Success Rate</p>
                      <p className="text-3xl font-black">94% <span className="text-xs font-bold block opacity-40">Career Improvement</span></p>
                   </div>
                </div>
                <div className="pt-12 space-y-4">
                   <div className="aspect-square rounded-[3rem] bg-slate-900 p-8 flex flex-col justify-center items-center text-center text-white shadow-xl">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl mb-4 italic">✨</div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-relaxed italic opacity-80">"Data mengalahkan asumsi."</p>
                   </div>
                   <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Profesional Indonesia Pria" />
                   </div>
                </div>
             </div>
             <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION / FEATURES */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Ekosistem JejakKarir</h2>
            <h3 className="text-4xl font-black tracking-tight text-slate-900 leading-none uppercase">Kelola Pertumbuhan Anda Tanpa Batas.</h3>
            <p className="text-slate-500 font-medium leading-relaxed italic">Satu platform terintegrasi untuk mendokumentasikan setiap kemajuan karir Anda secara objektif.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleFeatures.map((f, i) => (
              <FeatureCard 
                key={i}
                icon={f.icon} 
                title={f.title} 
                desc={f.desc} 
                highlight={f.highlight}
              />
            ))}
          </div>

          <div className="flex justify-center pt-10">
            <button 
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="px-10 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
              {showAllFeatures ? 'Sembunyikan Sebagian' : 'Lihat seluruh keuntungan yang didapatkan →'}
            </button>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-32 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Investasi Karir</h2>
          <h3 className="text-4xl font-black tracking-tight text-slate-900 leading-none uppercase">Pilih Paket Masa Depan Anda.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-center">
          {/* Paket Bulanan - 20% Discount */}
          <PricingCard 
            title="Paket Perjalanan" 
            duration="Bulanan" 
            originalPrice="49.000"
            price="39.000" 
            discount="Hemat 20%"
            features={["Unlimited Daily Logs", "Skill Matrix Mapping", "Basic Performance Chart", "Reminder Harian"]}
            cta="Mulai Berprogres"
            onStart={onStart}
          />
          
          {/* Paket 3 Bulanan (Growth) - 40% Discount */}
          <PricingCard 
            title="Paket Pertumbuhan" 
            duration="3 Bulan" 
            originalPrice="165.000"
            price="99.000" 
            discount="Hemat 40%"
            features={["Semua fitur Bulanan", "AI Career Insight", "Strategy Roadmap v2.0", "Priority Support"]}
            highlight={true}
            cta="Akselerasi Sekarang"
            onStart={onStart}
          />

          {/* Paket Tahunan - 70% Discount */}
          <PricingCard 
            title="Paket Pencapaian" 
            duration="1 Tahun" 
            originalPrice="499.000"
            price="149.000" 
            discount="Hemat 70%"
            features={["Akses Unlimited 1 Tahun", "Personal Landing Page Link", "E-Book Roadmap Karir", "Annual Performance Report"]}
            cta="Investasi Jangka Panjang"
            onStart={onStart}
          />
        </div>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-12 animate-pulse">🔥 Penawaran terbatas: Harga promo khusus bulan ini!</p>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 space-y-16">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Suara Profesional</h2>
                <h3 className="text-4xl font-black tracking-tight uppercase leading-none">Kata Mereka Tentang JejakKarir.</h3>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <TestimonialCard 
                name="Andini" 
                role="HR Manager, Tech Industry" 
                quote="JejakKarir membantu tim saya memvalidasi kontribusi individu dengan data objektif saat performance review. Sangat profesional!" 
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
      <footer className="py-12 border-t border-slate-100 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">J</div>
            <span className="text-lg font-black tracking-tighter">JejakKarir</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 Intelligent Performance System. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
             <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Privacy</button>
             <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Terms</button>
             <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, highlight }: any) => (
  <div className={`p-10 rounded-[3.5rem] border transition-all duration-500 group animate-in fade-in zoom-in ${highlight ? 'bg-white border-indigo-100 shadow-indigo-100/50 shadow-2xl' : 'bg-white border-slate-100 hover:shadow-xl'}`}>
    <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-2xl mb-8 border-2 transition-all group-hover:scale-110 bg-[#eef2fe] text-indigo-600 ${highlight ? 'border-indigo-200 shadow-lg shadow-indigo-100' : 'border-indigo-100/50'}`}>
       <i className={`bi ${icon}`}></i>
    </div>
    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 leading-tight">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed font-medium italic">"{desc}"</p>
  </div>
);

const PricingCard = ({ title, duration, originalPrice, price, discount, features, highlight, cta, onStart }: any) => (
  <div className={`p-10 lg:p-12 rounded-[4rem] border-2 flex flex-col h-full transition-all duration-700 ${highlight ? 'bg-slate-900 text-white border-slate-900 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] scale-105 z-10' : 'bg-white text-slate-900 border-slate-100 hover:border-indigo-100 shadow-sm'}`}>
    <div className="flex-1">
      <div className="flex justify-between items-start mb-6">
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{duration}</p>
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${highlight ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{discount}</span>
      </div>
      <h4 className="text-xl font-black uppercase tracking-tight mb-8 leading-none">{title}</h4>
      <div className="mb-12">
        <p className={`text-xs font-bold line-through opacity-40 mb-1 ${highlight ? 'text-slate-300' : 'text-slate-400'}`}>Rp {originalPrice}</p>
        <span className="text-4xl font-black tracking-tighter">Rp {price}</span>
        <p className={`text-[9px] font-bold uppercase mt-2 ${highlight ? 'opacity-40' : 'text-slate-400'}`}>Akses Penuh Selama {duration}</p>
      </div>
      <ul className="space-y-4 mb-12">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-[11px] font-bold tracking-tight">
            <span className={highlight ? 'text-indigo-400' : 'text-indigo-600'}>✓</span>
            <span className={highlight ? 'opacity-80' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
    <button onClick={onStart} className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${highlight ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-slate-900 text-white hover:bg-black'}`}>
      {cta}
    </button>
  </div>
);

const TestimonialCard = ({ name, role, quote }: any) => (
  <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-colors duration-500">
    <p className="text-lg font-medium italic opacity-90 leading-relaxed mb-8">"{quote}"</p>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest">{name}</p>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{role}</p>
      </div>
    </div>
  </div>
);

export default LandingPage;