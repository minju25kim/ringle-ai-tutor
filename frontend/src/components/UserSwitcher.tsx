'use client';

import { useUserStore } from '@/hooks/useUser';

const UserSwitcher = () => {
  const { currentUser, setUserId } = useUserStore();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Switch User</h2>
      <div className="flex space-x-3">
        <button
          onClick={() => setUserId('user-1')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            currentUser.id === 'user-1' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          B2C User
        </button>
        <button
          onClick={() => setUserId('user-2')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            currentUser.id === 'user-2' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          B2B User
        </button>
      </div>
    </div>
  );
};

export default UserSwitcher;