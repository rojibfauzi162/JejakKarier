
import React from 'react';
import { AppData, Skill, Achievement, PersonalProject, WorkExperience, Education } from '../types';

interface OnlineCVViewProps {
  slug: string;
  initialData: AppData;
}

const OnlineCVView: React.FC<OnlineCVViewProps> = ({ slug, initialData }) => {
  const config = initialData.onlineCV;
  const profile = initialData.profile;
  
  // Jika tidak aktif, tampilkan 404 sederhana
  if (!config.isActive || config.username !== slug) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center text-4xl mb-6">🔒</div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Profile not available</h1>
        <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Halaman yang Anda cari sedang offline atau belum dipublikasikan oleh pemiliknya.</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase tracking-widest text-[10px]">Back to Platform</button>
      </div>
    );
  }

  // Filter data sesuai pilihan di builder
  const work = initialData.workExperiences.filter(i => config.selectedItemIds.work?.includes(i.id));
  const projects = initialData.personalProjects.filter(i => config.selectedItemIds.projects?.includes(i.id));
  const skills = initialData.skills.filter(i => config.selectedItemIds.skills?.includes(i.id));

  // RENDER THEMES
  const renderTheme = () => {
    switch(config.themeId) {
      case 't-bento': return <BentoTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
      case 't-dark': return <DarkTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
      case 't-terminal': return <TerminalTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
      case 't-neubrutalism': return <NeubrutalismTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
      case 't-glass': return <GlassTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
      case 't-executive': return <ExecutiveTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
      default: return <MinimalTheme profile={profile} work={work} projects={projects} skills={skills} links={config.socialLinks} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderTheme()}
    </div>
  );
};

/* --- THEME COMPONENTS --- */

