import React from 'react';
import { RecallPackage } from '../types';

interface ExportCardProps {
  item: RecallPackage;
  exportRef: React.RefObject<HTMLDivElement>;
}

export const ExportCard: React.FC<ExportCardProps> = ({ item, exportRef }) => {
  const photos = item.foto || [];
  
  const getGridClass = () => {
    if (photos.length <= 1) return 'grid-cols-1';
    if (photos.length === 2) return 'grid-cols-2';
    if (photos.length === 3) return 'grid-cols-2'; // Will use custom spans
    return 'grid-cols-2';
  };

  return (
    <div className="fixed -left-[2000px] top-0">
      <div 
        ref={exportRef}
        className="w-[800px] bg-white p-12 flex flex-col gap-8 shadow-2xl border border-gray-100"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-1">RECALL</h1>
            <p className="text-blue-600 font-bold tracking-widest text-sm uppercase">Digital Archive Record</p>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 italic">Reference ID</div>
            <div className="text-gray-900 font-mono font-bold">#{item.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-12 gap-10">
          {/* Photos Section */}
          <div className="col-span-12 flex flex-col gap-4">
            {photos.length > 0 ? (
              <div className={`grid gap-4 ${getGridClass()}`}>
                {photos.length === 3 ? (
                  <>
                    <div className="col-span-2 h-[400px] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                      <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="col-span-1 h-[250px] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                      <img src={photos[1]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="col-span-1 h-[250px] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                      <img src={photos[2]} alt="" className="w-full h-full object-cover" />
                    </div>
                  </>
                ) : (
                  photos.slice(0, 4).map((src, idx) => (
                    <div 
                      key={idx} 
                      className={`overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 ${
                        photos.length === 1 ? 'h-[500px]' : 'h-[300px]'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">
                No Photos Attached
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="col-span-12 grid grid-cols-3 gap-8">
            <div className="col-span-2 flex flex-col gap-6">
              <div>
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg uppercase tracking-wider mb-3">
                  {item.kategori}
                </span>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                  {item.judul}
                </h2>
              </div>
              
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <p className="text-gray-700 leading-relaxed text-lg italic underline decoration-blue-200 decoration-2 underline-offset-4">
                  "{item.deskripsi}"
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-1 flex flex-col gap-6 pl-8 border-l border-gray-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                  <p className={`font-bold text-sm ${item.status === 'Urgent' ? 'text-red-600' : 'text-green-600'}`}>
                    {item.status}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authorized User</label>
                  <p className="font-bold text-gray-900">{item.klien || 'General User'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Date</label>
                  <p className="font-bold text-gray-900">{item.bulanTahunTarget || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location / Context</label>
                  <p className="font-bold text-gray-900 truncate">{item.lokasi || '-'}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">R</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">System Generated Report</div>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
