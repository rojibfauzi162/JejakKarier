
import React, { useState } from 'react';
import { MonthlyReview } from '../../types';
import { summarizeMonthlyReview } from '../../services/geminiService';
import { MONTHS } from '../../constants';

interface ReviewsProps {
  reviews: MonthlyReview[];
  onAdd: (r: MonthlyReview) => void;
  onDelete: (id: string) => void;
}

const Reviews: React.FC<ReviewsProps> = ({ reviews, onAdd, onDelete }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 uppercase">Monthly Reviews</h2>
        <p className="text-slate-500">Evaluasi berkala rekam jejak pertumbuhan Anda.</p>
      </header>
      <div className="bg-white p-20 rounded-3xl shadow-sm border border-slate-100 text-center text-slate-400 italic">Arsip review bulanan Anda ditampilkan di sini.</div>
    </div>
  );
};

export default Reviews;
