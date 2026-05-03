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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async (): Promise<void> => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(username, email, password);
      if (!result.success) {
        Alert.alert('Registration Failed', result.error);
      } else {
        Alert.alert('Success', 'Registration successful. Please log in.');
        router.push('/login');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fb]">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="school" size={24} color="#091426" />
          <Text className="text-xl font-bold text-[#091426]">LMS Academy</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center px-6 py-8">
        <View className="items-center w-full max-w-[440px] self-center">
          {/* Welcome Header */}
          <View className="items-center mb-12">
            <Text className="text-5xl font-semibold text-[#091426] mb-2 leading-[58px] tracking-tight">Create Account</Text>
            <Text className="text-base text-[#45474c] text-center leading-6">
              Join our learning community and start your educational journey.
            </Text>
          </View>

          {/* Register Card */}
          <View className="w-full bg-white rounded-xl p-6 shadow-sm border border-[#c5c6cd]">
            {/* Username Field */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#45474c] uppercase tracking-wider mb-1">Username</Text>
              <View className="flex-row items-center bg-[#f7f9fb] border border-[#c5c6cd] rounded-lg px-3 py-3">
                <Ionicons name="person" size={20} color="#75777d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-[#191c1e]"
                  placeholder=""
                  placeholderTextColor="#75777d"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#45474c] uppercase tracking-wider mb-1">Email Address</Text>
              <View className="flex-row items-center bg-[#f7f9fb] border border-[#c5c6cd] rounded-lg px-3 py-3">
                <Ionicons name="mail" size={20} color="#75777d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-[#191c1e]"
                  placeholder=""
                  placeholderTextColor="#75777d"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#45474c] uppercase tracking-wider mb-1">Password</Text>
              <View className="flex-row items-center bg-[#f7f9fb] border border-[#c5c6cd] rounded-lg px-3 py-3">
                <Ionicons name="lock-closed" size={20} color="#75777d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-[#191c1e]"
                  placeholder=""
                  placeholderTextColor="#75777d"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="ml-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#75777d"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#45474c] uppercase tracking-wider mb-1">Confirm Password</Text>
              <View className="flex-row items-center bg-[#f7f9fb] border border-[#c5c6cd] rounded-lg px-3 py-3">
                <Ionicons name="lock-closed" size={20} color="#75777d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-[#191c1e]"
                  placeholder=""
                  placeholderTextColor="#75777d"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  className="ml-3"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#75777d"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              className={`w-full bg-[#091426] py-3 rounded-lg items-center mt-6 shadow-sm ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-medium text-white">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View className="mt-6">
            <Text className="text-base text-[#45474c] text-center">
              Already have an account?{' '}
              <Text
                className="font-semibold text-[#091426]"
                onPress={() => router.push('/login')}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
