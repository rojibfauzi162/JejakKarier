
import React, { useState, useMemo } from 'react';
import { AppData, WorkExperience, Education, Skill, Training, Certification, Achievement } from '../types';

interface CVGeneratorProps {
  data: AppData;
}

type CVSection = 'work' | 'education' | 'skills' | 'trainings' | 'certs' | 'achievements';

const TEMPLATES = [
  { id: 't1', name: 'Professional Blue', description: 'Header biru tegas, layout korporat standar.' },
  { id: 't2', name: 'Modern Split (Dark Sidebar)', description: 'Sidebar kiri gelap untuk identitas, kanan terang untuk konten.' },
  { id: 't3', name: 'Clean Minimalist', description: 'Sangat bersih, fokus pada tipografi dan garis tipis.' },
  { id: 't4', name: 'Executive Elegance', description: 'Gaya premium dengan font serif dan layout terpusat.' },
  { id: 't5', name: 'Creative Card', description: 'Bagian-bagian dibungkus kartu dengan bayangan lembut.' },
  { id: 't6', name: 'Tech / Modern Grid', description: 'Gaya modern dengan grid tegas dan aksen monospace.' },
  { id: 't7', name: 'Startup Fresh', description: 'Warna cerah, sudut membulat, dan layout dinamis.' },
  { id: 't8', name: 'Dual Column Balance', description: 'Dua kolom seimbang untuk skill dan pengalaman.' },
  { id: 't9', name: 'High Contrast Block', description: 'Header blok warna solid dengan visual kontras.' },
  { id: 't10', name: 'Premium Digital UI', description: 'Aksen gradien dan gaya antarmuka aplikasi modern.' },
];

