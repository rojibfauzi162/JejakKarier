import React, { useState, useMemo } from 'react';
import { AppData, CareerEvent, EventType, ImportanceLevel, JobStatus, SubscriptionPlan } from '../../types';

interface CareerCalendarProps {
  data: AppData;
  onAddEvent: (e: CareerEvent) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateJobStatus?: (jobId: string, status: JobStatus) => void;
  onUpgrade?: () => void;
}

const CareerCalendar: React.FC<CareerCalendarProps> = ({ data, onAddEvent, onDeleteEvent, onUpdateJobStatus, onUpgrade }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily' | 'annual'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CareerEvent | null>(null);

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
    const firstDayDate = new Date(year, month, 1, 12, 0, 0);
    const firstDay = firstDayDate.getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for Monday start grid (Sen, Sel, Rab, Kam, Jum, Sab, Min)
    const paddingCount = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < paddingCount; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(getLocalDateStr(new Date(year, month, i)));
    }
    return days;
  }, [currentDate]);

  const weeklyDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const startOfWeek = new Date(d.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(getLocalDateStr(date));
    }
    return days;
  }, [currentDate]);

  const annualMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(currentDate.getFullYear(), i, 1));
    }
    return months;
  }, [currentDate.getFullYear()]);

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

  const handlePrev = () => {
    if (viewMode === 'annual') setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    else if (viewMode === 'monthly') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (viewMode === 'weekly') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
    else if (viewMode === 'daily') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'annual') setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    else if (viewMode === 'monthly') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (viewMode === 'weekly') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
    else if (viewMode === 'daily') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleOpenAdd = (day: string) => {
    const limit = data.planLimits?.careerCalendar || 2;
    if (data.plan === SubscriptionPlan.FREE && (data.careerEvents || []).length >= Number(limit)) {
      alert(`Batas event kalender tercapai (${limit}). Silakan upgrade paket untuk menjadwalkan lebih banyak agenda.`);
      onUpgrade?.();
      return;
    }
    setSelectedDay(day);
    setForm({ 
      title: '', 
      type: EventType.OTHER, 
      importance: ImportanceLevel.MEDIUM, 
      time: '09:00', 
      notes: '', 
      location: '', 
      link: '', 
      relatedId: '',
      date: day 
    });
    setCustomDetail('');
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CareerEvent) => {
    e.stopPropagation();
    setViewingEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !selectedDay) return;

    const finalNotes = form.type === EventType.OTHER && customDetail 
      ? `[Detail Kustom: ${customDetail}]\n${form.notes || ''}` 
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

    if (onUpdateJobStatus && form.relatedId && (form.type === EventType.INTERVIEW || form.type === EventType.TEST)) {
       onUpdateJobStatus(form.relatedId, JobStatus.WAWANCARA);
    }

    setIsModalOpen(false);
  };

  const addToGoogleCalendar = (event: CareerEvent) => {
    const start = event.date.replace(/-/g, '') + 'T' + event.time.replace(/:/g, '') + '00';
    const endHour = (parseInt(event.time.split(':')[0]) + 1).toString().padStart(2, '0');
    const end = event.date.replace(/-/g, '') + 'T' + endHour + event.time.split(':')[1] + '00';
    
    const title = encodeURIComponent(`[FokusKarir] ${event.title}`);
    const details = encodeURIComponent(`${event.notes || ''}\n\nType: ${event.type}\nImportance: ${event.importance}\nLink: ${event.link || '-'}`);
    const location = encodeURIComponent(event.location || '');
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
    window.open(url, '_blank');
  };

  const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-md ${color}`}></div>
      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Career Calendar</h2>
          <p className="text-slate-500 font-medium italic">"Visualisasikan jadwal krusial perjalanan profesional Anda."</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200">
            {[
              { id: 'annual', label: 'Tahunan' },
              { id: 'monthly', label: 'Bulanan' },
              { id: 'weekly', label: 'Mingguan' },
              { id: 'daily', label: 'Harian' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === m.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400">←</button>
            <h3 className="text-sm font-black uppercase tracking-widest w-44 text-center text-slate-700">
              {viewMode === 'annual' 
                ? currentDate.getFullYear()
                : viewMode === 'daily'
                ? currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400">→</button>
          </div>
        </div>
      </header>

      {/* LEGEND SECTION */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap justify-center gap-x-8 gap-y-4">
        <LegendItem color="bg-blue-500" label="Interview & Tes" />
        <LegendItem color="bg-emerald-500" label="Belajar & Sertifikasi" />
        <LegendItem color="bg-purple-500" label="Appraisal / Review" />
        <LegendItem color="bg-orange-500" label="Deadline Karir" />
        <LegendItem color="bg-indigo-500" label="Meeting" />
        <LegendItem color="bg-slate-400" label="Lainnya" />
      </div>

      {/* INFO KUOTA */}
      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-6 mx-1 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
               <i className="bi bi-calendar-event-fill"></i>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Agenda Kalender ({data?.plan})</p>
               <p className="text-sm font-black text-slate-800 tracking-tight">
                  {(data.careerEvents || []).length} / {data.planLimits?.careerCalendar === 'unlimited' ? '∞' : data.planLimits?.careerCalendar || 2} Jadwal Terdaftar
               </p>
            </div>
         </div>
         <button onClick={onUpgrade} className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all">🚀 Upgrade Plan</button>
      </div>

      {/* CALENDAR VIEW MODES */}
      <div className="bg-white p-4 lg:p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* ANNUAL VIEW */}
        {viewMode === 'annual' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {annualMonths.map((m, idx) => {
              const monthEvents = data.careerEvents?.filter(e => {
                const ed = new Date(e.date);
                return ed.getMonth() === m.getMonth() && ed.getFullYear() === m.getFullYear();
              }) || [];
              return (
                <div 
                  key={idx} 
                  onClick={() => { setCurrentDate(m); setViewMode('monthly'); }}
                  className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group"
                >
                  <h4 className="text-sm font-black uppercase text-slate-800 mb-4 group-hover:text-indigo-600">{m.toLocaleString('id-ID', { month: 'long' })}</h4>
                  <div className="space-y-2">
                    {monthEvents.length > 0 ? (
                      monthEvents.slice(0, 3).map(e => (
                        <div key={e.id} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${getTypeColor(e.type)}`}></div>
                          <p className="text-[10px] font-bold text-slate-600 truncate">{e.title}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] italic text-slate-300">Tidak ada agenda</p>
                    )}
                    {monthEvents.length > 3 && (
                      <p className="text-[9px] font-black text-indigo-400 mt-2">+{monthEvents.length - 3} agenda lagi</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONTHLY VIEW (EXISTING) */}
        {viewMode === 'monthly' && (
          <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
            {['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'].map(d => (
              <div key={d} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
            {calendarDays.map((day, idx) => (
              <div key={idx} className={`min-h-[140px] bg-white p-3 flex flex-col gap-2 relative group hover:bg-slate-50/50 transition-colors cursor-pointer ${!day ? 'bg-slate-50/20 opacity-50' : ''}`} onClick={() => day && handleOpenAdd(day)}>
                {day && (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-black ${day === getLocalDateStr(new Date()) ? 'w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg text-base' : 'text-xl text-slate-900 transition-colors'}`}>
                        {new Date(day).getDate()}
                      </span>
                      <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white">+</button>
                    </div>
                    <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar py-1">
                      {getEventsForDate(day).map(e => (
                        <div 
                          key={e.id} 
                          onClick={(ev) => handleEventClick(ev, e)}
                          className={`p-2 rounded-xl flex flex-col gap-0.5 transition-all shadow-sm hover:scale-[1.05] hover:shadow-md ${getTypeColor(e.type)} text-white`}
                        >
                          <p className="text-[9px] font-black leading-tight truncate uppercase">{e.title}</p>
                          <div className="flex items-center gap-1.5">
                             <span className="text-[8px] font-bold opacity-80 uppercase">{e.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* WEEKLY VIEW */}
        {viewMode === 'weekly' && (
          <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
            {['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'].map(d => (
              <div key={d} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
            {weeklyDays.map((day, idx) => (
              <div key={idx} className={`min-h-[400px] bg-white p-4 flex flex-col gap-4 relative group hover:bg-slate-50/50 transition-colors cursor-pointer`} onClick={() => handleOpenAdd(day)}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className={`text-2xl font-black ${day === getLocalDateStr(new Date()) ? 'text-indigo-600' : 'text-slate-800'}`}>
                      {new Date(day).getDate()}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(day).toLocaleString('id-ID', { month: 'short' })}</span>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">+</button>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                  {getEventsForDate(day).map(e => (
                    <div 
                      key={e.id} 
                      onClick={(ev) => handleEventClick(ev, e)}
                      className={`p-3 rounded-2xl flex flex-col gap-1 transition-all shadow-md ${getTypeColor(e.type)} text-white`}
                    >
                      <p className="text-[10px] font-black leading-tight uppercase">{e.title}</p>
                      <p className="text-[8px] font-bold opacity-80">{e.time} WIB</p>
                    </div>
                  ))}
                  {getEventsForDate(day).length === 0 && (
                    <p className="text-[10px] italic text-slate-300 text-center py-10 opacity-0 group-hover:opacity-100 transition-opacity">Belum ada agenda</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DAILY VIEW */}
        {viewMode === 'daily' && (
          <div className="min-h-[500px] flex flex-col lg:flex-row gap-10">
            <div className="lg:w-1/3 space-y-8">
              <div className="p-8 rounded-[3rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Agenda Hari Ini</p>
                <h3 className="text-4xl font-black tracking-tighter leading-none">{new Date(currentDate).getDate()}</h3>
                <p className="text-lg font-bold uppercase mt-2">{new Date(currentDate).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              </div>
              <button 
                onClick={() => handleOpenAdd(getLocalDateStr(currentDate))}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all"
              >
                + Tambah Agenda Hari Ini
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Daftar Event ({getEventsForDate(getLocalDateStr(currentDate)).length})</h4>
              <div className="grid grid-cols-1 gap-4">
                {getEventsForDate(getLocalDateStr(currentDate)).map(e => (
                  <div 
                    key={e.id} 
                    onClick={(ev) => handleEventClick(ev, e)}
                    className={`p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex items-center justify-between group bg-white`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg ${getTypeColor(e.type)}`}>
                        <i className={`bi ${e.type === EventType.INTERVIEW ? 'bi-person-badge' : e.type === EventType.TRAINING ? 'bi-mortarboard' : 'bi-calendar-event'}`}></i>
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800 text-lg uppercase tracking-tight">{e.title}</h5>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><i className="bi bi-clock mr-1"></i> {e.time} WIB</span>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{e.importance}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all mr-4">→</span>
                  </div>
                ))}
                {getEventsForDate(getLocalDateStr(currentDate)).length === 0 && (
                  <div className="py-32 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">Tidak ada agenda untuk hari ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DETAIL EVENT */}
      {isDetailModalOpen && viewingEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[2100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 relative">
             <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors text-xl">✕</button>
             
             <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg ${getTypeColor(viewingEvent.type)}`}>
                   <i className={`bi ${viewingEvent.type === EventType.INTERVIEW ? 'bi-person-badge' : viewingEvent.type === EventType.TRAINING ? 'bi-mortarboard' : 'bi-calendar-event'}`}></i>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{viewingEvent.type}</p>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{viewingEvent.title}</h3>
                </div>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                      <p className="text-sm font-black text-slate-700">{new Date(viewingEvent.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                      <p className="text-sm font-black text-slate-700">{viewingEvent.time} WIB</p>
                   </div>
                </div>

                {viewingEvent.location && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokasi</p>
                     <p className="text-sm font-bold text-slate-700">{viewingEvent.location}</p>
                  </div>
                )}

                {viewingEvent.link && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Meeting Link</p>
                     <a href={viewingEvent.link} target="_blank" rel="noreferrer" className="text-sm font-black text-blue-600 hover:underline break-all">{viewingEvent.link}</a>
                  </div>
                )}

                {viewingEvent.notes && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Catatan</p>
                     <div className="space-y-2">
                        {viewingEvent.notes.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                          <div key={idx} className="flex gap-3 items-start animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 100}ms` }}>
                             <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${getTypeColor(viewingEvent.type)} opacity-40`}></div>
                             <p className="text-xs font-medium text-slate-600 leading-relaxed">{line.replace(/^"|"$/g, '')}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-6">
                   <button 
                    onClick={() => addToGoogleCalendar(viewingEvent)}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                   >
                     <i className="bi bi-google"></i> Tambahkan ke Google Calendar
                   </button>
                   <div className="flex gap-3">
                      <button 
                        onClick={() => { onDeleteEvent(viewingEvent.id); setIsDetailModalOpen(false); }}
                        className="flex-1 py-4 bg-rose-50 text-rose-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Hapus Event
                      </button>
                      <button 
                        onClick={() => setIsDetailModalOpen(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Tutup
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH EVENT - SESUAI GAMBAR */}
      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 lg:p-12 shadow-2xl animate-in zoom-in duration-300 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors text-xl">✕</button>
            
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-10 tracking-tight text-center">TAMBAH EVENT KALENDER</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NAMA EVENT */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NAMA EVENT</label>
                <input className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-xs outline-none focus:border-indigo-200 transition-all" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Misal: Interview PT. Jaya..." required />
              </div>

              {/* JENIS EVENT & KEPENTINGAN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">JENIS EVENT</label>
                  <select className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-xs outline-none cursor-pointer" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                    {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KEPENTINGAN</label>
                  <select className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-xs outline-none cursor-pointer" value={form.importance} onChange={e => setForm({...form, importance: e.target.value as any})}>
                    {Object.values(ImportanceLevel).map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              {/* DETAIL EVENT KUSTOM (HANYA JIKA 'OTHER') */}
              {form.type === EventType.OTHER && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">DETAIL EVENT KUSTOM</label>
                  <textarea rows={2} className="w-full px-6 py-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 font-bold text-xs outline-none focus:border-indigo-200 resize-none" value={customDetail} onChange={e => setCustomDetail(e.target.value)} placeholder="Misal: Lomba Hackathon, Gathering, dsb..." required />
                </div>
              )}

              {/* WAKTU */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WAKTU (JAM)</label>
                <div className="relative">
                  <input type="time" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-xs outline-none" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </div>
              </div>

              {/* LOKASI & MEETING LINK */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LOKASI (OPSIONAL)</label>
                  <input className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-xs outline-none" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Nama Gedung / Kantor" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MEETING LINK (OPSIONAL)</label>
                  <input className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-xs outline-none" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="Zoom / Google Meet URL" />
                </div>
              </div>

              {/* CATATAN SINGKAT */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CATATAN SINGKAT</label>
                <textarea rows={2} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-xs outline-none resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Poin penting untuk diingat..." />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all hover:bg-slate-100">BATAL</button>
                <button type="submit" className="flex-[2] py-4 bg-[#1a1f2c] text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-[0.98]">SIMPAN EVENT</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerCalendar;