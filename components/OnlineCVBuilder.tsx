
import React, { useState, useMemo } from 'react';
import { AppData, OnlineCVConfig, WorkExperience, PersonalProject, Skill } from '../types';

interface OnlineCVBuilderProps {
  data: AppData;
  onUpdateConfig: (config: OnlineCVConfig) => void;
}

const THEMES = [
  { id: 't-bento', name: 'Bento Modern', desc: 'Layout grid bergaya Apple yang padat konten.' },
  { id: 't-terminal', name: 'Developer Terminal', desc: 'Gaya command-line hacker dengan font monospaced.' },
  { id: 't-brutal', name: 'Bold Brutalism', desc: 'Visual kontras tinggi dengan bayangan hitam tajam.' },
  { id: 't-dark', name: 'Cinematic Story', desc: 'Minimalis gelap dengan tipografi raksasa yang dramatis.' },
  { id: 't-startup', name: 'Startup Pitch', desc: 'Layout bersih dan cerah dengan aksen gradasi biru.' },
];

const OnlineCVBuilder: React.FC<OnlineCVBuilderProps> = ({ data, onUpdateConfig }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<OnlineCVConfig>(data.onlineCV);

  // Cek apakah username sudah pernah disetel sebelumnya untuk proteksi 7 hari
  const isUsernameLocked = !!data.onlineCV.username && data.onlineCV.username !== "";

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
      profile: {
        ...data.profile,
        name: config.customTitle || data.profile.name,
        currentPosition: config.customPosition || data.profile.currentPosition,
        description: config.customBio || data.profile.description
      },
      work: data.workExperiences.filter(w => config.selectedItemIds.work?.includes(w.id)),
      projects: data.personalProjects.filter(p => config.selectedItemIds.projects?.includes(p.id)),
      skills: data.skills.filter(s => config.selectedItemIds.skills?.includes(s.id)),
      achievements: data.achievements.filter(a => config.selectedItemIds.achievements?.includes(a.id)),
    };
  }, [data, config]);

  const updatePreviewText = (field: 'customTitle' | 'customBio' | 'customPosition', value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

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

      {/* Stepper Wizard */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit gap-1">
        {[
          { s: 1, label: 'Identitas' },
          { s: 2, label: 'Isi Cerita' },
          { s: 3, label: 'Gaya Visual' }
        ].map(item => (
          <button key={item.s} onClick={() => setStep(item.s)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${step === item.s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-4 space-y-8">
          {/* STEP 1: Identitas & URL */}
          {step === 1 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">1. Akses & Sosial</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                    <span>Username Unik</span>
                    {isUsernameLocked && <span className="text-rose-500">Terkunci (7 Hari)</span>}
                  </label>
                  <input 
                    disabled={isUsernameLocked}
                    className={`w-full px-5 py-4 rounded-2xl border outline-none font-black text-sm transition-all ${isUsernameLocked ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-blue-600'}`} 
                    value={config.username} 
                    onChange={e => setConfig({...config, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})} 
                    placeholder="nama-kamu" 
                  />
                  {isUsernameLocked && <p className="text-[9px] text-slate-400 italic mt-1 ml-1">Username telah disetel. Perubahan hanya diperbolehkan satu kali dalam seminggu.</p>}
                </div>
                <div className="space-y-2 pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Publikasi</label>
                  <div className="flex gap-2">
                    <button onClick={() => setConfig({...config, isActive: true})} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${config.isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>Online</button>
                    <button onClick={() => setConfig({...config, isActive: false})} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${!config.isActive ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-slate-100 text-slate-400'}`}>Offline</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Kurasi Konten (Story) */}
          {step === 2 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">2. Kurasi Konten Cerita</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Pilih apa saja yang ingin Anda tampilkan pada landing page publik Anda.</p>
              <div className="space-y-4">
                <ContentToggle title="Pengalaman Kerja" items={data.workExperiences.map(w => ({id: w.id, label: w.position}))} selectedIds={new Set(config.selectedItemIds.work || [])} onToggle={(id: string) => toggleItemId('work', id)} />
                <ContentToggle title="Keahlian Utama" items={data.skills.map(s => ({id: s.id, label: s.name}))} selectedIds={new Set(config.selectedItemIds.skills || [])} onToggle={(id: string) => toggleItemId('skills', id)} />
                <ContentToggle title="Proyek Pilihan" items={data.personalProjects.map(p => ({id: p.id, label: p.name}))} selectedIds={new Set(config.selectedItemIds.projects || [])} onToggle={(id: string) => toggleItemId('projects', id)} />
                <ContentToggle title="Pencapaian" items={data.achievements.map(a => ({id: a.id, label: a.title}))} selectedIds={new Set(config.selectedItemIds.achievements || [])} onToggle={(id: string) => toggleItemId('achievements', id)} />
              </div>
            </div>
          )}

          {/* STEP 3: Visual Branding (Template) */}
          {step === 3 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">3. Pilih Aura Visual</h3>
              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={() => setConfig({...config, themeId: theme.id})} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all text-left ${config.themeId === theme.id ? 'border-blue-600 bg-blue-50/20' : 'border-slate-50 hover:border-slate-200'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform ${config.themeId === theme.id ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-400'}`}>🎨</div>
                    <div>
                      <p className="font-black text-slate-800 text-xs uppercase">{theme.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{theme.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PRATINJAU LANGSUNG (LIVE PREVIEW) */}
        <div className="xl:col-span-8">
           <div className="bg-slate-200 rounded-[3rem] p-4 lg:p-8 shadow-inner min-h-[700px] flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 bg-white/40 p-2 px-4 rounded-full w-fit">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-[9px] font-black text-slate-500 ml-4 opacity-50 tracking-widest uppercase">Live Browser Preview (Editable)</span>
              </div>
              
              <div className="flex-1 w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-300 relative group">
                {/* Scrollable Frame Container */}
                <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth">
                   <LiveThemeRenderer themeId={config.themeId} data={previewData} onUpdateText={updatePreviewText} />
                </div>
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-6 py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-widest flex items-center gap-2">
                  <span>Klik Nama, Jabatan, atau Bio untuk Edit</span>
                  <span className="animate-bounce">↓</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center px-4">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tema: <span className="text-blue-600">{THEMES.find(t => t.id === config.themeId)?.name}</span></p>
                 <button onClick={() => window.open(getPublicLink(), '_blank')} className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                   Tampilan Desktop Penuh ↗
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

// Sub-komponen Perender Tema (Real-time Render)
const LiveThemeRenderer = ({ themeId, data, onUpdateText }: any) => {
  const { profile, work, skills, achievements, projects } = data;
  
  const ProfileImg = () => (
    profile.photoUrl ? (
      <img src={profile.photoUrl} className="w-32 h-32 rounded-3xl shadow-2xl object-cover hover:scale-105 transition-transform duration-700" alt="Profile" />
    ) : (
      <div className="w-32 h-32 bg-slate-200 rounded-3xl flex items-center justify-center text-4xl shadow-xl">👤</div>
    )
  );

  const SectionTag = ({ children, dark = false }: any) => (
    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 w-fit ${dark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
       {children}
    </div>
  );

  const EditableText = ({ tag: Tag, className, field, initialValue }: any) => (
    <Tag 
      contentEditable 
      suppressContentEditableWarning 
      className={`${className} outline-none focus:ring-2 focus:ring-blue-500/20 rounded cursor-text border-b border-transparent hover:border-slate-200 transition-all`}
      onBlur={(e: any) => onUpdateText(field, e.target.innerText)}
    >
      {initialValue}
    </Tag>
  );

  switch(themeId) {
    case 't-terminal':
      return (
        <div className="bg-black text-emerald-500 min-h-full p-10 font-mono text-sm leading-relaxed animate-in fade-in duration-500">
           <div className="space-y-10 border border-emerald-500/20 p-8 rounded-xl bg-emerald-950/5">
              <div>
                 <p className="opacity-40 mb-2">$ whoami</p>
                 <EditableText tag="h1" className="text-5xl font-black text-white tracking-tighter uppercase block" field="customTitle" initialValue={profile.name} />
                 <div className="mt-2 flex items-center gap-2">
                   <span className="text-xl text-emerald-400">#</span>
                   <EditableText tag="span" className="text-xl text-emerald-400 font-bold" field="customPosition" initialValue={profile.currentPosition} />
                 </div>
                 <div className="mt-6">
                   <p className="opacity-40">$ cat intro.txt</p>
                   <EditableText tag="p" className="text-emerald-700 italic block" field="customBio" initialValue={profile.description} />
                 </div>
              </div>

              <div>
                 <p className="opacity-40 mb-4">$ ls keahlian/</p>
                 <div className="flex flex-wrap gap-4">
                    {skills.map((s: any) => <span key={s.id} className="border border-emerald-500/30 px-3 py-1 bg-emerald-500/5">[{s.name}]</span>)}
                 </div>
              </div>

              <div>
                 <p className="opacity-40 mb-4">$ ./pengalaman.sh</p>
                 <div className="space-y-6">
                    {work.map((w: any) => (
                      <div key={w.id} className="pl-6 border-l-2 border-emerald-500/20">
                         <p className="text-white font-bold">{w.position}</p>
                         <p className="text-xs opacity-50 uppercase tracking-widest">{w.company} | {w.duration}</p>
                      </div>
                    ))}
                 </div>
              </div>
              <p className="animate-pulse opacity-50">_</p>
           </div>
        </div>
      );

    case 't-brutal':
      return (
        <div className="bg-[#FFDE03] min-h-full p-10 font-sans animate-in zoom-in duration-500">
           <div className="bg-white border-[6px] border-black p-10 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] mb-12 transform -rotate-1">
              <EditableText tag="h1" className="text-7xl font-black uppercase italic tracking-tighter leading-[0.8] mb-4 block" field="customTitle" initialValue={profile.name} />
              <div className="inline-block px-4 py-1 bg-black text-white transform hover:scale-105 transition-transform">
                <EditableText tag="span" className="text-2xl font-black uppercase" field="customPosition" initialValue={profile.currentPosition} />
              </div>
              <EditableText tag="p" className="mt-6 font-bold text-slate-800 block" field="customBio" initialValue={profile.description} />
           </div>
           
           <div className="grid grid-cols-2 gap-10">
              <div className="bg-[#0336FF] text-white border-[6px] border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                 <h3 className="text-3xl font-black uppercase underline decoration-4 mb-6">Keahlian Utama</h3>
                 <div className="flex flex-wrap gap-3">
                    {skills.map((s: any) => <span key={s.id} className="bg-white text-black px-3 py-1 font-black text-xs uppercase border-2 border-black">{s.name}</span>)}
                 </div>
              </div>
              <div className="bg-[#FF0266] text-white border-[6px] border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
                 <h3 className="text-3xl font-black uppercase underline decoration-4 mb-6">Pencapaian</h3>
                 <div className="space-y-4">
                    {achievements.map((a: any) => <p key={a.id} className="font-bold leading-tight">★ {a.title}</p>)}
                 </div>
              </div>
           </div>
        </div>
      );

    case 't-bento':
      return (
        <div className="bg-slate-50 min-h-full p-8 grid grid-cols-6 gap-6 animate-in fade-in duration-1000">
           <div className="col-span-4 bg-white p-12 rounded-[3.5rem] shadow-sm border border-white">
              <ProfileImg />
              <EditableText tag="h1" className="text-6xl font-black tracking-tighter mt-8 leading-[0.9] text-slate-900 block" field="customTitle" initialValue={profile.name} />
              <EditableText tag="p" className="text-xl font-bold text-blue-600 mt-4 uppercase tracking-[0.2em] block" field="customPosition" initialValue={profile.currentPosition} />
              <EditableText tag="p" className="mt-8 text-lg text-slate-500 font-medium leading-relaxed italic block" field="customBio" initialValue={profile.description} />
           </div>
           
           <div className="col-span-2 bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between">
              <SectionTag dark>Pengalaman</SectionTag>
              <div className="space-y-6">
                 {work.slice(0, 3).map((w: any) => (
                    <div key={w.id}>
                       <p className="font-black text-sm">{w.position}</p>
                       <p className="text-[10px] opacity-40 uppercase font-bold">{w.company}</p>
                    </div>
                 ))}
              </div>
              <p className="text-5xl font-black tracking-tighter mt-10">{work.length}+ <span className="text-xs uppercase block text-white/30 tracking-widest">Global Reach</span></p>
           </div>

           <div className="col-span-3 bg-blue-600 text-white p-10 rounded-[3.5rem] shadow-xl">
              <SectionTag dark>Keahlian Utama</SectionTag>
              <div className="flex flex-wrap gap-2">
                 {skills.map((s: any) => <span key={s.id} className="px-4 py-2 bg-white/10 rounded-2xl text-[10px] font-black uppercase border border-white/10">{s.name}</span>)}
              </div>
           </div>

           <div className="col-span-3 bg-white p-10 rounded-[3.5rem] border border-white shadow-sm">
              <SectionTag>Pencapaian</SectionTag>
              <div className="space-y-4">
                 {achievements.slice(0, 3).map((a: any) => <p key={a.id} className="font-black text-slate-700 text-base border-b border-slate-50 pb-2">🏆 {a.title}</p>)}
              </div>
           </div>
        </div>
      );

    case 't-startup':
      return (
        <div className="bg-white min-h-full font-sans animate-in slide-in-from-bottom-10 duration-700">
           <nav className="p-10 flex justify-between items-center border-b border-slate-50">
              <span className="font-black text-xl tracking-tighter text-blue-600">JEJAK.KARIR</span>
              <div className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Connect →</div>
           </nav>
           <div className="p-20 text-center max-w-4xl mx-auto">
              <EditableText tag="h1" className="text-8xl font-black tracking-tighter text-slate-900 mb-8 block" field="customTitle" initialValue={profile.name} />
              <EditableText tag="p" className="text-2xl text-slate-500 font-medium leading-relaxed mb-12 block" field="customBio" initialValue={profile.description} />
              <div className="flex flex-col items-center justify-center gap-4">
                 <div className="w-20 h-1 bg-blue-600 rounded-full"></div>
                 <EditableText tag="span" className="text-xs font-black uppercase tracking-[0.5em] text-slate-300 block" field="customPosition" initialValue={profile.currentPosition} />
              </div>
           </div>
           <div className="p-20 bg-slate-50">
              <div className="grid grid-cols-2 gap-20">
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-10"># Perjalanan Karir</h4>
                    <div className="space-y-12">
                       {work.map((w: any) => (
                          <div key={w.id}>
                             <h5 className="text-3xl font-black text-slate-800">{w.position}</h5>
                             <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-2">{w.company}</p>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-10"># Keahlian Utama</h4>
                    <div className="grid grid-cols-2 gap-4">
                       {skills.map((s: any) => <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 font-black text-slate-800 text-sm">{s.name}</div>)}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      );

    default: // CINEMATIC DARK
      return (
        <div className="bg-slate-950 text-white min-h-full p-20 font-sans animate-in fade-in duration-1000">
           <div className="max-w-4xl mx-auto space-y-32">
              <header className="space-y-12">
                 <p className="text-xs font-black text-blue-600 tracking-[0.6em] uppercase">Portfolio '25</p>
                 <EditableText tag="h1" className="text-9xl font-black tracking-tighter leading-[0.8] block" field="customTitle" initialValue={profile.name} />
                 <EditableText tag="p" className="text-2xl font-bold text-slate-400 uppercase tracking-widest block" field="customPosition" initialValue={profile.currentPosition} />
                 <EditableText tag="p" className="text-3xl text-slate-500 leading-tight max-w-2xl font-medium block" field="customBio" initialValue={profile.description} />
              </header>

              <section className="space-y-20">
                 <h3 className="text-xs font-black uppercase tracking-[0.5em] text-slate-700">Keahlian Utama</h3>
                 <div className="flex flex-wrap gap-10">
                    {skills.map((s: any) => <span key={s.id} className="text-4xl font-black text-white hover:text-blue-500 transition-colors">#{s.name}</span>)}
                 </div>
              </section>

              <section className="space-y-20">
                 <h3 className="text-xs font-black uppercase tracking-[0.5em] text-slate-700">Pengalaman</h3>
                 <div className="space-y-16">
                    {work.map((w: any) => (
                      <div key={w.id} className="group border-b border-white/5 pb-16 hover:border-blue-500 transition-colors duration-700">
                         <div className="flex justify-between items-baseline mb-4">
                            <h4 className="text-5xl font-black group-hover:text-blue-500 transition-colors">{w.position}</h4>
                            <span className="text-slate-600 font-black text-xs uppercase tracking-widest">{w.duration}</span>
                         </div>
                         <p className="text-slate-500 font-bold uppercase tracking-[0.2em]">{w.company}</p>
                      </div>
                    ))}
                 </div>
              </section>
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

export default OnlineCVBuilder;
