import { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../services/api';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user, setUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = async () => {
    setProfileLoading(true);
    try {
      const profile = await getMyProfile();
      setUser(profile);
      return profile;
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async (patch) => {
    setProfileLoading(true);
    try {
      const profile = await updateMyProfile(patch);
      setUser(profile);
      return profile;
    } finally {
      setProfileLoading(false);
    }
  };

  const value = useMemo(
    () => ({ profile: user, profileLoading, refreshProfile, updateProfile }),
    [user, profileLoading]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }
  return context;
}
