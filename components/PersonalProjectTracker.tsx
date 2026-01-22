
import React, { useState, useEffect } from 'react';
import { PersonalProject, ProjectStatus } from '../types';

interface PersonalProjectTrackerProps {
  projects: PersonalProject[];
  onAdd: (p: PersonalProject) => void;
  onUpdate: (p: PersonalProject) => void;
  onDelete: (id: string) => void;
}

const PersonalProjectTracker: React.FC<PersonalProjectTrackerProps> = ({ projects, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalProject | null>(null);

  const openAddForm = () => {
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personal Project Tracker</h2>
          <p className="text-slate-500 mt-1">Lacak proyek freelance, kerja sampingan, dan riset mandiri Anda.</p>
        </div>
        <button onClick={openAddForm} className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
          + Tambah Proyek Baru
        </button>
      </header>

      {/* Summary Row */}
      <div className="flex w-full md:w-[450px] border-2 border-slate-900 overflow-hidden rounded-md shadow-sm">
        <div className="bg-blue-600 text-white px-6 py-2 flex-1 font-black text-xs uppercase tracking-widest flex items-center justify-center border-r-2 border-slate-900">
          TOTAL PERSONAL PROJECT
        </div>
        <div className="bg-slate-100 flex-1 flex items-center justify-center text-xl font-black text-slate-900">
          {projects.length}
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(proj)} className="p-2 text-slate-400 hover:text-blue-600">✎</button>
                      <button onClick={() => onDelete(proj.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={7} className="py-24 text-center text-slate-400 italic font-medium">Belum ada proyek pribadi yang dicatat.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Proyek</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Portfolio Website" required />
        </div>

        {/* Improved Date Picker Section */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Proyek</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={() => setIsRange(false)} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${!isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Single Date</button>
              <button type="button" onClick={() => setIsRange(true)} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Date Range</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-400 ml-1 uppercase">{isRange ? 'Tanggal Mulai' : 'Pilih Tanggal'}</p>
              <input type="date" className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-2 focus:ring-blue-500/10" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            {isRange && (
              <div className="space-y-1 animate-in slide-in-from-left-2 duration-300">
                <p className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Tanggal Selesai</p>
                <input type="date" className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-2 focus:ring-blue-500/10" value={endDate} onChange={e => setEndDate(e.target.value)} required={isRange} />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Status Proyek</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}>
            <option value={ProjectStatus.PROSES}>Dalam Proses</option>
            <option value={ProjectStatus.SELESAI}>Selesai</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Skill yang Digunakan (Pisahkan dengan koma)</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" value={skillsText} onChange={e => handleSkillsChange(e.target.value)} placeholder="e.g. React, Tailwind, Firebase" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Link Proyek</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Deskripsi Proyek</label>
          <textarea rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ceritakan tentang proyek ini..." />
        </div>
      </div>
      <div className="flex gap-4 pt-6">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Batal</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black">Simpan Proyek</button>
      </div>
    </div>
  );
};

export default PersonalProjectTracker;
