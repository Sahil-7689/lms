import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import dashboardService, { DashboardData } from '../../src/services/dashboardService';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.username ? user.username.split(' ')[0] : 'Scholar';
  
  let profileImageUri = 'https://ui-avatars.com/api/?name=' + firstName + '&background=e0e0ff&color=312e81';
  if (user?.avatar) {
    if (typeof user.avatar === 'string') {
      profileImageUri = user.avatar;
    } else if (typeof user.avatar === 'object' && (user.avatar as any).url) {
      profileImageUri = (user.avatar as any).url;
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await dashboardService.getDashboardData();
        setData(result);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const handleEnrollPath = (path: any) => {
    router.push({
      pathname: '/library',
      params: { category: path.category }
    });
  };

  return (
    <View className="flex-1 bg-[#fbf8ff]">
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header */}
      <BlurView intensity={80} tint="light" className="absolute top-0 left-0 right-0 z-50 border-b border-white/20">
        <SafeAreaView>
          <View className="flex-row justify-between items-center px-5 py-3">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full overflow-hidden bg-[#e0e0ff] border-2 border-[#8690ee]">
                <Image 
                  source={{ uri: profileImageUri }}
                  className="w-full h-full"
                />
              </View>
              <Text className="text-xl font-bold text-[#312e81] tracking-tight">Luminary</Text>
            </View>
            <TouchableOpacity className="p-2">
              <Ionicons name="search" size={24} color="#312e81" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: 110, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personalized Welcome Header */}
        <LinearGradient
          colors={['#1a237e', '#7c4dff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-[32px] p-8 overflow-hidden mb-10 shadow-lg"
        >
          {/* Decorative shapes */}
          <View className="absolute -top-12 -right-12 w-[200px] h-[200px] rounded-full bg-[#68fadd]/20" />
          <View className="absolute -bottom-12 -left-12 w-[150px] h-[150px] rounded-full bg-[#7c4dff]/30" />
          
          <Text className="text-[40px] font-bold text-white tracking-tighter mb-2">Hello, {firstName}!</Text>
          <Text className="text-base text-white/80 leading-6 mb-6">
            Your intellectual momentum is at an all-time high. Ready to illuminate new concepts today?
          </Text>

          <View className="flex-row items-center bg-white/15 p-4 rounded-2xl border border-white/20 self-start">
            <View className="items-center px-4">
              <Text className="text-2xl font-semibold text-white">{data?.stats?.dayStreak || 0}</Text>
              <Text className="text-[10px] font-semibold text-[#e0e7ff] tracking-widest mt-1">DAY STREAK</Text>
            </View>
            <View className="w-[1px] h-10 bg-white/20" />
            <View className="items-center px-4">
              <Text className="text-2xl font-semibold text-white">{data?.stats?.masteryPercentage || 0}%</Text>
              <Text className="text-[10px] font-semibold text-[#e0e7ff] tracking-widest mt-1">MASTERY</Text>
            </View>
          </View>
        </LinearGradient>

        {isLoading ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color="#632ce5" />
          </View>
        ) : (
          <>
            {/* Daily Goal Widget */}
            <View className="bg-[#f5f2fb] rounded-[32px] p-8 items-center mb-10">
              <Text className="text-2xl font-semibold text-[#000666] mb-4 self-start">Daily Goal</Text>
              <View className="w-[160px] h-[160px] justify-center items-center">
                <Svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                  <Circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="#eae7ef"
                    strokeWidth="12"
                    fill="none"
                  />
                  <Circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="#632ce5"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="402"
                    strokeDashoffset={402 - (402 * (data?.goal?.currentMinutes || 0) / (data?.goal?.targetMinutes || 60))}
                    strokeLinecap="round"
                  />
                </Svg>
                <View className="absolute items-center">
                  <Text className="text-[32px] font-bold text-[#000666]">{data?.goal?.currentMinutes}</Text>
                  <Text className="text-sm font-semibold text-[#767683]">/ {data?.goal?.targetMinutes} min</Text>
                </View>
              </View>
              <Text className="mt-6 text-base text-[#454652] text-center">You're almost there! Just {Math.max(0, (data?.goal?.targetMinutes || 60) - (data?.goal?.currentMinutes || 0))} minutes to hit your peak.</Text>
            </View>

            {/* Continue Learning */}
            {data?.continueLearning && data.continueLearning.length > 0 && (
              <View className="mb-10">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-semibold text-[#000666]">Continue Learning</Text>
                  <TouchableOpacity onPress={() => router.push('/library')}>
                    <Text className="text-sm font-semibold text-[#632ce5]">View All</Text>
                  </TouchableOpacity>
                </View>

                <View className="gap-5">
                  {data.continueLearning.map((course) => (
                    <ImageBackground
                      key={course.id}
                      source={{ uri: course.thumbnail }}
                      className="h-[300px] rounded-[32px] overflow-hidden"
                      imageStyle={{ borderRadius: 32 }}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,6,102,0.9)']}
                        className="flex-1 justify-end p-5"
                      >
                        <BlurView intensity={40} tint="light" className="bg-white/70 rounded-2xl p-4 overflow-hidden">
                          <Text className="text-xl font-semibold text-[#000666] mb-3">{course.title}</Text>
                          <View className="h-1.5 bg-[#eae7ef] rounded-full mb-2 overflow-hidden">
                            <View 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${course.progressPercentage}%`, 
                                backgroundColor: course.progressPercentage > 50 ? '#632ce5' : '#44ddc1' 
                              }} 
                            />
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs font-semibold text-[#767683]">Lesson {course.lessonsCompleted} of {course.totalLessons}</Text>
                            <Text className={`text-xs font-semibold ${course.progressPercentage > 50 ? 'text-[#632ce5]' : 'text-[#00ab93]'}`}>
                              {course.progressPercentage}% Complete
                            </Text>
                          </View>
                        </BlurView>
                      </LinearGradient>
                    </ImageBackground>
                  ))}
                </View>
              </View>
            )}

            {/* Featured Paths Section */}
            {data?.featuredPaths && data.featuredPaths.length > 0 && (
              <View className="mb-10">
                <Text className="text-2xl font-semibold text-[#000666] mb-4">Featured Paths</Text>
                
                {data.featuredPaths.map((path) => (
                  <View key={path.id} className="bg-white rounded-[32px] border border-[#c6c5d4] mb-4 overflow-hidden p-2">
                    <Image 
                      source={{ uri: path.image }}
                      className="w-full h-[180px] rounded-3xl"
                    />
                    <View className="p-4">
                      <View className="flex-row gap-2 mb-3">
                        {path.tags.map((tag, idx) => (
                          <View key={idx} className="px-3 py-1 rounded-full" style={{ backgroundColor: tag.bgColor }}>
                            <Text className="text-[10px] font-bold tracking-widest" style={{ color: tag.color }}>{tag.text}</Text>
                          </View>
                        ))}
                      </View>
                      <Text className="text-xl font-semibold text-[#000666] mb-2">{path.title}</Text>
                      <Text className="text-base text-[#454652] mb-6">{path.description}</Text>
                      <TouchableOpacity 
                        className="bg-[#000666] py-[14px] rounded-xl items-center"
                        onPress={() => handleEnrollPath(path)}
                      >
                        <Text className="text-white text-sm font-semibold">Enroll Path</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        
        {/* Spacer for bottom nav */}
        <View className="h-[120px]" />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity className="absolute right-6 bottom-[100px] w-14 h-14 rounded-full bg-[#632ce5] justify-center items-center shadow-lg z-40">
        <Ionicons name="pencil" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
