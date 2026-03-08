import React, { useState } from "react";
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
  ScrollView,
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

const COMMON_PROCEDURES = [
  "Peripheral IV Cannulation",
  "Foley Catheter Insertion",
  "Wound Suturing",
  "Lumbar Puncture",
  "Central Line Placement",
  "Endotracheal Intubation",
  "Minor Skin Biopsy",
  "Vaccination",
  "Incision and Drainage",
  "Urinary Sample Collection",
];

const SETTINGS: { label: string; value: NonNullable<GenerateRequest["setting"]> }[] = [
  { label: "Inpatient", value: "inpatient" },
  { label: "Outpatient", value: "outpatient" },
  { label: "Emergency Dept", value: "ed" },
  { label: "Clinic", value: "clinic" },
];

const ANESTHESIA_TYPES: { label: string; value: NonNullable<GenerateRequest["anesthesiaType"]> }[] = [
  { label: "None", value: "none" },
  { label: "Local", value: "local" },
  { label: "Regional", value: "regional" },
  { label: "General", value: "general" },
];

interface ProcedureFormScreenProps {
  onSubmit: (request: GenerateRequest) => void;
  isLoading: boolean;
}

export function ProcedureFormScreen({ onSubmit, isLoading }: ProcedureFormScreenProps) {
  const { colors } = useTheme();
  const [procedureName, setProcedureName] = useState("");
  const [setting, setSetting] = useState<GenerateRequest["setting"]>();
  const [anesthesiaType, setAnesthesiaType] = useState<GenerateRequest["anesthesiaType"]>();
  const [patientContext, setPatientContext] = useState<PatientContext>({});
  const [showContext, setShowContext] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phiWarning, setPhiWarning] = useState<{ visible: boolean; patterns: string[] }>({
    visible: false,
    patterns: [],
  });

  const filteredProcedures = procedureName.trim()
    ? COMMON_PROCEDURES.filter((p) => p.toLowerCase().includes(procedureName.toLowerCase()))
    : COMMON_PROCEDURES;

  const validateTypedInputs = (): string | null => {
    const ctx = patientContext;
    if (ctx.ageInputMode === "typed") {
      if (ctx.ageYears === null || ctx.ageYears === undefined) return "Please enter an age value (0-120).";
      if (!Number.isInteger(ctx.ageYears) || ctx.ageYears < 0 || ctx.ageYears > 120) return "Age must be between 0 and 120.";
    }
    if (ctx.weightInputMode === "typed") {
      if (ctx.weightValue === null || ctx.weightValue === undefined) return "Please enter a weight value.";
      if (ctx.weightValue <= 0) return "Weight must be greater than 0.";
    }
    return null;
  };

  const handleSubmit = () => {
    Keyboard.dismiss();

    if (!procedureName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPhiWarning({ visible: true, patterns: ["Please enter a procedure name."] });
      return;
    }

    const phiCheck = checkForPhi(procedureName);
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
      mode: "procedure_checklist",
      patientContext: Object.keys(patientContext).length > 0 ? patientContext : undefined,
      procedureName: procedureName.trim(),
      setting,
      anesthesiaType,
    });
  };

  const contextCount = [
    patientContext.ageRange || patientContext.ageYears != null,
    patientContext.sexAtBirth,
    (patientContext.symptoms || []).length > 0,
    (patientContext.comorbidities || []).length > 0,
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="clipboard" size={18} color={colors.primary} />
        <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>Procedure Details</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Procedure Name *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: procedureName ? colors.primary : colors.inputBorder,
              color: colors.foreground,
            },
          ]}
          placeholder="e.g., Lumbar Puncture"
          placeholderTextColor={colors.mutedForeground + "80"}
          value={procedureName}
          onChangeText={(text) => {
            setProcedureName(text);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />

        {showSuggestions && filteredProcedures.length > 0 && (
          <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.suggestionsLabel, { color: colors.mutedForeground }]}>
              Quick Select
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {filteredProcedures.map((proc) => (
                <TouchableOpacity
                  key={proc}
                  style={[styles.suggestionChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => {
                    setProcedureName(proc);
                    setShowSuggestions(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{proc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Clinical Setting</Text>
        <View style={styles.pillRow}>
          {SETTINGS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.pill,
                { borderColor: setting === s.value ? colors.primary : colors.border },
                setting === s.value && { backgroundColor: colors.primary + "15" },
              ]}
              onPress={() => {
                setSetting(s.value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: setting === s.value ? colors.primary : colors.mutedForeground },
                  setting === s.value && { fontWeight: "600" },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Anesthesia Type</Text>
        <View style={styles.pillRow}>
          {ANESTHESIA_TYPES.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[
                styles.pill,
                { borderColor: anesthesiaType === a.value ? colors.primary : colors.border },
                anesthesiaType === a.value && { backgroundColor: colors.primary + "15" },
              ]}
              onPress={() => {
                setAnesthesiaType(a.value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: anesthesiaType === a.value ? colors.primary : colors.mutedForeground },
                  anesthesiaType === a.value && { fontWeight: "600" },
                ]}
              >
                {a.label}
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
          <Text style={[styles.contextToggleText, { color: colors.foreground }]}>Patient Context</Text>
          <Text style={[styles.contextOptional, { color: colors.mutedForeground }]}>Optional</Text>
          {contextCount > 0 && (
            <View style={[styles.contextBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.contextBadgeText, { color: colors.primaryForeground }]}>{contextCount}</Text>
            </View>
          )}
        </View>
        <Ionicons name={showContext ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {showContext && (
        <PatientContextForm value={patientContext} onChange={setPatientContext} />
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          (!procedureName.trim() || isLoading) && { opacity: 0.6 },
        ]}
        onPress={handleSubmit}
        disabled={isLoading || !procedureName.trim()}
        activeOpacity={0.8}
      >
        <Ionicons name="send" size={18} color={colors.primaryForeground} />
        <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
          Generate Procedure Checklist
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
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  suggestions: { borderWidth: 1, borderRadius: 10, padding: 10 },
  suggestionsLabel: { fontSize: 11, fontWeight: "500", marginBottom: 6 },
  suggestionsScroll: { flexDirection: "row" },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, marginRight: 6,
  },
  suggestionText: { fontSize: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
  },
  pillText: { fontSize: 13 },
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
