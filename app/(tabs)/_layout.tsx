import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useEffect } from 'react';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', elevation: 0, backgroundColor: 'transparent', borderTopWidth: 0 },
      }}
      tabBar={(props) => (
        <BlurView 
          intensity={90} 
          tint="light" 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-around', 
            position: 'absolute', 
            bottom: 32, 
            left: 24, 
            right: 24, 
            height: 72, 
            borderRadius: 36, 
            overflow: 'hidden', 
            borderWidth: 1, 
            borderColor: 'rgba(255,255,255,0.5)', 
            zIndex: 50 
          }}
        >
          {props.state.routes.map((route, index) => {
            const isFocused = props.state.index === index;
            
            let iconName = '';
            if (route.name === 'index') iconName = isFocused ? 'grid' : 'grid-outline';
            if (route.name === 'library') iconName = isFocused ? 'book' : 'book-outline';
            if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

            const onPress = () => {
              const event = props.navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                props.navigation.navigate(route.name);
              }
            };

            return (
              <View key={route.name} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity
                  onPress={onPress}
                  style={isFocused ? { 
                    backgroundColor: '#312e81', 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    shadowColor: '#312e81',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5
                  } : { padding: 8 }}
                >
                  <Ionicons 
                    name={iconName as any} 
                    size={24} 
                    color={isFocused ? "#ffffff" : "#94a3b8"} 
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </BlurView>
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
