import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, FolderPlus, Settings as SettingsIcon, Loader2 } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);

  // Sync local state with props when database changes
  useEffect(() => {
    setLocalCats(categories);
  }, [categories]);

  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  const updateDB = async (updatedCats: string[], updatedTags: string[]) => {
    setSaving(true);
    try {
      await FirestoreService.saveSettings({
        categories: updatedCats,
        availableTags: updatedTags
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to auto-save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (newCat && !localCats.includes(newCat)) {
      const updated = [...localCats, newCat];
      setLocalCats(updated);
      setNewCat("");
      await updateDB(updated, localTags);
    }
  };

  const removeCategory = async (cat: string) => {
    const updated = localCats.filter(c => c !== cat);
    setLocalCats(updated);
    await updateDB(updated, localTags);
  };

  const addTag = async () => {
    if (newTag && !localTags.includes(newTag)) {
      const formatted = newTag.startsWith('#') ? newTag : `#${newTag}`;
      if (localTags.includes(formatted)) return;
      
      const updated = [...localTags, formatted];
      setLocalTags(updated);
      setNewTag("");
      await updateDB(localCats, updated);
    }
  };

  const removeTag = async (tag: string) => {
    const updated = localTags.filter(t => t !== tag);
    setLocalTags(updated);
    await updateDB(localCats, updated);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-40">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-transparent dark:border-slate-800 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
            <SettingsIcon className="text-blue-600" /> SYSTEM ARCHIVE CONFIG
          </h2>
          {saving && (
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </div>
          )}
        </div>
        
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
                className="flex-grow p-3 bg-white dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button 
                onClick={addCategory}
                disabled={saving}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
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
                className="flex-grow p-3 bg-white dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button 
                onClick={addTag}
                disabled={saving}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
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
      </div>
    </div>
  );
};
