import React, { useState } from 'react';
import { AppData, InterviewScript } from '../../types';
import { generateInterviewScript } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
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
  Briefcase,
  Building2,
  Quote,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  FileText,
  Download
} from 'lucide-react';

interface InterviewIntelligenceScriptProps {
  data: AppData;
  onUpdateScripts: (scripts: InterviewScript[]) => void;
  onUpgrade: () => void;
}

const InterviewIntelligenceScript: React.FC<InterviewIntelligenceScriptProps> = ({ data, onUpdateScripts, onUpgrade }) => {
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScript, setActiveScript] = useState<InterviewScript | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('pitch');
  
  // Client-side dynamic inputs
  const [dynamicRole, setDynamicRole] = useState('');
  const [dynamicIndustry, setDynamicIndustry] = useState('');
  const [dynamicCompany, setDynamicCompany] = useState('');
  const [dynamicSalaryMin, setDynamicSalaryMin] = useState('');
  const [dynamicSalaryMax, setDynamicSalaryMax] = useState('');
  const [scriptTitle, setScriptTitle] = useState('');
  const [isEditing, setIsEditing] = useState(true);

  // Helper to format numbers with dots
  const formatNumber = (value: string) => {
    // Remove non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    // Add dots every 3 digits
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateInterviewScript(data, language);
      
      if (!result || typeof result !== 'object') {
        throw new Error('AI returned an empty or invalid result.');
      }

      const newScript: InterviewScript = {
        id: Date.now().toString(),
        title: `Script ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        targetRole: "Master Script", // Default name
        targetIndustry: "General",
        language,
        tone: "Formal",
        generatedAt: new Date().toISOString(),
        ...result
      };
      const updatedScripts = [newScript, ...(data.interviewScripts || [])];
      onUpdateScripts(updatedScripts);
      setActiveScript(newScript);
      setIsEditing(true); // Default to edit mode for new scripts
      
      // Reset dynamic inputs
      setDynamicRole('');
      setDynamicIndustry('');
      setDynamicCompany('');
      setDynamicSalaryMin('');
      setDynamicSalaryMax('');
      setScriptTitle(newScript.title || '');
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

  // Helper to replace placeholders
  const replacePlaceholders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\[Role\]/g, dynamicRole || '[Role]')
      .replace(/\[Industri\]/g, dynamicIndustry || '[Industri]')
      .replace(/\[Perusahaan\]/g, dynamicCompany || dynamicIndustry || '[Perusahaan]')
      .replace(/\[GajiMin\]/g, dynamicSalaryMin || '[GajiMin]')
      .replace(/\[GajiMax\]/g, dynamicSalaryMax || '[GajiMax]');
  };

  // Helper to handle text updates
  const updateScriptField = (field: keyof InterviewScript, value: any) => {
    if (!activeScript) return;
    const updatedScript = { ...activeScript, [field]: value };
    setActiveScript(updatedScript);
    
    // Update parent state to persist changes
    const updatedScripts = (data.interviewScripts || []).map(s => 
      s.id === activeScript.id ? updatedScript : s
    );
    onUpdateScripts(updatedScripts);
  };

  // Helper to update dynamic fields
  const updateDynamicField = (field: keyof InterviewScript, value: string) => {
    if (!activeScript) return;
    
    // Update local state based on field
    if (field === 'dynamicRole') setDynamicRole(value);
    if (field === 'dynamicIndustry') setDynamicIndustry(value);
    if (field === 'dynamicCompany') setDynamicCompany(value);
    if (field === 'dynamicSalaryMin') setDynamicSalaryMin(value);
    if (field === 'dynamicSalaryMax') setDynamicSalaryMax(value);
    if (field === 'title') setScriptTitle(value);
  };

  const handleSave = () => {
    if (!activeScript) return;

    const updatedScript = { 
      ...activeScript, 
      title: scriptTitle,
      dynamicRole,
      dynamicIndustry,
      dynamicCompany,
      dynamicSalaryMin,
      dynamicSalaryMax
    };
    setActiveScript(updatedScript);
    
    const updatedScripts = (data.interviewScripts || []).map(s => 
      s.id === activeScript.id ? updatedScript : s
    );
    onUpdateScripts(updatedScripts);
    alert("Perubahan berhasil disimpan!");
  };

  const handleExportPDF = () => {
    if (!activeScript) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    const roleTitle = dynamicRole || activeScript.targetRole;
    const industryTitle = dynamicIndustry || activeScript.targetIndustry;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Interview Script: ${roleTitle}`, margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Industry: ${industryTitle}`, margin, y);
    y += 15;

    // Elevator Pitch
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Perkenalan Diri Singkat (Elevator Pitch)", margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    const splitPitch = doc.splitTextToSize(replacePlaceholders(activeScript.elevatorPitch), 170);
    doc.text(splitPitch, margin, y);
    y += splitPitch.length * 5 + 10;

    // Common Questions
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Pertanyaan Umum & Jawaban", margin, y);
    y += 8;
    activeScript.commonQuestions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${replacePlaceholders(q.question)}`, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const splitAns = doc.splitTextToSize(replacePlaceholders(q.answer), 170);
      doc.text(splitAns, margin, y);
      y += splitAns.length * 5 + 8;
    });

    // Behavioral Questions
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Pertanyaan Perilaku (Metode STAR)", margin, y);
    y += 8;
    activeScript.behavioralQuestions.forEach((q, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${replacePlaceholders(q.question)}`, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const starText = `S: ${replacePlaceholders(q.starAnswer.situation)}\nT: ${replacePlaceholders(q.starAnswer.task)}\nA: ${replacePlaceholders(q.starAnswer.action)}\nR: ${replacePlaceholders(q.starAnswer.result)}`;
      const splitStar = doc.splitTextToSize(starText, 170);
      doc.text(splitStar, margin, y);
      y += splitStar.length * 5 + 8;
    });

    doc.save(`Interview_Script_${roleTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportWord = () => {
    if (!activeScript) return;

    const roleTitle = dynamicRole || activeScript.targetRole;
    const industryTitle = dynamicIndustry || activeScript.targetIndustry;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `Interview Script: ${roleTitle}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Industry: ${industryTitle}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          new Paragraph({
            text: "Perkenalan Diri Singkat (Elevator Pitch)",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [new TextRun({ text: replacePlaceholders(activeScript.elevatorPitch), italics: true })],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "Pertanyaan Umum & Jawaban",
            heading: HeadingLevel.HEADING_2,
          }),
          ...activeScript.commonQuestions.flatMap((q, i) => [
            new Paragraph({
              text: `${i + 1}. ${replacePlaceholders(q.question)}`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              text: replacePlaceholders(q.answer),
              spacing: { after: 200 },
            }),
          ]),

          new Paragraph({
            text: "Pertanyaan Perilaku (Metode STAR)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          ...activeScript.behavioralQuestions.flatMap((q, i) => [
            new Paragraph({
              text: `${i + 1}. ${replacePlaceholders(q.question)}`,
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: `Situation: ${replacePlaceholders(q.starAnswer.situation)}` }),
            new Paragraph({ text: `Task: ${replacePlaceholders(q.starAnswer.task)}` }),
            new Paragraph({ text: `Action: ${replacePlaceholders(q.starAnswer.action)}` }),
            new Paragraph({ text: `Result: ${replacePlaceholders(q.starAnswer.result)}`, spacing: { after: 200 } }),
          ]),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `Interview_Script_${roleTitle.replace(/\s+/g, '_')}.docx`);
    });
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
              Generate script wawancara "Master" yang fleksibel. Isi detail role, perusahaan, range gaji dan industri setelah generate untuk menyesuaikan script secara instan.
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
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konfigurasi Master Script</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bahasa Script</label>
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  <button 
                    onClick={() => setLanguage('ID')}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'ID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Bahasa Indonesia
                  </button>
                  <button 
                    onClick={() => setLanguage('EN')}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'EN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    English
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                 
                  Script akan dibuat dengan placeholder [Role], [perusahaan], [range gaji], [Industri]. Anda bisa mengubahnya sesuka hati setelah proses generate selesai.
                </p>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Master Script...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Master Script
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
                      onClick={() => {
                        setActiveScript(script);
                        setDynamicRole(script.dynamicRole || '');
                        setDynamicIndustry(script.dynamicIndustry || '');
                        setDynamicCompany(script.dynamicCompany || '');
                        setDynamicSalaryMin(script.dynamicSalaryMin || '');
                        setDynamicSalaryMax(script.dynamicSalaryMax || '');
                        setScriptTitle(script.title || `Script ${new Date(script.generatedAt).toLocaleDateString()}`);
                        setIsEditing(true);
                      }}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${activeScript?.id === script.id ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                    >
                      <p className="text-xs font-black text-slate-900 leading-tight mb-1">{script.title || script.targetRole}</p>
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
                {/* Dynamic Inputs Bar */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Sesuaikan Script (Real-time)</h4>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => setIsEditing(true)}
                          className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          Edit Master
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${!isEditing ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          Preview Final
                        </button>
                      </div>
                   </div>

                   {/* Title Input */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Script</label>
                      <input 
                        value={scriptTitle}
                        onChange={e => updateDynamicField('title', e.target.value)}
                        placeholder="Contoh: Script Interview Gojek"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Role / Posisi</label>
                         <input 
                            value={dynamicRole}
                            onChange={e => updateDynamicField('dynamicRole', e.target.value)}
                            placeholder="Contoh: Product Manager"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Industri</label>
                         <input 
                            value={dynamicIndustry}
                            onChange={e => updateDynamicField('dynamicIndustry', e.target.value)}
                            placeholder="Contoh: Fintech"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perusahaan</label>
                         <input 
                            value={dynamicCompany}
                            onChange={e => updateDynamicField('dynamicCompany', e.target.value)}
                            placeholder="Contoh: Gojek / Tokopedia"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Range Gaji (Min - Max)</label>
                         <div className="flex gap-2">
                            <input 
                              value={dynamicSalaryMin}
                              onChange={e => updateDynamicField('dynamicSalaryMin', formatNumber(e.target.value))}
                              placeholder="Min (Rp)"
                              className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <input 
                              value={dynamicSalaryMax}
                              onChange={e => updateDynamicField('dynamicSalaryMax', formatNumber(e.target.value))}
                              placeholder="Max (Rp)"
                              className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                         </div>
                      </div>
                      <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                        <button 
                          onClick={handleSave}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Simpan Perubahan
                        </button>
                      </div>
                   </div>
                </div>

                {/* Export Buttons */}
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={handleExportPDF}
                    className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                  <button 
                    onClick={handleExportWord}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Word
                  </button>
                </div>

                {/* Highlights Bar */}
                <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex items-center gap-3 shrink-0">
                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Key Highlights:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeScript.topHighlights.map((h, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white rounded-full text-[10px] font-bold text-emerald-700 border border-emerald-100 shadow-sm">
                        {replacePlaceholders(h)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Content Sections */}
                <div className="space-y-4">
                  {/* Elevator Pitch */}
                  <Section 
                    title="Perkenalan Diri Singkat (Elevator Pitch)" 
                    icon={<Target className="w-5 h-5" />}
                    isOpen={expandedSection === 'pitch'}
                    onToggle={() => toggleSection('pitch')}
                  >
                    <div className="bg-slate-50 rounded-2xl p-6 relative">
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-slate-200" />
                      {isEditing ? (
                        <textarea
                          value={replacePlaceholders(activeScript.elevatorPitch)}
                          onChange={(e) => updateScriptField('elevatorPitch', e.target.value)}
                          className="w-full min-h-[150px] bg-transparent border-none focus:ring-0 text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic resize-y"
                          placeholder="Edit your elevator pitch here..."
                        />
                      ) : (
                        <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic">
                          "{replacePlaceholders(activeScript.elevatorPitch)}"
                        </p>
                      )}
                    </div>
                  </Section>

                  {/* Common Questions */}
                  <Section 
                    title="Pertanyaan Umum & Jawaban" 
                    icon={<MessageSquare className="w-5 h-5" />}
                    isOpen={expandedSection === 'common'}
                    onToggle={() => toggleSection('common')}
                  >
                    <div className="space-y-6">
                      {activeScript.commonQuestions.map((q, i) => {
                        const isSalaryQuestion = q.question.toLowerCase().includes('gaji') || q.question.toLowerCase().includes('salary');
                        const displayQuestion = isSalaryQuestion ? "Berapa harapan gaji yang anda inginkan ?" : replacePlaceholders(q.question);
                        
                        return (
                          <div key={i} className="space-y-3">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px]">{i + 1}</span>
                              {displayQuestion}
                            </h4>
                            <div className="rounded-2xl p-5 border bg-slate-50 border-slate-100">
                              {isEditing ? (
                                <textarea
                                  value={replacePlaceholders(q.answer)}
                                  onChange={(e) => {
                                    const newQuestions = [...activeScript.commonQuestions];
                                    newQuestions[i] = { ...newQuestions[i], answer: e.target.value };
                                    updateScriptField('commonQuestions', newQuestions);
                                  }}
                                  className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-sm font-medium leading-relaxed resize-y text-slate-600"
                                  placeholder="Edit answer here..."
                                />
                              ) : (
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-slate-600">
                                  {replacePlaceholders(q.answer)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>

                  {/* Behavioral Questions (STAR) */}
                  <Section 
                    title="Pertanyaan Perilaku (Metode STAR)" 
                    icon={<Star className="w-5 h-5" />}
                    isOpen={expandedSection === 'behavioral'}
                    onToggle={() => toggleSection('behavioral')}
                  >
                    <div className="space-y-8">
                      {activeScript.behavioralQuestions.map((q, i) => (
                        <div key={i} className="space-y-4">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px]">{i + 1}</span>
                            {replacePlaceholders(q.question)}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['situation', 'task', 'action', 'result'].map((starPart) => (
                              <div key={starPart} className={`p-5 rounded-2xl border ${
                                starPart === 'situation' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                starPart === 'task' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                starPart === 'action' ? 'bg-violet-50 text-violet-600 border-violet-100' :
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                              } space-y-2`}>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{starPart}</span>
                                {isEditing ? (
                                  <textarea
                                    value={replacePlaceholders((q.starAnswer as any)[starPart])}
                                    onChange={(e) => {
                                      const newQuestions = [...activeScript.behavioralQuestions];
                                      newQuestions[i] = { 
                                        ...newQuestions[i], 
                                        starAnswer: { ...newQuestions[i].starAnswer, [starPart]: e.target.value } 
                                      };
                                      updateScriptField('behavioralQuestions', newQuestions);
                                    }}
                                    className="w-full min-h-[80px] bg-transparent border-none focus:ring-0 text-slate-800 text-sm font-medium leading-relaxed resize-y p-0"
                                  />
                                ) : (
                                  <p className="text-slate-800 text-sm font-medium leading-relaxed">{replacePlaceholders((q.starAnswer as any)[starPart])}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* Weakness Framing */}
                  <Section 
                    title="Strategi Menjawab Kelemahan" 
                    icon={<AlertCircle className="w-5 h-5" />}
                    isOpen={expandedSection === 'weakness'}
                    onToggle={() => toggleSection('weakness')}
                  >
                    <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Kelemahan Realistis</span>
                        {isEditing ? (
                          <textarea
                            value={replacePlaceholders(activeScript.weaknessFraming.weakness)}
                            onChange={(e) => updateScriptField('weaknessFraming', { ...activeScript.weaknessFraming, weakness: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 font-bold resize-y"
                          />
                        ) : (
                          <p className="text-slate-900 font-bold">{replacePlaceholders(activeScript.weaknessFraming.weakness)}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Framing Positif</span>
                        {isEditing ? (
                          <textarea
                            value={replacePlaceholders(activeScript.weaknessFraming.framing)}
                            onChange={(e) => updateScriptField('weaknessFraming', { ...activeScript.weaknessFraming, framing: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium leading-relaxed resize-y"
                          />
                        ) : (
                          <p className="text-slate-700 font-medium leading-relaxed">{replacePlaceholders(activeScript.weaknessFraming.framing)}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Rencana Perbaikan</span>
                        {isEditing ? (
                          <textarea
                            value={replacePlaceholders(activeScript.weaknessFraming.improvementPlan)}
                            onChange={(e) => updateScriptField('weaknessFraming', { ...activeScript.weaknessFraming, improvementPlan: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium leading-relaxed resize-y"
                          />
                        ) : (
                          <p className="text-slate-700 font-medium leading-relaxed">{replacePlaceholders(activeScript.weaknessFraming.improvementPlan)}</p>
                        )}
                      </div>
                    </div>
                  </Section>

                  {/* Questions for Interviewer */}
                  <Section 
                    title="Pertanyaan Cerdas untuk Pewawancara" 
                    icon={<HelpCircle className="w-5 h-5" />}
                    isOpen={expandedSection === 'interviewer'}
                    onToggle={() => toggleSection('interviewer')}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeScript.questionsForInterviewer.map((q, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                          {isEditing ? (
                            <textarea
                              value={replacePlaceholders(q)}
                              onChange={(e) => {
                                const newQuestions = [...activeScript.questionsForInterviewer];
                                newQuestions[i] = e.target.value;
                                updateScriptField('questionsForInterviewer', newQuestions);
                              }}
                              className="w-full bg-transparent border-none focus:ring-0 text-slate-700 text-sm font-bold leading-snug resize-y"
                            />
                          ) : (
                            <p className="text-slate-700 text-sm font-bold leading-snug">{replacePlaceholders(q)}</p>
                          )}
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
                    Generate "Master Script" satu kali, lalu sesuaikan role dan industri secara instan tanpa batas. Hemat token, tetap personal.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  <span>Mulai Generate Master Script</span>
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
