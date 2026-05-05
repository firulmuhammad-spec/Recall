import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, User, Trash2, AlertCircle, Pencil, X, Maximize2, ChevronLeft, ChevronRight, Share2, Download, Loader2 } from 'lucide-react';
import { RecallPackage } from '../types';
import { ExportCard } from './ExportCard';
import { toPng } from 'html-to-image';

interface CardProps {
  item: RecallPackage & { effectiveStatus?: string };
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
  viewMode?: 'grid' | 'list' | 'gallery';
}

export const Card: React.FC<CardProps> = ({ item, onDelete, onEdit, viewMode = 'grid' }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<'full' | 'photo_only'>('full');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = React.useRef<HTMLDivElement>(null);
  const isUrgent = item.effectiveStatus === 'Urgent';

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % item.foto.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + item.foto.length) % item.foto.length);
  };

  const handleExportAction = async (action: 'download' | 'share', mode: 'full' | 'photo_only') => {
    setExportMode(mode);
    setIsExporting(true);
    
    // Small delay to ensure the hidden ExportCard has updated its props/mode before capture
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!exportRef.current) {
      setIsExporting(false);
      return;
    }
    
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });
      
      if (action === 'download') {
        const link = document.createElement('a');
        link.download = `RECALL-${mode === 'full' ? 'DETAILS' : 'PHOTOS'}-${item.judul.replace(/\s+/g, '-').toUpperCase()}.png`;
        link.href = dataUrl;
        link.click();
      } else if (action === 'share') {
        // Convert dataUrl to blob for sharing
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `recall-${item.id.slice(0, 8)}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `RECALL: ${item.judul}`,
            text: `Archive Record: ${item.judul}\n${item.deskripsi}`,
          });
        } else {
          // Fallback to download if sharing not supported
          const link = document.createElement('a');
          link.download = `RECALL-SHARE-${item.id.slice(0, 8)}.png`;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } catch (err) {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  if (viewMode === 'gallery') {
    return (
      <>
        <motion.div
           layout
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.9 }}
           className="relative aspect-square rounded-[16px] overflow-hidden cursor-pointer group bg-[#f1f5f9] border border-[#e2e8f0]"
           onClick={() => setIsPreviewOpen(true)}
        >
          {item.foto && item.foto.length > 0 ? (
            <img src={item.foto[0]} alt={item.judul} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
               <Calendar size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
             <p className="text-white text-xs font-bold truncate">{item.judul}</p>
             <p className="text-white/70 text-[10px] truncate">{item.kategori}</p>
          </div>
          {isUrgent && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          )}
        </motion.div>
        {/* Fullscreen Preview Modal */}
        <AnimatePresence>
          {isPreviewOpen && item.foto.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12"
              onClick={() => setIsPreviewOpen(false)}
            >
              <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-20" onClick={() => setIsPreviewOpen(false)}>
                <X size={32} />
              </button>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-5xl w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                <img src={item.foto[currentImgIndex]} alt={item.judul} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                {item.foto.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md">
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full mb-4">
                      {currentImgIndex + 1} / {item.foto.length}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`bg-white border p-3 rounded-xl flex items-center gap-4 group hover:shadow-md transition-all relative ${
          isUrgent ? 'border-l-4 border-l-red-500' : 'border-[#e2e8f0]'
        }`}
      >
        <AnimatePresence>
          {showConfirm && (
            <motion.div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex items-center justify-center p-2 rounded-xl">
              <p className="text-xs font-bold mr-4">Delete?</p>
              <div className="flex gap-2">
                <button onClick={confirmDelete} className="bg-red-500 text-white px-3 py-1 rounded text-[10px] font-bold">Yes</button>
                <button onClick={cancelDelete} className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-[10px] font-bold">No</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-12 h-12 rounded-lg bg-[#f1f5f9] flex-shrink-0 overflow-hidden cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
           {item.foto && item.foto.length > 0 ? (
             <img src={item.foto[0]} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center"><Calendar size={18} className="text-slate-300" /></div>
           )}
        </div>
        <div className="flex-grow min-w-0">
           <h3 className="font-bold text-[#1e293b] truncate text-sm">{item.judul}</h3>
           <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#64748b]">
              <span className="font-bold text-blue-600 uppercase">{item.kategori}</span>
              {item.klien && (
                <span className="flex items-center gap-1">
                  <User size={10} /> {item.klien}
                </span>
              )}
           </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="relative">
             <button 
               onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
               disabled={isExporting}
               className={`p-2 rounded-lg transition-colors ${showExportMenu ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}
               title="Export Options"
             >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
             </button>
             
             <AnimatePresence>
               {showExportMenu && (
                 <motion.div 
                   initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                   className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-30"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Download</div>
                   <button onClick={() => { handleExportAction('download', 'full'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                     <Download size={14} /> Full Record
                   </button>
                   <button onClick={() => { handleExportAction('download', 'photo_only'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                     <Download size={14} /> Photos Only
                   </button>
                   <div className="h-px bg-slate-100 my-1" />
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Share</div>
                   <button onClick={() => { handleExportAction('share', 'full'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                     <Share2 size={14} /> Details Share
                   </button>
                   <button onClick={() => { handleExportAction('share', 'photo_only'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                     <Share2 size={14} /> Photos Layout
                   </button>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
              <Pencil size={14} />
           </button>
           <button onClick={handleDeleteClick} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
           </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-[16px] border border-[#e2e8f0] flex flex-col overflow-hidden transition-all duration-300 relative group hover:shadow-xl hover:shadow-blue-900/5 ${
          isUrgent ? 'border-2 border-[#ef4444] shadow-[0_4px_20px_rgba(239,68,68,0.1)]' : ''
        } ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
      >
        <AnimatePresence>
          {showConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center"
            >
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-sm font-bold text-gray-900 mb-4">Delete this package?</p>
              <div className="flex gap-2 w-full max-w-[200px]">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  No
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isUrgent && (
          <div className="absolute top-3 right-3 bg-[#ef4444] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest z-10 shadow-sm">
            Urgent • Pinned
          </div>
        )}

        <div 
          className="h-40 bg-[#f1f5f9] relative overflow-hidden flex items-center justify-center cursor-zoom-in group/img"
          onClick={() => setIsPreviewOpen(true)}
        >
          {item.foto && item.foto.length > 0 ? (
            <img 
              src={item.foto[currentImgIndex]} 
              alt={item.judul} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" 
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              item.kategori === 'Pekerjaan' ? 'bg-gradient-to-br from-blue-100 to-indigo-100' :
              item.kategori === 'Health' ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
              'bg-gradient-to-br from-slate-100 to-slate-200'
            }`}>
               <Calendar className={isUrgent ? 'text-red-300' : 'text-slate-300'} size={48} strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
            <Maximize2 className="text-white drop-shadow-lg" size={24} />
          </div>
        </div>

        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <span className={`badge text-[11px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${
              item.kategori === 'Pekerjaan' ? 'bg-[#e0e7ff] text-[#4338ca]' : 'bg-[#f1f5f9] text-[#475569]'
            }`}>
              {item.kategori}
            </span>
            {item.bulanTahunTarget && (
              <span className="text-[12px] text-[#94a3b8] font-medium">
                Target: {item.bulanTahunTarget}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-[#1e293b] leading-snug group-hover:text-blue-600 transition-colors">
            {item.judul}
          </h3>
          
          <p className="text-[13px] text-[#64748b] leading-relaxed mt-2 line-clamp-2">
            {item.deskripsi}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {item.tags && item.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-sm bg-[#f8fafc] border border-[#e2e8f0] font-medium text-[#64748b]">
                {tag}
              </span>
            ))}
            {item.tags && item.tags.length > 2 && (
              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#f8fafc] border border-[#e2e8f0] font-medium text-[#64748b]">
                +{item.tags.length - 2}
              </span>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center text-[11px] font-medium text-gray-400">
            <div className="flex items-center gap-1.5">
              <User size={12} />
              <span className="max-w-[100px] truncate">{item.klien || 'General'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                  disabled={isExporting}
                  className={`transition-colors disabled:opacity-50 ${showExportMenu ? 'text-blue-500' : 'text-gray-300 hover:text-blue-500'}`}
                  title="Export Options"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2.5 z-40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Select Export Mode</div>
                      
                      <div className="space-y-1">
                        <button onClick={() => { handleExportAction('download', 'full'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-xl flex items-center justify-between group">
                          <span className="flex items-center gap-2"><Download size={14} className="text-slate-400 group-hover:text-blue-500" /> Full Info PNG</span>
                          <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">HQ</span>
                        </button>
                        <button onClick={() => { handleExportAction('download', 'photo_only'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 group">
                          <Download size={14} className="text-slate-400 group-hover:text-blue-500" /> Photos Grid
                        </button>
                      </div>

                      <div className="h-px bg-slate-100 my-2" />
                      
                      <div className="space-y-1">
                        <button onClick={() => { handleExportAction('share', 'full'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 group">
                          <Share2 size={14} className="text-slate-400 group-hover:text-blue-500" /> Share Data
                        </button>
                        <button onClick={() => { handleExportAction('share', 'photo_only'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 group">
                          <Share2 size={14} className="text-slate-400 group-hover:text-blue-500" /> Share Images
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-gray-300 hover:text-blue-500 transition-colors"
                title="Edit Package"
              >
                <Pencil size={14} />
              </button>
              <button 
                onClick={handleDeleteClick}
                className="text-gray-300 hover:text-red-500 transition-colors"
                title="Delete Package"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hidden component for export rendering */}
      <ExportCard item={item} exportRef={exportRef} mode={exportMode} />

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && item.foto.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12"
            onClick={() => setIsPreviewOpen(false)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-20"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X size={32} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={item.foto[currentImgIndex]} 
                alt={item.judul} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              />

              {item.foto.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full mb-4">
                    {currentImgIndex + 1} / {item.foto.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
