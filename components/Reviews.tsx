
import React, { useState } from 'react';
import { MonthlyReview } from '../types';
import { summarizeMonthlyReview } from '../services/geminiService';
import { MONTHS } from '../constants';

interface ReviewsProps {
  reviews: MonthlyReview[];
  onAdd: (r: MonthlyReview) => void;
  onDelete: (id: string) => void;
}

const Reviews: React.FC<ReviewsProps> = ({ reviews, onAdd, onDelete }) => {
  const [formData, setFormData] = useState({
    month: MONTHS[new Date().getMonth()],
    year: '2024',
    positives: '',
    improvements: '',
    obstacles: '',
    nextMonthPlan: ''
  });
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSummarizing(true);
    const textToSummarize = `Wins: ${formData.positives}. Improvements: ${formData.improvements}. Obstacles: ${formData.obstacles}. Plan: ${formData.nextMonthPlan}`;
    const summary = await summarizeMonthlyReview(textToSummarize);
    
    onAdd({
      ...formData,
      id: Math.random().toString(),
      aiSummary: summary
    });
    
    setFormData({ ...formData, positives: '', improvements: '', obstacles: '', nextMonthPlan: '' });
    setIsSummarizing(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Monthly Reviews</h2>
        <p className="text-slate-500">Reflect on your growth and plan the month ahead.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Month</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none bg-white"
                value={formData.month}
                onChange={e => setFormData({ ...formData, month: e.target.value })}
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Year</label>
              <input 
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReviewField label="What went well?" value={formData.positives} onChange={v => setFormData({ ...formData, positives: v })} />
            <ReviewField label="What to improve?" value={formData.improvements} onChange={v => setFormData({ ...formData, improvements: v })} />
            <ReviewField label="Key obstacles" value={formData.obstacles} onChange={v => setFormData({ ...formData, obstacles: v })} />
            <ReviewField label="Next month plan" value={formData.nextMonthPlan} onChange={v => setFormData({ ...formData, nextMonthPlan: v })} />
          </div>
          <button 
            disabled={isSummarizing}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all disabled:opacity-50"
          >
            {isSummarizing ? 'Summarizing with AI...' : 'Save & Generate AI Summary'}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {reviews.slice().reverse().map(review => (
          <div key={review.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group">
             <div className="flex justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-800">{review.month} {review.year}</h3>
               <button onClick={() => onDelete(review.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">✕</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Review Highlights</h4>
                   <p className="text-sm text-slate-600"><span className="font-bold">Wins:</span> {review.positives}</p>
                   <p className="text-sm text-slate-600 mt-2"><span className="font-bold">Focus:</span> {review.nextMonthPlan}</p>
                 </div>
               </div>
               {review.aiSummary && (
                 <div className="bg-indigo-50 p-6 rounded-2xl relative overflow-hidden">
                   <div className="relative z-10">
                     <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">AI Summary & Action Items</h4>
                     <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{review.aiSummary}</p>
                   </div>
                   <div className="absolute top-0 right-0 p-3 text-2xl opacity-20">✨</div>
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
    <textarea 
      rows={3}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default Reviews;
