import React from 'react';
import { Shield, User, Calendar, Clock, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
import { AuthService } from '../lib/authService';

interface ProfileViewProps {
  userProfile: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userProfile }) => {
  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Your Profile</h2>
          <p className="text-gray-500 font-medium">Informasi akun Anda di sistem RECALL.</p>
        </div>
        <button 
          onClick={() => AuthService.logout()}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95 shadow-sm border border-red-100"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 mb-6 shadow-lg shadow-blue-100/50">
              <Shield size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900">{userProfile.displayName}</h3>
            <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full mt-3 shadow-md shadow-blue-200">
              {userProfile.role} Account
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
              <div className="p-3 bg-white rounded-xl text-gray-400">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Username</p>
                <p className="font-bold text-gray-900 leading-none">@{userProfile.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
              <div className="p-3 bg-white rounded-xl text-gray-400">
                <Calendar size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Joined Date</p>
                <p className="font-bold text-gray-900 leading-none">
                  {userProfile.createdAt?.toDate ? userProfile.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'New Member'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
              <div className="p-3 bg-white rounded-xl text-gray-400">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Session Policy</p>
                <p className="font-bold text-gray-900 leading-none">90 Days Expiry (Active Auto-refresh)</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
              <h4 className="font-bold text-blue-900 text-sm mb-2">Google Authenticated</h4>
              <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                Akun Anda diamankan melalui Google. Untuk mengganti password atau mengelola keamanan, silakan gunakan pengaturan Akun Google Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
