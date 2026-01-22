
import React, { useState } from 'react';
import { DailyReport } from '../types';

interface DailyLogsProps {
  logs: DailyReport[];
  onAdd: (log: DailyReport) => void;
  onDelete: (id: string) => void;
  affirmation: string;
}

const DailyLogs: React.FC<DailyLogsProps> = ({ logs, onAdd, onDelete, affirmation }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    output: '',
    metricValue: 0,
    metricLabel: 'Tasks Completed',
    reflection: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity || !formData.output) return;
    onAdd({
      ...formData,
      id: Math.random().toString(36).substr(2, 9)
    });
    setFormData({ ...formData, activity: '', output: '', metricValue: 0, reflection: '' });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Log Performance</h2>
          <p className="opacity-80 max-w-lg mt-2 italic text-sm">"{affirmation}"</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Primary Activity</label>
            <input 
              placeholder="What did you do today?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.activity}
              onChange={e => setFormData({ ...formData, activity: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Concrete Output</label>
            <input 
              placeholder="What was the result?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.output}
              onChange={e => setFormData({ ...formData, output: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Value</label>
              <input 
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.metricValue}
                onChange={e => setFormData({ ...formData, metricValue: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Metric Unit</label>
              <input 
                placeholder="e.g. Lines/Hours"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.metricLabel}
                onChange={e => setFormData({ ...formData, metricLabel: e.target.value })}
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Reflection / Notes</label>
            <textarea 
              rows={3}
              placeholder="Brief reflection on the day..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.reflection}
              onChange={e => setFormData({ ...formData, reflection: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <button className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95">
              Save Log
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Recent Logs</h3>
        <div className="grid grid-cols-1 gap-4">
          {logs.slice().reverse().map(log => (
            <div key={log.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between group transition-all hover:shadow-md">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-600 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-lg font-bold">{new Date(log.date).getDate()}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{log.activity}</h4>
                  <p className="text-sm text-slate-500 mt-1">Output: {log.output}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{log.metricValue} {log.metricLabel}</span>
                  </div>
                  {log.reflection && (
                    <p className="text-xs italic text-slate-400 mt-3 border-l-2 border-slate-200 pl-3">"{log.reflection}"</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => onDelete(log.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">No logs found. Start your first performance record above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLogs;
