import React from 'react';
import { motion } from 'motion/react';
import { Package } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white overflow-hidden">
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center shadow-2xl shadow-blue-500/40 z-10"
        >
          <Package className="text-white" size={64} strokeWidth={1.5} />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="mt-10 text-center"
        >
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">RECALL</h1>
          <div className="flex gap-1 justify-center">
             {[0, 1, 2].map((i) => (
               <motion.div 
                 key={i}
                 animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                 transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                 className="w-1.5 h-1.5 bg-blue-600 rounded-full"
               />
             ))}
          </div>
        </motion.div>

        {/* Background Decorative Rings */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.05, scale: 2 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 border-4 border-blue-600 rounded-full"
        />
      </div>
    </div>
  );
};
