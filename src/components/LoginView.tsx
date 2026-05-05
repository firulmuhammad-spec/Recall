import React, { useState } from 'react';
import { Package, LogIn, User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { AuthService } from '../lib/authService';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await AuthService.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Username atau password salah.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Error: Metode Email/Password belum diaktifkan di Firebase Console.');
      } else {
        setError('Sistem belum siap. Gunakan tombol Setup di bawah.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await AuthService.seedDefaultUsers();
      alert('Berhasil! Akun default telah dibuat. Silakan login dengan: admin, firul, atau zahra (Password: 123)');
    } catch (err: any) {
      console.error(err);
      if (err.message === 'auth/operation-not-allowed') {
        alert('Gagal: Metode login Email/Password BELUM DIAKTIFKAN di Firebase Console. Silakan aktifkan di menu Authentication -> Sign-in Method.');
      } else {
        alert('Ada masalah saat membuat akun: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-gray-50">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 p-10 border border-white">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mb-6 shadow-xl shadow-blue-600/30 transform hover:rotate-12 transition-transform duration-500">
            <Package className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">RECALL</h1>
          <p className="text-gray-400 mt-2 font-medium">Internal Archive System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                required
                placeholder="admin"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password"
                required
                placeholder="••••••"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-xl animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:bg-gray-300 disabled:shadow-none mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogIn size={20} />
            )}
            {loading ? 'Processing...' : 'Masuk ke Arsip'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-4">Pengguna baru? Minta admin untuk membuat akun.</p>
          <button 
            onClick={handleSeed}
            className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          >
            Setup Default ID (First Run Only)
          </button>
        </div>
      </div>
    </div>
  );
};