// 1. Bento Grid Theme
const BentoTheme = ({ profile, work, projects, skills, links }: any) => (
  <div className="min-h-screen bg-slate-50 p-6 lg:p-12 font-sans text-slate-900">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Intro Card */}
      <div className="md:col-span-4 lg:col-span-4 bg-white p-10 rounded-[3rem] shadow-sm border border-white flex flex-col justify-center gap-6">
        {profile.photoUrl && <img src={profile.photoUrl} className="w-24 h-24 rounded-3xl shadow-xl object-cover mb-2" />}
        <div>
          <h1 className="text-5xl font-black tracking-tighter leading-none">{profile.name}</h1>
          <p className="text-xl font-bold text-blue-600 mt-2 uppercase tracking-widest">{profile.currentPosition}</p>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">{profile.description}</p>
      </div>

      {/* Experience Summary */}
      <div className="md:col-span-2 lg:col-span-2 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between">
         <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Work History</p>
         <div className="space-y-6 mt-8">
            {work.slice(0, 2).map((w: any) => (
              <div key={w.id}>
                <p className="font-black text-sm">{w.position}</p>
                <p className="text-[10px] opacity-60 font-bold uppercase">{w.company}</p>
              </div>
            ))}
         </div>
         <div className="mt-8 pt-8 border-t border-white/10 text-4xl font-black tracking-tighter">
            {work.length}+ Exp
         </div>
      </div>

      {/* Skill Cloud */}
      <div className="md:col-span-2 lg:col-span-3 bg-blue-600 text-white p-10 rounded-[3rem] shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-blue-200">Expertise</h3>
        <div className="flex flex-wrap gap-2">
           {skills.map((s: any) => (
             <span key={s.id} className="px-4 py-2 bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/20">{s.name}</span>
           ))}
        </div>
      </div>

      {/* Projects */}
      <div className="md:col-span-2 lg:col-span-3 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden relative">
         <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-slate-400">Featured Projects</h3>
         <div className="space-y-4">
            {projects.slice(0, 3).map((p: any) => (
              <div key={p.id} className="flex justify-between items-center group cursor-pointer border-b border-slate-50 pb-4 hover:border-blue-500 transition-all">
                 <div>
                    <p className="font-black text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.status}</p>
                 </div>
                 <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  </div>
);

// 2. Minimal Dark Theme
const DarkTheme = ({ profile, work, projects, skills }: any) => (
  <div className="min-h-screen bg-slate-950 text-white p-8 lg:p-24 selection:bg-blue-500/30">
    <div className="max-w-4xl mx-auto space-y-24">
      <header className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none">{profile.name}</h1>
        <div className="flex items-center gap-6">
           <div className="h-0.5 w-12 bg-blue-600"></div>
           <p className="text-xl lg:text-2xl font-bold uppercase tracking-[0.2em] text-slate-400">{profile.currentPosition}</p>
        </div>
        <p className="text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl font-medium italic">"{profile.description}"</p>
      </header>

      <section className="space-y-12">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">01 / Selected Work</h3>
        <div className="space-y-8">
           {work.map((w: any) => (
             <div key={w.id} className="group flex flex-col md:flex-row md:items-center justify-between py-8 border-b border-white/5 hover:border-white/20 transition-all">
                <div className="space-y-1">
                   <h4 className="text-2xl lg:text-3xl font-black group-hover:text-blue-500 transition-colors">{w.position}</h4>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{w.company}</p>
                </div>
                <span className="text-slate-700 font-black text-xs uppercase mt-4 md:mt-0">{w.duration}</span>
             </div>
           ))}
        </div>
      </section>

      <footer className="pt-24 border-t border-white/5 text-center lg:text-left flex flex-col md:flex-row justify-between items-center gap-8">
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Contact me: {profile.email}</p>
         <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-blue-600">
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">Github</a>
         </div>
      </footer>
    </div>
  </div>
);

// 3. Terminal Theme
const TerminalTheme = ({ profile, work, projects, skills }: any) => (
  <div className="min-h-screen bg-black text-emerald-500 p-4 lg:p-10 font-mono text-sm leading-relaxed">
    <div className="max-w-4xl mx-auto border border-emerald-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
      <div className="bg-emerald-950/30 px-4 py-2 border-b border-emerald-500/30 flex justify-between items-center">
         <div className="flex gap-1.5">
           <div className="w-2 h-2 rounded-full bg-emerald-900"></div>
           <div className="w-2 h-2 rounded-full bg-emerald-900"></div>
           <div className="w-2 h-2 rounded-full bg-emerald-900"></div>
         </div>
         <span className="text-[10px] opacity-40 uppercase font-black">bash — 80x24</span>
      </div>
      <div className="p-8 space-y-8 overflow-y-auto">
        <div>
           <p className="opacity-40 mb-4">$ whoami</p>
           <h1 className="text-4xl font-black tracking-tight text-white mb-2">{profile.name}</h1>
           <p className="text-emerald-400 font-bold">[{profile.currentPosition}] @ {profile.currentCompany}</p>
           <p className="mt-4 text-emerald-600 max-w-xl">"{profile.description}"</p>
        </div>

        <div>
           <p className="opacity-40 mb-4">$ cat skills.json</p>
           <p className="text-white">[{skills.map((s:any) => `"${s.name}"`).join(', ')}]</p>
        </div>

        <div>
           <p className="opacity-40 mb-4">$ ls work_experience/</p>
           <div className="space-y-4">
              {work.map((w:any) => (
                <div key={w.id} className="border-l border-emerald-500/20 pl-6">
                   <p className="text-white font-black text-base">{w.position}</p>
                   <p className="opacity-60 text-xs font-bold uppercase">{w.company} | {w.duration}</p>
                   <p className="mt-2 text-emerald-800 text-xs leading-relaxed">{w.description}</p>
                </div>
              ))}
           </div>
        </div>
        
        <p className="animate-pulse">_</p>
      </div>
    </div>
  </div>
);

// 4. Neubrutalism Theme
const NeubrutalismTheme = ({ profile, work, projects, skills }: any) => (
  <div className="min-h-screen bg-[#F0EAD6] p-4 lg:p-12 font-sans selection:bg-yellow-300">
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="bg-yellow-400 border-4 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
         <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-4">{profile.name}</h1>
         <p className="text-xl font-black uppercase italic tracking-widest border-2 border-black inline-block px-4 py-1 bg-white">{profile.currentPosition}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">Experience</h3>
            <div className="space-y-8">
               {work.map((w:any) => (
                 <div key={w.id}>
                    <p className="font-black text-lg">{w.position}</p>
                    <p className="font-bold text-xs uppercase opacity-60 mb-2">{w.company}</p>
                    <p className="text-sm font-medium leading-relaxed">{w.description}</p>
                 </div>
               ))}
            </div>
         </div>
         <div className="space-y-10">
            <div className="bg-purple-400 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 text-white">Skills</h3>
               <div className="flex flex-wrap gap-2">
                  {skills.map((s:any) => (
                    <span key={s.id} className="px-3 py-1 bg-white border-2 border-black font-black text-xs uppercase">{s.name}</span>
                  ))}
               </div>
            </div>
            <div className="bg-emerald-400 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">About</h3>
               <p className="font-bold text-sm leading-loose">{profile.description}</p>
            </div>
         </div>
      </div>
    </div>
  </div>
);

// Fallback / Minimalist Theme (Modern Standard)
const MinimalTheme = ({ profile, work, projects, skills }: any) => (
  <div className="min-h-screen bg-white p-8 lg:p-24 font-sans text-slate-900">
    <div className="max-w-3xl mx-auto space-y-16">
      <header className="space-y-6">
        <h1 className="text-4xl font-black tracking-tight">{profile.name}</h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">{profile.description}</p>
      </header>

      <section className="space-y-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Experience</h3>
        <div className="space-y-10">
          {work.map((w: any) => (
            <div key={w.id} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{w.duration}</span>
              <div className="md:col-span-3 space-y-2">
                <h4 className="font-black text-slate-800 text-base">{w.position} · {w.company}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{w.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-16 border-t border-slate-100 flex justify-between items-center">
         <span className="text-xs font-black uppercase tracking-widest text-slate-400">{profile.email}</span>
         <div className="flex gap-4">
           {/* Simple placeholders for social */}
           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🔗</div>
           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">📱</div>
         </div>
      </footer>
    </div>
  </div>
);

// Template themes placeholder objects (lebih banyak bisa ditambahkan sesuai logika switch di atas)
const GlassTheme = ({ profile }: any) => <div>Glass Theme Placeholder</div>;
const ExecutiveTheme = ({ profile }: any) => <div>Executive Theme Placeholder</div>;

export default OnlineCVView;
