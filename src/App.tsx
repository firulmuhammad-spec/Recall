import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Settings as SettingsIcon, LogOut, Package, Users, User as UserIcon, Trash2, Bell, LayoutGrid, Plus, Moon, Sun } from 'lucide-react';
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
import { TrashView } from './components/TrashView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [packages, setPackages] = useState<RecallPackage[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'settings',
    categories: ["Pekerjaan", "Rumah", "Finance", "Kesehatan", "Lainnya"],
    availableTags: ["#vibrasi", "#pengujian", "#riwayatkesehatan", "#dokumen", "#penting"]
  });
  const [view, setView] = useState<'dashboard' | 'add' | 'settings' | 'users' | 'profile' | 'trash'>('dashboard');
  const [editingPackage, setEditingPackage] = useState<RecallPackage | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const clientSuggestions = useMemo(() => {
    const clients = packages.map(p => p.klien).filter((k): k is string => !!k);
    return Array.from(new Set(clients)).sort();
  }, [packages]);

  useEffect(() => {
    if (packages.length > 0 && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      
      if (Notification.permission === "granted") {
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const urgentItems = packages.filter(p => 
          p.status === "Menunggu" && p.bulanTahunTarget && currentYearMonth >= p.bulanTahunTarget
        );

        if (urgentItems.length > 0) {
          const lastNotif = localStorage.getItem('last_urgent_notif');
          const today = now.toDateString();
          
          if (lastNotif !== today) {
            new Notification("Recall Archive Urgent!", {
              body: `Ada ${urgentItems.length} item yang butuh perhatian hari ini. Silakan cek dashboard.`,
              icon: "https://cdn-icons-png.flaticon.com/512/9167/9167014.png"
            });
            localStorage.setItem('last_urgent_notif', today);
          }
        }
      }
    }
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
    const handleOnline = () => {
      console.log("Browser status: Online");
      setIsOffline(false);
    };
    const handleOffline = () => {
      console.log("Browser status: Offline");
      setIsOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial sync
    if (!navigator.onLine) setIsOffline(true);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    console.log("Setting up App auth listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (currUser) => {
      console.log("Auth state changed:", currUser ? `User logged in: ${currUser.email}` : "No user");
      
      try {
        if (currUser) {
          setLoading(true);
          
          const isValid = await AuthService.checkSession();
          if (!isValid) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          // Use real-time subscription for profile to handle intermittent offline states
          FirestoreService.subscribeToProfile(currUser.uid, async (profile) => {
            if (!profile) {
              console.log("No profile found, checking if we need to create one...");
              const newProfile = {
                username: currUser.email?.split('@')[0] || 'user',
                displayName: currUser.displayName || 'User',
                role: 'User' as const,
                preferences: { viewMode: 'grid' as const, sortBy: 'newest' },
                createdAt: serverTimestamp()
              };
              try {
                await setDoc(doc(db, 'users', currUser.uid), newProfile);
                // Subscription will trigger soon
              } catch (e) {
                console.error("Profile creation queued:", e);
                // Set temporary profile so UI can render
                setUserProfile({ id: currUser.uid, ...newProfile } as UserProfile);
                setLoading(false);
              }
            } else {
              setUserProfile(profile);
              setIsOffline(false);
              setLoading(false);
            }
          });
        } else {
          setUserProfile(null);
        }
        setUser(currUser);
      } catch (err: any) {
        console.error("Critical error in App auth listener:", err);
        if (err.message?.includes('offline')) setIsOffline(true);
      } finally {
        setLoading(false);
        console.log("App auth initialization finished.");
      }
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

    const unsubscribeSettings = FirestoreService.getSettings(async (data) => {
      if (!data) {
        // If settings doc doesn't exist, create it once by an admin or first user
        console.log("Settings not found in DB, using defaults");
        // We don't auto-create global settings for every user to avoid write spam, 
        // but we ensure the local state has the defaults (already in useState)
      } else {
        setSettings(data);
      }
    });

    return () => {
      if (unsubscribePackages) unsubscribePackages();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [user]);

  const handleEdit = (pkg: RecallPackage) => {
    setEditingPackage(pkg);
    setView('add');
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    setView('add');
  };

  const renderContent = () => {
    if (showSplash || (loading && !isOffline)) {
      return <SplashScreen />;
    }

    if (isOffline && !userProfile) { // Show offline screen only if we don't even have a cached profile
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6 font-sans">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border border-red-100 dark:border-red-900/40 flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
              <Package size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Firestore is Offline</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Aplikasi tidak dapat terhubung ke database. Cek koneksi internet Anda atau coba tombol di bawah ini.
            </p>
            <div className="flex flex-col w-full gap-2 mt-2">
              <button 
                onClick={async () => {
                  try {
                    const { enableNetwork, db } = await import('./lib/firebase');
                    await enableNetwork(db);
                    setIsOffline(false);
                    window.location.reload();
                  } catch (e) {
                    window.location.reload();
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Coba Reconnect & Refresh
              </button>
              <button 
                onClick={async () => {
                  const { resetFirestore } = await import('./lib/firebase');
                  await resetFirestore();
                }}
                className="text-xs text-gray-400 dark:text-slate-500 font-medium hover:text-gray-600 dark:hover:text-slate-300 transition-colors py-2"
              >
                Clear Cache & Full Reset
              </button>
            </div>
            {!navigator.onLine && (
              <p className="text-[10px] text-red-400 font-medium mt-2 italic">
                Browser mendeteksi Anda benar-benar sedang Offline.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (!user) {
      return <LoginView onLoginSuccess={() => setView('dashboard')} />;
    }

    return (
      <div className={`flex h-screen overflow-hidden font-sans`}>
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-[280px] bg-white dark:bg-slate-900 border-r border-[#e2e8f0] dark:border-slate-800 p-6 flex-col gap-6 shrink-0 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[24px] font-black tracking-tighter text-[#2563eb] leading-none cursor-pointer" onClick={() => setView('dashboard')}>
              RECALL
            </div>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} />}
            </button>
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
                view === 'dashboard' ? 'bg-[#eff6ff] dark:bg-blue-900/20 text-[#2563eb] dark:text-blue-400' : 'text-[#64748b] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid size={18} /> Dashboard
            </button>
            
            {userProfile?.role === 'Admin' && (
              <button 
                onClick={() => setView('users')}
                className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                  view === 'users' ? 'bg-[#eff6ff] dark:bg-blue-900/20 text-[#2563eb] dark:text-blue-400' : 'text-[#64748b] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Users size={18} /> User Management
              </button>
            )}

             <button 
              onClick={() => setView('settings')}
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                view === 'settings' ? 'bg-[#eff6ff] dark:bg-blue-900/20 text-[#2563eb] dark:text-blue-400' : 'text-[#64748b] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <SettingsIcon size={18} /> Global Settings
            </button>

            <button 
              onClick={() => setView('trash')}
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                view === 'trash' ? 'bg-[#eff6ff] dark:bg-blue-900/20 text-[#2563eb] dark:text-blue-400' : 'text-[#64748b] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Trash2 size={18} /> Recycle Bin
            </button>
            
            <button 
              onClick={() => AuthService.logout()}
              className="flex items-center gap-3 p-3 rounded-lg font-medium text-sm text-[#64748b] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all mt-4"
            >
              <LogOut size={18} /> Logout
            </button>
          </nav>

        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Global Header */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between shrink-0 z-40 transition-colors">
            <div className="flex items-center gap-4 lg:hidden">
              <div className="text-[20px] font-black tracking-tighter text-[#2563eb]" onClick={() => setView('dashboard')}>
                RECALL
              </div>
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} />}
              </button>
            </div>
            <div className="hidden lg:block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              {view === 'dashboard' ? 'Digital Archive Base' : 
               view === 'add' ? (editingPackage ? 'Update Archive' : 'New Archive Entry') :
               view === 'settings' ? 'System Configuration' :
               view === 'users' ? 'User Administration' : 
               view === 'trash' ? 'Recycle Bin System' : 'Account Intelligence'}
            </div>
            <div className="flex items-center gap-4">
              {isOffline && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-bold rounded-full border border-red-100 dark:border-red-900/30">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Offline Mode
                </span>
              )}
              <button 
                onClick={() => setView('profile')}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  view === 'profile' ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'
                } ${userProfile?.role === 'Admin' ? 'bg-indigo-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}
                title="My Profile"
              >
                <div className="font-bold text-xs">
                  {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </div>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-hide pb-40 lg:pb-20">
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
                onUpdate={() => {
                  // Subscription will handle state update automatically
                  console.log("Settings updated in DB");
                }} 
              />
            )}
            {view === 'users' && <UserManager />}
            {view === 'trash' && <TrashView />}
            {view === 'profile' && userProfile && <ProfileView userProfile={userProfile} />}
          </div>

          {/* Mobile Bottom Nav */}
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl p-1.5 flex justify-between items-center z-50 shadow-2xl shadow-blue-900/10">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b] dark:text-slate-400'}`}
            >
              <LayoutGrid size={20} />
              <span className="text-[10px] font-bold">Base</span>
            </button>
            <button 
              onClick={handleAddNew}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'add' && !editingPackage ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b] dark:text-slate-400'}`}
            >
              <Plus size={20} />
              <span className="text-[10px] font-bold">New</span>
            </button>
            <button 
              onClick={() => setView('trash')}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'trash' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b] dark:text-slate-400'}`}
            >
              <Trash2 size={20} />
              <span className="text-[10px] font-bold">Trash</span>
            </button>
            <button 
              onClick={() => setView('settings')}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 rounded-2xl transition-all ${view === 'settings' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'text-[#64748b] dark:text-slate-400'}`}
            >
              <SettingsIcon size={20} />
              <span className="text-[10px] font-bold">Tools</span>
            </button>
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-[#f1f5f9] dark:bg-slate-950 transition-colors duration-300`}>
       {renderContent()}
    </div>
  );
}
