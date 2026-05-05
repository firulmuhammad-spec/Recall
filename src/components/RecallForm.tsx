import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Plus, Info, AlertTriangle, CheckCircle2, ChevronRight, MapPin, Calendar, Users } from 'lucide-react';
import { compressImage, calculateDocSize } from '../utils/imageUtils';
import { FirestoreService } from '../lib/firestoreService';
import { Status, RecallPackage } from '../types';

interface RecallFormProps {
  categories: string[];
  availableTags: string[];
  clientSuggestions?: string[];
  editingData?: RecallPackage | null;
  onSuccess: () => void;
}

export const RecallForm: React.FC<RecallFormProps> = ({ categories, availableTags, clientSuggestions = [], editingData, onSuccess }) => {
  const [formData, setFormData] = useState({
    judul: "", 
    deskripsi: "", 
    kategori: "", 
    klien: "", 
    status: "Arsip" as Status, 
    tanggalPengambilan: "", 
    lokasi: "", 
    bulanTahunTarget: "", 
    tags: [] as string[]
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (editingData) {
      setFormData({
        judul: editingData.judul || "",
        deskripsi: editingData.deskripsi || "",
        kategori: editingData.kategori || "",
        klien: editingData.klien || "",
        status: editingData.status || "Arsip",
        tanggalPengambilan: editingData.tanggalPengambilan || "",
        lokasi: editingData.lokasi || "",
        bulanTahunTarget: editingData.bulanTahunTarget || "",
        tags: editingData.tags || []
      });
      setImages(editingData.foto || []);
    }
  }, [editingData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    
    setLoading(true);
    try {
      const compressed = await Promise.all((files as File[]).map(f => compressImage(f, 1024, 0.6)));
      setImages(prev => [...prev, ...compressed]);
    } catch (err) {
      setError("Failed to process images.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul) {
      setError("Judul Package is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      foto: images,
    };

    // Firestore 1MB Validation
    const size = calculateDocSize(payload);
    if (size > 1000000) {
       setError(`Package too large (${(size/1024/1024).toFixed(2)} MB). Please remove some photos.`);
       setLoading(false);
       return;
    }

    try {
      if (editingData) {
        await FirestoreService.updatePackage(editingData.id, payload);
      } else {
        await FirestoreService.addPackage(payload);
      }
      onSuccess();
    } catch (err) {
      setError("Failed to save. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50 relative group">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <p className="text-gray-600 font-medium">Click or Drag photos to upload first</p>
                <p className="text-xs text-gray-400">Max 1MB total compressed size</p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              <AnimatePresence>
                {images.map((img, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <img src={img} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Package *</label>
                <input 
                  required 
                  type="text"
                  placeholder="e.g., Laporan Vibrasi Pompa A" 
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.judul}
                  onChange={e => setFormData({...formData, judul: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Detail</label>
                <textarea 
                  placeholder="Ceritakan detail tentang data ini (opsional)..." 
                  className="w-full p-3 bg-gray-50 border-none rounded-xl h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.deskripsi}
                  onChange={e => setFormData({...formData, deskripsi: e.target.value})}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                <select 
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  value={formData.kategori}
                  onChange={e => setFormData({...formData, kategori: e.target.value})}
                >
                  <option value="">Select Category (Opsional)</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Klien / Pihak Terkait</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    placeholder="Nama Klien (Opsional)" 
                    list="client-list"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.klien}
                    onChange={e => setFormData({...formData, klien: e.target.value})}
                  />
                  <datalist id="client-list">
                    {clientSuggestions.map(client => (
                      <option key={client} value={client} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    placeholder="Lokasi pengambilan data (Opsional)" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.lokasi}
                    onChange={e => setFormData({...formData, lokasi: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Pengambilan</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.tanggalPengambilan}
                    onChange={e => setFormData({...formData, tanggalPengambilan: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status Package</label>
                <select 
                  className={`w-full p-3 border-none rounded-xl focus:ring-2 outline-none font-bold ${
                    formData.status === 'Urgent' ? 'bg-red-50 text-red-600 focus:ring-red-500' : 
                    formData.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 focus:ring-amber-500' : 
                    'bg-gray-50 text-gray-600 focus:ring-blue-500'
                  }`}
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as Status})}
                >
                  <option value="Arsip">Arsip (History Only)</option>
                  <option value="Menunggu">Menunggu (Reminder Active)</option>
                  <option value="Urgent">Urgent (Immediate Attention)</option>
                </select>
              </div>

              {formData.status === "Menunggu" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 text-amber-600">Reminder Deadline (YYYY-MM) *</label>
                  <input 
                    type="month" 
                    required
                    className="w-full p-3 bg-amber-50 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-amber-900"
                    value={formData.bulanTahunTarget}
                    onChange={e => setFormData({...formData, bulanTahunTarget: e.target.value})}
                  />
                  <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                    <Info size={10} /> App will alert you when this month arrives.
                  </p>
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      formData.tags.includes(tag) 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-3xl font-black tracking-tight mb-2">
            {editingData ? 'EDIT PACKAGE' : 'RECALL NEW PACKAGE'}
          </h2>
          <p className="text-blue-100 text-sm opacity-80">
            {editingData ? 'Update your archived data and context.' : 'Store your important data with visual context into the smart archive.'}
          </p>
          
          {/* Progress Dots */}
          <div className="flex gap-2 mt-6">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentStep === step ? 'w-8 bg-white' : 'w-2 bg-white/30'
                }`} 
              />
            ))}
          </div>
        </div>

        <form 
          onSubmit={handleSubmit} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (currentStep < 4) {
                e.preventDefault();
                setCurrentStep(prev => prev + 1);
              }
              // If currentStep is 4, let it submit naturally via Enter
            }
          }}
          className="p-8"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium"
            >
              <AlertTriangle size={20} />
              {error}
            </motion.div>
          )}

          <div className="min-h-[280px]">
            {renderStep()}
          </div>

          <div className="mt-12 flex justify-between items-center">
            {currentStep > 1 ? (
              <button 
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="text-gray-400 hover:text-gray-600 font-bold px-4 transition-colors"
              >
                Back
              </button>
            ) : <div></div>}

            <div className="flex gap-4">
              {currentStep < 4 ? (
                <button 
                  type="button"
                  key="btn-continue"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentStep(prev => prev + 1);
                  }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Continue <ChevronRight size={20} />
                </button>
              ) : (
                <button 
                  type="submit"
                  key="btn-submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:bg-gray-300 disabled:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">Memproses Archive...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {editingData ? 'Update Archive' : 'Finalize Archive'} <CheckCircle2 size={20} />
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
