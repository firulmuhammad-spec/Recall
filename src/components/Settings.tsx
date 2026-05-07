import React, { useState } from 'react';
import { Plus, X, Save, Tag, FolderPlus, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FirestoreService } from '../lib/firestoreService';

interface SettingsProps {
  categories: string[];
  tags: string[];
  onUpdate: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ categories, tags, onUpdate }) => {
  const [newCat, setNewCat] = useState("");
  const [newTag, setNewTag] = useState("");
  const [localCats, setLocalCats] = useState(categories);
  const [localTags, setLocalTags] = useState(tags);
  const [loading, setLoading] = useState(false);

  const addCategory = () => {
    if (newCat && !localCats.includes(newCat)) {
      setLocalCats([...localCats, newCat]);
      setNewCat("");
    }
  };

  const removeCategory = (cat: string) => {
    setLocalCats(localCats.filter(c => c !== cat));
  };

  const addTag = () => {
    if (newTag && !localTags.includes(newTag)) {
      const formatted = newTag.startsWith('#') ? newTag : `#${newTag}`;
      setLocalTags([...localTags, formatted]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setLocalTags(localTags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await FirestoreService.saveSettings({
        categories: localCats,
        availableTags: localTags
      });
      onUpdate();
      alert("Settings saved!");
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-40">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-transparent dark:border-slate-800 p-8">
        <h2 className="text-2xl font-black mb-8 dark:text-white flex items-center gap-3">
          <SettingsIcon className="text-blue-600" /> SYSTEM ARCHIVE CONFIG
        </h2>
        
        <div className="space-y-12">
          {/* Categories */}
          <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <FolderPlus size={16} /> Data Categories
            </h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="New Category Name"
                className="flex-grow p-3 bg-white dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button 
                onClick={addCategory}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {localCats.map(cat => (
                  <motion.span 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={cat} 
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border border-blue-100 dark:border-blue-900/50"
                  >
                    {cat}
                    <button onClick={() => removeCategory(cat)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Tags */}
          <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Tag size={16} /> Archive Tags
            </h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="New Tag Name"
                className="flex-grow p-3 bg-white dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button 
                onClick={addTag}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {localTags.map(tag => (
                  <motion.span 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={tag} 
                    className="bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border border-slate-200 dark:border-slate-600"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full mt-12 bg-blue-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-slate-300 dark:disabled:bg-slate-800 shadow-xl shadow-blue-600/20"
        >
          <Save size={20} /> {loading ? "UPDATING SYSTEM..." : "SAVE GLOBAL CONFIG"}
        </button>
      </div>
    </div>
  );
};
