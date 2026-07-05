import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/providers/AuthProvider';
import { PushProvider } from '@/providers/PushProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { RegionProvider } from '@/providers/RegionProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <RegionProvider>
            <AuthProvider>
              <PushProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: colors.bg },
                    headerTintColor: colors.text,
                    contentStyle: { backgroundColor: colors.bg },
                  }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="title/[type]/[id]"
                    options={{ title: '', headerTransparent: true }}
                  />
                  <Stack.Screen
                    name="sign-in"
                    options={{ presentation: 'modal', title: 'Cuenta' }}
                  />
                </Stack>
              </PushProvider>
            </AuthProvider>
          </RegionProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
