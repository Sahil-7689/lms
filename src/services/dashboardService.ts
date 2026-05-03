import AsyncStorage from '@react-native-async-storage/async-storage';
import courseService from './courseService';
import { Course } from '../types/course';

export interface DashboardCourse extends Course {
  progressPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface Path {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: { text: string; color: string; bgColor: string }[];
}

export interface DashboardData {
  stats: {
    dayStreak: number;
    masteryPercentage: number;
  };
  goal: {
    currentMinutes: number;
    targetMinutes: number;
  };
  continueLearning: DashboardCourse[];
  featuredPaths: Path[];
}

const STATS_KEY = '@lms_user_stats';

interface UserStats {
  lastLoginDate: string;
  dayStreak: number;
  currentMinutes: number;
  lastUpdatedMinutesDate: string;
}

class DashboardService {
  private async getUserStats(): Promise<UserStats> {
    try {
      const stored = await AsyncStorage.getItem(STATS_KEY);
      const today = new Date().toDateString();
      let stats: UserStats = stored ? JSON.parse(stored) : {
        lastLoginDate: today,
        dayStreak: 1,
        currentMinutes: 0,
        lastUpdatedMinutesDate: today,
      };

      let updated = false;

      // Check streak
      if (stats.lastLoginDate !== today) {
        const lastLogin = new Date(stats.lastLoginDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin.toDateString() === yesterday.toDateString()) {
          stats.dayStreak += 1;
        } else {
          stats.dayStreak = 1; // Streak broken
        }
        stats.lastLoginDate = today;
        updated = true;
      }

      // Reset daily minutes if it's a new day
      if (stats.lastUpdatedMinutesDate !== today) {
        stats.currentMinutes = 0;
        stats.lastUpdatedMinutesDate = today;
        updated = true;
      } else if (!stored) {
        // Just opened app for the first time or missing stats, add 5 minutes of activity!
        stats.currentMinutes += 5;
        updated = true;
      } else {
         // Simulate learning progression every time they fetch dashboard
         if (stats.currentMinutes < 60) {
            stats.currentMinutes += 5;
            updated = true;
         }
      }

      if (updated) {
        await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
      }

      return stats;
    } catch (e) {
      console.error('Error fetching stats', e);
      return { lastLoginDate: new Date().toDateString(), dayStreak: 1, currentMinutes: 5, lastUpdatedMinutesDate: new Date().toDateString() };
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    // 1. Fetch data
    const [courses, bookmarkedIds, userStats] = await Promise.all([
      courseService.fetchCourses(30), // Get a substantial pool of courses
      courseService.getBookmarkedCourseIds(),
      this.getUserStats()
    ]);
    
    // 2. Map Continue Learning based on ACTUAL bookmarks
    // We map the bookmarked IDs to actual course objects
    const bookmarkedCourses = courses.filter(c => bookmarkedIds.includes(c.id));
    
    // If they have no bookmarks, we'll fall back to showing the first course as a "Start Learning" prompt
    const activeCourses = bookmarkedCourses.length > 0 ? bookmarkedCourses : courses.slice(0, 1);

    const continueLearning: DashboardCourse[] = activeCourses.map((course) => {
      // Deterministic pseudo-random progress based on course ID to avoid layout jumps
      const progress = (course.id * 13) % 100; 
      const totalLessons = 10 + (course.id % 15);
      const lessonsCompleted = Math.floor((progress / 100) * totalLessons);

      return {
        ...course,
        progressPercentage: progress,
        lessonsCompleted: lessonsCompleted,
        totalLessons: totalLessons,
      };
    });

    // 3. Map Featured Paths dynamically based on unique categories
    const categoriesFound = new Set<string>();
    const uniqueCategoryCourses = courses.filter(c => {
      if (!categoriesFound.has(c.category) && !bookmarkedIds.includes(c.id)) {
        categoriesFound.add(c.category);
        return true;
      }
      return false;
    });

    // Take top 2 unique categories
    const featuredPaths: Path[] = uniqueCategoryCourses.slice(0, 2).map((course, index) => {
      const isFirst = index === 0;
      return {
        id: course.id.toString(),
        title: `${course.category.charAt(0).toUpperCase() + course.category.slice(1)} Mastery Path`,
        category: course.category,
        description: course.description.length > 60 
          ? course.description.substring(0, 60) + '...' 
          : course.description,
        image: course.thumbnail,
        tags: [
          {
            text: course.category.toUpperCase(),
            color: isFirst ? '#00ab93' : '#93000a',
            bgColor: isFirst ? 'rgba(104,250,221,0.1)' : '#ffdad6',
          }
        ]
      };
    });

    // 4. Calculate Mastery (e.g. average progress of bookmarked courses)
    let totalProgress = 0;
    if (continueLearning.length > 0) {
       totalProgress = continueLearning.reduce((sum, course) => sum + course.progressPercentage, 0);
    }
    const masteryPercentage = continueLearning.length > 0 ? Math.round(totalProgress / continueLearning.length) : 0;

    return {
      stats: {
        dayStreak: userStats.dayStreak,
        masteryPercentage: masteryPercentage,
      },
      goal: {
        currentMinutes: userStats.currentMinutes,
        targetMinutes: 60,
      },
      continueLearning,
      featuredPaths,
    };
  }
}

export default new DashboardService();
