import React, { useState, useEffect } from 'react';
import { Package, LogIn, AlertCircle } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { signInWithGoogle, signInWithGoogleRedirect, handleRedirectResult, config, auth } from '../lib/firebase';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRedirect, setUseRedirect] = useState(false);

  useEffect(() => {
    console.log("LoginView mounted. Current host:", window.location.hostname);
    
    // Check for redirect result on load
    handleRedirectResult()
      .then((result) => {
        if (result?.user) {
          console.log("Redirect success:", result.user.email);
          onLoginSuccess();
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err);
        // Only show error if it's not a cancelled login
        if (err.code !== 'auth/cancelled-popup-request') {
          setError(`Redirect Error: ${err.message}`);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("LoginView: onAuthStateChanged event:", user ? user.email : "null");
      if (user) {
        console.log("LoginView detected user, calling onLoginSuccess...");
        onLoginSuccess();
      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.MouseEvent, type: 'popup' | 'redirect') => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log(`Initialing Google ${type} login...`);
    
    try {
      if (type === 'popup') {
        const result = await signInWithGoogle();
        if (result?.user) {
          console.log("Popup login resolved successfully:", result.user.email);
          onLoginSuccess();
        }
      } else {
        console.log("Attempting redirect...");
        await signInWithGoogleRedirect();
      }
    } catch (err: any) {
      console.error('Login action error:', err);
      const errorCode = err.code;
      
      if (errorCode === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan (Popup ditutup).');
      } else if (errorCode === 'auth/popup-blocked') {
        setError('Popup diblokir browser. Mengalihkan ke mode Redirect...');
        setUseRedirect(true);
        setTimeout(() => {
          signInWithGoogleRedirect().catch(e => {
             console.error("Auto-redirect fail:", e);
             setError("Gagal redirect otomatis. Klik login kembali.");
          });
        }, 1500);
      } else if (errorCode === 'auth/unauthorized-domain' || errorCode === 'auth/unauthorized-domain-id-mismatch') {
        setError(`Domain ${window.location.hostname} belum terdaftar di Firebase Authorized Domains.`);
      } else if (errorCode === 'auth/internal-error' || errorCode === 'auth/network-request-failed') {
        setError('Gagal menghubungkan. Gunakan mode Redirect jika masalah berlanjut.');
        setUseRedirect(true);
      } else {
        setError(`Gagal (${errorCode || 'Error'}): ${err.message || ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-gray-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-blue-900/5 p-10 border border-white dark:border-slate-800 text-center">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mb-6 shadow-xl shadow-blue-600/30 transform hover:rotate-12 transition-transform duration-500">
            <Package className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">RECALL</h1>
          <p className="text-gray-400 dark:text-slate-500 mt-2 font-medium text-lg">Your intelligent personal archive.</p>
        </div>

        <div className="space-y-6">
          <p className="text-gray-500 dark:text-slate-400 font-medium">Masuk untuk mengakses database internal dan arsip data penting Anda.</p>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl justify-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={(e) => handleLogin(e, useRedirect ? 'redirect' : 'popup')}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:shadow-none mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogIn size={20} />
              )}
              {loading ? 'Connecting...' : `Sign in with Google${useRedirect ? ' (Redirect Mode)' : ''}`}
            </button>

            {useRedirect && !loading && (
              <button 
                onClick={(e) => handleLogin(e, 'popup')}
                className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Coba popup mode kembali
              </button>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-600">Securely powered by Google Cloud & Firestore</p>
        </div>
      </div>
    </div>
  );
};
