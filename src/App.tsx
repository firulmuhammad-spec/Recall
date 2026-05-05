import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, Plus, LayoutGrid, Settings as SettingsIcon, LogOut, Package } from 'lucide-react';
import { auth, signInWithGoogle } from './lib/firebase';
import { FirestoreService } from './lib/firestoreService';
import { RecallPackage, AppSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { RecallForm } from './components/RecallForm';
import { Settings } from './components/Settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [packages, setPackages] = useState<RecallPackage[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'settings',
    categories: ["Pekerjaan", "Rumah", "Finance", "Kesehatan", "Lainnya"],
    availableTags: ["#vibrasi", "#pengujian", "#riwayatkesehatan", "#dokumen", "#penting"]
  });
  const [view, setView] = useState<'dashboard' | 'add' | 'settings'>('dashboard');
  const [editingPackage, setEditingPackage] = useState<RecallPackage | null>(null);

  const clientSuggestions = useMemo(() => {
    const clients = packages.map(p => p.klien).filter((k): k is string => !!k);
    return Array.from(new Set(clients)).sort();
  }, [packages]);

  const handleEdit = (pkg: RecallPackage) => {
    setEditingPackage(pkg);
    setView('add');
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    setView('add');
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setPackages([]);
      return;
    }

    const unsubscribePackages = FirestoreService.getPackages((data) => {
      setPackages(data);
    });

    const fetchSettings = async () => {
      const data = await FirestoreService.getSettings();
      if (data) setSettings(data);
    };

    fetchSettings();

    return () => {
      if (unsubscribePackages) unsubscribePackages();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">Initializing archive...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/30">
            <Package className="text-white" size={48} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">RECALL</h1>
          <p className="text-gray-500 mb-12 text-lg">Your intelligent personal knowledge base and smart archive for essential data.</p>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-gray-900 text-white p-5 rounded-3xl font-bold flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl active:scale-95 disabled:bg-gray-400 disabled:shadow-none"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogIn size={20} />
            )}
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
          
          <p className="mt-8 text-xs text-gray-400">Securely stored on Cloud Firestore</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-[#1e293b] overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[280px] bg-white border-r border-[#e2e8f0] p-6 flex-col gap-6 shrink-0">
        <div className="text-[24px] font-black tracking-tighter text-[#2563eb] mb-2 leading-none cursor-pointer" onClick={() => setView('dashboard')}>
          RECALL
        </div>
        
        <button 
          onClick={handleAddNew}
          className={`bg-[#2563eb] text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 ${view === 'add' && !editingPackage ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        >
          <Plus size={18} strokeWidth={2.5} /> New Package
        </button>

        <nav className="flex flex-col gap-1 mt-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
              view === 'dashboard' ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b] hover:bg-gray-50'
            }`}
          >
            <LayoutGrid size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
              view === 'settings' ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b] hover:bg-gray-50'
            }`}
          >
            <SettingsIcon size={18} /> Settings
          </button>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 p-3 rounded-lg font-medium text-sm text-[#64748b] hover:bg-red-50 hover:text-red-500 transition-all mt-4"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <div className="mt-auto border-t border-gray-100 pt-6">
          <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-4 block">Categories</span>
          <div className="flex flex-col gap-3">
            {settings.categories.slice(0, 5).map(cat => (
              <label key={cat} className="flex items-center gap-2.5 text-sm font-medium text-[#475569] cursor-pointer group">
                <input type="checkbox" checked className="w-4 h-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]" readOnly />
                <span className="group-hover:text-[#2563eb] transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-gray-100 pt-6">
          <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-9 h-9 rounded-full" />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#1e293b] truncate leading-tight">{user.displayName}</p>
            <p className="text-[10px] text-[#94a3b8] truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-[#e2e8f0] px-4 flex items-center justify-between shrink-0">
          <div className="text-[20px] font-black tracking-tighter text-[#2563eb]" onClick={() => setView('dashboard')}>
            RECALL
          </div>
          <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {view === 'dashboard' && (
          <Dashboard 
            items={packages} 
            categories={settings.categories} 
            availableTags={settings.availableTags}
            onEdit={handleEdit} 
          />
        )}
          {view === 'add' && (
            <RecallForm 
              categories={settings.categories} 
              availableTags={settings.availableTags} 
              clientSuggestions={clientSuggestions}
              editingData={editingPackage}
              onSuccess={() => {
                setView('dashboard');
                setEditingPackage(null);
              }} 
            />
          )}
          {view === 'settings' && (
            <Settings 
              categories={settings.categories} 
              tags={settings.availableTags} 
              onUpdate={async () => {
                const data = await FirestoreService.getSettings();
                if (data) setSettings(data);
              }} 
            />
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-1.5 flex justify-between items-center z-50 shadow-2xl shadow-blue-900/10">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b]'}`}
          >
            <LayoutGrid size={20} />
            <span className="text-[10px] font-bold">Base</span>
          </button>
          <button 
            onClick={handleAddNew}
            className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'add' && !editingPackage ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b]'}`}
          >
            <Plus size={20} />
            <span className="text-[10px] font-bold">New</span>
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'settings' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b]'}`}
          >
            <SettingsIcon size={20} />
            <span className="text-[10px] font-bold">Tools</span>
          </button>
        </div>
      </main>
    </div>
  );
}
