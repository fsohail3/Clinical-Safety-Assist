import React, { useState, useCallback } from "react";
import { StatusBar, ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "@/screens/LoginScreen";
import { AuthWebViewScreen } from "@/screens/AuthWebViewScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { WebViewScreen } from "@/screens/WebViewScreen";

const Stack = createNativeStackNavigator();

function RootApp() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading, setLoginComplete } = useAuth();
  const [showAuthWebView, setShowAuthWebView] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showAuthWebView) {
    return (
      <AuthWebViewScreen
        onLoginComplete={() => {
          setShowAuthWebView(false);
          setLoginComplete();
        }}
        onCancel={() => setShowAuthWebView(false)}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LoginScreen onLogin={() => setShowAuthWebView(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider onLoginRequest={() => {}}>
          <RootApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
});
