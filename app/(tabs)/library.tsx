import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Course } from '../../src/types/course';
import { LegendList } from '@legendapp/list';
import { useAppGlobalState } from '../../src/contexts/AppContext';
import { useEffect } from 'react';

// Extract item component and use React.memo for list item optimization
const CourseItem = React.memo(({ item, isBookmarked, onPress, onToggleBookmark }: {
  item: Course;
  isBookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: (id: number) => void;
}) => {
  return (
    <TouchableOpacity 
      className="bg-white rounded-2xl border border-[#eae7ef] overflow-hidden shadow-sm mb-4"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnail }} className="w-full h-40 bg-[#f5f2fb]" />
      
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="flex-1 text-lg font-semibold text-[#000666] mr-3" numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity 
            className="p-3 -m-3"
            onPress={() => onToggleBookmark(item.id)}
          >
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isBookmarked ? "#632ce5" : "#767683"} 
            />
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-[#454652] leading-5 mb-4" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row items-center">
          <Image 
            source={{ uri: item.instructor.picture.thumbnail }} 
            className="w-6 h-6 rounded-full mr-2" 
          />
          <Text className="text-xs font-medium text-[#767683]">
            {item.instructor.name.first} {item.instructor.name.last}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id && 
         prevProps.isBookmarked === nextProps.isBookmarked;
});

export default function CourseListScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { courses, bookmarkedIds, isLoadingCourses, refreshCourses, toggleBookmark } = useAppGlobalState();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(category || '');

  useEffect(() => {
    if (category) {
      setSearchQuery(category);
    }
  }, [category]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshCourses();
    setIsRefreshing(false);
  }, [refreshCourses]);

  const filteredCourses = useMemo(() => {
    if (searchQuery.trim() === '') {
      return courses;
    }
    const query = searchQuery.toLowerCase();
    return courses.filter((course) => 
      course.title.toLowerCase().includes(query) || 
      course.description.toLowerCase().includes(query) ||
      course.category.toLowerCase().includes(query)
    );
  }, [searchQuery, courses, bookmarkedIds]);

  const renderCourseItem = useCallback(({ item }: { item: Course }) => {
    const isBookmarked = bookmarkedIds.includes(item.id);
    return (
      <CourseItem 
        item={item} 
        isBookmarked={isBookmarked} 
        onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}
        onToggleBookmark={toggleBookmark}
      />
    );
  }, [bookmarkedIds, toggleBookmark, router]);

  return (
    <SafeAreaView className="flex-1 bg-[#fbf8ff]">
      {/* Header & Search */}
      <View className="px-5 pt-3 pb-4 bg-[#fbf8ff] border-b border-[#eae7ef]">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#000666" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#000666]">Course Catalog</Text>
          <View className="w-6" />
        </View>

        <View className="flex-row items-center bg-[#eae7ef] rounded-xl px-3 h-11">
          <Ionicons name="search" size={20} color="#767683" className="mr-2" />
          <TextInput
            className="flex-1 text-base text-[#1b1b21]"
            placeholder="Search courses..."
            placeholderTextColor="#767683"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#767683" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List */}
      {isLoadingCourses ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#632ce5" />
        </View>
      ) : (
        <LegendList
          data={filteredCourses}
          estimatedItemSize={290}
          keyExtractor={(item: Course) => item.id.toString()}
          renderItem={renderCourseItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#632ce5"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-16">
              <Ionicons name="search-outline" size={48} color="#c6c5d4" />
              <Text className="mt-4 text-base font-medium text-[#767683]">No courses found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
