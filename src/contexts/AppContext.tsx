import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import courseService from '../services/courseService';
import { Course } from '../types/course';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notificationsEnabled: true,
};

interface AppContextType {
  // Course State
  courses: Course[];
  bookmarkedIds: number[];
  isLoadingCourses: boolean;
  refreshCourses: () => Promise<void>;
  toggleBookmark: (courseId: number) => Promise<void>;

  // Preferences State
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppGlobalState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppGlobalState must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingCourses(true);
    try {
      // Load Preferences
      const storedPrefs = await AsyncStorage.getItem('@lms_preferences');
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
      }

      // Load Bookmarks
      const ids = await courseService.getBookmarkedCourseIds();
      setBookmarkedIds(ids);

      // Load Courses
      const data = await courseService.fetchCourses(30);
      setCourses(data);
    } catch (err) {
      console.error('[AppProvider] Error loading initial data:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const refreshCourses = async () => {
    try {
      const data = await courseService.fetchCourses(30);
      setCourses(data);
    } catch (err) {
      console.error('[AppProvider] Error refreshing courses:', err);
    }
  };

  const toggleBookmark = async (courseId: number) => {
    // 1. Optimistic Update (Instant UI feedback)
    let isAdded = false;
    setBookmarkedIds(prev => {
      const exists = prev.includes(courseId);
      isAdded = !exists;
      return exists ? prev.filter(id => id !== courseId) : [...prev, courseId];
    });
    
    // 2. Persist in background without blocking
    try {
      await courseService.toggleBookmark(courseId);
    } catch (error) {
      console.error('[AppContext] Failed to persist bookmark, rolling back', error);
      // Rollback on error
      setBookmarkedIds(prev => 
        isAdded ? prev.filter(id => id !== courseId) : [...prev, courseId]
      );
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    await AsyncStorage.setItem('@lms_preferences', JSON.stringify(newPrefs));
  };

  return (
    <AppContext.Provider value={{
      courses,
      bookmarkedIds,
      isLoadingCourses,
      refreshCourses,
      toggleBookmark,
      preferences,
      updatePreferences
    }}>
      {children}
    </AppContext.Provider>
  );
};
