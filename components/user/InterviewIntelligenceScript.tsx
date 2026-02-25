import React, { useState } from 'react';
import { AppData, InterviewScript } from '../../types';
import { generateInterviewScript } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Sparkles, 
  Target, 
  MessageSquare, 
  Star, 
  HelpCircle, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Globe,
  Languages,
  Briefcase,
  Building2,
  Quote,
  CheckCircle2,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface InterviewIntelligenceScriptProps {
  data: AppData;
  onUpdateScripts: (scripts: InterviewScript[]) => void;
  onUpgrade: () => void;
}

const InterviewIntelligenceScript: React.FC<InterviewIntelligenceScriptProps> = ({ data, onUpdateScripts, onUpgrade }) => {
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');
  const [tone, setTone] = useState<'Formal' | 'Casual' | 'Corporate'>('Formal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScript, setActiveScript] = useState<InterviewScript | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('pitch');

  const handleGenerate = async () => {
    if (!targetRole || !targetIndustry) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateInterviewScript(data, targetRole, targetIndustry, language, tone);
      
      if (!result || typeof result !== 'object') {
        throw new Error('AI returned an empty or invalid result.');
      }

      const newScript: InterviewScript = {
        id: Date.now().toString(),
        targetRole,
        targetIndustry,
        language,
        tone,
        generatedAt: new Date().toISOString(),
        ...result
      };
      const updatedScripts = [newScript, ...(data.interviewScripts || [])];
      onUpdateScripts(updatedScripts);
      setActiveScript(newScript);
    } catch (err: any) {
      console.error('Error generating interview script:', err);
      setError(err.message || 'Gagal men-generate script. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start lg:items-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
            <Mic className="w-10 h-10" />
          </div>
          <div className="space-y-4 flex-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Interview Intelligence Script</h2>
            <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
              Generate script wawancara yang personal dan berbasis data nyata dari aktivitas serta pencapaian Anda di FokusKarir. Konsisten, terstruktur, dan profesional.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6 sticky top-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konfigurasi Script</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role yang Dilamar</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Contoh: Senior Product Manager"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Industri Target</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Contoh: Fintech / E-commerce"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bahasa</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button 
                      onClick={() => setLanguage('ID')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'ID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      ID
                    </button>
                    <button 
                      onClick={() => setLanguage('EN')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'EN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      EN
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tone</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 text-[10px] uppercase tracking-widest"
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                  >
                    <option value="Formal">Formal</option>
                    <option value="Casual">Casual</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !targetRole || !targetIndustry}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Smart Script
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-600 leading-relaxed">{error}</p>
              </div>
            )}

            {data.interviewScripts && data.interviewScripts.length > 0 && (
              <div className="pt-6 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">History Script</h4>
                <div className="space-y-2">
                  {data.interviewScripts.map((script) => (
                    <button 
                      key={script.id}
                      onClick={() => setActiveScript(script)}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${activeScript?.id === script.id ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                    >
                      <p className="text-xs font-black text-slate-900 leading-tight mb-1">{script.targetRole}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(script.generatedAt).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeScript ? (
              <motion.div 
                key={activeScript.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Highlights Bar */}
                <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex items-center gap-3 shrink-0">
                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Key Highlights:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeScript.topHighlights.map((h, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white rounded-full text-[10px] font-bold text-emerald-700 border border-emerald-100 shadow-sm">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Content Sections */}
                <div className="space-y-4">
                  {/* Elevator Pitch */}
                  <Section 
                    title="Elevator Pitch (60-90s)" 
                    icon={<Target className="w-5 h-5" />}
                    isOpen={expandedSection === 'pitch'}
                    onToggle={() => toggleSection('pitch')}
                  >
                    <div className="bg-slate-50 rounded-2xl p-6 relative">
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-slate-200" />
                      <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic">
                        "{activeScript.elevatorPitch}"
                      </p>
                    </div>
                  </Section>

                  {/* Common Questions */}
                  <Section 
                    title="Jawaban Pertanyaan Umum" 
                    icon={<MessageSquare className="w-5 h-5" />}
                    isOpen={expandedSection === 'common'}
                    onToggle={() => toggleSection('common')}
                  >
                    <div className="space-y-6">
                      {activeScript.commonQuestions.map((q, i) => (
                        <div key={i} className="space-y-3">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px]">{i + 1}</span>
                            {q.question}
                          </h4>
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">{q.answer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* Behavioral Questions (STAR) */}
                  <Section 
                    title="Behavioral Questions (STAR Format)" 
                    icon={<Star className="w-5 h-5" />}
                    isOpen={expandedSection === 'behavioral'}
                    onToggle={() => toggleSection('behavioral')}
                  >
                    <div className="space-y-8">
                      {activeScript.behavioralQuestions.map((q, i) => (
                        <div key={i} className="space-y-4">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px]">{i + 1}</span>
                            {q.question}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StarCard label="Situation" content={q.starAnswer.situation} color="blue" />
                            <StarCard label="Task" content={q.starAnswer.task} color="indigo" />
                            <StarCard label="Action" content={q.starAnswer.action} color="violet" />
                            <StarCard label="Result" content={q.starAnswer.result} color="emerald" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* Weakness Framing */}
                  <Section 
                    title="Weakness Framing Assistant" 
                    icon={<AlertCircle className="w-5 h-5" />}
                    isOpen={expandedSection === 'weakness'}
                    onToggle={() => toggleSection('weakness')}
                  >
                    <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Kelemahan Realistis</span>
                        <p className="text-slate-900 font-bold">{activeScript.weaknessFraming.weakness}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Framing Positif</span>
                        <p className="text-slate-700 font-medium leading-relaxed">{activeScript.weaknessFraming.framing}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Rencana Perbaikan</span>
                        <p className="text-slate-700 font-medium leading-relaxed">{activeScript.weaknessFraming.improvementPlan}</p>
                      </div>
                    </div>
                  </Section>

                  {/* Questions for Interviewer */}
                  <Section 
                    title="Pertanyaan Balik untuk Interviewer" 
                    icon={<HelpCircle className="w-5 h-5" />}
                    isOpen={expandedSection === 'interviewer'}
                    onToggle={() => toggleSection('interviewer')}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeScript.questionsForInterviewer.map((q, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                          <p className="text-slate-700 text-sm font-bold leading-snug">{q}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-slate-200 p-12">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                  <Mic className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Siap untuk Interview?</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    Masukkan detail role dan industri di panel kiri untuk men-generate script wawancara cerdas berbasis data Anda.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
    <button 
      onClick={onToggle}
      className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
          {icon}
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
      {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="px-8 pb-8 pt-2">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const StarCard: React.FC<{ label: string; content: string; color: string }> = ({ label, content, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} space-y-2`}>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
      <p className="text-slate-800 text-sm font-medium leading-relaxed">{content}</p>
    </div>
  );
};

export default InterviewIntelligenceScript;
