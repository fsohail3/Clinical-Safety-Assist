import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, fetchUsage } from "@/api/client";
import { checkForPhi } from "@/lib/phi-filter";
import { ADMIN_EMAILS } from "@/config";
import type { UsageData } from "@/types";

export function SettingsScreen({ navigation }: any) {
  const { colors, mode, setMode, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      const data = await fetchUsage();
      setUsageData(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

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

  const handleManageBilling = async () => {
    try {
      const data = await apiRequest<{ url: string }>("POST", "/api/stripe/create-portal-session", {});
      if (data.url) {
        navigation.navigate("WebView", { url: data.url, title: "Billing" });
      }
    } catch {
      Alert.alert("Error", "Failed to open billing portal.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim() || feedbackLoading) return;

    const phiCheck = checkForPhi(feedbackMessage);
    if (!phiCheck.isClean) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Protected Information Detected",
        `Please remove the following before submitting:\n\n${phiCheck.blockedPatterns.join("\n")}`
      );
      return;
    }

    setFeedbackLoading(true);

    try {
      await apiRequest("POST", "/api/feedback", { message: feedbackMessage.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedbackSuccess(true);
      setFeedbackMessage("");
      setTimeout(() => {
        setFeedbackVisible(false);
        setFeedbackSuccess(false);
      }, 2000);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  const themeOptions: Array<{ label: string; value: "light" | "dark" | "system"; icon: string }> = [
    { label: "Light", value: "light", icon: "sunny" },
    { label: "Dark", value: "dark", icon: "moon" },
    { label: "System", value: "system", icon: "phone-portrait" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View style={[styles.subscriptionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.subscriptionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subscription</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: usageData?.hasSubscription ? colors.success + "20" : colors.muted },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: usageData?.hasSubscription ? colors.success : colors.mutedForeground },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: usageData?.hasSubscription ? colors.success : colors.mutedForeground },
                ]}
              >
                {usageData?.hasSubscription ? "Pro" : "Free"}
              </Text>
            </View>
          </View>

          {usageData && !usageData.hasSubscription && (
            <View style={styles.usageInfo}>
              <Text style={[styles.usageText, { color: colors.mutedForeground }]}>
                {5 - usageData.freeQueriesUsed} of 5 free queries remaining
              </Text>
              <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(usageData.freeQueriesUsed / 5) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {usageData?.hasSubscription ? (
            <TouchableOpacity
              style={[styles.billingButton, { borderColor: colors.border }]}
              onPress={handleManageBilling}
              activeOpacity={0.7}
            >
              <Ionicons name="card" size={18} color={colors.foreground} />
              <Text style={[styles.billingText, { color: colors.foreground }]}>Manage Billing</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color={colors.primaryForeground} />
              <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>
                Upgrade to Pro - $10/month
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, padding: 16, paddingBottom: 8 }]}>
            Appearance
          </Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOption,
                  { borderColor: mode === opt.value ? colors.primary : colors.border },
                  mode === opt.value && { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => {
                  setMode(opt.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={20}
                  color={mode === opt.value ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    { color: mode === opt.value ? colors.primary : colors.mutedForeground },
                    mode === opt.value && { fontWeight: "600" },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SettingsRow
            icon="chatbox"
            label="Send Feedback"
            colors={colors}
            onPress={() => setFeedbackVisible(true)}
          />
          {isAdmin && (
            <SettingsRow
              icon="stats-chart"
              label="Admin Panel"
              colors={colors}
              onPress={() => Linking.openURL("https://thehealthprovider.replit.app/admin")}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.destructive + "30" }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          thehealthprovider v1.0.0
        </Text>
      </ScrollView>

      <Modal visible={feedbackVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.feedbackModal, { backgroundColor: colors.card }]}>
            {feedbackSuccess ? (
              <View style={styles.feedbackSuccessView}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                <Text style={[styles.feedbackSuccessText, { color: colors.foreground }]}>
                  Thank you for your feedback!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.feedbackHeader}>
                  <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>
                    Share Your Feedback
                  </Text>
                  <TouchableOpacity onPress={() => setFeedbackVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.phiWarning, { backgroundColor: colors.amber + "10", borderColor: colors.amber + "30" }]}>
                  <Text style={[styles.phiWarningText, { color: colors.amber }]}>
                    Do not include patient identifiers or clinical details.
                  </Text>
                </View>

                <TextInput
                  style={[styles.feedbackInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.foreground }]}
                  placeholder="Type your feedback here..."
                  placeholderTextColor={colors.mutedForeground}
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                />

                <View style={styles.feedbackFooter}>
                  <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                    {feedbackMessage.length}/2000
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.feedbackSubmit,
                      { backgroundColor: colors.primary },
                      (!feedbackMessage.trim() || feedbackLoading) && { opacity: 0.6 },
                    ]}
                    onPress={handleSubmitFeedback}
                    disabled={!feedbackMessage.trim() || feedbackLoading}
                    activeOpacity={0.8}
                  >
                    {feedbackLoading ? (
                      <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                      <Ionicons name="send" size={16} color={colors.primaryForeground} />
                    )}
                    <Text style={[styles.feedbackSubmitText, { color: colors.primaryForeground }]}>
                      {feedbackLoading ? "Sending..." : "Submit"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, colors, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[styles.settingsRowLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1,
  },
  backButton: { width: 44, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "600" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  subscriptionCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  subscriptionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  usageInfo: { gap: 6 },
  usageText: { fontSize: 12 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  billingButton: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  billingText: { flex: 1, fontSize: 14, fontWeight: "500" },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 10,
  },
  upgradeBtnText: { fontSize: 15, fontWeight: "600" },
  settingsGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  themeRow: { flexDirection: "row", gap: 8, padding: 16, paddingTop: 8 },
  themeOption: {
    flex: 1, alignItems: "center", gap: 4,
    paddingVertical: 12, borderRadius: 10, borderWidth: 1,
  },
  themeLabel: { fontSize: 12 },
  settingsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsRowLabel: { fontSize: 15 },
  logoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
  versionText: { fontSize: 11, textAlign: "center" },
  modalOverlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  feedbackModal: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, gap: 14,
  },
  feedbackHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feedbackTitle: { fontSize: 18, fontWeight: "700" },
  phiWarning: { padding: 10, borderRadius: 8, borderWidth: 1 },
  phiWarningText: { fontSize: 12, fontWeight: "500" },
  feedbackInput: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14,
    minHeight: 120, textAlignVertical: "top",
  },
  feedbackFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  charCount: { fontSize: 11 },
  feedbackSubmit: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
  },
  feedbackSubmitText: { fontSize: 14, fontWeight: "600" },
  feedbackSuccessView: { alignItems: "center", paddingVertical: 40, gap: 12 },
  feedbackSuccessText: { fontSize: 16, fontWeight: "600" },
});
