import React, { useState, useEffect } from 'react';
import { SystemTraining } from '../../types';
import { getSystemTrainings, saveSystemTraining, deleteSystemTraining, uploadImage, uploadImageSimple } from '../../services/firebase';

interface TrainingManagementProps {
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const TrainingManagement: React.FC<TrainingManagementProps> = ({ onToast }) => {
  const [trainings, setTrainings] = useState<SystemTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<SystemTraining | null>(null);
  const [formData, setFormData] = useState<Partial<SystemTraining>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    const data = await getSystemTrainings();
    setTrainings(data);
    setLoading(false);
  };

  const handleEdit = (training: SystemTraining) => {
    setEditingTraining(training);
    setFormData(training);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTraining(null);
    setFormData({
      id: Math.random().toString(36).substr(2, 9),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      tags: []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this training?')) {
      try {
        await deleteSystemTraining(id);
        onToast('Training deleted successfully', 'success');
        fetchTrainings();
      } catch (error) {
        onToast('Failed to delete training', 'error');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.date) {
        onToast('Title and Date are required', 'error');
        return;
      }

      if (uploading) {
        onToast('Please wait for image upload to complete', 'error');
        return;
      }
      
      // Ensure ID exists
      const id = formData.id || Math.random().toString(36).substr(2, 9);
      
      const trainingToSave: SystemTraining = {
        ...formData as SystemTraining,
        id,
        price: Number(formData.price) || 0,
        tags: formData.tags || [],
        updatedAt: new Date().toISOString()
      };
      
      await saveSystemTraining(trainingToSave);
      onToast('Training saved successfully', 'success');
      setIsModalOpen(false);
      fetchTrainings();
    } catch (error) {
      console.error("Save error:", error);
      onToast(`Failed to save training: ${(error as Error).message}`, 'error');
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setStatusText('Compressing image...');

    try {
        let blobToUpload: Blob = file;
        try {
            // Add timeout for compression (5 seconds)
            const compressionPromise = compressImage(file);
            const timeoutPromise = new Promise<Blob>((_, reject) => 
                setTimeout(() => reject(new Error("Compression timed out")), 5000)
            );
            
            blobToUpload = await Promise.race([compressionPromise, timeoutPromise]);
        } catch (compressError) {
            console.warn('Compression failed or timed out, uploading original file', compressError);
            // Fallback to original file
            blobToUpload = file;
        }

        setStatusText('Starting upload...');
        const path = `trainings/${Date.now()}_${file.name}`;
        
        let url = '';
        try {
            // Try 1: Resumable Upload
            url = await uploadImage(blobToUpload, path, (progress) => {
                setUploadProgress(progress);
                setStatusText(`Uploading... ${Math.round(progress)}%`);
            });
        } catch (uploadError) {
            console.warn('Resumable upload failed, trying simple upload...', uploadError);
            setStatusText('Retrying with simple upload (please wait)...');
            
            try {
                // Try 2: Simple Upload
                await new Promise(resolve => setTimeout(resolve, 1000));
                url = await uploadImageSimple(blobToUpload, path);
            } catch (simpleError) {
                console.warn('Simple upload failed, falling back to Base64...', simpleError);
                setStatusText('Upload failed. Using offline mode (Base64)...');
                
                // Try 3: Base64 Fallback
                try {
                    // Check size limit for Firestore (approx 1MB)
                    if (blobToUpload.size > 800000) {
                         // If too big, try to compress again very aggressively or fail
                         throw new Error("Image too large for offline mode. Please use a smaller image (< 800KB).");
                    }
                    
                    url = await blobToBase64(blobToUpload);
                    onToast('Network upload failed. Saved as offline image (Base64).', 'success');
                } catch (base64Error) {
                    throw new Error("All upload methods failed. Please check your connection or use a smaller image.");
                }
            }
        }
        
        setFormData({ ...formData, image: url });
        if (!url.startsWith('data:')) {
            onToast('Image uploaded successfully', 'success');
        }
    } catch (error) {
        console.error('Upload error:', error);
        onToast(`Failed to upload image: ${(error as Error).message}`, 'error');
    } finally {
        setUploading(false);
        setUploadProgress(0);
        setStatusText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Training Management</h3>
        <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <i className="bi bi-plus-lg mr-2"></i>Add Training
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map(training => (
            <div key={training.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  training.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                  training.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {training.status.toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(training)} className="text-slate-400 hover:text-indigo-600">
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button onClick={() => handleDelete(training.id)} className="text-slate-400 hover:text-rose-600">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-2">{training.title}</h4>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{training.description}</p>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <i className="bi bi-calendar"></i>
                  {new Date(training.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-clock"></i>
                  {training.time} ({training.duration})
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-person"></i>
                  {training.instructor}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-6">{editingTraining ? 'Edit Training' : 'Add New Training'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.title || ''}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border rounded-lg h-24"
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instructor</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.instructor || ''}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.category || ''}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.date || ''}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input 
                  type="time" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.time || ''}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. 2 Hours"
                  value={formData.duration || ''}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.price || 0}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Location / Link</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.location || ''}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Registration Link</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  value={formData.registrationLink || ''}
                  onChange={e => setFormData({...formData, registrationLink: e.target.value})}
                />
              </div>
               <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Training Image</label>
                <div className="flex items-center gap-4 mb-2">
                    {formData.image && (
                        <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                    )}
                    <div className="flex-1">
                        <input 
                            type="file" 
                            accept="image/*"
                            className="w-full p-2 border rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                        {uploading && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <p className="text-xs text-indigo-600 mt-1">{statusText}</p>
                            </div>
                        )}
                    </div>
                </div>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg text-xs text-slate-500"
                  placeholder="Or enter image URL manually"
                  value={formData.image || ''}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={formData.status || 'upcoming'}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Training</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;
