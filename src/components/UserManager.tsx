import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, User, Trash2, Shield, Key, X, Check, Search } from 'lucide-react';
import { FirestoreService } from '../lib/firestoreService';
import { UserProfile } from '../types';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = FirestoreService.getAllUsers((data) => {
      setUsers(data as UserProfile[]);
    });
    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
      else if (unsubscribe && 'then' in unsubscribe) unsubscribe.then(u => u && u());
    };
  }, []);

  // Filtered users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">User Management</h2>
          <p className="text-gray-500 font-medium">Manage access and roles for the RECALL system.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 shadow-sm transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <motion.div 
            layout
            key={u.id} 
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600">
                <User size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                u.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {u.role}
              </span>
            </div>
            
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{u.displayName}</h3>
            <p className="text-sm text-gray-400 font-medium">@{u.username}</p>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end gap-2">
               <p className="text-[10px] text-gray-300 font-bold uppercase mr-auto">Created: {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'New'}</p>
               {u.role !== 'Admin' && (
                 <button className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                   <Trash2 size={16} />
                 </button>
               )}
            </div>
          </motion.div>
        ))}

        <button 
          onClick={() => alert('Feature: Admin creates user. Due to Firebase limitations in this environment, creation of new auth users is best done via seed or Firebase Console.')}
          className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all group"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <UserPlus size={28} />
          </div>
          <span className="font-bold text-sm">Add New Member</span>
        </button>
      </div>
    </div>
  );
};
