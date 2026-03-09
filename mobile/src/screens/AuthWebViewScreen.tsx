import React, { useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, SafeAreaView, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/config";
import { useTheme } from "@/theme/ThemeContext";

interface AuthWebViewScreenProps {
  onLoginComplete: () => void;
  onCancel: () => void;
}

export function AuthWebViewScreen({ onLoginComplete, onCancel }: AuthWebViewScreenProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const hasTriggeredLogin = useRef(false);

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    if (hasTriggeredLogin.current) return;

    const baseWithoutSlash = API_BASE_URL.replace(/\/$/, "");
    const normalizedUrl = url.replace(/\/$/, "").split("?")[0].split("#")[0];

    if (normalizedUrl === baseWithoutSlash) {
      hasTriggeredLogin.current = true;
      onLoginComplete();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sign In</Text>
        <View style={styles.cancelButton} />
      </View>
      <WebView
        source={{ uri: `${API_BASE_URL}/api/login` }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.webview}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  cancelButton: { width: 40, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
});
