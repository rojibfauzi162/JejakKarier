
import React, { useState } from 'react';
import { Skill, Training, Certification, SkillStatus, SkillCategory, SkillPriority, TrainingStatus } from '../types';

interface SkillTrackerProps {
  skills: Skill[];
  trainings: Training[];
  certs: Certification[];
  onAddSkill: (s: Skill) => void;
  onUpdateSkill: (s: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onAddTraining: (t: Training) => void;
  onUpdateTraining: (t: Training) => void;
  onDeleteTraining: (id: string) => void;
  onAddCert: (c: Certification) => void;
  onUpdateCert: (c: Certification) => void;
  onDeleteCert: (id: string) => void;
}

const SkillTracker: React.FC<SkillTrackerProps> = ({ 
  skills, trainings, certs, 
  onAddSkill, onUpdateSkill, onDeleteSkill,
  onAddTraining, onUpdateTraining, onDeleteTraining,
  onAddCert, onUpdateCert, onDeleteCert
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'learning' | 'certs'>('skills');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const getPriorityStyle = (priority: SkillPriority) => {
    switch(priority) {
      case SkillPriority.CRITICAL: return 'bg-rose-50 text-rose-600 border-rose-100';
      case SkillPriority.HIGH: return 'bg-blue-50 text-blue-600 border-blue-100';
      case SkillPriority.MEDIUM: return 'bg-amber-50 text-amber-600 border-amber-100';
      case SkillPriority.LOW: return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const getStatusStyle = (status: SkillStatus) => {
    switch(status) {
      case SkillStatus.ACHIEVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case SkillStatus.ON_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-100';
      case SkillStatus.GAP: return 'bg-slate-50 text-slate-400 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  // Training metrics
  const totalCourses = trainings.length;
  const onProcessCount = trainings.filter(t => t.status === TrainingStatus.ON_PROCESS).length;
  const completedCount = trainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
  const percentage = totalCourses > 0 ? ((completedCount / totalCourses) * 100).toFixed(0) : "0";
  const totalCost = trainings.reduce((acc, t) => acc + (t.cost || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth & Intelligence</h2>
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar">
            <SubTabButton active={activeSubTab === 'skills'} onClick={() => setActiveSubTab('skills')} label="Skill Matrix" icon="🎯" />
            <SubTabButton active={activeSubTab === 'learning'} onClick={() => setActiveSubTab('learning')} label="Learning Hub" icon="📖" />
            <SubTabButton active={activeSubTab === 'certs'} onClick={() => setActiveSubTab('certs')} label="Credentials" icon="📜" />
          </div>
        </div>
        <button 
          onClick={openAddForm}
          className="group flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="text-xl">+</span>
          <span>Log New {activeSubTab === 'skills' ? 'Skill' : activeSubTab === 'learning' ? 'Course' : 'Cert'}</span>
        </button>
      </header>

      {/* Modern Dashboard Stats for Training */}
      {activeSubTab === 'learning' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-500">
          <StatWidget title="Total Course" value={totalCourses} icon="📚" color="blue" />
          <StatWidget title="In Progress" value={onProcessCount} icon="⏳" color="amber" />
          <StatWidget title="Achievement" value={`${percentage}%`} icon="🔥" color="emerald" />
          <StatWidget title="Investment" value={`Rp ${(totalCost/1000).toFixed(0)}k`} icon="💎" color="purple" />
        </div>
      )}

      {/* Forms Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            {activeSubTab === 'skills' && <SkillForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateSkill(d as Skill) : onAddSkill({ ...d, id: Math.random().toString() } as Skill); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
            {activeSubTab === 'learning' && <TrainingForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateTraining(d as Training) : onAddTraining({ ...d, id: Math.random().toString() } as Training); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
            {activeSubTab === 'certs' && <CertForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateCert(d as Certification) : onAddCert({ ...d, id: Math.random().toString() } as Certification); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
          </div>
        </div>
      )}

      {/* Skill Matrix Table */}
      {activeSubTab === 'skills' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-5">Skill Name</th>
                  <th className="px-6 py-5 text-center">Proficiency</th>
                  <th className="px-8 py-5">Matrix Visualization</th>
                  <th className="px-6 py-5 text-center">Priority</th>
                  <th className="px-6 py-5">Current Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {skills.map(skill => (
                  <tr key={skill.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-base">{skill.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{skill.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-black text-sm text-slate-700">
                        {skill.currentLevel}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex items-center shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${skill.currentLevel >= 4 ? 'bg-emerald-500' : skill.currentLevel >= 3 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${(skill.currentLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getPriorityStyle(skill.priority)}`}>
                        {skill.priority}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(skill.status)}`}>
                        {skill.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(skill)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">✎</button>
                        <button onClick={() => onDeleteSkill(skill.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {skills.length === 0 && <div className="py-24 text-center text-slate-400 italic font-medium">No skills defined in your matrix.</div>}
          </div>

          {/* Mobile Grid View */}
          <div className="lg:hidden p-4 grid grid-cols-1 gap-4">
            {skills.map(skill => (
              <div key={skill.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{skill.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{skill.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditForm(skill)} className="p-2 text-slate-400 hover:text-blue-500">✎</button>
                    <button onClick={() => onDeleteSkill(skill.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mb-3 overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: `${(skill.currentLevel/5)*100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className={getPriorityStyle(skill.priority).split(' ').slice(1).join(' ')}>{skill.priority}</span>
                  <span className="text-slate-400">Lv.{skill.currentLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Hub Table */}
      {activeSubTab === 'learning' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-5">Course Detail</th>
                  <th className="px-6 py-5">Platform</th>
                  <th className="px-6 py-5 text-center">Investment</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Reference</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trainings.map(t => (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`font-bold text-slate-800 text-base ${t.status === TrainingStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{t.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.topic} • {t.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm font-medium text-slate-600">{t.provider}</td>
                    <td className="px-6 py-6 text-center font-black text-slate-700 text-sm">Rp {t.cost?.toLocaleString()}</td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <a href={t.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-bold hover:underline truncate block max-w-[120px]">Visit Link →</a>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">✎</button>
                        <button onClick={() => onDeleteTraining(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trainings.length === 0 && <div className="py-24 text-center text-slate-400 italic font-medium">No learning journey logged yet.</div>}
          </div>

          {/* Mobile Training Cards */}
          <div className="lg:hidden p-4 grid grid-cols-1 gap-4">
             {trainings.map(t => (
               <div key={t.id} className={`p-6 bg-slate-50/50 rounded-3xl border border-slate-100 ${t.status === TrainingStatus.COMPLETED ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                     <h4 className="font-black text-slate-800 leading-tight">{t.name}</h4>
                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{t.status}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>{t.provider}</span>
                    <span className="font-black">Rp {t.cost?.toLocaleString()}</span>
                  </div>
                  <a href={t.link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 uppercase">Resource →</a>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Certificates Masonry/Grid */}
      {activeSubTab === 'certs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in duration-500">
          {certs.map(c => (
            <div key={c.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📜</div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditForm(c)} className="p-2 text-slate-300 hover:text-blue-600 rounded-xl bg-slate-50">✎</button>
                  <button onClick={() => onDeleteCert(c.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-xl bg-slate-50">✕</button>
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-2">{c.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{c.issuer}</p>
              
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Validated Skill</span>
                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{c.relatedSkill}</span>
                </div>
                <a 
                  href={c.fileLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full py-3 text-center bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Verify Record
                </a>
              </div>
            </div>
          ))}
          {certs.length === 0 && <div className="col-span-full py-32 text-center text-slate-400 italic font-medium">No professional credentials saved.</div>}
        </div>
      )}
    </div>
  );
};

/* Dashboard Widgets */
const StatWidget: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };
  return (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-md transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

const SubTabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${ 
      active ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white bg-slate-50/50 border-slate-100 hover:border-slate-200' 
    }`}
  >
    <span className="text-base">{icon}</span>
    <span>{label}</span>
  </button>
);

/* Form Sub-components */

const SkillForm: React.FC<{ initialData?: Skill; onSubmit: (data: Partial<Skill>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Skill>>(initialData || { name: '', category: SkillCategory.HARD, currentLevel: 3, requiredLevel: 5, status: SkillStatus.GAP, priority: SkillPriority.MEDIUM, actionPlan: '', lastUsed: new Date().getFullYear().toString() });
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Expertise Detail</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Define your competency benchmarks</p>
      </div>
      <div className="space-y-5">
         <InputGroup label="Skill Title" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Strategic Tax Planning" />
         <div className="grid grid-cols-2 gap-5">
            <SelectGroup label="Classification" value={formData.category} onChange={v => setFormData({...formData, category: v as SkillCategory})} options={[SkillCategory.HARD, SkillCategory.SOFT]} />
            <SelectGroup label="Priority" value={formData.priority} onChange={v => setFormData({...formData, priority: v as SkillPriority})} options={[SkillPriority.CRITICAL, SkillPriority.HIGH, SkillPriority.MEDIUM, SkillPriority.LOW]} />
         </div>
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Current Level (1-5)" type="number" value={formData.currentLevel || 1} onChange={v => setFormData({...formData, currentLevel: parseInt(v) || 1})} />
            <InputGroup label="Last Used (Year)" type="text" value={formData.lastUsed || ''} onChange={v => setFormData({...formData, lastUsed: v})} placeholder="2025" />
         </div>
         <SelectGroup label="Status" value={formData.status} onChange={v => setFormData({...formData, status: v as SkillStatus})} options={[SkillStatus.GAP, SkillStatus.ON_PROGRESS, SkillStatus.ACHIEVED]} />
         <div className="space-y-1.5">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Development Roadmap</label>
           <textarea placeholder="Outline your improvement plan..." rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-slate-700" value={formData.actionPlan} onChange={e => setFormData({...formData, actionPlan: e.target.value})} />
         </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-blue-700">Save Skill</button>
      </div>
    </div>
  );
};

const TrainingForm: React.FC<{ initialData?: Training; onSubmit: (data: Partial<Training>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Training>>(initialData || { name: '', provider: '', cost: 0, date: new Date().toISOString().split('T')[0], topic: '', status: TrainingStatus.ON_PROCESS, notes: '' });
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Learning Record</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Track your educational growth</p>
      </div>
      <div className="space-y-5">
         <InputGroup label="Course Title" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Advanced Tax Compliance" />
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Academy / Provider" value={formData.provider || ''} onChange={v => setFormData({...formData, provider: v})} placeholder="Klikpajak" />
            <InputGroup label="Investment (IDR)" type="number" value={formData.cost || 0} onChange={v => setFormData({...formData, cost: parseInt(v) || 0})} />
         </div>
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Date" type="date" value={formData.date || ''} onChange={v => setFormData({...formData, date: v})} />
            <SelectGroup label="Status" value={formData.status} onChange={v => setFormData({...formData, status: v as TrainingStatus})} options={[TrainingStatus.PLANNED, TrainingStatus.ON_PROCESS, TrainingStatus.COMPLETED]} />
         </div>
         <InputGroup label="Material Link" value={formData.link || ''} onChange={v => setFormData({...formData, link: v})} placeholder="https://..." />
         <textarea placeholder="Key takeaways..." rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-slate-700" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-amber-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-amber-600">Save Record</button>
      </div>
    </div>
  );
};

const CertForm: React.FC<{ initialData?: Certification; onSubmit: (data: Partial<Certification>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Certification>>(initialData || { name: '', issuer: '', date: new Date().toISOString().split('T')[0], relatedSkill: '', fileLink: '', isActive: true });
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Professional Credential</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Formalize your expertise</p>
      </div>
      <div className="space-y-5">
         <InputGroup label="Cert Name" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} placeholder="Brevet A & B" />
         <InputGroup label="Issuing Body" value={formData.issuer || ''} onChange={v => setFormData({...formData, issuer: v})} placeholder="IKPI" />
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Date Issued" type="date" value={formData.date || ''} onChange={v => setFormData({...formData, date: v})} />
            <InputGroup label="Related Skill" value={formData.relatedSkill || ''} onChange={v => setFormData({...formData, relatedSkill: v})} placeholder="Taxation" />
         </div>
         <InputGroup label="Verification Link" value={formData.fileLink || ''} onChange={v => setFormData({...formData, fileLink: v})} placeholder="https://drive..." />
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-emerald-600">Save Cert</button>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ label: string, value: string | number, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
);

const SelectGroup: React.FC<{ label: string, value: any, onChange: (v: string) => void, options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <select 
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold cursor-pointer hover:bg-slate-50 transition-colors text-slate-700" 
      value={value} 
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default SkillTracker;
