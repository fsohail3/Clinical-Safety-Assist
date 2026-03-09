import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeContext";
import { PatientContextForm } from "@/components/PatientContextForm";
import { PhiWarningModal } from "@/components/PhiWarningModal";
import { checkForPhi } from "@/lib/phi-filter";
import type { GenerateRequest, PatientContext } from "@/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ClinicalFormScreenProps {
  onSubmit: (request: GenerateRequest) => void;
  isLoading: boolean;
}

const DURATIONS: { label: string; value: GenerateRequest["complaintDuration"] }[] = [
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
  { label: "Months", value: "months" },
];

export function ClinicalFormScreen({ onSubmit, isLoading }: ClinicalFormScreenProps) {
  const { colors } = useTheme();
  const [complaintText, setComplaintText] = useState("");
  const [complaintDuration, setComplaintDuration] = useState<GenerateRequest["complaintDuration"]>();
  const [patientContext, setPatientContext] = useState<PatientContext>({});
  const [showContext, setShowContext] = useState(false);
  const [phiWarning, setPhiWarning] = useState<{ visible: boolean; patterns: string[] }>({
    visible: false,
    patterns: [],
  });
  const inputRef = useRef<TextInput>(null);

  const validateTypedInputs = (): string | null => {
    const ctx = patientContext;
    if (ctx.ageInputMode === "typed") {
      if (ctx.ageYears === null || ctx.ageYears === undefined) return "Please enter an age value (0-120).";
      if (!Number.isInteger(ctx.ageYears) || ctx.ageYears < 0 || ctx.ageYears > 120) return "Age must be a whole number between 0 and 120.";
    }
    if (ctx.weightInputMode === "typed") {
      if (ctx.weightValue === null || ctx.weightValue === undefined) return "Please enter a weight value.";
      if (ctx.weightValue <= 0) return "Weight must be greater than 0.";
      const unit = ctx.weightUnit || "lb";
      if (unit === "lb" && ctx.weightValue > 1500) return "Weight exceeds maximum (1500 lb).";
      if (unit === "kg" && ctx.weightValue > 700) return "Weight exceeds maximum (700 kg).";
    }
    return null;
  };

  const handleSubmit = () => {
    Keyboard.dismiss();

    const phiCheck = checkForPhi(complaintText);
    if (!phiCheck.isClean) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPhiWarning({ visible: true, patterns: phiCheck.blockedPatterns });
      return;
    }

    const validationError = validateTypedInputs();
    if (validationError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPhiWarning({ visible: true, patterns: [validationError] });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit({
      mode: "clinical_support",
      patientContext: Object.keys(patientContext).length > 0 ? patientContext : undefined,
      complaintText: complaintText.trim() || undefined,
      complaintDuration,
    });
  };

  const contextCount = [
    patientContext.ageRange || patientContext.ageYears != null,
    patientContext.sexAtBirth,
    (patientContext.symptoms || []).length > 0,
    (patientContext.comorbidities || []).length > 0,
    (patientContext.allergies || []).length > 0,
    (patientContext.medications || []).length > 0,
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="medical" size={18} color={colors.primary} />
        <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>Chief Complaint</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          Describe the chief complaint (de-identified)
        </Text>
        <TextInput
          ref={inputRef}
          style={[
            styles.textarea,
            {
              backgroundColor: colors.inputBackground,
              borderColor: complaintText ? colors.primary : colors.inputBorder,
              color: colors.foreground,
            },
          ]}
          placeholder="e.g., Adult presenting with acute onset chest pain, radiating to left arm..."
          placeholderTextColor={colors.mutedForeground + "80"}
          value={complaintText}
          onChangeText={setComplaintText}
          multiline
          textAlignVertical="top"
          returnKeyType="default"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Symptom Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[
                styles.durationPill,
                { borderColor: complaintDuration === d.value ? colors.primary : colors.border },
                complaintDuration === d.value && { backgroundColor: colors.primary + "15" },
              ]}
              onPress={() => {
                setComplaintDuration(d.value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.durationText,
                  { color: complaintDuration === d.value ? colors.primary : colors.mutedForeground },
                  complaintDuration === d.value && { fontWeight: "600" },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.contextToggle, { borderColor: colors.border }]}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setShowContext(!showContext);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.contextToggleLeft}>
          <Ionicons name="person" size={16} color={colors.primary} />
          <Text style={[styles.contextToggleText, { color: colors.foreground }]}>
            Patient Context
          </Text>
          <Text style={[styles.contextOptional, { color: colors.mutedForeground }]}>Optional</Text>
          {contextCount > 0 && (
            <View style={[styles.contextBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.contextBadgeText, { color: colors.primaryForeground }]}>
                {contextCount}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name={showContext ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {showContext && (
        <PatientContextForm value={patientContext} onChange={setPatientContext} />
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isLoading && { opacity: 0.7 },
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Ionicons name="send" size={18} color={colors.primaryForeground} />
        <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
          Generate Clinical Support
        </Text>
      </TouchableOpacity>

      <PhiWarningModal
        visible={phiWarning.visible}
        onClose={() => setPhiWarning({ visible: false, patterns: [] })}
        blockedPatterns={phiWarning.patterns}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLabel: { fontSize: 14, fontWeight: "600" },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "500" },
  textarea: {
    borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15,
    minHeight: 110, lineHeight: 22,
  },
  durationRow: { flexDirection: "row", gap: 8 },
  durationPill: {
    flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
    alignItems: "center",
  },
  durationText: { fontSize: 13 },
  contextToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  contextToggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  contextToggleText: { fontSize: 14, fontWeight: "600" },
  contextOptional: { fontSize: 11 },
  contextBadge: {
    width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  contextBadgeText: { fontSize: 10, fontWeight: "700" },
  submitButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 12,
  },
  submitText: { fontSize: 16, fontWeight: "600" },
});
