import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, LayoutGrid, List, Image as ImageIcon, ChevronDown, ChevronUp, X, Check, ArrowUpDown, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Card } from './Card';
import { RecallPackage } from '../types';
import { FirestoreService } from '../lib/firestoreService';

interface DashboardProps {
  items: RecallPackage[];
  categories: string[];
  availableTags: string[];
  onEdit: (pkg: RecallPackage) => void;
  initialViewMode?: ViewMode;
  initialSortBy?: SortOption;
  onStateChange?: (viewMode: ViewMode, sortBy: SortOption) => void;
}

type ViewMode = 'grid' | 'list' | 'gallery';
type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'urgent';

export const Dashboard: React.FC<DashboardProps> = ({ 
  items, 
  categories, 
  availableTags, 
  onEdit,
  initialViewMode = 'grid',
  initialSortBy = 'newest',
  onStateChange
}) => {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Sync state changes back to parent
  useEffect(() => {
    if (onStateChange) {
      onStateChange(viewMode, sortBy);
    }
  }, [viewMode, sortBy]);

  // Update internal state if props change (e.g. on mount from Firestore)
  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
    if (initialSortBy) setSortBy(initialSortBy);
  }, [initialViewMode, initialSortBy]);

  const processedItems = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let result = items.map(item => {
      let effectiveStatus = item.status;
      if (item.status === "Menunggu" && item.bulanTahunTarget) {
        if (currentYearMonth >= item.bulanTahunTarget) {
          effectiveStatus = "Urgent";
        }
      }
      return { ...item, effectiveStatus };
    });

    // Filtering
    result = result.filter(item => {
      const q = search.toLowerCase();
      const matchesSearch = !search || 
        item.judul.toLowerCase().includes(q) || 
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q)) ||
        (item.klien && item.klien.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));
      
      const matchesCat = filterCat === "" || item.kategori === filterCat;
      
      const matchesInclude = includeTags.length === 0 || 
        includeTags.every(tag => item.tags?.includes(tag));
      
      const matchesExclude = excludeTags.length === 0 || 
        !excludeTags.some(tag => item.tags?.includes(tag));

      return matchesSearch && matchesCat && matchesInclude && matchesExclude;
    });

    // Sorting
    result.sort((a, b) => {
      // Rule 1: Pinned items always on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const getTimestamp = (val: any) => {
        if (!val) return Date.now() / 1000; // Assume current time for pending server timestamps
        if (typeof val.toMillis === 'function') return val.toMillis() / 1000;
        if (val.seconds) return val.seconds;
        if (val instanceof Date) return val.getTime() / 1000;
        return 0;
      };

      switch (sortBy) {
        case 'newest':
          return getTimestamp(b.tanggalInput) - getTimestamp(a.tanggalInput);
        case 'oldest':
          return getTimestamp(a.tanggalInput) - getTimestamp(b.tanggalInput);
        case 'az':
          return a.judul.localeCompare(b.judul);
        case 'za':
          return b.judul.localeCompare(a.judul);
        case 'urgent':
          const urgencyScore = (s: string | undefined) => s === 'Urgent' ? 2 : s === 'Menunggu' ? 1 : 0;
          const diff = urgencyScore(b.effectiveStatus) - urgencyScore(a.effectiveStatus);
          if (diff !== 0) return diff;
          return getTimestamp(b.tanggalInput) - getTimestamp(a.tanggalInput);
        default:
          return 0;
      }
    });

    return result;
  }, [items, search, filterCat, includeTags, excludeTags, sortBy]);

  const toggleIncludeTag = (tag: string) => {
    setExcludeTags(prev => prev.filter(t => t !== tag));
    setIncludeTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleExcludeTag = (tag: string) => {
    setIncludeTags(prev => prev.filter(t => t !== tag));
    setExcludeTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleDelete = async (id: string) => {
    await FirestoreService.moveToTrash(id);
  };

  const urgentCount = useMemo(() => 
    processedItems.filter(p => p.effectiveStatus === 'Urgent').length
  , [processedItems]);

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] mx-auto pb-32 lg:pb-12">
      {urgentCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-red-50 border border-red-100 rounded-[20px] flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">Urgent Action Required</p>
              <p className="text-xs text-red-600 font-medium">You have {urgentCount} items that need attention today.</p>
            </div>
          </div>
          <button 
             onClick={() => setSortBy('urgent')}
             className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase transition-all active:scale-95 shadow-lg shadow-red-200"
          >
            Review Now
          </button>
        </motion.div>
      )}

      <header className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#1e293b] dark:text-[#f1f5f9] leading-tight">Your Archive</h1>
            <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1 font-medium">Displaying {processedItems.length}/{items.length} active packages</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* View Mode Switcher */}
            <div className="flex bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-1 rounded-xl shadow-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-700'}`}
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-700'}`}
              >
                <ImageIcon size={18} />
              </button>
            </div>

            <div className="relative min-w-[200px] lg:min-w-[300px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] dark:text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 rounded-xl text-sm text-[#1e293b] dark:text-slate-200 placeholder-[#64748b] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isAdvancedOpen || includeTags.length > 0 || excludeTags.length > 0
                ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-lg shadow-blue-600/20' 
                : 'bg-white dark:bg-slate-800 border-[#cbd5e1] dark:border-slate-700 text-[#475569] dark:text-slate-300 hover:bg-[#f8fafc] dark:hover:bg-slate-700'
              }`}
            >
              <Filter size={16} />
              Advanced
              {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Sort Dropdown */}
            <div className="relative group">
              <select 
                className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 rounded-xl text-sm font-semibold text-[#475569] dark:text-slate-300 appearance-none cursor-pointer outline-none focus:border-[#2563eb] shadow-sm w-full md:w-auto"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">Alphabetical (A-Z)</option>
                <option value="za">Alphabetical (Z-A)</option>
                <option value="urgent">Urgency Status</option>
              </select>
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[24px] p-6 lg:p-8 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Category Filter */}
                <div>
                  <h4 className="text-sm font-bold text-[#1e293b] dark:text-slate-200 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Category
                  </h4>
                  <select 
                    className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded-lg text-sm font-medium text-[#475569] dark:text-slate-300 appearance-none cursor-pointer outline-none focus:border-[#2563eb]"
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Tag Selection */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-bold text-[#1e293b] dark:text-slate-200 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Tag Explorer (Include/Exclude)
                    </span>
                    <button 
                      onClick={() => { setIncludeTags([]); setExcludeTags([]); }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-extrabold uppercase tracking-widest"
                    >
                      Reset Tags
                    </button>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isIncluded = includeTags.includes(tag);
                      const isExcluded = excludeTags.includes(tag);
                      return (
                        <div key={tag} className="flex overflow-hidden rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 group shadow-sm transition-all hover:shadow-md">
                          <button 
                            onClick={() => toggleIncludeTag(tag)}
                            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isIncluded ? 'bg-green-500 text-white border-green-500' : 'text-[#475569] dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {isIncluded && <Check size={12} strokeWidth={3} />}
                            {tag}
                          </button>
                          <button 
                            onClick={() => toggleExcludeTag(tag)}
                            className={`border-l border-[#e2e8f0] dark:border-slate-700 px-2 py-1.5 transition-all ${
                              isExcluded ? 'bg-red-500 text-white border-red-500' : 'text-[#94a3b8] dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                            }`}
                            title="Exclude this tag"
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#94a3b8] dark:text-slate-500 mt-3 font-medium">Click tag to <span className="text-green-600 dark:text-green-400 font-bold">INCLUDE</span>, click X to <span className="text-red-600 dark:text-red-400 font-bold">EXCLUDE</span>.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      {processedItems.length > 0 ? (
        <div className={`
          ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8' : ''}
          ${viewMode === 'list' ? 'flex flex-col gap-4' : ''}
          ${viewMode === 'gallery' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : ''}
        `}>
          <AnimatePresence mode="popLayout">
            {processedItems.map(item => (
              <Card 
                key={item.id} 
                item={item} 
                onDelete={handleDelete} 
                onEdit={() => onEdit(item)}
                viewMode={viewMode}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-slate-800/50 rounded-[32px] border border-dashed border-[#e2e8f0] dark:border-slate-700">
          <div className="bg-[#f1f5f9] dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutGrid className="text-[#94a3b8] dark:text-slate-500" size={40} />
          </div>
          <h3 className="text-[#1e293b] dark:text-[#f1f5f9] font-bold text-xl">No active packages</h3>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-2 max-w-xs mx-auto">Start building your knowledge base by adding your first important record.</p>
        </div>
      )}
    </div>
  );
};