const CVGenerator: React.FC<CVGeneratorProps> = ({ data }) => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('t1');
  const [visibleSections, setVisibleSections] = useState<Set<CVSection>>(new Set(['work', 'education', 'skills', 'trainings', 'certs', 'achievements']));
  const [selectedItems, setSelectedItems] = useState<{
    work: Set<string>;
    education: Set<string>;
    skills: Set<string>;
    trainings: Set<string>;
    certs: Set<string>;
    achievements: Set<string>;
  }>({
    work: new Set(data.workExperiences.map(i => i.id)),
    education: new Set(data.educations.map(i => i.id)),
    skills: new Set(data.skills.map(i => i.id)),
    trainings: new Set(data.trainings.map(i => i.id)),
    certs: new Set(data.certifications.map(i => i.id)),
    achievements: new Set(data.achievements.map(i => i.id)),
  });

  const toggleSection = (section: CVSection) => {
    const next = new Set(visibleSections);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    setVisibleSections(next);
  };

  const toggleItem = (section: CVSection, id: string) => {
    const next = new Set(selectedItems[section]);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItems({ ...selectedItems, [section]: next });
  };

  const filteredData = useMemo(() => ({
    profile: data.profile,
    work: data.workExperiences.filter(i => selectedItems.work.has(i.id)),
    education: data.educations.filter(i => selectedItems.education.has(i.id)),
    skills: data.skills.filter(i => selectedItems.skills.has(i.id)),
    trainings: data.trainings.filter(i => selectedItems.trainings.has(i.id)),
    certs: data.certifications.filter(i => selectedItems.certs.has(i.id)),
    achievements: data.achievements.filter(i => selectedItems.achievements.has(i.id)),
  }), [data, selectedItems]);

  const renderCV = () => {
    // Helper Components
    const SectionHeader = ({ title, colorClass = "text-slate-400" }: { title: string, colorClass?: string }) => (
      <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 border-b pb-2 ${colorClass}`}>{title}</h3>
    );

    const ProfilePhoto = ({ className = "w-24 h-24" }: { className?: string }) => (
      data.profile.photoUrl ? (
        <div className={`${className} rounded-2xl overflow-hidden shadow-lg border-2 border-white mb-4`}>
          <img src={data.profile.photoUrl} alt="CV Profile" className="w-full h-full object-cover" />
        </div>
      ) : null
    );

    const ContactInfo = ({ isVertical = false }: { isVertical?: boolean }) => (
      <div className={`flex ${isVertical ? 'flex-col gap-2' : 'flex-wrap gap-4'} text-[10px] font-bold text-slate-500 uppercase tracking-tight`}>
        <span>📧 {data.profile.email}</span>
        <span>📞 {data.profile.phone}</span>
        <span>📍 {data.profile.domicile}</span>
      </div>
    );

    // Template Mapping
    const getTemplateClasses = () => {
      switch(selectedTemplate) {
        case 't2': return "flex gap-0 p-0 font-sans";
        case 't4': return "p-16 font-serif text-center";
        case 't6': return "p-12 font-mono bg-slate-50";
        case 't10': return "p-12 bg-white";
        default: return "p-12 font-sans";
      }
    };

    return (
      <div className={`min-h-[1122px] w-[794px] mx-auto bg-white shadow-2xl relative overflow-hidden transition-all duration-500 ${getTemplateClasses()}`}>
        
        {/* TEMPLATE 1: Corporate Classic */}
        {selectedTemplate === 't1' && (
          <div className="space-y-8">
            <div className="absolute top-0 left-0 w-full h-4 bg-blue-600"></div>
            <header className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{data.profile.name}</h1>
                <p className="text-lg font-bold text-blue-600 mt-1 uppercase tracking-widest">{data.profile.currentPosition}</p>
                <div className="mt-4"><ContactInfo /></div>
              </div>
              <ProfilePhoto className="w-28 h-28" />
            </header>
            <div className="text-sm text-slate-600 italic border-l-4 border-blue-600 pl-4">{data.profile.description}</div>
            <div className="grid grid-cols-1 gap-8">
               <CVContent filteredData={filteredData} visibleSections={visibleSections} SectionHeader={SectionHeader} />
            </div>
          </div>
        )}

        {/* TEMPLATE 2: Modern Split (Sidebar) */}
        {selectedTemplate === 't2' && (
          <>
            <div className="w-1/3 bg-slate-900 text-white p-10 flex flex-col items-center">
              <ProfilePhoto className="w-32 h-32 rounded-full border-4 border-slate-800" />
              <h1 className="text-2xl font-black text-center mt-6 tracking-tight leading-tight">{data.profile.name}</h1>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-2 text-center">{data.profile.currentPosition}</p>
              
              <div className="w-full mt-10 space-y-8">
                <div>
                   <h3 className="text-[10px] font-black uppercase text-blue-400 border-b border-white/10 pb-2 mb-4">Contact</h3>
                   <div className="space-y-3 text-[10px] opacity-70">
                     <p>📧 {data.profile.email}</p>
                     <p>📞 {data.profile.phone}</p>
                     <p>📍 {data.profile.domicile}</p>
                   </div>
                </div>
                {visibleSections.has('skills') && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-blue-400 border-b border-white/10 pb-2 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                       {filteredData.skills.map(s => (
                         <span key={s.id} className="px-2 py-1 bg-white/10 rounded text-[8px] uppercase font-bold">{s.name}</span>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 p-12 bg-white space-y-10">
              <div className="text-sm text-slate-600 leading-relaxed italic">"{data.profile.description}"</div>
              <CVContent filteredData={filteredData} visibleSections={visibleSections} SectionHeader={SectionHeader} hideSections={['skills']} />
            </div>
          </>
        )}

        {/* TEMPLATE 4: Executive Serif */}
        {selectedTemplate === 't4' && (
          <div className="space-y-10">
            <header className="border-b-2 border-slate-900 pb-8">
               <h1 className="text-5xl font-serif italic text-slate-900">{data.profile.name}</h1>
               <p className="text-lg text-slate-500 uppercase tracking-widest mt-2">{data.profile.currentPosition}</p>
               <div className="flex justify-center mt-4"><ContactInfo /></div>
            </header>
            <div className="max-w-xl mx-auto text-base text-slate-700 leading-loose italic">{data.profile.description}</div>
            <div className="text-left grid grid-cols-1 gap-10">
               <CVContent filteredData={filteredData} visibleSections={visibleSections} SectionHeader={SectionHeader} />
            </div>
          </div>
        )}

        {/* TEMPLATE 6: Tech Grid */}
        {selectedTemplate === 't6' && (
          <div className="space-y-10">
            <div className="border-4 border-slate-900 p-8 flex justify-between items-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <div>
                  <h1 className="text-4xl font-black tracking-tighter">&gt; {data.profile.name}</h1>
                  <p className="text-blue-600 font-bold mt-1">// {data.profile.currentPosition}</p>
               </div>
               <ProfilePhoto className="w-24 h-24 rounded-none border-4 border-slate-900" />
            </div>
            <div className="grid grid-cols-12 gap-10">
               <div className="col-span-8 space-y-10">
                  <CVContent filteredData={filteredData} visibleSections={visibleSections} SectionHeader={SectionHeader} hideSections={['skills', 'certs']} />
               </div>
               <div className="col-span-4 bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="space-y-8">
                     <SectionHeader title="Stack" colorClass="text-slate-900" />
                     <div className="flex flex-col gap-3">
                        {filteredData.skills.map(s => (
                          <div key={s.id} className="text-[10px] font-bold">
                             <p>{s.name}</p>
                             <div className="h-1 bg-slate-100 mt-1"><div className="h-full bg-slate-900" style={{width: `${s.currentLevel*20}%`}}></div></div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* TEMPLATE 10: Modern UI Gradient */}
        {selectedTemplate === 't10' && (
          <div className="space-y-10">
            <header className="bg-gradient-to-r from-indigo-600 to-blue-500 p-12 -m-12 mb-12 text-white flex justify-between items-center">
               <div className="flex items-center gap-8">
                 <ProfilePhoto className="w-32 h-32 rounded-3xl border-4 border-white/20 shadow-2xl" />
                 <div>
                    <h1 className="text-4xl font-black tracking-tight">{data.profile.name}</h1>
                    <p className="text-blue-100 text-lg font-medium opacity-80 mt-1">{data.profile.currentPosition}</p>
                    <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-white/70">
                       <span>{data.profile.email}</span>
                       <span>{data.profile.domicile}</span>
                    </div>
                 </div>
               </div>
            </header>
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 text-slate-700 italic leading-relaxed text-sm">
               "{data.profile.description}"
            </div>
            <div className="grid grid-cols-2 gap-12">
               <CVContent filteredData={filteredData} visibleSections={visibleSections} SectionHeader={SectionHeader} />
            </div>
          </div>
        )}

        {/* DEFAULT Fallback for other templates (T3, T5, T7, T8, T9) */}
        {!['t1', 't2', 't4', 't6', 't10'].includes(selectedTemplate) && (
          <div className="space-y-8">
             <header className="flex flex-col items-center text-center">
               <ProfilePhoto className="w-32 h-32 rounded-full mb-6" />
               <h1 className="text-4xl font-black text-slate-900">{data.profile.name}</h1>
               <p className="text-lg font-bold text-indigo-600 uppercase mt-2">{data.profile.currentPosition}</p>
               <div className="mt-4"><ContactInfo /></div>
             </header>
             <div className="text-sm text-slate-600 text-center max-w-2xl mx-auto">{data.profile.description}</div>
             <CVContent filteredData={filteredData} visibleSections={visibleSections} SectionHeader={SectionHeader} />
          </div>
        )}

      </div>
    );
  };

  const steps = [
    { id: 1, label: 'Visual Style', icon: '🎨' },
    { id: 2, label: 'Data Picker', icon: '📝' },
    { id: 3, label: 'Final Export', icon: '🚀' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI CV Intelligence Builder</h2>
          <p className="text-slate-500 font-medium">Langkah {step} dari 3: {steps.find(s => s.id === step)?.label}</p>
        </div>
        {step === 3 && (
          <button onClick={() => window.print()} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all text-xs uppercase tracking-widest flex items-center gap-3">
            <span>📥</span> Download PDF
          </button>
        )}
      </header>

      {/* Progress Stepper */}
      <div className="bg-white px-8 py-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-slate-100 w-full">
           <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
        {steps.map(s => (
          <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all ${
              step === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' : 
              step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.id ? '✓' : s.icon}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${step === s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Action Area */}
        <div className="xl:col-span-4 space-y-6">
          {step === 1 && (
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px]">1</span>
                Pilih Template Modern
              </h3>
              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left group ${
                      selectedTemplate === t.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-full aspect-[3/4] rounded-xl mb-3 shadow-sm ${selectedTemplate === t.id ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-300'} transition-colors flex items-center justify-center text-[8px] text-white/30 font-black uppercase`}>Preview</div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 leading-tight">{t.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px]">2</span>
                Filter Data Experience
              </h3>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                <SelectionSection title="Riwayat Pekerjaan" active={visibleSections.has('work')} onToggle={() => toggleSection('work')} items={data.workExperiences.map(i => ({ id: i.id, label: i.position, sub: i.company }))} selectedIds={selectedItems.work} onToggleItem={(id) => toggleItem('work', id)} />
                <SelectionSection title="Pendidikan" active={visibleSections.has('education')} onToggle={() => toggleSection('education')} items={data.educations.map(i => ({ id: i.id, label: i.degree, sub: i.institution }))} selectedIds={selectedItems.education} onToggleItem={(id) => toggleItem('education', id)} />
                <SelectionSection title="Keahlian (Skills)" active={visibleSections.has('skills')} onToggle={() => toggleSection('skills')} items={data.skills.map(i => ({ id: i.id, label: i.name, sub: i.category }))} selectedIds={selectedItems.skills} onToggleItem={(id) => toggleItem('skills', id)} />
                <SelectionSection title="Achievements" active={visibleSections.has('achievements')} onToggle={() => toggleSection('achievements')} items={data.achievements.map(i => ({ id: i.id, label: i.title, sub: i.impact }))} selectedIds={selectedItems.achievements} onToggleItem={(id) => toggleItem('achievements', id)} />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white animate-in slide-in-from-left-4 duration-500">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🚀</div>
               <h3 className="text-xl font-black tracking-tight mb-2">Siap untuk Dilamar?</h3>
               <p className="text-slate-400 text-sm leading-relaxed mb-8">Tinjau kembali data Anda di pratinjau samping. Jika sudah sesuai, klik download untuk mendapatkan file PDF profesional Anda.</p>
               <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                     <span className="text-[10px] font-bold uppercase text-slate-500">Template</span>
                     <span className="text-xs font-black text-blue-400 uppercase">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                     <span className="text-[10px] font-bold uppercase text-slate-500">Total Item</span>
                     <span className="text-xs font-black text-emerald-400 uppercase">{filteredData.work.length + filteredData.education.length + filteredData.skills.length} Items</span>
                  </div>
               </div>
            </section>
          )}

          {/* Stepper Navigation */}
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                ← Kembali
              </button>
            )}
            {step < 3 ? (
              <button 
                onClick={() => setStep(s => s + 1)}
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
              >
                Lanjut Ke Step {step + 1} →
              </button>
            ) : (
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Ulangi
              </button>
            )}
          </div>
        </div>

        {/* Right Preview Area */}
        <div className="xl:col-span-8 flex justify-center items-start">
          <div className="sticky top-10 transform scale-[0.6] md:scale-[0.8] lg:scale-[0.9] xl:scale-1 origin-top transition-all duration-700">
             <div className="bg-slate-200 p-8 rounded-[3rem] shadow-inner border-4 border-white/50">
               {renderCV()}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Sub-component for CV sections to reduce repetition
