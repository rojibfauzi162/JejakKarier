
import React, { useState } from 'react';
import { CareerPath, CareerType, AppData, CareerStatus, SubscriptionPlan, SkillRequirement } from '../types';
import { analyzeSkillGap } from '../services/geminiService';

interface CareerPlannerProps {
  paths: CareerPath[];
  appData: AppData;
  onAddPath: (path: CareerPath) => void;
  onUpdatePath: (path: CareerPath) => void;
  onDeletePath: (id: string) => void;
  onUpgrade?: () => void;
}

const CareerPlanner: React.FC<CareerPlannerProps> = ({ paths, appData, onAddPath, onUpdatePath, onDeletePath, onUpgrade }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ trainings: string[], certifications: string[], summary: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<CareerPath | null>(null);
  const [selectedPathForGap, setSelectedPathForGap] = useState<CareerPath | null>(null);

  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  // Helper to calculate age from birthDate
  const calculateCurrentAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = calculateCurrentAge(appData.profile.birthDate);
  
  const calculateSkillGap = (requirements: SkillRequirement[]) => {
    if (!requirements || requirements.length === 0) return 0;
    let totalCurrent = 0;
    let totalTarget = 0;
    requirements.forEach(req => {
      const s = appData.skills.find(sk => (sk.name || '').toLowerCase().trim() === (req.name || '').toLowerCase().trim());
      if (s) totalCurrent += Math.min(s.currentLevel, req.level);
      totalTarget += req.level;
    });
    if (totalTarget === 0) return 0;
    const readiness = (totalCurrent / totalTarget) * 100;
    const gap = 100 - readiness;
    return Math.max(0, Math.round(gap));
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSkillGap(appData);
    setAiResult(result);
    setIsAnalyzing(false);
  };

  const openForm = (path?: CareerPath) => {
    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.careerPath || 10;
    if (!path) {
      if (appData?.plan === SubscriptionPlan.FREE && paths.length >= Number(limit)) {
        alert(`Batas target karir tercapai (${limit}). Silakan upgrade paket untuk perencanaan lebih mendalam.`);
        onUpgrade?.();
        return;
      }
    }
    setEditingPath(path || null);
    setIsFormOpen(true);
  };

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  const renderStars = (level: number) => {
    return (
      <div className="flex justify-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`text-base ${s <= level ? 'text-amber-400' : 'text-slate-200'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  // Helper to format "YYYY-MM" to "MMM YYYY"
  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "-01");
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Helper to check if a "YYYY-MM" deadline is overdue
  const isOverdue = (deadlineStr: string) => {
    if (!deadlineStr) return false;
    // Set to last day of the month for fair comparison
    const [y, m] = deadlineStr.split('-').map(Number);
    const deadlineDate = new Date(y, m, 0); // Last day of month m
    return deadlineDate < currentDate;
  };

  const limit = appData?.planLimits?.careerPath || 10;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Career Path Planner</h2>
          <p className="text-slate-500 mt-2 italic font-medium">
            "Tentukan posisi impian, skill yang harus di-upgrade, dan target waktu pencahaianmu."
          </p>
        </div>
        <button 
          onClick={() => openForm()}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          + Tambah Target Karir
        </button>
      </header>

      {/* INFO KUOTA (QUOTA BANNER) - HIDDEN FOR PRO USERS */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm mx-1">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-rocket-takeoff-fill"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Target Karir ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {paths.length} / {limit === 'unlimited' ? '∞' : limit} Target Disusun
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

      {/* Desktop Spreadsheet Table */}
      <div className="hidden lg:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-emerald-500 text-white select-none">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Target Jabatan <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Jenis Karir <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Perkiraan Tahun <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center bg-blue-600">GAP YEAR <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center bg-blue-500">USIA KAMU <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Skill & Target Level <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center bg-rose-500">SKILL GAP (%) <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Langkah Pengembangan <FilterIcon /></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Deadline Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paths.map((path) => {
              const gapYear = path.targetYear - currentYear;
              // Target age calculation based on current profile age
              const targetAge = userAge + (gapYear < 0 ? 0 : gapYear);
              const isAchieved = path.status === CareerStatus.ACHIEVED;
              const overdue = isOverdue(path.actionDeadline);
              const shouldStrike = isAchieved || overdue;
              
              const contentClass = shouldStrike ? 'italic line-through decoration-slate-300 text-slate-400' : '';
              
              return (
                <tr key={path.id} className={`transition-colors group ${shouldStrike ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                  <td className={`px-6 py-5 border-r border-slate-100 font-black ${shouldStrike ? 'text-slate-400' : 'text-slate-800'}`}>
                    {path.targetPosition}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-100 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      shouldStrike ? 'bg-slate-100 text-slate-300' :
                      path.type === CareerType.UTAMA ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {path.type}
                    </span>
                  </td>
                  <td className={`px-6 py-5 border-r border-slate-100 text-center font-bold ${contentClass}`}>
                    {path.targetYear}
                  </td>
                  <td className={`px-6 py-5 border-r border-slate-100 text-center font-black bg-slate-100/50 ${shouldStrike ? 'text-slate-300' : 'text-slate-500'} ${contentClass}`}>
                    {gapYear < 0 ? 0 : gapYear}
                  </td>
                  <td className={`px-6 py-5 border-r border-slate-100 text-center font-black bg-blue-50/20 ${shouldStrike ? 'text-blue-300' : 'text-blue-700'} ${contentClass}`}>
                    {targetAge}
                  </td>
                  <td className={`px-6 py-5 border-r border-slate-100 text-xs font-semibold ${shouldStrike ? 'text-slate-300' : 'text-slate-500'} ${contentClass}`}>
                    <div className="flex flex-wrap gap-1">
                      {path.requiredSkills.map((req, i) => (
                        <span key={i} className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">
                          {req.name} (Lvl {req.level})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td 
                    onClick={() => setSelectedPathForGap(path)}
                    className={`px-6 py-5 border-r border-slate-100 text-center font-black cursor-pointer hover:bg-rose-50 transition-colors ${shouldStrike ? 'text-rose-300' : 'text-rose-600'}`}
                  >
                    {calculateSkillGap(path.requiredSkills)}%
                  </td>
                  <td className={`px-6 py-5 border-r border-slate-100 text-xs font-medium italic ${shouldStrike ? 'text-slate-300' : 'text-slate-600'} ${contentClass}`}>
                    "{path.developmentPlan}"
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-xs font-bold whitespace-nowrap ${shouldStrike ? 'text-slate-300' : 'text-amber-600'} ${contentClass}`}>
                        {formatDeadline(path.actionDeadline)}
                      </span>
                      <div className="flex gap-1 opacity-100 transition-opacity">
                        <button onClick={() => openForm(path)} className="p-2 text-slate-400 hover:text-blue-500">✎</button>
                        <button onClick={() => onDeletePath(path.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paths.length === 0 && <div className="py-24 text-center text-slate-400 italic">Data belum tersedia. Klik + Tambah Target Karir.</div>}
      </div>

      {/* Mobile Grid/Card View */}
      <div className="lg:hidden space-y-6">
        {paths.map((path) => {
          const gapYear = path.targetYear - currentYear;
          const targetAge = userAge + (gapYear < 0 ? 0 : gapYear);
          const isAchieved = path.status === CareerStatus.ACHIEVED;
          const overdue = isOverdue(path.actionDeadline);
          const shouldStrike = isAchieved || overdue;

          return (
            <div key={path.id} className={`p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group ${shouldStrike ? 'bg-slate-50 opacity-80' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-xl font-black tracking-tight ${shouldStrike ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {path.targetPosition}
                  </h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      shouldStrike ? 'bg-slate-200 text-slate-300' :
                      path.type === CareerType.UTAMA ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                    }`}>{path.type}</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">{path.targetYear}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openForm(path)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all">✎</button>
                  <button onClick={() => onDeletePath(path.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">✕</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`${shouldStrike ? 'bg-slate-300' : 'bg-blue-600'} p-4 rounded-2xl text-white shadow-inner`}>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Gap Year</p>
                  <p className="text-2xl font-black">{gapYear < 0 ? 0 : gapYear}</p>
                </div>
                <div className={`${shouldStrike ? 'bg-slate-400' : 'bg-blue-500'} p-4 rounded-2xl text-white shadow-inner`}>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Usia Target</p>
                  <p className="text-2xl font-black">{targetAge}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Required Skills & Level</p>
                    <div 
                      onClick={() => setSelectedPathForGap(path)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform ${shouldStrike ? 'bg-rose-100 text-rose-300' : 'bg-rose-500 text-white'}`}
                    >
                      Gap: {calculateSkillGap(path.requiredSkills)}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {path.requiredSkills.map((req, i) => (
                      <span key={i} className={`px-2 py-1 rounded-md text-[10px] font-bold ${shouldStrike ? 'bg-slate-200 text-slate-400' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        {req.name} (Lvl {req.level})
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Development Steps</p>
                   <p className={`text-xs leading-relaxed italic ${shouldStrike ? 'text-slate-400 line-through' : 'text-slate-500'}`}>"{path.developmentPlan}"</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Action Deadline</span>
                   <span className={`text-sm font-black ${shouldStrike ? 'text-slate-300' : 'text-amber-600'}`}>{formatDeadline(path.actionDeadline)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Roadmap Section Removed as per user request to replace with Skill Gap % */}
      
      {/* Skill Gap Detail Modal */}
      {selectedPathForGap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detail Skill Gap</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedPathForGap.targetPosition}</p>
              </div>
              <button 
                onClick={() => setSelectedPathForGap(null)}
                className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Skill Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Current Level</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Target Level</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPathForGap.requiredSkills.map((req, idx) => {
                    const userSkill = appData.skills.find(s => (s.name || '').toLowerCase() === (req.name || '').toLowerCase());
                    const currentLevel = userSkill?.currentLevel || 0;
                    const targetLevel = req.level;
                    
                    let statusLabel = "Gap";
                    let statusColor = "bg-rose-100 text-rose-600";
                    
                    if (currentLevel >= targetLevel) {
                      statusLabel = "Achieved";
                      statusColor = "bg-emerald-100 text-emerald-600";
                    } else if (currentLevel > 0) {
                      statusLabel = "On Progress";
                      statusColor = "bg-blue-100 text-blue-600";
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-800">{req.name}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {renderStars(currentLevel)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {renderStars(targetLevel)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-2">Analisis Strategis</h4>
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                Kamu memiliki gap sebesar <span className="font-black text-indigo-900">{calculateSkillGap(selectedPathForGap.requiredSkills)}%</span> untuk posisi ini. 
                Fokuslah untuk meningkatkan skill yang masih berstatus <span className="text-rose-600 font-black">Gap</span> melalui training atau project personal agar siap mencapai target di tahun {selectedPathForGap.targetYear}.
              </p>
            </div>

            <button 
              onClick={() => setSelectedPathForGap(null)}
              className="w-full mt-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
              {editingPath ? 'Update Target Karir' : 'Target Karir Baru'}
            </h3>
            
            <CareerForm 
              initialData={editingPath}
              availableSkills={appData.skills.map(s => s.name)}
              onSubmit={(data) => {
                if (editingPath) {
                  onUpdatePath({ ...editingPath, ...data } as CareerPath);
                } else {
                  onAddPath({ ...data, id: Math.random().toString(36).substr(2, 9) } as CareerPath);
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

const CareerForm: React.FC<{ 
  initialData: CareerPath | null, 
  availableSkills: string[],
  onSubmit: (data: Partial<CareerPath>) => void, 
  onCancel: () => void 
}> = ({ initialData, availableSkills, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<CareerPath>>(initialData || {
    targetPosition: '',
    type: CareerType.UTAMA,
    targetYear: new Date().getFullYear() + 1,
    requiredSkills: [],
    developmentPlan: '',
    actionDeadline: '',
    status: CareerStatus.NOT_STARTED
  });

  const [skills, setSkills] = useState<SkillRequirement[]>(initialData?.requiredSkills || []);

  const addSkill = () => {
    setSkills([...skills, { name: '', level: 3 }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof SkillRequirement, value: string | number) => {
    const newSkills = [...skills];
    // @ts-ignore
    newSkills[index] = { ...newSkills[index], [field]: value };
    setSkills(newSkills);
  };

  return (
    <div className="space-y-6">
      <datalist id="available-skills">
        {availableSkills.map((s, i) => (
          <option key={i} value={s} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Target Jabatan</label>
          <input 
            placeholder="Contoh: Senior Product Manager"
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:border-indigo-500 transition-colors" 
            value={formData.targetPosition || ''} 
            onChange={e => setFormData({ ...formData, targetPosition: e.target.value })} 
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Jenis Karir</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold cursor-pointer" value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value as CareerType })}>
            <option value={CareerType.UTAMA}>Utama</option>
            <option value={CareerType.SAMPINGAN}>Sampingan</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Status Progress</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-sm cursor-pointer" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value as CareerStatus })}>
            <option value={CareerStatus.NOT_STARTED}>Belum Mulai</option>
            <option value={CareerStatus.ON_PROGRESS}>On Progress</option>
            <option value={CareerStatus.ACHIEVED}>Tercapai</option>
          </select>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Required Skills & Target Level (1-5)</label>
            <button 
              type="button"
              onClick={addSkill}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all active:scale-95"
            >
              + Tambah Skill
            </button>
          </div>
          
          <div className="space-y-3">
            {skills.map((skill, index) => (
              <div key={index} className="flex gap-3 items-center animate-in slide-in-from-left duration-300">
                <div className="flex-1 relative">
                  <input 
                    list="available-skills"
                    placeholder="Nama Skill..."
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-sm focus:border-indigo-500"
                    value={skill.name}
                    onChange={e => updateSkill(index, 'name', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Lvl</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    className="w-10 bg-transparent outline-none font-black text-slate-700 text-center"
                    value={skill.level}
                    onChange={e => updateSkill(index, 'level', parseInt(e.target.value) || 1)}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl border border-slate-200"
                >
                  ✕
                </button>
              </div>
            ))}
            {skills.length === 0 && (
              <div className="text-center py-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Belum ada skill yang ditambahkan</p>
                <button onClick={addSkill} className="text-[10px] font-black text-indigo-600 uppercase underline">Klik untuk menambah skill</button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Target Tahun</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" value={formData.targetYear || ''} onChange={e => setFormData({ ...formData, targetYear: parseInt(e.target.value) || 2025 })} />
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Deadline Aksi</label>
          <input type="month" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold" value={formData.actionDeadline || ''} onChange={e => setFormData({ ...formData, actionDeadline: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Langkah Pengembangan</label>
          <textarea rows={3} placeholder="Apa langkah konkret yang akan kamu ambil? (Contoh: Ambil sertifikasi PMP, Selesaikan kursus Python di Coursera)" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none focus:border-indigo-500 transition-colors" value={formData.developmentPlan || ''} onChange={e => setFormData({ ...formData, developmentPlan: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-4 pt-6">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Batal</button>
        <button onClick={() => onSubmit({ ...formData, requiredSkills: skills })} className="flex-1 py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95">Simpan Target Karir</button>
      </div>
    </div>
  );
};

export default CareerPlanner;
