import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/ModeToggle";
import { UsageBanner } from "@/components/UsageBanner";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { ClinicalFormScreen } from "@/screens/ClinicalFormScreen";
import { ProcedureFormScreen } from "@/screens/ProcedureFormScreen";
import { ResultsScreen } from "@/screens/ResultsScreen";
import { apiRequest, fetchUsage } from "@/api/client";
import { API_BASE_URL, FREE_QUERIES_LIMIT } from "@/config";
import type { GenerateRequest, GenerateResponse, UsageData } from "@/types";

export function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [mode, setMode] = useState<"clinical_support" | "procedure_checklist">("clinical_support");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerateRequest | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsage = useCallback(async () => {
    try {
      const data = await fetchUsage();
      setUsageData(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsage();
    setRefreshing(false);
  }, [loadUsage]);

  const handleGenerate = async (request: GenerateRequest) => {
    setIsLoading(true);
    setError(null);
    setLastRequest(request);

    try {
      const data = await apiRequest<GenerateResponse>("POST", "/api/generate", request);
      setResult(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadUsage();
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.message || "An error occurred. Please try again.";
      if (msg.includes("paywall") || msg.includes("limit")) {
        setError("You've used all your free queries. Please subscribe to continue.");
      } else if (msg.includes("PHI")) {
        setError("Protected information detected. Please remove patient identifiers.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const data = await apiRequest<{ url: string }>("POST", "/api/stripe/create-checkout-session", {});
      if (data.url) {
        navigation.navigate("WebView", { url: data.url, title: "Subscribe" });
      }
    } catch {
      Alert.alert("Error", "Failed to start checkout. Please try again.");
    }
  };

  const handleNewQuery = () => {
    setResult(null);
    setLastRequest(null);
    setError(null);
  };

  const canQuery = usageData?.hasSubscription || (usageData?.freeQueriesUsed ?? 0) < FREE_QUERIES_LIMIT;

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <DisclaimerModal />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>thehealthprovider</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={[styles.avatarButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.avatarText, { color: colors.foreground }]}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {usageData && (
          <UsageBanner
            freeQueriesUsed={usageData.freeQueriesUsed}
            hasSubscription={usageData.hasSubscription}
            onUpgrade={handleUpgrade}
          />
        )}

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "30" }]}>
            <Ionicons name="alert-circle" size={18} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        {result && lastRequest ? (
          <ResultsScreen
            result={result}
            originalRequest={lastRequest}
            onBack={handleNewQuery}
            navigation={navigation}
          />
        ) : (
          <>
            <ModeToggle mode={mode} onChange={(m) => { setMode(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} />

            {!canQuery ? (
              <View style={styles.paywallBlock}>
                <Ionicons name="lock-closed" size={40} color={colors.mutedForeground} />
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>
                  Subscribe to continue
                </Text>
                <Text style={[styles.paywallDesc, { color: colors.mutedForeground }]}>
                  You've used all {FREE_QUERIES_LIMIT} free queries. Upgrade to Pro for unlimited access.
                </Text>
                <TouchableOpacity
                  style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
                  onPress={handleUpgrade}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subscribeText, { color: colors.primaryForeground }]}>
                    Subscribe Now - $10/month
                  </Text>
                </TouchableOpacity>
              </View>
            ) : mode === "clinical_support" ? (
              <ClinicalFormScreen onSubmit={handleGenerate} isLoading={isLoading} />
            ) : (
              <ProcedureFormScreen onSubmit={handleGenerate} isLoading={isLoading} />
            )}
          </>
        )}

        <View style={styles.disclaimerFooter}>
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            For trained clinicians only. Not medical advice. Do not enter patient identifiers.
          </Text>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              {mode === "clinical_support" ? "Generating clinical guidance..." : "Building procedure checklist..."}
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.mutedForeground }]}>
              This usually takes 5-15 seconds
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  avatarButton: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "600" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13 },
  paywallBlock: { alignItems: "center", paddingVertical: 40, gap: 12 },
  paywallTitle: { fontSize: 20, fontWeight: "700" },
  paywallDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  subscribeButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 8 },
  subscribeText: { fontSize: 16, fontWeight: "600" },
  disclaimerFooter: { paddingVertical: 16, alignItems: "center" },
  disclaimerText: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  loadingCard: {
    padding: 32, borderRadius: 16, alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    marginHorizontal: 40,
  },
  loadingText: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  loadingSubtext: { fontSize: 12 },
});
