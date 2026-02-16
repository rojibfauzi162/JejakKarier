
import React, { useState, useEffect } from 'react';
import { PersonalProject, ProjectStatus, AppData, SubscriptionPlan } from '../types';

interface PersonalProjectTrackerProps {
  projects: PersonalProject[];
  onAdd: (p: PersonalProject) => void;
  onUpdate: (p: PersonalProject) => void;
  onDelete: (id: string) => void;
  appData?: AppData;
  onUpgrade?: () => void;
}

const PersonalProjectTracker: React.FC<PersonalProjectTrackerProps> = ({ projects, onAdd, onUpdate, onDelete, appData, onUpgrade }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalProject | null>(null);

  // LOGIC LIMITASI - HANYA UNTUK PAKET FREE
  const limit = appData?.planLimits?.projects || 10;
  const isLimitReached = appData?.plan === SubscriptionPlan.FREE && limit !== 'unlimited' && projects.length >= Number(limit);

  const openAddForm = () => {
    if (isLimitReached) {
      alert(`Limit proyek personal Anda (${limit} proyek) telah tercapai. Silakan upgrade paket Anda.`);
      onUpgrade?.();
      return;
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: PersonalProject) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Personal Project Tracker</h2>
          <p className="text-slate-500 mt-1 text-xs lg:text-sm">Lacak proyek freelance, kerja sampingan, dan riset mandiri Anda.</p>
        </div>
        <button onClick={openAddForm} className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest">
          + Proyek Baru
        </button>
      </header>

      {/* INFO KUOTA (QUOTA BANNER) - HIDDEN FOR PRO USERS */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 mx-1 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-tools"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Portfolio Proyek ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {projects.length} / {limit === 'unlimited' ? '∞' : limit} Proyek Terdaftar
                 </p>
              </div>
           </div>
           <button 
              onClick={onUpgrade}
              className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95"
           >
              🚀 Upgrade Plan
           </button>
        </div>
      )}

      {/* LIMIT ALERT BAR - HANYA UNTUK USER FREE */}
      {isLimitReached && appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mx-1 animate-in slide-in-from-top-2 duration-500">
           <div className="flex items-center gap-4 text-center md:text-left">
              <span className="text-3xl">⚠️</span>
              <div>
                 <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Portofolio Penuh (Paket {appData?.plan})</p>
                 <p className="text-sm font-bold text-slate-800">Anda telah menggunakan seluruh slot proyek ({projects.length}/{limit}).</p>
              </div>
           </div>
           <button 
            onClick={onUpgrade}
            className="px-8 py-3 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
           >
             Upgrade Kapasitas →
           </button>
        </div>
      )}

      {/* Summary Row */}
      <div className="flex w-full md:w-[450px] border-2 border-slate-900 overflow-hidden rounded-2xl shadow-sm">
        <div className="bg-blue-600 text-white px-4 lg:px-6 py-2.5 flex-1 font-black text-[10px] lg:text-xs uppercase tracking-widest flex items-center justify-center border-r-2 border-slate-900">
          TOTAL PROJECTS
        </div>
        <div className="bg-slate-100 flex-1 flex items-center justify-center text-lg lg:text-xl font-black text-slate-900">
          {projects.length}
        </div>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-white/20 text-center w-16 bg-blue-600">NO <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-64">NAMA PROYEK <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-52">TANGGAL <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20">SKILL YANG DIGUNAKAN <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-44">LINK <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-32 text-center">STATUS <FilterIcon /></th>
              <th className="px-6 py-4">DESKRIPSI <FilterIcon /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((proj, index) => (
              <tr key={proj.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-5 border-r border-slate-200 text-center bg-blue-50/20 font-black text-blue-600">{index + 1}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-black text-slate-800 text-sm leading-tight">{proj.name}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-500 text-[13px] whitespace-pre-wrap">{proj.date}</td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{proj.skills.join(', ')}</p>
                </td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-bold hover:underline break-all">{proj.link}</a>
                </td>
                <td className="px-6 py-5 border-r border-slate-200 text-center">
                  <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    proj.status === ProjectStatus.SELESAI ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {proj.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2">"{proj.description}"</p>
                    <div className="flex gap-1 opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(proj)} className="p-2 text-slate-400 hover:text-blue-600">✎</button>
                      <button onClick={() => onDelete(proj.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Project Cards */}
      <div className="lg:hidden space-y-4">
        {projects.map((proj, index) => (
          <div key={proj.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xs">#{index + 1}</div>
                <div>
                  <h4 className="font-black text-slate-800 text-base leading-snug">{proj.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{proj.date}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditForm(proj)} className="p-2 text-slate-300">✎</button>
                <button onClick={() => onDelete(proj.id)} className="p-2 text-slate-300">✕</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  proj.status === ProjectStatus.SELESAI ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {proj.status}
                </span>
                {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 uppercase">View Link →</a>}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stack Used</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {proj.skills.map((skill, si) => (
                    <span key={si} className="px-2 py-0.5 bg-white text-slate-500 text-[9px] font-bold rounded-md border border-slate-100">{skill}</span>
                  ))}
                </div>
              </div>

              <p className="text-xs font-medium text-slate-500 leading-relaxed italic border-t border-slate-50 pt-3">
                " {proj.description} "
              </p>
            </div>
          </div>
        ))}
        {projects.length === 0 && <div className="py-16 text-center text-slate-400 italic font-medium">Belum ada proyek.</div>}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-6 lg:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight mb-8">
              {editingItem ? 'Update Project' : 'New Project'}
            </h3>
            <ProjectForm 
              initialData={editingItem}
              onSubmit={(data) => {
                if (editingItem) {
                  onUpdate({ ...editingItem, ...data } as PersonalProject);
                } else {
                  onAdd({ ...data, id: Math.random().toString(36).substr(2, 9) } as PersonalProject);
                }
                setIsFormOpen(false);
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectForm: React.FC<{ initialData: PersonalProject | null; onSubmit: (data: Partial<PersonalProject>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<PersonalProject>>(initialData || {
    name: '', date: new Date().toISOString().split('T')[0], skills: [], link: '', status: ProjectStatus.PROSES, description: ''
  });

  const [skillsText, setSkillsText] = useState(initialData ? initialData.skills.join(', ') : '');
  
  // Datepicker Logic
  const [isRange, setIsRange] = useState(initialData ? initialData.date.includes(' - ') : false);
  const [startDate, setStartDate] = useState(initialData ? (initialData.date.includes(' - ') ? initialData.date.split(' - ')[0] : initialData.date) : new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData && initialData.date.includes(' - ') ? initialData.date.split(' - ')[1] : '');

  const handleSkillsChange = (val: string) => {
    setSkillsText(val);
    const skills = val.split(',').map(s => s.trim()).filter(s => s !== '');
    setFormData({ ...formData, skills });
  };

  useEffect(() => {
    if (isRange && endDate) {
      setFormData(prev => ({ ...prev, date: `${startDate} - ${endDate}` }));
    } else {
      setFormData(prev => ({ ...prev, date: startDate }));
    }
  }, [startDate, endDate, isRange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Proyek</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Portfolio..." required />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={() => setIsRange(false)} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${!isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Single</button>
              <button type="button" onClick={() => setIsRange(true)} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Range</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            {isRange && (
              <input type="date" className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} required={isRange} />
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Status</label>
          <select className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}>
            <option value={ProjectStatus.PROSES}>Dalam Proses</option>
            <option value={ProjectStatus.SELESAI}>Selesai</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Skill (Pisahkan dengan koma)</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={skillsText} onChange={e => handleSkillsChange(e.target.value)} placeholder="React, Tailwind..." />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Link</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Deskripsi</label>
          <textarea rows={3} className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-xs" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detail..." />
        </div>
      </div>
      <div className="flex gap-4 pt-4 lg:pt-6">
        <button onClick={onCancel} className="flex-1 py-4 lg:py-5 text-slate-400 font-black rounded-2xl text-xs">Batal</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 lg:py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black text-xs">Simpan</button>
      </div>
    </div>
  );
};

export default PersonalProjectTracker;
