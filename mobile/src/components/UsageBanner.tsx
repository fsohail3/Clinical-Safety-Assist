import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { FREE_QUERIES_LIMIT } from "@/config";

interface UsageBannerProps {
  freeQueriesUsed: number;
  hasSubscription: boolean;
  onUpgrade: () => void;
}

export function UsageBanner({ freeQueriesUsed, hasSubscription, onUpgrade }: UsageBannerProps) {
  const { colors } = useTheme();

  if (hasSubscription) {
    return (
      <View style={[styles.proBanner, { backgroundColor: colors.primary + "10" }]}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={[styles.proText, { color: colors.mutedForeground }]}>
          Pro subscriber - Unlimited queries
        </Text>
      </View>
    );
  }

  const remaining = FREE_QUERIES_LIMIT - freeQueriesUsed;
  const progress = (freeQueriesUsed / FREE_QUERIES_LIMIT) * 100;

  if (remaining <= 0) {
    return (
      <View style={[styles.endedBanner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
        <View style={styles.endedHeader}>
          <Ionicons name="card" size={16} color={colors.destructive} />
          <Text style={[styles.endedTitle, { color: colors.destructive }]}>Free trial ended</Text>
        </View>
        <Text style={[styles.endedDesc, { color: colors.mutedForeground }]}>
          You've used all {FREE_QUERIES_LIMIT} free queries. Subscribe to continue using thehealthprovider.
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={onUpgrade}
          activeOpacity={0.8}
        >
          <Text style={[styles.upgradeButtonText, { color: colors.primaryForeground }]}>
            Subscribe Now - $10/month
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.freeBanner, { backgroundColor: colors.muted }]}>
      <View style={styles.freeHeader}>
        <Text style={[styles.freeText, { color: colors.mutedForeground }]}>
          Free queries: {remaining} of {FREE_QUERIES_LIMIT} remaining
        </Text>
        <TouchableOpacity onPress={onUpgrade}>
          <Text style={[styles.upgradeLink, { color: colors.primary }]}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  proBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  proText: { fontSize: 12 },
  endedBanner: { padding: 16, borderRadius: 10, borderWidth: 1, gap: 8 },
  endedHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  endedTitle: { fontSize: 14, fontWeight: "600" },
  endedDesc: { fontSize: 12 },
  upgradeButton: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  upgradeButtonText: { fontSize: 14, fontWeight: "600" },
  freeBanner: { padding: 12, borderRadius: 8, gap: 8 },
  freeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  freeText: { fontSize: 12 },
  upgradeLink: { fontSize: 12, fontWeight: "500" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
});
