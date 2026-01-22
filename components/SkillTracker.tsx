
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

  const getPriorityColor = (priority: SkillPriority) => {
    switch(priority) {
      case SkillPriority.CRITICAL: return 'bg-rose-50 text-rose-600 border-rose-100';
      case SkillPriority.HIGH: return 'bg-sky-50 text-sky-600 border-sky-100';
      case SkillPriority.MEDIUM: return 'bg-amber-50 text-amber-600 border-amber-100';
      case SkillPriority.LOW: return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const calculateTrainingStats = () => {
    const total = trainings.length;
    const completed = trainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
    const onProcess = trainings.filter(t => t.status === TrainingStatus.ON_PROCESS).length;
    const totalCost = trainings.reduce((acc, curr) => acc + curr.cost, 0);
    const percentage = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    return { total, completed, onProcess, totalCost, percentage };
  };

  const stats = calculateTrainingStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Growth & Learning</h2>
          <div className="flex gap-2 mt-4">
            <SubTabButton active={activeSubTab === 'skills'} onClick={() => setActiveSubTab('skills')} label="Detailed Skill Matrix" />
            <SubTabButton active={activeSubTab === 'learning'} onClick={() => setActiveSubTab('learning')} label="Training History" />
            <SubTabButton active={activeSubTab === 'certs'} onClick={() => setActiveSubTab('certs')} label="Certifications" />
          </div>
        </div>
        <button 
          onClick={openAddForm}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          + Add {activeSubTab === 'skills' ? 'Skill' : activeSubTab === 'learning' ? 'Training' : 'Certification'}
        </button>
      </header>

      {/* Modal Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            {activeSubTab === 'skills' && (
              <SkillForm 
                initialData={editingItem} 
                onSubmit={(data) => {
                  editingItem ? onUpdateSkill(data as Skill) : onAddSkill({ ...data, id: Math.random().toString() } as Skill);
                  setIsFormOpen(false);
                }} 
                onCancel={() => setIsFormOpen(false)} 
              />
            )}
            {activeSubTab === 'learning' && (
              <TrainingForm 
                initialData={editingItem} 
                onSubmit={(data) => {
                  editingItem ? onUpdateTraining(data as Training) : onAddTraining({ ...data, id: Math.random().toString() } as Training);
                  setIsFormOpen(false);
                }} 
                onCancel={() => setIsFormOpen(false)} 
              />
            )}
            {activeSubTab === 'certs' && (
              <CertForm 
                initialData={editingItem} 
                onSubmit={(data) => {
                  editingItem ? onUpdateCert(data as Certification) : onAddCert({ ...data, id: Math.random().toString() } as Certification);
                  setIsFormOpen(false);
                }} 
                onCancel={() => setIsFormOpen(false)} 
              />
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'skills' && (
        <div className="grid grid-cols-1 gap-6">
          {skills.map(skill => (
            <div key={skill.id} className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-slate-100 group transition-all hover:shadow-xl hover:border-slate-200">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xl tracking-tight">{skill.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                         <span className="text-[10px] font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">{skill.category}</span>
                         <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getPriorityColor(skill.priority)}`}>
                           {skill.priority}
                         </span>
                         <span className="text-[10px] font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">
                           {skill.status}
                         </span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(skill)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all">✎</button>
                      <button onClick={() => onDeleteSkill(skill.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">✕</button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                      <span>Level {skill.currentLevel} / 5</span>
                      <span>Progress Visualizer (BAR)</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]" style={{ width: `${(skill.currentLevel / 5) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-1/3 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
                   <div className="space-y-4">
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Used</p>
                       <p className="text-sm font-bold text-slate-700">{skill.lastUsed || '-'}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action / Improvement Plan</p>
                       <p className="text-xs text-slate-600 leading-relaxed italic mt-1">"{skill.actionPlan || 'No action plan recorded yet.'}"</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {skills.length === 0 && <p className="text-center py-24 text-slate-400 italic bg-white rounded-[2.5rem] border border-dashed border-slate-200">No skills tracked yet.</p>}
        </div>
      )}

      {activeSubTab === 'learning' && (
        <div className="space-y-8">
          {/* Summary Dashboard Component */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Training Dashboard</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <p className="text-xs opacity-70">Total Courses</p>
                     <p className="text-3xl font-black">{stats.total}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs opacity-70">Completed</p>
                     <p className="text-3xl font-black text-emerald-300">{stats.completed}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs opacity-70">On Process</p>
                     <p className="text-3xl font-black text-amber-300">{stats.onProcess}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs opacity-70">Percentage</p>
                     <p className="text-3xl font-black text-rose-300">{stats.percentage}%</p>
                   </div>
                 </div>
               </div>
               <div className="mt-8 pt-6 border-t border-white/10 relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-70 mb-1">Total Training Investment</p>
                    <p className="text-2xl font-black">Rp {stats.totalCost.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl text-2xl">💰</div>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            </div>

            <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center shadow-sm">
               <div className="flex items-start gap-4">
                 <div className="text-4xl">🎓</div>
                 <div className="space-y-3">
                   <p className="text-xl font-bold text-slate-800 leading-snug">
                     Hai! Saat ini kamu telah mengikuti <span className="text-blue-600 underline underline-offset-4">{stats.total} course</span> pengembangan diri.
                   </p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                     <span className="font-bold text-emerald-600">✅ {stats.completed} telah kamu selesaikan</span>, <span className="font-bold text-amber-600">⌛ {stats.onProcess} sedang kamu jalani</span>.
                   </p>
                   <p className="text-sm italic font-medium text-slate-400 bg-slate-50 p-3 rounded-xl border-l-4 border-slate-200">
                     "Terus konsisten, karena setiap ilmu akan jadi bekal terbaik untuk kariermu ke depan! 💪"
                   </p>
                 </div>
               </div>
            </div>
          </div>

          {/* Training List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainings.map(t => (
              <div key={t.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-slate-200 group flex flex-col justify-between">
                 <div className="space-y-4">
                   <div className="flex justify-between items-start">
                     <div>
                        <span className="text-[9px] font-black uppercase text-blue-500 tracking-tighter bg-blue-50 px-2 py-0.5 rounded-full">{t.provider}</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1 tracking-tight">{t.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.topic}</p>
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(t)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all">✎</button>
                        <button onClick={() => onDeleteTraining(t.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">✕</button>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Biaya</p>
                         <p className="text-sm font-bold text-slate-700">Rp {t.cost.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tanggal</p>
                         <p className="text-sm font-bold text-slate-700">{t.date}</p>
                      </div>
                   </div>

                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Status</p>
                      <div className={`px-4 py-2 rounded-xl text-center text-xs font-black uppercase tracking-widest shadow-sm ${
                        t.status === TrainingStatus.COMPLETED ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'
                      }`}>
                        {t.status}
                      </div>
                   </div>
                 </div>

                 <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                    {t.link && (
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center text-xs">🔗</div>
                         <a href={t.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 underline truncate hover:text-blue-800">{t.link}</a>
                      </div>
                    )}
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Catatan</p>
                       <p className="text-xs text-slate-600 leading-relaxed italic">{t.notes || "Belum ada catatan."}</p>
                    </div>
                 </div>
              </div>
            ))}
            {trainings.length === 0 && <div className="col-span-full py-24 text-center text-slate-400 italic bg-white rounded-[2.5rem] border border-dashed border-slate-200">No learning courses recorded yet.</div>}
          </div>
        </div>
      )}

      {activeSubTab === 'certs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map(c => (
            <div key={c.id} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex gap-6 items-start group relative transition-all hover:shadow-lg">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📜</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-xl leading-tight tracking-tight">{c.name}</h4>
                <p className="text-sm text-slate-500 mb-4 font-medium">{c.issuer}</p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issued: {c.year}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${c.isActive ? 'text-green-600' : 'text-red-500'}`}>
                    {c.isActive ? '✓ Active' : 'Expired'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase tracking-widest">Expires: {c.expiryDate}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditForm(c)} className="p-2 text-slate-400 hover:text-blue-500">✎</button>
                <button onClick={() => onDeleteCert(c.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
              </div>
            </div>
          ))}
          {certs.length === 0 && <p className="col-span-full text-center py-20 text-slate-400 italic bg-white rounded-[2.5rem] border border-dashed border-slate-200">No professional certifications recorded.</p>}
        </div>
      )}
    </div>
  );
};

/* Form Components */

const SkillForm: React.FC<{ initialData?: Skill; onSubmit: (data: Partial<Skill>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Skill>>(initialData || {
    name: '', category: SkillCategory.HARD, currentLevel: 3, requiredLevel: 5, status: SkillStatus.GAP,
    priority: SkillPriority.MEDIUM, lastUsed: new Date().getFullYear().toString(), actionPlan: ''
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{initialData ? 'Update Skill Intelligence' : 'Register New Expertise'}</h3>
        <p className="text-sm text-slate-500">Provide high-fidelity data for better AI career planning.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Skill Title</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none bg-slate-50/50 font-medium"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Komunikasi Klien, Python, Strategi Pajak"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Classification</label>
          <select 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value as SkillCategory})}
          >
            <option value={SkillCategory.HARD}>Hard Skill</option>
            <option value={SkillCategory.SOFT}>Soft Skill</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Urgency Priority</label>
          <select 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.priority}
            onChange={e => setFormData({...formData, priority: e.target.value as SkillPriority})}
          >
            <option value={SkillPriority.CRITICAL}>Critical</option>
            <option value={SkillPriority.HIGH}>High Priority</option>
            <option value={SkillPriority.MEDIUM}>Medium</option>
            <option value={SkillPriority.LOW}>Low / Maintenance</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Competency (1-5)</label>
          <input 
            type="number" min="1" max="5"
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none bg-slate-50/50 font-medium"
            value={formData.currentLevel}
            onChange={e => setFormData({...formData, currentLevel: parseInt(e.target.value) || 0})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Year Last Applied</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none bg-slate-50/50 font-medium"
            value={formData.lastUsed}
            onChange={e => setFormData({...formData, lastUsed: e.target.value})}
            placeholder="2025"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Action / Development Plan</label>
          <textarea 
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium resize-none"
            value={formData.actionPlan}
            onChange={e => setFormData({...formData, actionPlan: e.target.value})}
            placeholder="What are you doing to maintain or improve this skill?"
          />
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all hover:bg-black">Commit Changes</button>
      </div>
    </div>
  );
};

const TrainingForm: React.FC<{ initialData?: Training; onSubmit: (data: Partial<Training>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Training>>(initialData || {
    name: '', provider: '', cost: 0, date: new Date().toISOString().split('T')[0], topic: '', status: TrainingStatus.ON_PROCESS, link: '', notes: ''
  });

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{initialData ? 'Update Course Details' : 'Register New Course'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Judul Course</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Brevet Pajak A & B"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Platform / Platform</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.provider}
            onChange={e => setFormData({...formData, provider: e.target.value})}
            placeholder="e.g. MySkill, Udemy, Coursera"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Topik</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.topic}
            onChange={e => setFormData({...formData, topic: e.target.value})}
            placeholder="e.g. Pajak, Excel, Programming"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Biaya (Rp)</label>
          <input 
            type="number"
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.cost}
            onChange={e => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Tanggal</label>
          <input 
            type="date"
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Status</label>
          <select 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-black uppercase tracking-widest text-xs"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value as TrainingStatus})}
          >
            <option value={TrainingStatus.ON_PROCESS}>On Process</option>
            <option value={TrainingStatus.COMPLETED}>Completed</option>
            <option value={TrainingStatus.PLANNED}>Planned</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Link / Materi URL</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium"
            value={formData.link}
            onChange={e => setFormData({...formData, link: e.target.value})}
            placeholder="https://..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Catatan</label>
          <textarea 
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-medium resize-none"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="e.g. Sedang ambil kelas weekend, Selesai & dapat e-sertif"
          />
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all hover:bg-blue-700">Save Course</button>
      </div>
    </div>
  );
};

const CertForm: React.FC<{ initialData?: Certification; onSubmit: (data: Partial<Certification>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Certification>>(initialData || {
    name: '', issuer: '', year: '2024', expiryDate: '2027', isActive: true
  });

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{initialData ? 'Modify Certification' : 'New Professional Credential'}</h3>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Credential Name</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Body of Issuance</label>
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50"
            value={formData.issuer}
            onChange={e => setFormData({...formData, issuer: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Issue Date</label>
            <input 
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50"
              value={formData.year}
              onChange={e => setFormData({...formData, year: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Renewal / Expiry</label>
            <input 
              type="date"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50"
              value={formData.expiryDate}
              onChange={e => setFormData({...formData, expiryDate: e.target.value})}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <input 
            type="checkbox" id="isActive"
            checked={formData.isActive}
            onChange={e => setFormData({...formData, isActive: e.target.checked})}
            className="w-6 h-6 rounded-lg accent-amber-500 cursor-pointer"
          />
          <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Currently in Good Standing / Active</label>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl transition-all hover:bg-amber-600">Save Credential</button>
      </div>
    </div>
  );
};

const SubTabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
      active ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white bg-slate-50 border-transparent hover:border-slate-200'
    }`}
  >
    {label}
  </button>
);

export default SkillTracker;
