import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

interface PhiWarningModalProps {
  visible: boolean;
  onClose: () => void;
  blockedPatterns: string[];
}

export function PhiWarningModal({ visible, onClose, blockedPatterns }: PhiWarningModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: colors.destructive + "15" }]}>
              <Ionicons name="warning" size={24} color={colors.destructive} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Protected Information Detected
            </Text>
          </View>

          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            The following patterns were detected in your input. Please remove patient identifiers before submitting:
          </Text>

          {blockedPatterns.map((pattern, idx) => (
            <View key={idx} style={[styles.patternRow, { backgroundColor: colors.destructive + "10" }]}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.patternText, { color: colors.foreground }]}>{pattern}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              I Understand
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", padding: 24,
  },
  modal: { borderRadius: 16, padding: 24, width: "100%" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", flex: 1 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  patternRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 8, marginBottom: 6,
  },
  patternText: { fontSize: 13, flex: 1 },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 12 },
  buttonText: { fontSize: 15, fontWeight: "600" },
});
