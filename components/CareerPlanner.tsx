
import React, { useState } from 'react';
import { CareerPath, CareerStatus, AppData } from '../types';
import { analyzeSkillGap } from '../services/geminiService';

interface CareerPlannerProps {
  paths: CareerPath[];
  appData: AppData;
  onAddPath: (path: CareerPath) => void;
  onUpdatePath: (path: CareerPath) => void;
  onDeletePath: (id: string) => void;
}

const CareerPlanner: React.FC<CareerPlannerProps> = ({ paths, appData, onAddPath, onUpdatePath, onDeletePath }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ trainings: string[], certifications: string[], summary: string } | null>(null);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSkillGap(appData);
    setAiResult(result);
    setIsAnalyzing(false);
  };

  const addPath = () => {
    onAddPath({
      id: Math.random().toString(36).substr(2, 9),
      targetPosition: "Enter Target Position",
      targetAge: 30,
      requiredSkills: [],
      ownedSkills: [],
      steps: []
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Career Path Planning</h2>
          <p className="text-slate-500">Map out your journey to the next level.</p>
        </div>
        <button 
          onClick={addPath}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all"
        >
          + New Path
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {paths.map(path => (
            <div key={path.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group">
              <div className="flex justify-between mb-4">
                <input 
                  className="text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none"
                  defaultValue={path.targetPosition}
                  onBlur={(e) => onUpdatePath({ ...path, targetPosition: e.target.value })}
                />
                <button onClick={() => onDeletePath(path.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase">Target Age:</span>
                <input 
                  type="number"
                  className="w-16 px-2 py-1 bg-slate-50 rounded-lg text-sm font-bold text-slate-700"
                  defaultValue={path.targetAge}
                  onBlur={(e) => onUpdatePath({ ...path, targetAge: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone Steps</h4>
                {path.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <input type="checkbox" checked={step.status === CareerStatus.ACHIEVED} readOnly />
                    <span className="flex-1 text-sm font-medium">{step.description}</span>
                    <span className="text-[10px] font-bold text-slate-400">{step.deadline}</span>
                  </div>
                ))}
                <button className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs hover:bg-slate-50 transition-colors font-bold uppercase">
                  Add Milestone
                </button>
              </div>
            </div>
          ))}

          {paths.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400">Click "+ New Path" to start planning your career.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">✨</div>
                <h3 className="text-lg font-bold">AI Career Scout</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Based on your current skills and targets, our AI can provide specific training and certification recommendations.
              </p>
              <button 
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl transition-all transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing Data...' : 'Generate AI Insights'}
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>

          {aiResult && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-500">
              <h3 className="text-lg font-bold mb-4">Recommended for You</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Suggested Trainings</h4>
                  <ul className="space-y-2">
                    {aiResult.trainings.map((t, i) => (
                      <li key={i} className="text-sm font-medium p-3 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">High-Impact Certs</h4>
                  <ul className="space-y-2">
                    {aiResult.certifications.map((c, i) => (
                      <li key={i} className="text-sm font-medium p-3 bg-amber-50 text-amber-700 rounded-xl flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">AI Summary</h4>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{aiResult.summary}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerPlanner;
