
import React from 'react';
import { AiConfig } from '../../types';

interface AiArchitectureProps {
  aiConfig: AiConfig;
  setAiConfigState: (config: AiConfig) => void;
  handleSaveAiConfig: (e: React.FormEvent) => void;
  isSavingAi: boolean;
  isFetchingModels: boolean;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  modelSearchTerm: string;
  setModelSearchTerm: (term: string) => void;
  filteredOpenRouterModels: any[];
  handleModelSelect: (model: any) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const AiArchitecture: React.FC<AiArchitectureProps> = ({ 
  aiConfig, setAiConfigState, handleSaveAiConfig, isSavingAi, 
  isFetchingModels, isModelDropdownOpen, setIsModelDropdownOpen,
  modelSearchTerm, setModelSearchTerm, filteredOpenRouterModels,
  handleModelSelect, dropdownRef 
}) => {
  return (
    <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-5xl">
       <div className="flex items-center gap-8 mb-10 pb-8 border-b border-slate-50">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-xl">🧠</div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">Pusat Kontrol AI</h3>
            <p className="text-slate-400 font-medium text-sm">Konfigurasi Gateway OpenRouter.</p>
          </div>
       </div>

       <form onSubmit={handleSaveAiConfig} className="space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OpenRouter API Key</label>
               <input 
                type="password" 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-bold text-xs focus:border-indigo-400 transition-all" 
                value={aiConfig.openRouterKey || ''}
                onChange={e => setAiConfigState({...aiConfig, openRouterKey: e.target.value})}
                placeholder="sk-or-v1-..."
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative" ref={dropdownRef}>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Model</label>
                  <div 
                    className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[1.75rem] font-black text-xs cursor-pointer flex justify-between items-center shadow-sm"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  >
                    <span className="truncate">{isFetchingModels ? 'Memuat...' : (aiConfig.modelName || 'Pilih Model AI...')}</span>
                    <i className={`bi bi-chevron-down text-slate-400`}></i>
                  </div>

                  {isModelDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[1000] overflow-hidden max-h-[300px] overflow-y-auto">
                      <div className="p-4 border-b border-slate-50 sticky top-0 bg-white z-10">
                         <input placeholder="Cari model..." className="w-full px-4 py-2 border rounded-xl text-xs font-bold" value={modelSearchTerm || ''} onChange={e => setModelSearchTerm(e.target.value)} />
                      </div>
                      {filteredOpenRouterModels.map(m => (
                        <div key={m.id} onClick={() => handleModelSelect(m)} className="px-6 py-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50">
                           <p className="text-xs font-black text-slate-800">{m.name}</p>
                           <p className="text-[9px] text-slate-400 uppercase">{m.id}</p>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Output Token (Safe Mode)</label>
                  <input 
                    type="number"
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.75rem] outline-none font-black text-sm text-indigo-700 shadow-inner" 
                    value={aiConfig.maxTokens || ''}
                    onChange={e => setAiConfigState({...aiConfig, maxTokens: Math.min(Number(e.target.value) || 0, 8192)})}
                  />
               </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row gap-4">
            <button disabled={isSavingAi} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">
               {isSavingAi ? 'Menyimpan...' : 'Terapkan Konfigurasi AI'}
            </button>
          </div>
       </form>
    </div>
  );
};

export default AiArchitecture;
