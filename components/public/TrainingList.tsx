import React, { useState, useEffect } from 'react';
import { SystemTraining } from '../../types';
import { getSystemTrainings } from '../../services/firebase';

const TrainingList: React.FC = () => {
  const [trainings, setTrainings] = useState<SystemTraining[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await getSystemTrainings();
      setTrainings(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
             <span className="font-bold text-slate-900 tracking-tight">FokusKarir Training</span>
          </div>
          <a href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Back to Home</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Upgrade Your Skills</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">Join our expert-led trainings and workshops to accelerate your career growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainings.map(training => (
            <div key={training.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 flex flex-col h-full">
              <div className="h-48 bg-slate-200 relative">
                {training.image ? (
                  <img src={training.image} alt={training.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <i className="bi bi-image text-3xl"></i>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                   <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                     {training.category}
                   </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <i className="bi bi-calendar-event"></i>
                  {new Date(training.date).toLocaleDateString()} • {training.time}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">{training.title}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1">{training.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Price</p>
                    <p className="text-lg font-black text-slate-900">
                      {training.price === 0 ? 'FREE' : `Rp ${training.price.toLocaleString('id-ID')}`}
                    </p>
                  </div>
                  <a 
                    href={`/trainings/${training.id}`}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                  >
                    View Detail
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TrainingList;
