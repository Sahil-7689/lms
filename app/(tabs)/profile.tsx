import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAppGlobalState } from '../../src/contexts/AppContext';
import dashboardService, { DashboardData } from '../../src/services/dashboardService';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ProfileScreen() {
  const { user, updateAvatar, logout } = useAuth();
  const { preferences, updatePreferences } = useAppGlobalState();
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // We'll maintain local avatar state so it updates instantly
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const toggleNotifications = (value: boolean) => {
    updatePreferences({ notificationsEnabled: value });
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Luminary?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const loadData = useCallback(async () => {
    try {
      const result = await dashboardService.getDashboardData();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data for profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    // Determine initial avatar
    const firstName = user?.username ? user.username.split(' ')[0] : 'User';
    let defaultAvatar = 'https://ui-avatars.com/api/?name=' + firstName + '&background=e0e0ff&color=312e81';
    
    if (user?.avatar) {
      if (typeof user.avatar === 'string') {
        defaultAvatar = user.avatar;
      } else if (typeof user.avatar === 'object' && (user.avatar as any).url) {
        defaultAvatar = (user.avatar as any).url;
      }
    }
    setAvatarUri(defaultAvatar);
  }, [user]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow access to your photos to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      
      await updateAvatar(selectedUri);
    }
  };

  return (
    <View className="flex-1 bg-[#fbf8ff]">
      <BlurView intensity={80} tint="light" className="absolute top-0 left-0 right-0 z-50 border-b border-white/20">
        <SafeAreaView>
          <View className="items-center px-5 py-3">
            <Text className="text-xl font-bold text-[#312e81] tracking-tight">Profile</Text>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1a237e', '#7c4dff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-[32px] p-8 overflow-hidden mb-10 shadow-lg"
        >
          <View className="absolute -top-12 -right-12 w-[200px] h-[200px] rounded-full bg-[#68fadd]/20" />
          <View className="absolute -bottom-12 -left-12 w-[150px] h-[150px] rounded-full bg-[#7c4dff]/30" />
          
          <View className="flex-row items-center">
            <View className="relative mr-5">
              <Image 
                source={{ uri: avatarUri || undefined }}
                className="w-20 h-20 rounded-full bg-[#e0e0ff] border-[3px] border-white"
              />
              <TouchableOpacity className="absolute bottom-0 right-0 bg-[#632ce5] w-7 h-7 rounded-full justify-center items-center border-2 border-white" onPress={handlePickImage}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="text-2xl font-bold text-white mb-1">{user?.username || 'User'}</Text>
              <Text className="text-sm text-white/80">{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </LinearGradient>

        {isLoading ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color="#632ce5" />
          </View>
        ) : (
          <View className="mb-10">
            <Text className="text-xl font-semibold text-[#000666] mb-4">Your Statistics</Text>

            <View className="flex-row flex-wrap justify-between gap-4">
              <View className="w-[47%] bg-white rounded-3xl p-5 items-center shadow-sm border border-[#eae7ef]">
                <Ionicons name="flame" size={28} color="#ff7043" className="mb-3" />
                <Text className="text-2xl font-bold text-[#000666] mb-1">{data?.stats?.dayStreak || 0}</Text>
                <Text className="text-xs font-medium text-[#767683]">Day Streak</Text>
              </View>

              <View className="w-[47%] bg-white rounded-3xl p-5 items-center shadow-sm border border-[#eae7ef]">
                <Ionicons name="trophy" size={28} color="#fbc02d" className="mb-3" />
                <Text className="text-2xl font-bold text-[#000666] mb-1">{data?.stats?.masteryPercentage || 0}%</Text>
                <Text className="text-xs font-medium text-[#767683]">Mastery</Text>
              </View>

              <View className="w-[47%] bg-white rounded-3xl p-5 items-center shadow-sm border border-[#eae7ef]">
                <Ionicons name="book" size={28} color="#632ce5" className="mb-3" />
                <Text className="text-2xl font-bold text-[#000666] mb-1">{data?.continueLearning?.length || 0}</Text>
                <Text className="text-xs font-medium text-[#767683]">Courses Active</Text>
              </View>

              <View className="w-[47%] bg-white rounded-3xl p-5 items-center shadow-sm border border-[#eae7ef]">
                <Ionicons name="time" size={28} color="#4caf50" className="mb-3" />
                <Text className="text-2xl font-bold text-[#000666] mb-1">{data?.goal?.currentMinutes || 0}m</Text>
                <Text className="text-xs font-medium text-[#767683]">Learned Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bookmarks Section */}
        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-[#000666]">My Bookmarks</Text>
            {data?.continueLearning && data.continueLearning.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
                <Text className="text-sm font-semibold text-[#632ce5]">View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {!data?.continueLearning || data.continueLearning.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 items-center border border-dashed border-[#c6c5d4]">
              <Ionicons name="bookmark-outline" size={40} color="#c6c5d4" />
              <Text className="text-sm font-medium text-[#767683] mt-3 text-center">No bookmarks yet. Start exploring!</Text>
              <TouchableOpacity 
                className="mt-4 bg-[#f5f2fb] px-5 py-2 rounded-xl"
                onPress={() => router.push('/(tabs)/library')}
              >
                <Text className="text-xs font-bold text-[#632ce5]">Go to Catalog</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-2">
              {data.continueLearning.map((course) => (
                <TouchableOpacity 
                  key={course.id} 
                  className="w-[180px] bg-white rounded-2xl overflow-hidden shadow-sm border border-[#eae7ef] mx-2"
                  onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                >
                  <Image source={{ uri: course.thumbnail }} className="w-full h-24" />
                  <View className="p-3">
                    <Text className="text-sm font-semibold text-[#000666]" numberOfLines={1}>{course.title}</Text>
                    <Text className="text-[10px] text-[#767683] mt-1">{course.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View className="mb-10">
           <Text className="text-xl font-semibold text-[#000666] mb-4">Settings</Text>
           
           <View className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-[#eae7ef]">
             <View className="w-10 h-10 rounded-full bg-[#e0e0ff] justify-center items-center">
               <Ionicons name="notifications" size={22} color="#632ce5" />
             </View>
             <Text className="flex-1 text-base font-medium text-[#000666] ml-3">Push Notifications</Text>
             <Switch
               value={preferences.notificationsEnabled}
               onValueChange={toggleNotifications}
               trackColor={{ false: '#eae7ef', true: '#c7b1fa' }}
               thumbColor={preferences.notificationsEnabled ? '#632ce5' : '#767683'}
             />
           </View>

           <TouchableOpacity 
             className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-[#fee2e2]"
             onPress={handleLogout}
             disabled={isLoggingOut}
           >
             <View className="w-10 h-10 rounded-full bg-[#fef2f2] justify-center items-center">
               <Ionicons name="log-out" size={22} color="#ef4444" />
             </View>
             <Text className="flex-1 text-base font-medium text-[#ef4444] ml-3">Log Out</Text>
             {isLoggingOut && <ActivityIndicator size="small" color="#ef4444" />}
           </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
