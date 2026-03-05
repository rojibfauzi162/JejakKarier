import React, { useState, useEffect } from 'react';
import { SystemTraining } from '../../types';
import { getSystemTrainingById } from '../../services/firebase';

interface TrainingDetailProps {
  id: string;
}

const TrainingDetail: React.FC<TrainingDetailProps> = ({ id }) => {
  const [training, setTraining] = useState<SystemTraining | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await getSystemTrainingById(id);
      setTraining(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!training) return <div className="min-h-screen flex items-center justify-center">Training not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
             <span className="font-bold text-slate-900 tracking-tight">FokusKarir Training</span>
          </div>
          <a href="/trainings" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Back to List</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="h-64 md:h-80 bg-slate-200 relative">
            {training.image ? (
              <img src={training.image} alt={training.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                <i className="bi bi-image text-6xl"></i>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 pt-24">
               <div className="flex gap-3 mb-3">
                 <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                   {training.category}
                 </span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    training.status === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                 }`}>
                   {training.status}
                 </span>
               </div>
               <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{training.title}</h1>
               <p className="text-white/80 font-medium text-lg flex items-center gap-2">
                 <i className="bi bi-person-circle"></i> {training.instructor}
               </p>
            </div>
          </div>

          <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="md:col-span-2 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">About This Training</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{training.description}</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">What You'll Learn</h3>
                  <div className="flex flex-wrap gap-2">
                    {training.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i className="bi bi-calendar-event"></i></div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                        <p className="font-bold text-slate-900">{new Date(training.date).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i className="bi bi-clock"></i></div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Time</p>
                        <p className="font-bold text-slate-900">{training.time} ({training.duration})</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i className="bi bi-geo-alt"></i></div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Location</p>
                        <p className="font-bold text-slate-900 truncate max-w-[150px]" title={training.location}>{training.location}</p>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Price</p>
                      <p className="text-3xl font-black text-slate-900 mb-4">
                        {training.price === 0 ? 'FREE' : `Rp ${training.price.toLocaleString('id-ID')}`}
                      </p>
                      {training.registrationLink ? (
                        <a 
                          href={training.registrationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full py-3 bg-indigo-600 text-white font-bold text-center rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                          Register Now
                        </a>
                      ) : (
                        <button disabled className="block w-full py-3 bg-slate-200 text-slate-400 font-bold text-center rounded-xl cursor-not-allowed">
                          Registration Closed
                        </button>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainingDetail;
