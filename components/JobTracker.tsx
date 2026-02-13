
import React, { useState, useMemo } from 'react';
import { JobApplication, JobStatus, CareerEvent, EventType, ImportanceLevel, AppData, SubscriptionPlan } from '../types';

interface JobTrackerProps {
  applications: JobApplication[];
  careerEvents: CareerEvent[];
  onAdd: (j: JobApplication) => void;
  onUpdate: (j: JobApplication) => void;
  onDelete: (id: string) => void;
  onAddCalendarEvent?: (e: CareerEvent) => void;
  appData?: AppData;
}

type TimeFilter = 'All' | '1 Day' | '7 Days' | '30 Days' | 'Custom Range';

const JobTracker: React.FC<JobTrackerProps> = ({ applications, careerEvents, onAdd, onUpdate, onDelete, onAddCalendarEvent, appData }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobApplication | null>(null);
  
  // Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingApp, setSchedulingApp] = useState<JobApplication | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Selection and Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<JobStatus>(JobStatus.SUDAH_KIRIM);

  // Filters
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const uniqueLocations = useMemo(() => {
    const locations = new Set(applications.map(a => a.location));
    return ['All', ...Array.from(locations)];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesLocation = locationFilter === 'All' || app.location === locationFilter;
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      
      let matchesTime = true;
      if (timeFilter !== 'All') {
        const appDate = new Date(app.appliedDate);
        const today = new Date();
        const diffInDays = (today.getTime() - appDate.getTime()) / (1000 * 3600 * 24);

        if (timeFilter === '1 Day') matchesTime = diffInDays <= 1;
        else if (timeFilter === '7 Days') matchesTime = diffInDays <= 7;
        else if (timeFilter === '30 Days') matchesTime = diffInDays <= 30;
        else if (timeFilter === 'Custom Range') {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            matchesTime = appDate >= start && appDate <= end;
          }
        }
      }

      return matchesLocation && matchesStatus && matchesTime;
    });
  }, [applications, locationFilter, statusFilter, timeFilter, customStartDate, customEndDate]);

  const openAddForm = () => {
    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.jobTracker || 2;
    if (appData?.plan === SubscriptionPlan.FREE && applications.length >= Number(limit)) {
      alert(`Batas lamaran kerja tercapai (${limit}). Silakan upgrade paket untuk melacak lebih banyak peluang.`);
      return;
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: JobApplication) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openScheduleModal = (app: JobApplication) => {
    setSchedulingApp(app);
    setIsScheduleModalOpen(true);
  };

  const handlePushToCalendar = () => {
    if (!onAddCalendarEvent || !schedulingApp) return;
    
    const eventId = Math.random().toString(36).substr(2, 9);
    const newEvent: CareerEvent = {
      id: eventId,
      title: `Interview/Tes: ${schedulingApp.position}`,
      type: EventType.INTERVIEW,
      date: scheduleDate,
      time: scheduleTime,
      importance: ImportanceLevel.HIGH,
      notes: `Perusahaan: ${schedulingApp.company}\nLokasi: ${schedulingApp.location}\nLink: ${schedulingApp.link || '-'}\nCatatan: ${schedulingApp.notes || '-'}`,
      relatedId: schedulingApp.id
    };

    onAddCalendarEvent(newEvent);
    // Update Job to track it's scheduled
    onUpdate({ ...schedulingApp, calendarEventId: eventId });

    setIsScheduleModalOpen(false);
    setSchedulingApp(null);
    alert(`Berhasil dijadwalkan pada ${new Date(scheduleDate).toLocaleDateString('id-ID')} pukul ${scheduleTime}.`);
  };

  const getStatusStyle = (status: JobStatus) => {
    switch(status) {
      case JobStatus.SUDAH_KIRIM: return 'bg-blue-50 text-blue-600 border-blue-200';
      case JobStatus.PERLU_FOLLOW_UP: return 'bg-amber-50 text-amber-600 border-amber-200';
      case JobStatus.WAWANCARA: return 'bg-purple-50 text-purple-600 border-purple-200';
      case JobStatus.DITOLAK: return 'bg-rose-50 text-rose-600 border-rose-200';
      case JobStatus.TIDAK_ADA_JAWABAN: return 'bg-slate-50 text-slate-400 border-slate-300';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    else setSelectedIds(new Set());
  };

  const handleBulkPublish = () => {
    if (selectedIds.size === 0) return;
    applications.forEach(app => {
      if (selectedIds.has(app.id)) onUpdate({ ...app, status: bulkStatus });
    });
    setSelectedIds(new Set());
    alert(`Status ${selectedIds.size} lamaran berhasil diperbarui!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 lg:pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">Loker Tracker</h2>
          <p className="text-slate-500 mt-1 font-medium text-xs lg:text-sm">Monitoring status lamaran kerja secara real-time.</p>
        </div>
        <button onClick={openAddForm} className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest">
          + Log Lamaran Baru
        </button>
      </header>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Total" value={applications.length} icon="📄" color="blue" />
        <StatWidget title="Follow Up" value={applications.filter(a => a.status === JobStatus.PERLU_FOLLOW_UP).length} icon="⏳" color="amber" />
        <StatWidget title="Wawancara" value={applications.filter(a => a.status === JobStatus.WAWANCARA).length} icon="🎙️" color="purple" />
        <StatWidget title="Ditolak" value={applications.filter(a => a.status === JobStatus.DITOLAK).length} icon="❌" color="rose" />
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lokasi</label>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none">
            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none">
            <option value="All">Semua Status</option>
            {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-full lg:w-44">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Waktu</label>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as TimeFilter)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none">
            <option value="All">Kapanpun</option>
            <option value="1 Day">1 Hari Terakhir</option>
            <option value="7 Days">7 Hari Terakhir</option>
            <option value="30 Days">30 Hari Terakhir</option>
            <option value="Custom Range">Pilih Range</option>
          </select>
        </div>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      <div className="hidden lg:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px] table-fixed">
          <thead>
            <tr className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 w-12 text-center bg-blue-600 border-r border-white/10">
                <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0} className="w-4 h-4 rounded" />
              </th>
              <th className="px-4 py-4 w-12 text-center bg-blue-500 border-r border-white/10">No</th>
              <th className="px-6 py-4 w-44 border-r border-white/10">Posisi</th>
              <th className="px-6 py-4 w-44 border-r border-white/10">Perusahaan</th>
              <th className="px-6 py-4 w-40 border-r border-white/10">Lokasi</th>
              <th className="px-6 py-4 w-32 border-r border-white/10 text-center">Tgl Lamar</th>
              <th className="px-6 py-4 w-48 border-r border-white/10 text-center">Status</th>
              <th className="px-6 py-4 w-52">Catatan</th>
              <th className="px-8 py-4 w-36 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplications.map((app, index) => {
              // FIX: Verifikasi apakah event kalender benar-benar ada di daftar careerEvents menggunakan relatedId
              const isActuallyScheduled = careerEvents.some(e => e.relatedId === app.id);
              const isSchedulable = (app.status === JobStatus.PERLU_FOLLOW_UP || app.status === JobStatus.WAWANCARA) && !isActuallyScheduled;
              
              return (
                <tr key={app.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(app.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-5 text-center border-r border-slate-100">
                    <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleSelect(app.id)} className="w-4 h-4 rounded" />
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-400 bg-slate-50/30 border-r border-slate-100">{index + 1}</td>
                  <td className="px-6 py-5 font-black text-slate-800 text-sm border-r border-slate-100 truncate">{app.position}</td>
                  <td className="px-6 py-5 font-bold text-slate-600 text-sm border-r border-slate-100 truncate">{app.company}</td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-medium border-r border-slate-100 truncate">{app.location}</td>
                  <td className="px-6 py-5 text-center text-[10px] font-bold text-slate-400 border-r border-slate-100">{app.appliedDate}</td>
                  <td className="px-6 py-5 text-center border-r border-slate-100">
                    <div className={`inline-block px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border whitespace-nowrap min-w-[120px] ${getStatusStyle(app.status)}`}>
                      {app.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-100">
                    <p className="text-xs text-slate-500 italic truncate">{app.notes || '-'}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {isSchedulable && (
                        <button 
                          onClick={() => openScheduleModal(app)}
                          className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Jadwalkan ke Kalender"
                        >
                           <i className="bi bi-calendar-plus"></i>
                        </button>
                      )}
                      {isActuallyScheduled && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl" title="Sudah Dijadwalkan">
                          <i className="bi bi-calendar-check-fill"></i>
                        </div>
                      )}
                      <button onClick={() => openEditForm(app)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all">✎</button>
                      <button onClick={() => onDelete(app.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Application Cards */}
      <div className="lg:hidden space-y-4">
        {filteredApplications.map((app) => {
          const isActuallyScheduled = careerEvents.some(e => e.relatedId === app.id);
          const isSchedulable = (app.status === JobStatus.PERLU_FOLLOW_UP || app.status === JobStatus.WAWANCARA) && !isActuallyScheduled;
          
          return (
            <div key={app.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative group overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleSelect(app.id)} className="w-5 h-5 rounded-lg" />
                  <div>
                    <h4 className="font-black text-slate-800 text-base">{app.position}</h4>
                    <p className="text-xs font-bold text-slate-500">{app.company}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isSchedulable && (
                    <button onClick={() => openScheduleModal(app)} className="p-2 text-indigo-600"><i className="bi bi-calendar-plus"></i></button>
                  )}
                  {isActuallyScheduled && <span className="p-2 text-emerald-600"><i className="bi bi-calendar-check-fill"></i></span>}
                  <button onClick={() => openEditForm(app)} className="p-2 text-slate-300">✎</button>
                  <button onClick={() => onDelete(app.id)} className="p-2 text-slate-300">✕</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokasi</p>
                  <p className="text-[11px] font-bold text-slate-600">{app.location}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                  <p className="text-[11px] font-bold text-slate-600">{app.appliedDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(app.status)}`}>
                  {app.status}
                </span>
              </div>

              {app.notes && (
                <p className="mt-4 text-[10px] text-slate-400 italic border-t border-slate-50 pt-3">
                  " {app.notes} "
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* SCHEDULE CONFIRMATION MODAL */}
      {isScheduleModalOpen && schedulingApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                    <i className="bi bi-calendar-event"></i>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Jadwalkan Event</h3>
                 <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2 uppercase tracking-widest">Pilih waktu interview/follow-up untuk:</p>
                 <p className="font-black text-indigo-600 text-sm mt-1">{schedulingApp.position} @ {schedulingApp.company}</p>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tanggal</label>
                       <input type="date" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Jam</label>
                       <input type="time" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Batal</button>
                    <button type="button" onClick={handlePushToCalendar} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Konfirmasi Jadwal</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL FORM: Tambah & Edit */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 lg:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <JobForm 
              initialData={editingItem}
              onSubmit={(data) => {
                if (editingItem) {
                  onUpdate({ ...editingItem, ...data } as JobApplication);
                } else {
                  onAdd({ ...data, id: Math.random().toString(36).substr(2, 9) } as JobApplication);
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

const StatWidget: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };
  return (
    <div className="bg-white p-5 lg:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-10 lg:w-12 h-10 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-xl lg:text-2xl shadow-inner border ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-lg lg:text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const JobForm: React.FC<{ initialData: JobApplication | null; onSubmit: (data: Partial<JobApplication>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<JobApplication>>(initialData || {
    position: '', company: '', location: '', appliedDate: new Date().toISOString().split('T')[0],
    appliedVia: 'Linked In', status: JobStatus.SUDAH_KIRIM, link: '', notes: ''
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{initialData ? 'Update Record' : 'Record New Application'}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lacak journey pencarian kerjamu</p>
      </div>
      <div className="space-y-4 lg:space-y-5">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            <InputGroup label="Posisi" value={formData.position || ''} onChange={v => setFormData({...formData, position: v})} placeholder="Role Name" />
            <InputGroup label="Perusahaan" value={formData.company || ''} onChange={v => setFormData({...formData, company: v})} placeholder="Company Name" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            <InputGroup label="Lokasi" value={formData.location || ''} onChange={v => setFormData({...formData, location: v})} placeholder="e.g. Jakarta" />
            <InputGroup label="Tanggal Lamar" type="date" value={formData.appliedDate || ''} onChange={v => setFormData({...formData, appliedDate: v})} />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            <SelectGroup label="Via" value={formData.appliedVia} onChange={v => setFormData({...formData, appliedVia: v})} options={['Email', 'Website', 'Orang Dalam', 'Kita Lulus', 'Job Street', 'Linked In']} />
            <SelectGroup label="Status" value={formData.status} onChange={v => setFormData({...formData, status: v as JobStatus})} options={Object.values(JobStatus)} />
         </div>
         <InputGroup label="Link Loker" value={formData.link || ''} onChange={v => setFormData({...formData, link: v})} placeholder="https://..." />
         <textarea placeholder="Catatan tambahan..." rows={3} className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-slate-700 text-xs" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-4 lg:py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl text-xs">Batal</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 lg:py-5 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-700 text-xs">Simpan Record</button>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ label: string, value: string | number, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} placeholder={placeholder} className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-slate-700 text-xs" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const SelectGroup: React.FC<{ label: string, value: any, onChange: (v: string) => void, options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <select className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-slate-700 text-xs" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default JobTracker;
