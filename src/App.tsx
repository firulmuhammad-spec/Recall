import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, Plus, LayoutGrid, Settings as SettingsIcon, LogOut, Package, Users, User as UserIcon } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirestoreService } from './lib/firestoreService';
import { AuthService } from './lib/authService';
import { RecallPackage, AppSettings, UserProfile } from './types';
import { Dashboard } from './components/Dashboard';
import { RecallForm } from './components/RecallForm';
import { Settings } from './components/Settings';
import { LoginView } from './components/LoginView';
import { SplashScreen } from './components/SplashScreen';
import { UserManager } from './components/UserManager';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [packages, setPackages] = useState<RecallPackage[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'settings',
    categories: ["Pekerjaan", "Rumah", "Finance", "Kesehatan", "Lainnya"],
    availableTags: ["#vibrasi", "#pengujian", "#riwayatkesehatan", "#dokumen", "#penting"]
  });
  const [view, setView] = useState<'dashboard' | 'add' | 'settings' | 'users' | 'profile'>('dashboard');
  const [editingPackage, setEditingPackage] = useState<RecallPackage | null>(null);

  const clientSuggestions = useMemo(() => {
    const clients = packages.map(p => p.klien).filter((k): k is string => !!k);
    return Array.from(new Set(clients)).sort();
  }, [packages]);

  // Sync preferences to Firestore (debounced)
  const savePreferences = async (viewMode: string, sortBy: string) => {
    if (user && userProfile) {
      await FirestoreService.updateUserProfile(user.uid, {
        preferences: { viewMode, sortBy }
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currUser) => {
      if (currUser) {
        // Enforce 3-month session check
        const isValid = await AuthService.checkSession();
        if (!isValid) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        let profile = await FirestoreService.getUserProfile(currUser.uid);
        
        // Auto-create profile if first time
        if (!profile) {
          const newProfile = {
            username: currUser.email?.split('@')[0] || 'user',
            displayName: currUser.displayName || 'User',
            role: 'User' as const,
            preferences: {
              viewMode: 'grid' as const,
              sortBy: 'newest'
            },
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', currUser.uid), newProfile);
          profile = { id: currUser.uid, ...newProfile };
        }

        setUserProfile(profile as UserProfile);
      } else {
        setUserProfile(null);
      }
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

  if (showSplash || (loading && !user)) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginView onLoginSuccess={() => setView('dashboard')} />;
  }

  const handleEdit = (pkg: RecallPackage) => {
    setEditingPackage(pkg);
    setView('add');
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    setView('add');
  };

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
          
          {userProfile?.role === 'Admin' && (
            <button 
              onClick={() => setView('users')}
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                view === 'users' ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b] hover:bg-gray-50'
              }`}
            >
              <Users size={18} /> User Management
            </button>
          )}

          <button 
            onClick={() => setView('profile')}
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
              view === 'profile' ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b] hover:bg-gray-50'
            }`}
          >
            <UserIcon size={18} /> My Profile
          </button>

          <button 
            onClick={() => setView('settings')}
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
              view === 'settings' ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b] hover:bg-gray-50'
            }`}
          >
            <SettingsIcon size={18} /> Global Settings
          </button>
          
          <button 
            onClick={() => AuthService.logout()}
            className="flex items-center gap-3 p-3 rounded-lg font-medium text-sm text-[#64748b] hover:bg-red-50 hover:text-red-500 transition-all mt-4"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-6">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
            {userProfile?.displayName?.charAt(0) || user.email?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#1e293b] truncate leading-tight">{userProfile?.displayName || user.displayName}</p>
            <p className="text-[10px] text-[#94a3b8] truncate">{userProfile?.role || 'User'}</p>
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
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs" onClick={() => setView('profile')}>
            {userProfile?.displayName?.charAt(0) || user.email?.charAt(0)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {view === 'dashboard' && (
            <Dashboard 
              items={packages} 
              categories={settings.categories} 
              availableTags={settings.availableTags}
              onEdit={handleEdit}
              initialViewMode={userProfile?.preferences?.viewMode}
              initialSortBy={userProfile?.preferences?.sortBy as any}
              onStateChange={(v, s) => savePreferences(v, s)}
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
          {view === 'users' && <UserManager />}
          {view === 'profile' && userProfile && <ProfileView userProfile={userProfile} />}
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
            onClick={() => setView('profile')}
            className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'profile' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b]'}`}
          >
            <UserIcon size={20} />
            <span className="text-[10px] font-bold">You</span>
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
