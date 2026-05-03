import React, { useRef, useEffect, useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Course } from '../../../src/types/course';
import courseService from '../../../src/services/courseService';

export default function CourseWebViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courses = await courseService.fetchCourses();
        const foundCourse = courses.find(c => c.id.toString() === id);
        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          router.back();
        }
      } catch (error) {
        console.error('Failed to load course for webview:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourse();
  }, [id]);

  if (isLoading || !course) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#632ce5" />
      </View>
    );
  }

  const injectedJavaScript = `
    document.getElementById('native-msg').innerHTML = 'Injected from Native App: Welcome to the Syllabus!';
    window.ReactNativeWebView.postMessage('WebView is fully loaded and ready.');
    true;
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 24px;
          background-color: #fbf8ff;
          color: #1b1b21;
        }
        h1 {
          color: #000666;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .category {
          display: inline-block;
          background-color: #632ce5;
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        p {
          line-height: 1.6;
          color: #454652;
          font-size: 16px;
        }
        .meta {
          background-color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #eae7ef;
          margin: 24px 0;
        }
        .meta p {
          margin: 8px 0;
          font-weight: 500;
        }
        #native-msg {
          color: #00ab93;
          font-weight: bold;
          margin-top: 24px;
          padding: 12px;
          background-color: rgba(104, 250, 221, 0.1);
          border-left: 4px solid #00ab93;
        }
      </style>
    </head>
    <body>
      <div class="category">${course.category}</div>
      <h1>${course.title}</h1>
      
      <div class="meta">
        <p>👨‍🏫 Instructor: ${course.instructor.name.first} ${course.instructor.name.last}</p>
        <p>⭐ Rating: ${course.rating} / 5.0</p>
        <p>💰 Price: $${course.price}</p>
      </div>

      <h2>Course Description</h2>
      <p>${course.description}</p>
      
      <div id="native-msg">Waiting for Native App injection...</div>
    </body>
    </html>
  `;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-[#eae7ef]">
        <TouchableOpacity className="w-10 h-10 rounded-full bg-[#f5f2fb] items-center justify-center" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#312e81" />
        </TouchableOpacity>
        <Text className="text-[18px] font-semibold text-[#000666]">Course Syllabus</Text>
        <View className="w-10" />
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ 
          html: htmlContent, 
          headers: {
            'X-App-Version': '1.0.0',
            'X-Course-ID': course.id.toString(),
            'Authorization': 'Bearer NativeToken123'
          }
        }}
        injectedJavaScript={injectedJavaScript}
        renderError={(errorName) => (
          <View className="flex-1 justify-center items-center p-10 bg-white">
            <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
            <Text className="text-xl font-bold text-[#000666] mt-4 text-center">Failed to load syllabus</Text>
            <Text className="text-base text-[#767683] mt-2 text-center">Please check your internet connection and try again.</Text>
            <TouchableOpacity 
              className="mt-8 bg-[#632ce5] px-8 py-3 rounded-xl"
              onPress={() => webViewRef.current?.reload()}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent.statusCode);
        }}
        className="flex-1"
      />
    </SafeAreaView>
  );
}
