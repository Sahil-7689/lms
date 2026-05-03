import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg';

const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 48 48">
    <Defs>
      <ClipPath id="clip">
        <Rect width="48" height="48" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#clip)">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </G>
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = (): void => {
    Alert.alert('Google Login', 'Google login functionality coming soon!');
  };

  const handleAppleLogin = (): void => {
    Alert.alert('Apple Login', 'Apple login functionality coming soon!');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2F5]">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center gap-2 px-5 pt-4 pb-2">
          <Ionicons name="school-outline" size={22} color="#1A1A2E" />
          <Text className="text-[17px] font-bold text-[#1A1A2E]">LMS Academy</Text>
        </View>

        {/* ── Hero ── */}
        <View className="items-center px-6 pt-8 pb-7">
          <Text className="text-4xl font-bold text-[#1A1A2E] tracking-tighter text-center mb-3">Welcome</Text>
          <Text className="text-[15px] text-[#6B7280] text-center leading-relaxed">
            Access your learning dashboard and{'\n'}continue your journey.
          </Text>
        </View>

        {/* ── Login Card ── */}
        <View className="mx-4 bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
          {/* Email */}
          <View className="mb-[18px]">
            <Text className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-widest mb-1.5">Email Address</Text>
            <View className="flex-row items-center border border-[#D1D5DB] rounded-xl px-3 py-[13px] bg-[#FAFAFA]">
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" className="mr-2.5" />
              <TextInput
                className="flex-1 text-[15px] text-[#1A1A2E]"
                placeholder="name@university.edu"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View className="mb-[18px]">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-widest">Password</Text>
              <TouchableOpacity>
                <Text className="text-xs font-medium text-[#1A1A2E]">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center border border-[#D1D5DB] rounded-xl px-3 py-[13px] bg-[#FAFAFA]">
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" className="mr-2.5" />
              <TextInput
                className="flex-1 text-[15px] text-[#1A1A2E]"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            className={`bg-[#1A1A2E] rounded-xl py-[15px] items-center mt-2 shadow-md ${isLoading ? 'opacity-60' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white tracking-wide">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-5 gap-2.5">
            <View className="flex-1 h-[1px] bg-[#E5E7EB]" />
            <Text className="text-[11px] font-semibold text-[#9CA3AF] tracking-widest">OR CONTINUE WITH</Text>
            <View className="flex-1 h-[1px] bg-[#E5E7EB]" />
          </View>

          {/* Social Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3 border border-[#D1D5DB] rounded-xl bg-white" onPress={handleGoogleLogin} activeOpacity={0.8}>
              <GoogleIcon />
              <Text className="text-sm font-semibold text-[#1A1A2E]">Google</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3 border border-[#D1D5DB] rounded-xl bg-white" onPress={handleAppleLogin} activeOpacity={0.8}>
              <Ionicons name="logo-apple" size={20} color="#191C1E" />
              <Text className="text-sm font-semibold text-[#1A1A2E]">Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sign Up Link ── */}
        <View className="items-center mt-5 mb-6">
          <Text className="text-[15px] text-[#6B7280]">
            Don't have an account?{' '}
            <Text className="font-bold text-[#1A1A2E]" onPress={() => router.push('/register')}>
              Sign Up
            </Text>
          </Text>
        </View>

        {/* ── Trust Banner ── */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80' }}
            className="w-full h-[140px]"
            resizeMode="cover"
          />
          <Text className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest text-center py-3">TRUSTED BY 500+ INSTITUTIONS WORLDWIDE</Text>
        </View>

        {/* ── Footer ── */}
        <View className="items-center mt-8 px-4 gap-2">
          <Text className="text-xs text-[#9CA3AF]">© 2024 LMS Academy. All rights reserved.</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-[#2DD4BF]">Privacy Policy</Text>
            <Text className="text-xs text-[#9CA3AF]">·</Text>
            <Text className="text-xs text-[#2DD4BF]">Terms of Service</Text>
            <Text className="text-xs text-[#9CA3AF]">·</Text>
            <Text className="text-xs text-[#2DD4BF]">Help Center</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
