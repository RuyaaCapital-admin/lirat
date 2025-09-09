import { useState, useEffect } from 'react';

// Generate a unique anonymous user ID
const generateAnonymousId = () => {
  return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get or create anonymous user
const getAnonymousUser = () => {
  let userId = localStorage.getItem('liirat-anonymous-user-id');
  
  if (!userId) {
    userId = generateAnonymousId();
    localStorage.setItem('liirat-anonymous-user-id', userId);
  }
  
  return {
    id: userId,
    isAnonymous: true,
    name: localStorage.getItem('liirat-user-name') || 'User',
    email: null,
    created_date: localStorage.getItem('liirat-user-created') || new Date().toISOString()
  };
};

// Save user data locally
const saveUserData = (data) => {
  if (data.name) localStorage.setItem('liirat-user-name', data.name);
  if (data.settings) localStorage.setItem('liirat-user-settings', JSON.stringify(data.settings));
};

// Get user settings
const getUserSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('liirat-user-settings') || '{}');
  } catch {
    return {};
  }
};

export const AnonymousUserSystem = {
  getUser: getAnonymousUser,
  saveData: saveUserData,
  getSettings: getUserSettings,
  clearData: () => {
    localStorage.removeItem('liirat-anonymous-user-id');
    localStorage.removeItem('liirat-user-name');
    localStorage.removeItem('liirat-user-settings');
  }
};

// Hook for using anonymous user system
export const useAnonymousUser = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    setUser(getAnonymousUser());
  }, []);
  
  const updateUser = (data) => {
    saveUserData(data);
    setUser(getAnonymousUser());
  };
  
  return { user, updateUser };
};