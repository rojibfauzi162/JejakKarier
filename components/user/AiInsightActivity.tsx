
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, ProjectStatus, TrainingStatus, AiInsightRecord, Achievement, AchievementCategory } from '../../types';
import { generateCareerInsight } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface AiInsightActivityProps {
  data: AppData;
  onUpdateInsights?: (insights: AiInsightRecord[]) => void;
  onAddAchievement?: (achievement: Achievement) => void;
}

const AiInsightActivity: React.FC<AiInsightActivityProps> = ({ data, onUpdateInsights, onAddAchievement }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Performance Insight</h2>
      </header>
      <div className="bg-indigo-600 p-20 rounded-[3rem] text-white text-center italic shadow-2xl">Laporan berbasis AI yang meninjau seluruh aktivitas kerja Anda.</div>
    </div>
  );
};

export default AiInsightActivity;
