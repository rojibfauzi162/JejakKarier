
import React, { useState, useMemo } from 'react';
import { AppData, CareerEvent, EventType, ImportanceLevel, JobStatus, TrainingStatus } from '../../types';

interface CareerCalendarProps {
  data: AppData;
  onAddEvent: (e: CareerEvent) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateJobStatus?: (jobId: string, status: JobStatus) => void;
}

const CareerCalendar: React.FC<CareerCalendarProps> = ({ data, onAddEvent, onDeleteEvent, onUpdateJobStatus }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateStr = (d: Date) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  // Form State
  const [form, setForm] = useState<Partial<CareerEvent>>({
    title: '',
    type: EventType.OTHER,
    importance: ImportanceLevel.MEDIUM,
    time: '09:00',
    notes: '',
    location: '',
    link: '',
    relatedId: ''
  });
  
  const [customDetail, setCustomDetail] = useState('');

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // Gunakan jam 12 siang untuk mencegah pergeseran tanggal akibat timezone
    const firstDayDate = new Date(year, month, 1, 12, 0, 0);
    const firstDay = firstDayDate.getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for Monday start grid (Sen, Sel, Rab, Kam, Jum, Sab, Min)
    const paddingCount = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < paddingCount; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(getLocalDateStr(new Date(year, month, i)));
    }
    return days;
  }, [currentDate]);

  const getEventsForDate = (dateStr: string) => {
    return data.careerEvents?.filter(e => e.date === dateStr) || [];
  };

  const getTypeColor = (type: EventType) => {
    switch (type) {
      case EventType.INTERVIEW:
      case EventType.TEST:
        return 'bg-blue-500';
      case EventType.TRAINING:
      case EventType.CERTIFICATION:
        return 'bg-emerald-500';
      case EventType.APPRAISAL:
        return 'bg-purple-500';
      case EventType.DEADLINE:
        return 'bg-orange-500';
      case EventType.MEETING:
        return 'bg-indigo-500';
      default:
        return 'bg-slate-400';
    }
  };

  const handleOpenAdd = (day: string) => {
    setSelectedDay(day);
    setForm({ ...form, date: day });
    setCustomDetail('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !selectedDay) return;

    // Judul utama tetap Nama Event, jika custom maka kita simpan infonya di catatan
    const finalNotes = form.type === EventType.OTHER && customDetail 
      ? `[Jenis Custom: ${customDetail}]\n${form.notes || ''}` 
      : form.notes;

    const newEvent: CareerEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: form.title,
      type: form.type as EventType,
      date: selectedDay,
      time: form.time || '09:00',
      importance: form.importance as ImportanceLevel,
      notes: finalNotes,
      location: form.location,
      link: form.link,
      relatedId: form.relatedId
    };

    onAddEvent(newEvent);

    // Integrasi: Update status Job jika ditautkan
    if (onUpdateJobStatus && form.relatedId && (form.type === EventType.INTERVIEW || form.type === EventType.TEST)) {
       onUpdateJobStatus(form.relatedId, JobStatus.WAWANCARA);
    }

    setIsModalOpen(false);
    setForm({ title: '', type: EventType.OTHER, importance: ImportanceLevel.MEDIUM, time: '09:00', notes: '', location: '', link: '', relatedId: '' });
    setCustomDetail('');
  };

  const addToGoogleCalendar = (event: CareerEvent) => {
    const start = event.date.replace(/-/g, '') + 'T' + event.time.replace(/:/g, '') + '00';
    const end = event.date.replace(/-/g, '') + 'T' + (parseInt(event.time.split(':')[0]) + 1).toString().padStart(2, '0') + event.time.split(':')[1] + '00';
    const title = encodeURIComponent(`[FokusKarir] ${event.title}`);
    const details = encodeURIComponent(`${event.notes || ''}\n\nType: ${event.type}\nImportance: ${event.importance}\nLink: ${event.link || '-'}`);
    const location = encodeURIComponent(event.location || '');
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Career Calendar</h2>
          <p className="text-slate-500 font-medium italic">"Visualisasikan jadwal krusial perjalanan profesional Anda."</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400">←</button>
           <h3 className="text-sm font-black uppercase tracking-widest w-40 text-center text-slate-700">
             {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
           </h3>
           <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400">→</button>
        </div>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-2">
         <LegendItem color="bg-blue-500" label="Interview / Tes" />
         <LegendItem color="bg-emerald-500" label="Training / Cert" />
         <LegendItem color="bg-purple-500" label="Appraisal / Review" />
         <LegendItem color="bg-orange-500" label="Deadline Penting" />
         <LegendItem color="bg-indigo-500" label="Meeting" />
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
           {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
             <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
           ))}
        </div>
        <div className="grid grid-cols-7">
           {calendarDays.map((day, idx) => {
             const events = day ? getEventsForDate(day) : [];
             const isToday = day === getLocalDateStr(new Date());
             
             return (
               <div key={idx} className={`min-h-[120px] p-2 border-r border-b border-slate-50 last:border-r-0 group transition-all ${day ? 'hover:bg-indigo-50/30' : 'bg-slate-50/30'}`}>
                  {day && (
                    <div className="h-full flex flex-col">
                       <div className="flex justify-between items-start mb-2">
                          <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-black ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                            {parseInt(day.split('-')[2])}
                          </span>
                          <button onClick={() => handleOpenAdd(day)} className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">+</button>
                       </div>
                       
                       <div className="flex-1 space-y-1">
                          {events.slice(0, 3).map(e => (
                            <div key={e.id} onClick={() => setSelectedDay(day)} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-50 shadow-sm cursor-pointer hover:border-indigo-200 transition-all">
                               <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getTypeColor(e.type)}`}></div>
                               <p className="text-[9px] font-black text-slate-700 truncate leading-none">{e.title}</p>
                            </div>
                          ))}
                          {events.length > 3 && (
                            <p className="text-[8px] font-black text-indigo-400 text-center uppercase tracking-widest mt-1">+{events.length - 3} lainnya</p>
                          )}
                       </div>
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>

      {/* Day Detail & List */}
      {selectedDay && getEventsForDate(selectedDay).length > 0 && (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Event Pada {new Date(selectedDay).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getEventsForDate(selectedDay).map(e => (
                <div key={e.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between group">
                   <div>
                      <div className="flex justify-between items-start mb-4">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase text-white shadow-sm ${getTypeColor(e.type)}`}>{e.type}</span>
                         <div className="flex gap-2">
                            <button onClick={() => addToGoogleCalendar(e)} className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm hover:scale-110 transition-transform" title="Add to Google Calendar">
                               <i className="bi bi-google"></i>
                            </button>
                            <button onClick={() => onDeleteEvent(e.id)} className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all">✕</button>
                         </div>
                      </div>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">{e.title}</h5>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mb-4">
                         <span>🕒 {e.time}</span>
                         <span>•</span>
                         <span className={e.importance === ImportanceLevel.HIGH ? 'text-rose-500' : ''}>Prio: {e.importance}</span>
                      </div>
                      {e.notes && <p className="text-[11px] text-slate-500 italic mb-4 leading-relaxed whitespace-pre-line">"{e.notes}"</p>}
                   </div>
                   {e.link && (
                     <a href={e.link} target="_blank" rel="noreferrer" className="mt-4 py-2 bg-indigo-600 text-white rounded-xl text-center font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100">Buka Link Event ↗</a>
                   )}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh] no-scrollbar">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase">Tambah Event Kalender</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Event</label>
                   <input 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    placeholder="Misal: Interview PT. Jaya..." 
                    required 
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Event</label>
                      <select className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs" value={form.type} onChange={e => setForm({...form, type: e.target.value as EventType})}>
                         {Object.values(EventType).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kepentingan</label>
                      <select className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-xs" value={form.importance} onChange={e => setForm({...form, importance: e.target.value as ImportanceLevel})}>
                         {Object.values(ImportanceLevel).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                   </div>
                </div>

                {/* KOLOM TAMBAHAN UNTUK EVENT CUSTOM */}
                {form.type === EventType.OTHER && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-300">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Detail Event Kustom</label>
                    <input 
                      className="w-full px-6 py-4 rounded-2xl bg-indigo-50 border border-indigo-100 outline-none font-bold text-sm text-indigo-900" 
                      value={customDetail} 
                      onChange={e => setCustomDetail(e.target.value)} 
                      placeholder="Misal: Lomba Hackathon, Gathering, dsb..." 
                      required 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu (Jam)</label>
                      <input type="time" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasi (Opsional)</label>
                      <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Nama Gedung / Kantor" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Link (Opsional)</label>
                      <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="Zoom / Google Meet URL" />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Singkat</label>
                   <textarea rows={2} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Poin penting untuk diingat..." />
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
                   <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-black transition-all">Simpan Event</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
     <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default CareerCalendar;
