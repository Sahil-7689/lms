import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Course } from '../../src/types/course';
import courseService from '../../src/services/courseService';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppGlobalState } from '../../src/contexts/AppContext';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { bookmarkedIds, toggleBookmark } = useAppGlobalState();
  
  const [course, setCourse] = useState<Course | null>(null);
  const isBookmarked = course ? bookmarkedIds.includes(course.id) : false;
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const courses = await courseService.fetchCourses();
      const foundCourse = courses.find(c => c.id.toString() === id);
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError('Course not found');
      }
    } catch (err: any) {
      console.error('Failed to load course details:', err);
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const handleToggleBookmark = async () => {
    if (!course) return;
    await toggleBookmark(course.id);
  };

  const handleEnroll = () => {
    if (!course) return;
    setIsEnrolling(true);
    // Simulate API call
    setTimeout(() => {
      setIsEnrolling(false);
      Alert.alert(
        'Success!',
        `You have successfully enrolled in ${course.title}.`,
        [{ text: 'Start Learning', onPress: () => router.back() }]
      );
    }, 1500);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fbf8ff]">
        <ActivityIndicator size="large" color="#632ce5" />
      </View>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView className="flex-1 bg-[#fbf8ff] justify-center items-center p-10">
        <Ionicons name="alert-circle-outline" size={80} color="#dc3545" />
        <Text className="text-2xl font-bold text-[#000666] mt-6 text-center">{error || 'Something went wrong'}</Text>
        <Text className="text-base text-[#767683] mt-3 text-center">We couldn't load the course details. Please try again.</Text>
        <TouchableOpacity 
          className="mt-10 bg-[#632ce5] px-10 py-4 rounded-2xl shadow-lg"
          onPress={loadCourse}
        >
          <Text className="text-white font-bold text-lg">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-4 p-2" onPress={() => router.back()}>
          <Text className="text-[#632ce5] font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#fbf8ff]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

        {/* Hero Image */}
        <View className="w-full h-[350px] relative">
          <Image source={{ uri: course.thumbnail }} className="w-full h-full" resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            className="absolute inset-0 justify-between"
          />

          <SafeAreaView className="flex-row justify-between px-5 pt-2">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/30 justify-center items-center">
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleBookmark} className="w-10 h-10 rounded-full bg-black/30 justify-center items-center">
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isBookmarked ? "#68fadd" : "#ffffff"}
              />
            </TouchableOpacity>
          </SafeAreaView>

          <View className="absolute bottom-[30px] left-5 right-5">
            <View className="bg-[#632ce5] px-3 py-1.5 rounded-lg self-start mb-3">
              <Text className="text-white font-bold text-[10px] tracking-widest">{course.category.toUpperCase()}</Text>
            </View>
            <Text className="text-[28px] font-bold text-white shadow-sm">{course.title}</Text>
          </View>
        </View>

        {/* Course Details */}
        <View className="p-5 bg-[#fbf8ff] rounded-t-3xl -mt-6">

          {/* Stats Row */}
          <View className="flex-row items-center bg-white p-4 rounded-2xl mb-6 shadow-sm border border-[#eae7ef]">
            <View className="flex-1 flex-row items-center justify-center gap-2">
              <Ionicons name="star" size={20} color="#ffb800" />
              <Text className="text-base font-semibold text-[#1b1b21]">{course.rating}</Text>
            </View>
            <View className="w-[1px] h-6 bg-[#eae7ef]" />
            <View className="flex-1 flex-row items-center justify-center gap-2">
              <Ionicons name="pricetag-outline" size={20} color="#632ce5" />
              <Text className="text-base font-semibold text-[#1b1b21]">${course.price}</Text>
            </View>
          </View>

          {/* Instructor Section */}
          <Text className="text-[18px] font-semibold text-[#000666] mb-4">Instructor</Text>
          <View className="flex-row items-center bg-[#f5f2fb] p-4 rounded-2xl mb-6">
            <Image source={{ uri: course.instructor.picture.medium }} className="w-12 h-12 rounded-full mr-4" />
            <View>
              <Text className="text-base font-semibold text-[#1b1b21] mb-1">
                {course.instructor.name.first} {course.instructor.name.last}
              </Text>
              <Text className="text-sm text-[#767683]">{course.instructor.email}</Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-[18px] font-semibold text-[#000666] mb-4">About This Course</Text>
          <Text className="text-base text-[#454652] leading-6 mb-6">{course.description}</Text>

          {/* Images Gallery */}
          {course.images && course.images.length > 0 ? (
            <>
              <Text className="text-[18px] font-semibold text-[#000666] mb-4">Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
                {course.images.map((img, index) => (
                  <Image key={index} source={{ uri: img }} className="w-[200px] h-[140px] rounded-xl mr-3" />
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Read Syllabus Button for WebView */}
          <TouchableOpacity 
            className="flex-row items-center bg-[#f5f2fb] p-4 rounded-2xl border border-[#eae7ef] mb-6"
            onPress={() => router.push({ pathname: '/course/[id]/webview', params: { id: course.id } })}
          >
            <Ionicons name="document-text-outline" size={24} color="#632ce5" />
            <Text className="text-base font-semibold text-[#1b1b21] ml-3">View Full Syllabus (Web)</Text>
            <Ionicons name="chevron-forward" size={20} color="#c6c5d4" className="ml-auto" />
          </TouchableOpacity>

          <View className="h-[100px]" />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white flex-row items-center justify-between px-5 pt-4 pb-8 border-t border-[#eae7ef]">
        <View className="flex-1">
          <Text className="text-xs font-medium text-[#767683] mb-1">Total Price</Text>
          <Text className="text-2xl font-bold text-[#000666]">${course.price}</Text>
        </View>
        <TouchableOpacity
          className={`bg-[#632ce5] py-3.5 px-8 rounded-2xl shadow-md ${isEnrolling ? 'opacity-70' : ''}`}
          onPress={handleEnroll}
          disabled={isEnrolling}
        >
          <Text className="text-white text-base font-semibold">
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
