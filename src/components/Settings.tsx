import React, { useState } from 'react';
import { Plus, X, Save, Tag, FolderPlus } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-[32px] shadow-sm p-8">
        <h2 className="text-2xl font-black mb-8">APP SETTINGS</h2>
        
        <div className="space-y-12">
          {/* Categories */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FolderPlus size={16} /> Categories
            </h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="New Category Name"
                className="flex-grow p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button 
                onClick={addCategory}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localCats.map(cat => (
                <span key={cat} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="hover:text-blue-900"><X size={14} /></button>
                </span>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Tag size={16} /> Tags
            </h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="New Tag Name"
                className="flex-grow p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button 
                onClick={addTag}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localTags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-gray-900"><X size={14} /></button>
                </span>
              ))}
            </div>
          </section>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full mt-12 bg-gray-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all disabled:bg-gray-400"
        >
          <Save size={20} /> {loading ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
};
