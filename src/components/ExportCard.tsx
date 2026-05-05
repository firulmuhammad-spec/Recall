import React from 'react';
import { RecallPackage } from '../types';

interface ExportCardProps {
  item: RecallPackage;
  exportRef: React.RefObject<HTMLDivElement>;
  mode: 'full' | 'photo_only';
}

export const ExportCard: React.FC<ExportCardProps> = ({ item, exportRef, mode }) => {
  const photos = item.foto || [];
  
  const getGridClass = () => {
    if (photos.length <= 1) return 'grid-cols-1';
    if (photos.length === 2) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <div className="fixed -left-[4000px] top-0">
      <div 
        ref={exportRef}
        className="w-[1000px] bg-white flex flex-col gap-0 shadow-2xl overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {mode === 'full' && (
          /* Header - Slimmer */
          <div className="px-10 py-6 bg-slate-900 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">RECALL</h1>
              <p className="text-blue-400 font-bold tracking-widest text-[10px] uppercase">Digital Archive Record</p>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">ID Ref</div>
              <div className="text-white font-mono font-bold text-sm">#{item.id.slice(0, 12).toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Photos Section - Dominant 50% area */}
        <div className={`bg-gray-100 p-8 ${mode === 'photo_only' ? 'min-h-[600px]' : 'min-h-[500px]'} flex items-center justify-center`}>
          {photos.length > 0 ? (
            <div className={`grid gap-6 w-full ${getGridClass()}`}>
              {photos.slice(0, 4).map((src, idx) => (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-xl bg-white shadow-lg ${
                    photos.length === 1 ? 'h-[600px]' : photos.length === 2 ? 'h-[450px]' : 'h-[350px]'
                  }`}
                >
                  <img 
                    src={src} 
                    alt="" 
                    className="w-full h-full object-contain p-2" // Changed to contain to avoid cropping
                  />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-slate-800 shadow-sm border border-white/20">
                    IMAGE {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-60 w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">
              No Photos Attached
            </div>
          )}
        </div>

        {mode === 'full' && (
          /* Details Section - Compact */
          <div className="p-10 grid grid-cols-12 gap-8 bg-white">
            <div className="col-span-8 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                    {item.kategori}
                  </span>
                  <span className={`px-3 py-1 text-[10px] font-black rounded-md uppercase tracking-wider ${
                    item.status === 'Urgent' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter">
                  {item.judul}
                </h2>
              </div>
              
              <div className="border-l-4 border-blue-100 pl-6 py-2">
                <p className="text-gray-600 leading-relaxed text-xl font-medium">
                  {item.deskripsi}
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold rounded-lg">
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-4 flex flex-col justify-between pl-8 border-l border-gray-100">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Authorized By</label>
                    <p className="font-bold text-slate-800 text-lg">{item.klien || 'System Guest'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Tanggal Pengambilan</label>
                    <p className="font-bold text-slate-800 text-lg">{item.tanggalPengambilan || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Location Context</label>
                    <p className="font-bold text-slate-800 text-lg truncate">{item.lokasi || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                <div>
                   <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">Report Date</div>
                   <div className="text-xs text-slate-500 font-bold">
                    {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-sm italic font-black text-slate-300 flex items-center justify-center text-[10px]">R</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'photo_only' && (
          <div className="bg-slate-900 px-8 py-4 flex justify-between items-center">
            <span className="text-white font-black tracking-tighter text-sm uppercase">RECALL ARCHIVE • {item.judul}</span>
            <span className="text-slate-400 font-mono text-[10px]">#{item.id.slice(0, 8)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
