
import React, { useMemo } from 'react';
import { AppData } from '../types';
import { LiveThemeRenderer } from './OnlineCVBuilder';

interface OnlineCVViewProps {
  slug: string;
  initialData: AppData;
}

const OnlineCVView: React.FC<OnlineCVViewProps> = ({ slug, initialData }) => {
  const config = initialData.onlineCV;
  
  // Jika tidak aktif, tampilkan 404 sederhana
  if (!config.isActive || config.username !== slug) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center text-4xl mb-6">🔒</div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Profile not available</h1>
        <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Halaman yang Anda cari sedang offline atau belum dipublikasikan oleh pemiliknya.</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase tracking-widest text-[10px]">Back to Platform</button>
      </div>
    );
  }

  // Filter data sesuai pilihan di builder
  const previewData = useMemo(() => {
    return {
      profile: {
        ...initialData.profile,
        name: config.customTitle || initialData.profile.name,
        currentPosition: config.customPosition || initialData.profile.currentPosition,
        description: config.customBio || initialData.profile.description
      },
      work: initialData.workExperiences.filter(w => config.selectedItemIds.work?.includes(w.id)),
      projects: initialData.personalProjects.filter(p => config.selectedItemIds.projects?.includes(p.id)),
      skills: initialData.skills.filter(s => config.selectedItemIds.skills?.includes(s.id)),
      achievements: initialData.achievements.filter(a => config.selectedItemIds.achievements?.includes(a.id)),
    };
  }, [initialData, config]);

  return (
    <div className="min-h-screen bg-white">
      {/* Gunakan renderer yang sama persis dengan yang ada di Builder */}
      <LiveThemeRenderer 
        themeId={config.themeId} 
        data={previewData} 
        isReadOnly={true} 
      />
      
      {/* Floating Badge Branding */}
      <div className="fixed bottom-6 right-6">
         <a href="/" target="_blank" className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 pl-4 pr-6 rounded-full border border-slate-200 shadow-xl group hover:bg-slate-900 transition-all duration-500">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform">F</div>
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Created with</span>
               <span className="text-[10px] font-black text-slate-900 group-hover:text-white transition-colors tracking-tighter">FokusKarir Platform</span>
            </div>
         </a>
      </div>
    </div>
  );
};

export default OnlineCVView;
