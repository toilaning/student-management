'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  setAvailableUsers: (users: User[]) => void;
  isLoading: boolean;
  isReady: boolean;
  refreshUsers: () => Promise<void>;
  logout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const defaultAdmin: User = {
  id: 'ADMIN001',
  username: 'admin',
  passwordHash: '',
  role: 'ADMIN',
  name: 'Quản Trị Viên Hệ Thống',
  email: 'admin@trungtam.edu.vn',
  isActive: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultAdmin);
  const [availableUsers, setAvailableUsers] = useState<User[]>([defaultAdmin]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Khởi tạo nhanh từ localStorage ngay khi mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUserJson = localStorage.getItem('active_user');
        if (savedUserJson) {
          const parsedUser = JSON.parse(savedUserJson);
          if (parsedUser && parsedUser.id && parsedUser.role) {
            setCurrentUser(parsedUser);
          }
        } else {
          const savedUserId = localStorage.getItem('active_user_id');
          if (savedUserId) {
            // Nếu chỉ có id, tạm thời giữ hoặc cập nhật id
            setCurrentUser(prev => ({ ...prev, id: savedUserId }));
          }
        }
      } catch (err) {
        console.error('Lỗi khi đọc user từ localStorage:', err);
      }
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const users: User[] = data.users || [];
        setAvailableUsers(users);

        if (typeof window !== 'undefined') {
          const savedUserId = localStorage.getItem('active_user_id');
          const savedUserJson = localStorage.getItem('active_user');
          let targetUser: User | undefined;

          if (savedUserJson) {
            try {
              const parsed = JSON.parse(savedUserJson);
              if (parsed?.id) {
                targetUser = users.find(u => u.id === parsed.id);
              }
            } catch (e) {
              // ignore
            }
          }

          if (!targetUser && savedUserId) {
            targetUser = users.find(u => u.id === savedUserId);
          }

          if (targetUser) {
            setCurrentUser(targetUser);
            localStorage.setItem('active_user_id', targetUser.id);
            localStorage.setItem('active_user', JSON.stringify(targetUser));
          } else if (users.length > 0) {
            // Nếu không tìm thấy user đã lưu, dùng user đầu tiên
            setCurrentUser(users[0]);
            localStorage.setItem('active_user_id', users[0].id);
            localStorage.setItem('active_user', JSON.stringify(users[0]));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_user_id');
      localStorage.removeItem('active_user');
      window.location.href = '/login';
    }
  };

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_user_id', user.id);
      localStorage.setItem('active_user', JSON.stringify(user));
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        availableUsers,
        setAvailableUsers,
        isLoading,
        isReady,
        refreshUsers: fetchUsers,
        logout,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
