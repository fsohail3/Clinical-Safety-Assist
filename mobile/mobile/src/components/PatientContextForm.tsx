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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import type { PatientContext } from "@/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Shortness of breath", "Chest pain", "Headache",
  "Nausea", "Vomiting", "Diarrhea", "Fatigue", "Dizziness",
  "Abdominal pain", "Back pain", "Joint pain", "Rash", "Swelling",
];

const RED_FLAG_SYMPTOMS = [
  "Altered mental status", "Severe chest pain", "Difficulty breathing",
  "Uncontrolled bleeding", "Signs of stroke", "Severe allergic reaction",
  "High fever (>104F)", "Severe dehydration", "Loss of consciousness",
];

const COMMON_COMORBIDITIES = [
  "Diabetes", "Hypertension", "Heart disease", "COPD", "Asthma",
  "Chronic kidney disease", "Liver disease", "Cancer", "HIV/AIDS",
  "Obesity", "Stroke history",
];

const COMMON_ALLERGIES = [
  "Penicillin", "Sulfa drugs", "NSAIDs", "Latex", "Contrast dye",
  "Morphine", "Codeine", "Aspirin",
];

interface PatientContextFormProps {
  value: PatientContext;
  onChange: (context: PatientContext) => void;
}

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return (
    <View style={[styles.section, { borderColor: colors.border }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon as any} size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {open && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  variant = "default",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: "default" | "danger";
}) {
  const { colors } = useTheme();
  const activeColor = variant === "danger" ? colors.destructive : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: selected ? activeColor : colors.border },
        selected && { backgroundColor: activeColor + "15" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? activeColor : colors.mutedForeground },
          selected && { fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function OptionPill({
  label,
  value,
  selectedValue,
  onPress,
}: {
  label: string;
  value: string;
  selectedValue?: string;
  onPress: (value: string) => void;
}) {
  const { colors } = useTheme();
  const selected = selectedValue === value;

  return (
    <TouchableOpacity
      style={[
        styles.optionPill,
        { borderColor: selected ? colors.primary : colors.border },
        selected && { backgroundColor: colors.primary + "15" },
      ]}
      onPress={() => onPress(value)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionPillText,
          { color: selected ? colors.primary : colors.mutedForeground },
          selected && { fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function PatientContextForm({ value, onChange }: PatientContextFormProps) {
  const { colors } = useTheme();
  const [customAllergy, setCustomAllergy] = useState("");
  const [customMed, setCustomMed] = useState("");

  const toggleItem = (key: "symptoms" | "redFlagSymptoms" | "comorbidities" | "allergies", item: string) => {
    const current = (value[key] || []) as string[];
    const updated = current.includes(item)
      ? current.filter((s) => s !== item)
      : [...current, item];
    onChange({ ...value, [key]: updated });
  };

  return (
    <View style={styles.container}>
      <Section title="Demographics" icon="person" defaultOpen={true}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Age</Text>
          <View style={styles.pillRow}>
            <OptionPill label="Child (0-12)" value="child" selectedValue={value.ageRange} onPress={(v) => onChange({ ...value, ageRange: v as any, ageInputMode: "select" })} />
            <OptionPill label="Teen (13-17)" value="adolescent" selectedValue={value.ageRange} onPress={(v) => onChange({ ...value, ageRange: v as any, ageInputMode: "select" })} />
            <OptionPill label="Adult (18-64)" value="adult" selectedValue={value.ageRange} onPress={(v) => onChange({ ...value, ageRange: v as any, ageInputMode: "select" })} />
            <OptionPill label="65+" value="older_adult" selectedValue={value.ageRange} onPress={(v) => onChange({ ...value, ageRange: v as any, ageInputMode: "select" })} />
          </View>
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>or enter exact age</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.foreground }]}
            placeholder="Age in years"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={value.ageYears != null ? String(value.ageYears) : ""}
            onChangeText={(text) => {
              const val = text === "" ? null : parseInt(text, 10);
              onChange({
                ...value,
                ageYears: val,
                ageInputMode: "typed",
                ageRange: undefined,
                ageYearsGrouped: val != null && val >= 90 ? "90+" : null,
              });
            }}
            maxLength={3}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Sex at Birth</Text>
          <View style={styles.pillRow}>
            <OptionPill label="Male" value="male" selectedValue={value.sexAtBirth} onPress={(v) => onChange({ ...value, sexAtBirth: v as any })} />
            <OptionPill label="Female" value="female" selectedValue={value.sexAtBirth} onPress={(v) => onChange({ ...value, sexAtBirth: v as any })} />
            <OptionPill label="Unknown" value="unknown" selectedValue={value.sexAtBirth} onPress={(v) => onChange({ ...value, sexAtBirth: v as any })} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pregnancy Status</Text>
          <View style={styles.pillRow}>
            <OptionPill label="Yes" value="yes" selectedValue={value.pregnancy} onPress={(v) => onChange({ ...value, pregnancy: v as any })} />
            <OptionPill label="No" value="no" selectedValue={value.pregnancy} onPress={(v) => onChange({ ...value, pregnancy: v as any })} />
            <OptionPill label="Unknown" value="unknown" selectedValue={value.pregnancy} onPress={(v) => onChange({ ...value, pregnancy: v as any })} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Weight</Text>
          <View style={styles.pillRow}>
            <OptionPill label="Underweight" value="underweight" selectedValue={value.weightRange} onPress={(v) => onChange({ ...value, weightRange: v as any, weightInputMode: "select" })} />
            <OptionPill label="Normal" value="normal" selectedValue={value.weightRange} onPress={(v) => onChange({ ...value, weightRange: v as any, weightInputMode: "select" })} />
            <OptionPill label="Overweight" value="overweight" selectedValue={value.weightRange} onPress={(v) => onChange({ ...value, weightRange: v as any, weightInputMode: "select" })} />
            <OptionPill label="Obese" value="obese" selectedValue={value.weightRange} onPress={(v) => onChange({ ...value, weightRange: v as any, weightInputMode: "select" })} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Immunosuppressed</Text>
          <View style={styles.pillRow}>
            <OptionPill label="Yes" value="yes" selectedValue={value.immunosuppressed} onPress={(v) => onChange({ ...value, immunosuppressed: v as any })} />
            <OptionPill label="No" value="no" selectedValue={value.immunosuppressed} onPress={(v) => onChange({ ...value, immunosuppressed: v as any })} />
            <OptionPill label="Unknown" value="unknown" selectedValue={value.immunosuppressed} onPress={(v) => onChange({ ...value, immunosuppressed: v as any })} />
          </View>
        </View>
      </Section>

      <Section title="Symptoms" icon="pulse">
        <Text style={[styles.chipSectionLabel, { color: colors.mutedForeground }]}>
          Tap to select (multiple allowed)
        </Text>
        <View style={styles.chipWrap}>
          {COMMON_SYMPTOMS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={(value.symptoms || []).includes(s)}
              onPress={() => toggleItem("symptoms", s)}
            />
          ))}
        </View>
      </Section>

      <Section title="Red Flag Symptoms" icon="alert-circle">
        <View style={styles.chipWrap}>
          {RED_FLAG_SYMPTOMS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={(value.redFlagSymptoms || []).includes(s)}
              onPress={() => toggleItem("redFlagSymptoms", s)}
              variant="danger"
            />
          ))}
        </View>
      </Section>

      <Section title="Comorbidities" icon="fitness">
        <View style={styles.chipWrap}>
          {COMMON_COMORBIDITIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={(value.comorbidities || []).includes(c)}
              onPress={() => toggleItem("comorbidities", c)}
            />
          ))}
        </View>
      </Section>

      <Section title="Allergies" icon="flask">
        <View style={styles.chipWrap}>
          {COMMON_ALLERGIES.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={(value.allergies || []).includes(a)}
              onPress={() => toggleItem("allergies", a)}
            />
          ))}
        </View>
        <View style={styles.addCustomRow}>
          <TextInput
            style={[styles.addInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.foreground }]}
            placeholder="Add custom allergy..."
            placeholderTextColor={colors.mutedForeground}
            value={customAllergy}
            onChangeText={setCustomAllergy}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (customAllergy.trim()) {
                const current = value.allergies || [];
                if (!current.includes(customAllergy.trim())) {
                  onChange({ ...value, allergies: [...current, customAllergy.trim()] });
                }
                setCustomAllergy("");
              }
            }}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary, opacity: customAllergy.trim() ? 1 : 0.5 }]}
            onPress={() => {
              if (customAllergy.trim()) {
                const current = value.allergies || [];
                if (!current.includes(customAllergy.trim())) {
                  onChange({ ...value, allergies: [...current, customAllergy.trim()] });
                }
                setCustomAllergy("");
              }
            }}
            disabled={!customAllergy.trim()}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </Section>

      <Section title="Medications" icon="medkit">
        {(value.medications || []).length > 0 && (
          <View style={styles.chipWrap}>
            {(value.medications || []).map((m) => (
              <Chip
                key={m}
                label={m}
                selected={true}
                onPress={() => {
                  const updated = (value.medications || []).filter((x) => x !== m);
                  onChange({ ...value, medications: updated });
                }}
              />
            ))}
          </View>
        )}
        <View style={styles.addCustomRow}>
          <TextInput
            style={[styles.addInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.foreground }]}
            placeholder="Add medication..."
            placeholderTextColor={colors.mutedForeground}
            value={customMed}
            onChangeText={setCustomMed}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (customMed.trim()) {
                const current = value.medications || [];
                if (!current.includes(customMed.trim())) {
                  onChange({ ...value, medications: [...current, customMed.trim()] });
                }
                setCustomMed("");
              }
            }}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary, opacity: customMed.trim() ? 1 : 0.5 }]}
            onPress={() => {
              if (customMed.trim()) {
                const current = value.medications || [];
                if (!current.includes(customMed.trim())) {
                  onChange({ ...value, medications: [...current, customMed.trim()] });
                }
                setCustomMed("");
              }
            }}
            disabled={!customMed.trim()}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  section: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  sectionContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "500" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 11 },
  input: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 12 },
  chipSectionLabel: { fontSize: 11, marginBottom: 2 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  optionPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  optionPillText: { fontSize: 12 },
  addCustomRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  addInput: {
    flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13,
  },
  addButton: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
