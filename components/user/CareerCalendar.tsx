
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
  const [viewMode, setViewMode] = useState<'TAHUNAN' | 'BULANAN' | 'MINGGUAN' | 'HARIAN'>('BULANAN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CareerEvent | null>(null);

  // LOGIC LIMITASI - HANYA UNTUK PAKET FREE
  const limit = data.planLimits?.careerCalendar || 10;
  const isPro = data.plan !== SubscriptionPlan.FREE;
  const usage = data.careerEvents.length;

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

  // Helper: Format date string YYYY-MM-DD
  const getLocalDateStr = (d: Date) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  // Helper: Google Calendar Sync URL
  const getGoogleCalendarUrl = (event: CareerEvent) => {
    const base = "https://www.google.com/calendar/render?action=TEMPLATE";
    const startStr = event.date.replace(/-/g, '') + 'T' + event.time.replace(':', '') + '00';
    const [h, m] = event.time.split(':').map(Number);
    const endH = (h + 1).toString().padStart(2, '0');
    const endStr = event.date.replace(/-/g, '') + 'T' + endH + m.toString().padStart(2, '0') + '00';
    
    return `${base}&text=${encodeURIComponent(event.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(event.notes || '')}&location=${encodeURIComponent(event.location || '')}`;
  };

  // Logic: Generate Calendar Days based on View Mode
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const result = [];

    if (viewMode === 'BULANAN') {
      const firstDayDate = new Date(year, month, 1);
      const firstDay = firstDayDate.getDay(); 
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startPadding = firstDay === 0 ? 6 : firstDay - 1;
      for (let i = 0; i < startPadding; i++) result.push(null);
      for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, month, d));
    } else if (viewMode === 'MINGGUAN') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentDate);
        d.setDate(diff + i);
        result.push(d);
      }
    } else if (viewMode === 'HARIAN') {
      result.push(new Date(currentDate));
    } else if (viewMode === 'TAHUNAN') {
      for (let m = 0; m < 12; m++) result.push(new Date(year, m, 1));
    }

    return result;
  }, [currentDate, viewMode]);

  const daysInCurrentMonthCount = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  }, [currentDate]);

  const weeksInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.ceil((daysInMonth + (firstDay === 0 ? 6 : firstDay - 1)) / 7);
  }, [currentDate]);

  const currentWeekNumber = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return Math.ceil((currentDate.getDate() + offset) / 7);
  }, [currentDate]);

  const goToWeek = (weekNum: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    let targetDay = (weekNum - 1) * 7 - offset + 1;
    if (targetDay < 1) targetDay = 1;
    const newDate = new Date(year, month, targetDay);
    setCurrentDate(newDate);
  };

  const goToDay = (dayNum: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(dayNum);
    setCurrentDate(newDate);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'BULANAN') newDate.setMonth(currentDate.getMonth() - 1);
    else if (viewMode === 'MINGGUAN') newDate.setDate(currentDate.getDate() - 7);
    else if (viewMode === 'HARIAN') newDate.setDate(currentDate.getDate() - 1);
    else if (viewMode === 'TAHUNAN') newDate.setFullYear(currentDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'BULANAN') newDate.setMonth(currentDate.getMonth() + 1);
    else if (viewMode === 'MINGGUAN') newDate.setDate(currentDate.getDate() + 7);
    else if (viewMode === 'HARIAN') newDate.setDate(currentDate.getDate() + 1);
    else if (viewMode === 'TAHUNAN') newDate.setFullYear(currentDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !selectedDay) return;
    if (!isPro && limit !== 'unlimited' && usage >= Number(limit)) {
      alert(`Limit agenda tercapai (${limit}). Silakan upgrade paket.`);
      onUpgrade?.();
      return;
    }
    const newEvent: CareerEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: form.title!,
      type: form.type || EventType.OTHER,
      date: selectedDay,
      time: form.time || '09:00',
      importance: ImportanceLevel.MEDIUM,
      notes: form.notes,
      location: form.location,
      link: form.link,
      relatedId: form.relatedId
    };
    onAddEvent(newEvent);
    setIsModalOpen(false);
    setForm({ title: '', type: EventType.OTHER, importance: ImportanceLevel.MEDIUM, time: '09:00', notes: '', location: '', link: '', relatedId: '' });
  };

  const getTypeColor = (type: EventType) => {
    switch(type) {
      case EventType.INTERVIEW: case EventType.TEST: return 'bg-blue-600';
      case EventType.TRAINING: case EventType.CERTIFICATION: return 'bg-emerald-500';
      case EventType.APPRAISAL: return 'bg-purple-500';
      case EventType.DEADLINE: return 'bg-orange-500';
      case EventType.MEETING: return 'bg-indigo-600';
      default: return 'bg-slate-400';
    }
  };

  const dayNames = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Career Calendar</h2>
          <p className="text-slate-400 font-bold text-xs mt-2 italic">"Visualisasikan jadwal krusial perjalanan profesional Anda."</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-sm">
          {(['TAHUNAN', 'BULANAN', 'MINGGUAN', 'HARIAN'] as const).map(mode => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
             <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">←</button>
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.2em] w-52 text-center">
               {viewMode === 'TAHUNAN' ? currentDate.getFullYear() : currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
             </h3>
             <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">→</button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-white text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-50 border border-slate-200 shadow-sm transition-all">Hari Ini</button>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 px-2 pt-5 border-t border-slate-50">
           <LegendItem color="bg-blue-600" label="Interview & Tes" />
           <LegendItem color="bg-emerald-500" label="Belajar & Sertifikasi" />
           <LegendItem color="bg-purple-500" label="Appraisal / Review" />
           <LegendItem color="bg-orange-500" label="Deadline Karir" />
           <LegendItem color="bg-indigo-600" label="Meeting" />
           <LegendItem color="bg-slate-400" label="Lainnya" />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        {viewMode === 'BULANAN' && (
          <>
            <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/30">
              {dayNames.map(d => <div key={d} className="py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-40 border-r border-b border-slate-50 bg-slate-50/10"></div>;
                const dayStr = getLocalDateStr(day);
                const isToday = dayStr === getLocalDateStr(new Date());
                const dayEvents = data.careerEvents.filter(e => e.date === dayStr);
                return (
                  <div key={dayStr} onClick={() => { setSelectedDay(dayStr); setIsModalOpen(true); }} className={`h-40 border-r border-b border-slate-50 p-4 cursor-pointer hover:bg-indigo-50/20 transition-all relative group ${isToday ? 'bg-indigo-50/10' : ''}`}>
                    <span className={`text-lg font-black ${isToday ? 'text-indigo-600 bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100' : 'text-slate-900'}`}>{day.getDate()}</span>
                    <div className="space-y-1.5 mt-3 max-h-[85%] overflow-y-auto no-scrollbar">
                      {dayEvents.map(e => <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setViewingEvent(e); setIsDetailModalOpen(true); }} className={`px-3 py-1.5 rounded-lg text-white text-[9px] font-black uppercase truncate shadow-sm transition-transform hover:scale-[1.02] ${getTypeColor(e.type)}`}>{e.time} {e.title}</div>)}
                    </div>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs shadow-xl"><i className="bi bi-plus-lg"></i></div></div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'MINGGUAN' && (
          <>
            <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/30">
              {dayNames.map(d => <div key={d} className="py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 h-[500px]">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="border-r border-slate-50 bg-slate-50/10"></div>;
                const dayStr = getLocalDateStr(day);
                const isToday = dayStr === getLocalDateStr(new Date());
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const dayEvents = data.careerEvents.filter(e => e.date === dayStr);
                return (
                  <div key={dayStr} onClick={() => { setSelectedDay(dayStr); setIsModalOpen(true); }} className={`border-r border-slate-50 p-6 cursor-pointer hover:bg-indigo-50/20 transition-all relative group ${isToday ? 'bg-indigo-50/10' : ''}`}>
                    <div className="text-center mb-6">
                      <span className={`text-2xl font-black ${isToday ? 'text-indigo-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}`}>{day.getDate()}</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto no-scrollbar">
                      {dayEvents.map(e => <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setViewingEvent(e); setIsDetailModalOpen(true); }} className={`px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase shadow-sm transition-transform hover:scale-[1.05] ${getTypeColor(e.type)}`}>{e.time} {e.title}</div>)}
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg shadow-xl"><i className="bi bi-plus"></i></div></div>
                  </div>
                );
              })}
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center gap-3">
              {Array.from({ length: weeksInMonth }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => goToWeek(i + 1)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentWeekNumber === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                >
                  Minggu {i + 1}
                </button>
              ))}
            </div>
          </>
        )}

        {viewMode === 'HARIAN' && (
          <div className="flex flex-col h-full bg-white">
            {/* Unified vertical scroll container */}
            <div className="h-[700px] overflow-y-auto no-scrollbar relative border-t border-slate-100">
               <div className="flex flex-row min-h-full">
                  {/* TIME RAIL - Sticky horizontally but moves vertically with content */}
                  <div className="w-20 lg:w-32 bg-slate-50/50 border-r border-slate-100 shrink-0 sticky left-0 z-10 backdrop-blur-sm">
                    {hoursArray.map(hour => (
                      <div key={hour} className="h-24 border-b border-slate-100 flex items-center justify-center bg-slate-50/80">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{String(hour).padStart(2, '0')}:00</span>
                      </div>
                    ))}
                  </div>
                  {/* CONTENT AREA - Shared vertical scroll space */}
                  <div className="flex-1 bg-white">
                    {hoursArray.map(hour => {
                      const dayStr = getLocalDateStr(currentDate);
                      const hourStr = String(hour).padStart(2, '0');
                      const eventsInHour = data.careerEvents.filter(e => e.date === dayStr && e.time.startsWith(hourStr));
                      return (
                        <div 
                          key={hour} 
                          className="h-24 border-b border-slate-50 p-2 flex gap-2 overflow-x-auto no-scrollbar cursor-pointer hover:bg-slate-50/50 transition-colors"
                          onClick={() => { 
                             setSelectedDay(dayStr); 
                             setForm(prev => ({ ...prev, time: `${hourStr}:00` }));
                             setIsModalOpen(true); 
                           }}
                        >
                           {eventsInHour.map(e => (
                             <div 
                              key={e.id} 
                              onClick={(ev) => { ev.stopPropagation(); setViewingEvent(e); setIsDetailModalOpen(true); }}
                              className={`min-w-[200px] max-w-[300px] p-3 rounded-2xl text-white shadow-md cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-center ${getTypeColor(e.type)}`}
                             >
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{e.type}</p>
                                <p className="text-xs font-black truncate">{e.title}</p>
                             </div>
                           ))}
                        </div>
                      );
                    })}
                  </div>
               </div>
               <button 
                onClick={() => { setSelectedDay(getLocalDateStr(currentDate)); setIsModalOpen(true); }}
                className="sticky bottom-10 left-[calc(100%-80px)] w-16 h-16 bg-slate-950 text-white rounded-[2rem] shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-20"
               >
                  <i className="bi bi-plus-lg"></i>
               </button>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {Array.from({ length: daysInCurrentMonthCount }).map((_, i) => {
                const dayNum = i + 1;
                const isActive = currentDate.getDate() === dayNum;
                return (
                  <button 
                    key={dayNum} 
                    onClick={() => goToDay(dayNum)}
                    className={`shrink-0 w-10 h-10 rounded-xl text-[11px] font-black transition-all flex items-center justify-center border ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-white hover:text-indigo-600 hover:border-indigo-200'}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'TAHUNAN' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 bg-slate-50/30">
            {calendarDays.map((monthDate, idx) => {
              const monthLabel = monthDate?.toLocaleString('id-ID', { month: 'long' });
              const monthPrefix = `${currentDate.getFullYear()}-${String(idx + 1).padStart(2, '0')}`;
              const monthEvents = data.careerEvents.filter(e => e.date.startsWith(monthPrefix));
              return (
                <div key={idx} className="h-64 border-r border-b border-slate-100 p-6 bg-white flex flex-col group">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">{monthLabel}</h4>
                  <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                     {monthEvents.map(e => (
                       <div key={e.id} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getTypeColor(e.type)}`}></div>
                          <p className="text-[9px] font-bold text-slate-500 truncate uppercase">{e.title}</p>
                       </div>
                     ))}
                     {monthEvents.length === 0 && <p className="text-[9px] text-slate-300 font-bold uppercase italic mt-4">Belum ada agenda</p>}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                     <span className="text-[10px] font-black text-indigo-600">{monthEvents.length} EVENT</span>
                     <button 
                      onClick={() => { setViewMode('BULANAN'); setCurrentDate(new Date(currentDate.getFullYear(), idx, 1)); }}
                      className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <i className="bi bi-chevron-right"></i>
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isDetailModalOpen && viewingEvent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-10 border border-slate-100 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${getTypeColor(viewingEvent.type)}`}>{viewingEvent.type}</span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-4">{viewingEvent.title}</h3>
                 </div>
                 <button onClick={() => setIsDetailModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors">✕</button>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-lg"><i className="bi bi-calendar3"></i></div>
                    <span>{new Date(viewingEvent.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-lg"><i className="bi bi-clock"></i></div>
                    <span>{viewingEvent.time} WIB</span>
                 </div>
                 <div className="p-7 bg-slate-50/80 rounded-[2.5rem] border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Catatan Agenda</p>
                    <div className="space-y-2 text-sm font-medium text-slate-600 leading-relaxed italic">
                      {viewingEvent.notes?.split('\n').map((line, i) => (
                        <div key={i} className="flex gap-2.5"><span className="text-indigo-300">•</span><span>{line}</span></div>
                      )) || 'Tidak ada catatan tambahan.'}
                    </div>
                 </div>
                 <a href={getGoogleCalendarUrl(viewingEvent)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-[1.75rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all shadow-md active:scale-95"><i className="bi bi-google"></i> Tambahkan ke Google Calendar</a>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => { onDeleteEvent(viewingEvent.id); setIsDetailModalOpen(false); }} className="flex-1 py-4 bg-rose-50 text-rose-500 font-black rounded-[1.75rem] uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all">Hapus Agenda</button>
                    <button onClick={() => setIsDetailModalOpen(false)} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-[1.75rem] uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Tutup</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-10 lg:p-14 border border-slate-100 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh] no-scrollbar">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-8">Tambah Agenda Baru</h3>
            <form onSubmit={handleAddEvent} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Agenda</label>
                 <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-indigo-400 transition-all shadow-inner" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} placeholder="Misal: Interview PT ABC" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                    <select className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm cursor-pointer" value={form.type || ''} onChange={e => setForm({...form, type: e.target.value as EventType})}>{Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioritas</label>
                    <select className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm cursor-pointer" value={form.importance || ''} onChange={e => setForm({...form, importance: e.target.value as ImportanceLevel})}>{Object.values(ImportanceLevel).map(i => <option key={i} value={i}>{i}</option>)}</select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu</label>
                    <input type="time" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={form.time || ''} onChange={e => setForm({...form, time: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasi (Opsional)</label>
                    <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} placeholder="Online / Kantor" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan</label>
                 <textarea rows={3} className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none shadow-inner" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Detail agenda..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl uppercase text-[11px] tracking-widest">Batal</button>
                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-3xl uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Simpan Agenda 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2.5"><div className={`w-3 h-3 rounded-full ${color}`}></div><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{label}</span></div>
);

export default CareerCalendar;
