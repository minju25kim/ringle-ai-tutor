'use client';

import { useUserStore } from '@/hooks/useUser';

const UserSwitcher = () => {
  const { currentUser, setUserId } = useUserStore();

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-bold mb-2">Switch User</h2>
      <div className="flex space-x-2">
        <button
          onClick={() => setUserId('user-1')}
          className={`px-4 py-2 rounded-md ${
            currentUser.id === 'user-1' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          B2C User
        </button>
        <button
          onClick={() => setUserId('user-2')}
          className={`px-4 py-2 rounded-md ${
            currentUser.id === 'user-2' ? 'bg-green-500 text-white' : 'bg-gray-200'
          }`}
        >
          B2B User
        </button>
      </div>
    </div>
  );
};

export default UserSwitcher;