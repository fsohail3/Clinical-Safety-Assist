import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

interface ModeToggleProps {
  mode: "clinical_support" | "procedure_checklist";
  onChange: (mode: "clinical_support" | "procedure_checklist") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.muted }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          mode === "clinical_support" && { backgroundColor: colors.card },
          mode === "clinical_support" && styles.activeTab,
        ]}
        onPress={() => onChange("clinical_support")}
        activeOpacity={0.7}
      >
        <Ionicons
          name="medical"
          size={18}
          color={mode === "clinical_support" ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabText,
            { color: mode === "clinical_support" ? colors.foreground : colors.mutedForeground },
            mode === "clinical_support" && styles.activeTabText,
          ]}
        >
          Clinical Support
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          mode === "procedure_checklist" && { backgroundColor: colors.card },
          mode === "procedure_checklist" && styles.activeTab,
        ]}
        onPress={() => onChange("procedure_checklist")}
        activeOpacity={0.7}
      >
        <Ionicons
          name="clipboard"
          size={18}
          color={mode === "procedure_checklist" ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabText,
            { color: mode === "procedure_checklist" ? colors.foreground : colors.mutedForeground },
            mode === "procedure_checklist" && styles.activeTabText,
          ]}
        >
          Procedure Checklist
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", borderRadius: 10, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 8,
  },
  activeTab: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "500" },
  activeTabText: { fontWeight: "600" },
});
