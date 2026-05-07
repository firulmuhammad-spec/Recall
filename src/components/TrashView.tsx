import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCcw, XCircle, Clock, Package } from 'lucide-react';
import { RecallPackage } from '../types';
import { FirestoreService } from '../lib/firestoreService';

export const TrashView: React.FC = () => {
  const [items, setItems] = useState<RecallPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirestoreService.getTrash((data) => {
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe?.();
  }, []);

  const handleRestore = async (id: string) => {
    await FirestoreService.restoreFromTrash(id);
  };

  const handlePermanentDelete = async (id: string) => {
    if (window.confirm('Hapus permanen archive ini? Tindakan ini tidak bisa dibatalkan.')) {
      await FirestoreService.deletePermanently(id);
    }
  };

  const calculateDaysLeft = (deletedAt: any) => {
    if (!deletedAt) return 0;
    const deleteDate = deletedAt.toMillis ? deletedAt.toMillis() : new Date(deletedAt).getTime();
    const expiryDate = deleteDate + (10 * 24 * 60 * 60 * 1000); // 10 days
    const timeLeft = expiryDate - Date.now();
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Trash...</p>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] mx-auto pb-40 lg:pb-12">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-[#f1f5f9] tracking-tighter uppercase leading-none">Recycle Bin</h1>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-1">Item akan dihapus otomatis setelah 10 hari</p>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
            <Trash2 size={40} />
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Tempat sampah kosong</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const daysLeft = calculateDaysLeft(item.deletedAt);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase">
                          {item.kategori}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                          <Clock size={10} />
                          <span className="text-[10px] font-black">{daysLeft} Hari Lagi</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg mb-2 line-clamp-1">{item.judul}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-sm line-clamp-2 mb-6 h-10">{item.deskripsi}</p>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all active:scale-95"
                      >
                        <XCircle size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
