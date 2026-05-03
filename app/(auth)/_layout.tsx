import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useEffect } from "react";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || isAuthenticated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
