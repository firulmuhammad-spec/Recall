import React, { useState } from 'react';
import { Key, Save, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { AuthService } from '../lib/authService';
import { UserProfile } from '../types';

interface ProfileViewProps {
  userProfile: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userProfile }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await AuthService.updatePassword(newPassword);
      setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal memperbarui password. Silakan login ulang lalu coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Your Profile</h2>
        <p className="text-gray-500 font-medium">Manage your personal account settings and security.</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center text-blue-600">
              <Shield size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{userProfile.displayName}</h3>
              <p className="text-gray-400 font-medium">@{userProfile.username} • {userProfile.role}</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Key size={18} className="text-blue-500" />
              Ganti Password
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password Baru</label>
                <input 
                  type="password"
                  required
                  placeholder="Min. 6 karakter"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                <input 
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-bold ${
                message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