const CVContent = ({ filteredData, visibleSections, SectionHeader, hideSections = [] }: any) => {
  const isSectionVisible = (key: string) => visibleSections.has(key) && !hideSections.includes(key);

  return (
    <>
      {isSectionVisible('work') && filteredData.work.length > 0 && (
        <div>
          <SectionHeader title="Experience" />
          <div className="space-y-6">
            {filteredData.work.map((w: WorkExperience) => (
              <div key={w.id}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-black text-slate-800 text-sm uppercase">{w.position}</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{w.duration}</span>
                </div>
                <p className="text-blue-600 text-[10px] font-black uppercase mb-2 tracking-widest">{w.company}</p>
                <p className="text-xs text-slate-600 leading-relaxed text-justify">{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSectionVisible('education') && filteredData.education.length > 0 && (
        <div>
          <SectionHeader title="Education" />
          <div className="space-y-4">
            {filteredData.education.map((e: Education) => (
              <div key={e.id} className="flex justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{e.degree}</h4>
                  <p className="text-slate-500 text-[10px] font-medium">{e.institution}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSectionVisible('skills') && filteredData.skills.length > 0 && (
        <div>
          <SectionHeader title="Expertise" />
          <div className="flex flex-wrap gap-2">
            {filteredData.skills.map((s: Skill) => (
              <span key={s.id} className="px-3 py-1 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-lg">
                {s.name} (Lv.{s.currentLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      {isSectionVisible('achievements') && filteredData.achievements.length > 0 && (
        <div>
          <SectionHeader title="Impact" />
          <div className="space-y-3">
            {filteredData.achievements.map((a: Achievement) => (
              <div key={a.id} className="text-xs">
                <p className="font-bold text-slate-800 text-[11px] mb-1">{a.title}</p>
                <p className="text-slate-500 italic text-[10px] leading-relaxed">{a.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const SelectionSection: React.FC<{ 
  title: string, 
  active: boolean, 
  onToggle: () => void, 
  items: {id: string, label: string, sub: string}[],
  selectedIds: Set<string>,
  onToggleItem: (id: string) => void
}> = ({ title, active, onToggle, items, selectedIds, onToggleItem }) => (
  <div className="space-y-3">
    <button 
      onClick={onToggle}
      className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all ${active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      <span className="text-lg">{active ? '✓' : '○'}</span>
    </button>
    {active && (
      <div className="pl-4 space-y-2 animate-in slide-in-from-top-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onToggleItem(item.id)}
            className={`w-full text-left p-3 rounded-xl border text-[10px] transition-all flex justify-between items-center ${
              selectedIds.has(item.id) ? 'bg-white border-blue-500 text-slate-800' : 'bg-slate-50/50 border-slate-100 text-slate-300'
            }`}
          >
            <div>
              <p className="font-bold truncate max-w-[150px]">{item.label}</p>
              <p className="opacity-60 text-[8px] font-medium">{item.sub}</p>
            </div>
            <span className="text-lg">{selectedIds.has(item.id) ? '✅' : '☐'}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default CVGenerator;
