import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

const DISCLAIMER_KEY = "thp_disclaimer_accepted";

export function DisclaimerModal() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, "true");
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBg, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Welcome to thehealthprovider
              </Text>
            </View>

            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Before using this clinical decision support tool, please review and accept these important terms:
            </Text>

            <View style={[styles.termCard, { backgroundColor: colors.muted }]}>
              <Ionicons name="heart" size={18} color={colors.primary} style={styles.termIcon} />
              <View style={styles.termContent}>
                <Text style={[styles.termTitle, { color: colors.foreground }]}>For Trained Clinicians Only</Text>
                <Text style={[styles.termDesc, { color: colors.mutedForeground }]}>
                  This tool is intended for use by licensed healthcare professionals only. It is not a substitute for clinical judgment.
                </Text>
              </View>
            </View>

            <View style={[styles.termCard, { backgroundColor: colors.muted }]}>
              <Ionicons name="warning" size={18} color={colors.destructive} style={styles.termIcon} />
              <View style={styles.termContent}>
                <Text style={[styles.termTitle, { color: colors.foreground }]}>Not Medical Advice</Text>
                <Text style={[styles.termDesc, { color: colors.mutedForeground }]}>
                  Outputs are suggestions only. Always verify with institutional protocols, current guidelines, and your professional expertise.
                </Text>
              </View>
            </View>

            <View style={[styles.termCard, { backgroundColor: colors.muted }]}>
              <Ionicons name="lock-closed" size={18} color={colors.primary} style={styles.termIcon} />
              <View style={styles.termContent}>
                <Text style={[styles.termTitle, { color: colors.foreground }]}>Privacy Protection</Text>
                <Text style={[styles.termDesc, { color: colors.mutedForeground }]}>
                  Do not enter any patient identifiable information (PHI). Use de-identified data only.
                </Text>
              </View>
            </View>

            <Text style={[styles.agreement, { color: colors.mutedForeground }]}>
              By tapping "I Accept", you acknowledge that you are a trained healthcare professional and agree to use this tool in accordance with these guidelines.
            </Text>

            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={[styles.acceptText, { color: colors.primaryForeground }]}>I Accept</Text>
            </TouchableOpacity>
          </ScrollView>
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
  modal: { borderRadius: 16, padding: 24, width: "100%", maxHeight: "85%" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  iconBg: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", flex: 1 },
  intro: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  termCard: { flexDirection: "row", padding: 12, borderRadius: 10, marginBottom: 10, gap: 10 },
  termIcon: { marginTop: 2 },
  termContent: { flex: 1 },
  termTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  termDesc: { fontSize: 12, lineHeight: 17 },
  agreement: { fontSize: 11, lineHeight: 16, marginTop: 12, marginBottom: 16 },
  acceptButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  acceptText: { fontSize: 16, fontWeight: "600" },
});
