import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User } from '@/api/entities';
import { ensureUserDefaults } from '@/api/functions';

// Create Auth Context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Replace volatile in-memory cache with a check against the user object itself.
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      
      if (currentUser && currentUser.id) {
        // If key default settings are missing, it's likely a new or legacy user.
        // We check for 'preferredLanguage' as a marker.
        if (!currentUser.preferredLanguage) {
          console.log(`[Auth] User ${currentUser.email} is missing defaults. Ensuring now...`);
          try {
            await ensureUserDefaults({ 
              action: 'ensure_defaults', 
              userData: { name: currentUser.full_name } 
            });
            // Re-fetch the user to get the fresh data with defaults applied.
            const updatedUser = await User.me();
            setUser(updatedUser);
          } catch (defaultsError) {
            console.warn('Failed to ensure user defaults:', defaultsError);
            // In case of error, still set the user. It will retry on the next load.
            setUser(currentUser);
          }
        } else {
          // Defaults are present, so just set the user.
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn('Auth error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleAuthChange = () => {
      fetchUser();
    };

    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [fetchUser]);

  const login = async () => {
    await User.login();
    window.dispatchEvent(new Event('auth-changed'));
  };

  const logout = async () => {
    await User.logout();
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
  };

  const updateProfile = async (profileData) => {
    try {
      await User.updateMyUserData(profileData);
      // Update local user state
      setUser(prev => ({ ...prev, ...profileData }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};