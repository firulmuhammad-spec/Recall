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
    // Check for redirect result on load
    handleRedirectResult()
      .then((result) => {
        if (result?.user) {
          onLoginSuccess();
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onLoginSuccess();
      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.MouseEvent, type: 'popup' | 'redirect') => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (type === 'popup') {
        const result = await signInWithGoogle();
        if (result?.user) {
          onLoginSuccess();
        }
      } else {
        await signInWithGoogleRedirect();
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      const errorCode = err.code;
      
      if (errorCode === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan (Popup ditutup).');
      } else if (errorCode === 'auth/popup-blocked') {
        setError('Popup diblokir browser. Mengalihkan ke mode Redirect...');
        setUseRedirect(true);
        // Automatically try redirect if popup is blocked
        setTimeout(() => signInWithGoogleRedirect(), 2000);
      } else if (errorCode === 'auth/unauthorized-domain' || errorCode === 'auth/unauthorized-domain-id-mismatch') {
        setError(`Domain ${window.location.hostname} belum terdaftar di Firebase Authorized Domains.`);
      } else if (errorCode === 'auth/internal-error' || errorCode === 'auth/network-request-failed') {
        setError('Gagal menghubungkan ke Google. Pastikan domain sudah terdaftar dan tidak diblokir browser.');
        setUseRedirect(true); // Suggest redirect for internal errors
      } else {
        setError(`Gagal: ${errorCode || 'Error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-gray-50">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 p-10 border border-white text-center">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mb-6 shadow-xl shadow-blue-600/30 transform hover:rotate-12 transition-transform duration-500">
            <Package className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">RECALL</h1>
          <p className="text-gray-400 mt-2 font-medium text-lg">Your intelligent personal archive.</p>
        </div>

        <div className="space-y-6">
          <p className="text-gray-500 font-medium">Masuk untuk mengakses database internal dan arsip data penting Anda.</p>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-xl justify-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={(e) => handleLogin(e, useRedirect ? 'redirect' : 'popup')}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:bg-gray-300 disabled:shadow-none mt-4"
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
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Coba popup mode kembali
              </button>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400">Securely powered by Google Cloud & Firestore</p>
        </div>
      </div>
    </div>
  );
};
