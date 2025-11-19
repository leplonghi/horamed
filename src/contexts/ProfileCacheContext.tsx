import React, { createContext, useContext } from 'react';
import { useProfileCache } from '@/hooks/useProfileCache';

interface ProfileCacheContextType {
  cache: any;
  prefetchProfileData: (profileId: string, userId: string) => Promise<void>;
  prefetchAllProfiles: (profiles: any[], userId: string) => Promise<void>;
  getProfileCache: (profileId: string) => any;
  invalidateProfileCache: (profileId: string) => void;
  invalidateAllCache: () => void;
  updateProfileCache: (profileId: string, updates: any) => void;
}

const ProfileCacheContext = createContext<ProfileCacheContextType | undefined>(undefined);

export function ProfileCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheHook = useProfileCache();

  return (
    <ProfileCacheContext.Provider value={cacheHook}>
      {children}
    </ProfileCacheContext.Provider>
  );
}

export function useProfileCacheContext() {
  const context = useContext(ProfileCacheContext);
  if (!context) {
    throw new Error('useProfileCacheContext must be used within ProfileCacheProvider');
  }
  return context;
}
