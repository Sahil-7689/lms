import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { Course, Instructor, Product } from '../types/course';

const BOOKMARKS_KEY = '@lms_course_bookmarks';

class CourseService {
  /**
   * Fetches random products and users from FreeAPI and combines them
   * into a list of Courses with assigned Instructors.
   */
  async fetchCourses(limit: number = 20): Promise<Course[]> {
    try {
      // Run both API requests in parallel
      const [productsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/public/randomproducts?limit=${limit}`),
        fetch(`${API_BASE_URL}/api/v1/public/randomusers?limit=${limit}`),
      ]);

      if (!productsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data from FreeAPI');
      }

      const productsData = await productsRes.json();
      const usersData = await usersRes.json();

      const products: Product[] = productsData.data.data;
      const instructors: Instructor[] = usersData.data.data;

      // Combine them: assign an instructor to each product based on index
      const courses: Course[] = products.map((product, index) => {
        // Fallback to the first instructor if for some reason lengths don't match
        const instructor = instructors[index % instructors.length];
        
        // FreeAPI still returns old cdn.dummyjson.com URLs which are dead.
        // We replace them with consistent high-quality Picsum photos based on the product ID.
        let safeThumbnail = product.thumbnail;
        if (safeThumbnail && safeThumbnail.includes('dummyjson.com')) {
          safeThumbnail = `https://picsum.photos/seed/course_${product.id}/400/300`;
        }
        
        const safeImages = product.images ? product.images.map((img, i) => 
          img.includes('dummyjson.com') ? `https://picsum.photos/seed/course_${product.id}_${i}/400/300` : img
        ) : [safeThumbnail];

        return {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          rating: product.rating,
          thumbnail: safeThumbnail,
          images: safeImages,
          category: product.category,
          instructor,
        };
      });

      return courses;
    } catch (error) {
      console.error('[CourseService] Error fetching courses:', error);
      throw error;
    }
  }

  // ── Bookmarks Local Storage ───────────────────────────────────────────────

  async getBookmarkedCourseIds(): Promise<number[]> {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored !== null) {
        return JSON.parse(stored) as number[];
      }
      return [];
    } catch (error) {
      console.error('[CourseService] Error getting bookmarks:', error);
      return [];
    }
  }

  async toggleBookmark(courseId: number): Promise<boolean> {
    try {
      const currentBookmarks = await this.getBookmarkedCourseIds();
      let newBookmarks: number[];
      let isBookmarked = false;

      if (currentBookmarks.includes(courseId)) {
        // Remove bookmark
        newBookmarks = currentBookmarks.filter((id) => id !== courseId);
      } else {
        // Add bookmark
        newBookmarks = [...currentBookmarks, courseId];
        isBookmarked = true;
      }

      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      console.log(`[CourseService] Persisted ${newBookmarks.length} bookmarks to storage`);
      
      // Check for milestone in background
      const notificationService = require('./notificationService').default;
      notificationService.checkBookmarkMilestone(newBookmarks.length);
      
      return isBookmarked;
    } catch (error) {
      console.error('[CourseService] Error toggling bookmark:', error);
      return false; // Safely fail
    }
  }
}

export default new CourseService();
