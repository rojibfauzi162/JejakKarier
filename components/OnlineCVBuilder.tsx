
import React, { useState, useMemo } from 'react';
import { AppData, OnlineCVConfig, WorkExperience, PersonalProject, Skill } from '../types';

interface OnlineCVBuilderProps {
  data: AppData;
  onUpdateConfig: (config: OnlineCVConfig) => void;
}

const THEMES = [
  { id: 't-bento', name: 'Bento Modern', desc: 'Layout grid bergaya Apple yang padat konten.' },
  { id: 't-dark', name: 'Dark Story', desc: 'Minimalis gelap dengan fokus pada narasi karir.' },
  { id: 't-brutal', name: 'Bold Brutalism', desc: 'Visual mencolok dengan tipografi raksasa.' },
  { id: 't-terminal', name: 'Hacker Dev', desc: 'Gaya terminal kode untuk profesional IT.' },
  { id: 't-glass', name: 'Soft Glass', desc: 'Efek transparansi elegan dengan warna gradasi.' },
  { id: 't-startup', name: 'Startup Pitch', desc: 'Layout berenergi tinggi untuk profil progresif.' },
];

const OnlineCVBuilder: React.FC<OnlineCVBuilderProps> = ({ data, onUpdateConfig }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<OnlineCVConfig>(data.onlineCV);

  const handleSave = () => {
    onUpdateConfig(config);
  };

  const getPublicLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('u', config.username || 'yourname');
    return url.toString();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getPublicLink());
    alert('Link landing page disalin!');
  };

  const previewData = useMemo(() => {
    return {
      profile: data.profile,
      work: data.workExperiences.filter(w => config.selectedItemIds.work?.includes(w.id)),
      projects: data.personalProjects.filter(p => config.selectedItemIds.projects?.includes(p.id)),
      skills: data.skills.filter(s => config.selectedItemIds.skills?.includes(s.id)),
      achievements: data.achievements.filter(a => config.selectedItemIds.achievements?.includes(a.id)),
    };
  }, [data, config]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personal Branding Hub</h2>
          <p className="text-slate-500 font-medium italic">"Ubah database karir Anda menjadi website landing page profesional."</p>
        </div>
        <div className="flex gap-3">
          {config.isActive && (
            <button onClick={copyLink} className="px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2">
              <span>🔗</span> Copy Link
            </button>
          )}
          <button onClick={handleSave} className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all text-[10px] uppercase tracking-widest">
            Simpan Perubahan
          </button>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit gap-1">
        {[1, 2, 3].map(s => (
          <button key={s} onClick={() => setStep(s)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Langkah {s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-4 space-y-8">
          {step === 1 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">1. Akses & Sosial</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Unik</label>
                  <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-black text-blue-600 text-sm" value={config.username} onChange={e => setConfig({...config, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})} placeholder="alex-pro" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Publikasi</label>
                  <div className="flex gap-2">
                    <button onClick={() => setConfig({...config, isActive: true})} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${config.isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>Online</button>
                    <button onClick={() => setConfig({...config, isActive: false})} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${!config.isActive ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-slate-100 text-slate-400'}`}>Offline</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">2. Visual Branding</h3>
              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={() => setConfig({...config, themeId: theme.id})} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all text-left ${config.themeId === theme.id ? 'border-blue-600 bg-blue-50/20' : 'border-slate-50 hover:border-slate-200'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${config.themeId === theme.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>🎨</div>
                    <div>
                      <p className="font-black text-slate-800 text-xs uppercase">{theme.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{theme.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">3. Konten Story</h3>
              <div className="space-y-4">
                <ContentToggle title="Pengalaman Kerja" items={data.workExperiences.map(w => ({id: w.id, label: w.position}))} selectedIds={new Set(config.selectedItemIds.work || [])} onToggle={(id) => toggleItemId('work', id)} />
                <ContentToggle title="Keahlian Utama" items={data.skills.map(s => ({id: s.id, label: s.name}))} selectedIds={new Set(config.selectedItemIds.skills || [])} onToggle={(id) => toggleItemId('skills', id)} />
                <ContentToggle title="Pencapaian" items={data.achievements.map(a => ({id: a.id, label: a.title}))} selectedIds={new Set(config.selectedItemIds.achievements || [])} onToggle={(id) => toggleItemId('achievements', id)} />
              </div>
            </div>
          )}
        </div>

        {/* Improved Real-time Preview Area */}
        <div className="xl:col-span-8">
           <div className="bg-slate-200 rounded-[3rem] p-4 lg:p-8 shadow-inner min-h-[700px] flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 bg-white/40 p-2 px-4 rounded-full w-fit">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-[9px] font-black text-slate-500 ml-4 opacity-50 tracking-widest uppercase">Live View Mode</span>
              </div>
              
              <div className="flex-1 w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-300 relative group">
                {/* Fixed Preview Scrollable Container */}
                <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth">
                   <LiveThemeRenderer themeId={config.themeId} data={previewData} />
                </div>
                
                {/* Scroll Indicator Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-widest">
                  Scroll to Explore ↓
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center px-4">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tema Terpilih: <span className="text-blue-600">{THEMES.find(t => t.id === config.themeId)?.name}</span></p>
                 <button onClick={() => window.open(getPublicLink(), '_blank')} className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                   Lihat Tampilan Penuh ↗
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  function toggleItemId(key: string, id: string) {
    const next = new Set(config.selectedItemIds[key] || []);
    if (next.has(id)) next.delete(id); else next.add(id);
    setConfig({...config, selectedItemIds: {...config.selectedItemIds, [key]: Array.from(next)}});
  }
};

// Internal Sub-component for Storytelling Themes
const LiveThemeRenderer = ({ themeId, data }: any) => {
  const { profile, work, skills, achievements } = data;
  
  const ProfileImg = () => (
    profile.photoUrl ? (
      <img src={profile.photoUrl} className="w-32 h-32 rounded-3xl shadow-2xl object-cover hover:scale-105 transition-transform duration-700" alt="Profile" />
    ) : (
      <div className="w-32 h-32 bg-slate-200 rounded-3xl flex items-center justify-center text-4xl shadow-xl">👤</div>
    )
  );

  const SectionTitle = ({ children, dark = false }: any) => (
    <h3 className={`text-xs font-black uppercase tracking-[0.4em] mb-12 flex items-center gap-4 ${dark ? 'text-white/30' : 'text-slate-300'}`}>
       <span className="w-10 h-0.5 bg-current"></span>
       {children}
    </h3>
  );

  switch(themeId) {
    case 't-bento':
      return (
        <div className="bg-slate-50 min-h-full p-8 lg:p-12 animate-in fade-in duration-1000">
           <div className="grid grid-cols-6 gap-6 max-w-5xl mx-auto">
              {/* Story Intro */}
              <div className="col-span-4 bg-white p-12 rounded-[3.5rem] shadow-sm border border-white flex flex-col justify-center">
                 <ProfileImg />
                 <h1 className="text-6xl font-black tracking-tighter mt-8 leading-[0.9]">{profile.name}</h1>
                 <p className="text-xl font-bold text-blue-600 mt-4 uppercase tracking-[0.2em]">{profile.currentPosition}</p>
                 <p className="mt-8 text-lg text-slate-500 font-medium leading-relaxed italic">"{profile.description}"</p>
              </div>
              
              {/* Quick Arsenal */}
              <div className="col-span-2 bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between overflow-hidden relative">
                 <SectionTitle dark>Arsenal</SectionTitle>
                 <div className="flex flex-wrap gap-2 relative z-10">
                    {skills.map((s: any) => <span key={s.id} className="px-4 py-2 bg-white/10 rounded-2xl text-[10px] font-black uppercase border border-white/10">{s.name}</span>)}
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
              </div>

              {/* Journey Highlights */}
              <div className="col-span-6 lg:col-span-3 bg-white p-10 rounded-[3.5rem] shadow-sm border border-white">
                 <SectionTitle>Journey</SectionTitle>
                 <div className="space-y-8">
                    {work.map((w: any) => (
                      <div key={w.id} className="group border-l-2 border-slate-100 pl-6 py-1 hover:border-blue-500 transition-colors">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{w.duration}</p>
                        <h4 className="text-xl font-black text-slate-800">{w.position}</h4>
                        <p className="text-blue-600 font-bold text-xs uppercase">{w.company}</p>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Legacy / Achievements */}
              <div className="col-span-6 lg:col-span-3 bg-blue-600 text-white p-10 rounded-[3.5rem] shadow-xl">
                 <SectionTitle dark>Legacy</SectionTitle>
                 <div className="space-y-6">
                    {achievements.map((a: any) => (
                      <div key={a.id} className="bg-white/10 p-5 rounded-3xl border border-white/10 hover:bg-white/20 transition-all cursor-default">
                        <h5 className="font-black text-base">{a.title}</h5>
                        <p className="text-xs text-blue-100/70 mt-2 italic">"{a.impact}"</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      );

    case 't-dark':
      return (
        <div className="bg-slate-950 text-white min-h-full p-12 lg:p-24 selection:bg-blue-500/30 font-sans animate-in fade-in duration-1000">
           <div className="max-w-3xl mx-auto space-y-32">
              <header className="space-y-10">
                 <div className="flex items-center gap-6">
                    <span className="w-12 h-1px bg-blue-600"></span>
                    <p className="text-xs font-black uppercase tracking-[0.5em] text-blue-600">Portfolio '25</p>
                 </div>
                 <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-none">{profile.name}</h1>
                 <p className="text-xl lg:text-3xl text-slate-400 font-medium leading-relaxed">{profile.description}</p>
              </header>

              <section className="space-y-20">
                 <SectionTitle dark>Experience</SectionTitle>
                 <div className="space-y-16">
                    {work.map((w: any) => (
                      <div key={w.id} className="group relative">
                         <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                            <h4 className="text-3xl lg:text-5xl font-black group-hover:text-blue-500 transition-colors duration-500">{w.position}</h4>
                            <span className="text-slate-600 font-black text-xs uppercase tracking-widest">{w.duration}</span>
                         </div>
                         <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">{w.company}</p>
                         <p className="mt-6 text-slate-400 text-lg leading-relaxed max-w-xl">{w.description}</p>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="grid grid-cols-2 gap-20">
                 <div>
                    <SectionTitle dark>Arsenal</SectionTitle>
                    <div className="flex flex-wrap gap-4">
                       {skills.map((s: any) => <span key={s.id} className="text-2xl font-black text-slate-700 hover:text-white transition-colors cursor-default">#{s.name}</span>)}
                    </div>
                 </div>
                 <div>
                    <SectionTitle dark>Connect</SectionTitle>
                    <p className="text-2xl font-black text-blue-600 hover:underline cursor-pointer">{profile.email}</p>
                 </div>
              </section>

              <footer className="pt-32 pb-12 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800">Coded by JejakKarir Digital System</p>
              </footer>
           </div>
        </div>
      );

    default:
      return (
        <div className="p-12 text-center flex flex-col items-center justify-center min-h-full">
           <ProfileImg />
           <h1 className="text-4xl font-black mt-8">{profile.name}</h1>
           <p className="text-blue-600 font-bold uppercase tracking-widest mt-2">{profile.currentPosition}</p>
           <p className="mt-8 text-slate-500 max-w-xl leading-relaxed italic">"{profile.description}"</p>
           <div className="mt-12 flex flex-wrap justify-center gap-4">
             {skills.map((s: any) => <span key={s.id} className="px-5 py-2 bg-slate-100 rounded-full text-xs font-black uppercase tracking-widest">{s.name}</span>)}
           </div>
        </div>
      );
  }
};

const ContentToggle = ({ title, items, selectedIds, onToggle }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-3">
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all ${isOpen ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        <span className="text-lg">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="pl-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
          {items.map((item: any) => (
            <button key={item.id} onClick={() => onToggle(item.id)} className={`w-full text-left p-3 rounded-xl border text-[10px] transition-all flex justify-between items-center ${selectedIds.has(item.id) ? 'bg-white border-blue-500 text-slate-800 shadow-md' : 'bg-slate-50/50 border-slate-100 text-slate-300'}`}>
              <span className="font-bold">{item.label}</span>
              <span className="text-lg">{selectedIds.has(item.id) ? '✅' : '☐'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InputRow = ({ label, value, onChange, placeholder }: any) => (
  <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
    <span className="text-[9px] font-black text-slate-400 uppercase w-20 shrink-0">{label}</span>
    <input className="flex-1 bg-transparent border-none outline-none font-bold text-xs text-slate-800" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default OnlineCVBuilder;
