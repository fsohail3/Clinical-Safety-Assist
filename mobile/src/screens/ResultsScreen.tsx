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
  Linking,
  Alert,
  Keyboard,
  ActivityIndicator,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeContext";
import { apiRequest } from "@/api/client";
import { checkForPhi } from "@/lib/phi-filter";
import type { GenerateResponse, GenerateRequest, Bullet, FollowUpTurn, FollowUpResponse } from "@/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getBulletText(bullet: Bullet): string {
  if (typeof bullet === "string") return bullet;
  return bullet.text;
}

interface ResultsScreenProps {
  result: GenerateResponse;
  originalRequest: GenerateRequest;
  onBack: () => void;
  navigation: any;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen(!open);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Ionicons name={icon as any} size={16} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {open && <View style={styles.cardContent}>{children}</View>}
    </View>
  );
}

export function ResultsScreen({ result, originalRequest, onBack, navigation }: ResultsScreenProps) {
  const { colors } = useTheme();
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpTurn[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const text = formatResultAsText(result);
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareResult = async () => {
    try {
      const text = formatResultAsText(result);
      await Share.share({ message: text });
    } catch {}
  };

  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim() || followUpLoading) return;
    Keyboard.dismiss();

    const phiCheck = checkForPhi(followUpQuestion);
    if (!phiCheck.isClean) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Protected Information Detected",
        `Please remove the following before submitting:\n\n${phiCheck.blockedPatterns.join("\n")}`
      );
      return;
    }

    setFollowUpLoading(true);

    try {
      const data = await apiRequest<FollowUpResponse>("POST", "/api/generate/follow-up", {
        mode: result.mode,
        originalRequest,
        originalOutput: result.output,
        followUpHistory: followUpHistory.slice(-4),
        newQuestion: followUpQuestion.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFollowUpHistory((prev) => [
        ...prev,
        { question: followUpQuestion.trim(), answer: data.answer },
      ]);
      setFollowUpQuestion("");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Follow-up failed", err?.message || "Please try again.");
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.resultHeader}>
        <View style={styles.resultHeaderLeft}>
          <Ionicons
            name={result.mode === "clinical_support" ? "medical" : "clipboard"}
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>
            {result.mode === "clinical_support" ? "Clinical Support" : "Procedure Checklist"}
          </Text>
        </View>
        <View style={styles.resultActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            onPress={copyToClipboard}
            activeOpacity={0.7}
          >
            <Ionicons name={copied ? "checkmark" : "copy"} size={16} color={copied ? colors.success : colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            onPress={shareResult}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newQueryBtn, { backgroundColor: colors.primary + "15" }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.newQueryText, { color: colors.primary }]}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
        <Text style={[styles.summaryText, { color: colors.foreground }]}>
          {result.output.summary}
        </Text>
      </View>

      {result.output.safety.redFlags.length > 0 && (
        <View style={[styles.redFlagCard, { backgroundColor: colors.destructive + "08", borderColor: colors.destructive + "30" }]}>
          <View style={styles.redFlagHeader}>
            <Ionicons name="warning" size={16} color={colors.destructive} />
            <Text style={[styles.redFlagTitle, { color: colors.destructive }]}>
              Red Flags - Immediate Attention Required
            </Text>
          </View>
          {result.output.safety.redFlags.map((flag, idx) => (
            <View key={idx} style={styles.redFlagItem}>
              <Ionicons name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.redFlagText, { color: colors.foreground }]}>{flag}</Text>
            </View>
          ))}
        </View>
      )}

      {result.output.sections.map((section, idx) => (
        <CollapsibleSection key={idx} title={section.title} icon="document-text">
          {section.bullets.map((bullet, bulletIdx) => (
            <View key={bulletIdx} style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[styles.bulletText, { color: colors.foreground }]}>
                {getBulletText(bullet)}
              </Text>
            </View>
          ))}
        </CollapsibleSection>
      ))}

      {(result.output.codes.icd10?.length || result.output.codes.cpt?.length) ? (
        <CollapsibleSection title="Coding Suggestions" icon="code-slash">
          {result.output.codes.icd10 && result.output.codes.icd10.length > 0 && (
            <View style={styles.codeSection}>
              <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>
                ICD-10-CM (Possible codes to consider)
              </Text>
              {result.output.codes.icd10.map((code, idx) => (
                <View key={idx} style={styles.codeRow}>
                  <View style={[styles.codeBadge, { borderColor: colors.border }]}>
                    <Text style={[styles.codeText, { color: colors.foreground }]}>{code.code}</Text>
                  </View>
                  <Text style={[styles.codeLabel2, { color: colors.foreground }]}>{code.label}</Text>
                </View>
              ))}
            </View>
          )}
          {result.output.codes.cpt && result.output.codes.cpt.length > 0 && (
            <View style={styles.codeSection}>
              <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>
                CPT (Confirm with facility coding)
              </Text>
              {result.output.codes.cpt.map((code, idx) => (
                <View key={idx} style={styles.codeRow}>
                  <View style={[styles.codeBadge, { borderColor: colors.border }]}>
                    <Text style={[styles.codeText, { color: colors.foreground }]}>{code.code_family}</Text>
                  </View>
                  <Text style={[styles.codeLabel2, { color: colors.foreground }]}>{code.label}</Text>
                </View>
              ))}
            </View>
          )}
        </CollapsibleSection>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setRefsOpen(!refsOpen);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="book" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>References</Text>
            {result.output.references && result.output.references.length > 0 && (
              <View style={[styles.refBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.refBadgeText, { color: colors.mutedForeground }]}>
                  {result.output.references.length}
                </Text>
              </View>
            )}
          </View>
          <Ionicons name={refsOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        {refsOpen && (
          <View style={styles.cardContent}>
            {result.output.references && result.output.references.length > 0 ? (
              result.output.references.map((ref) => (
                <View key={ref.number} style={styles.refItem}>
                  <Text style={[styles.refNumber, { color: colors.primary }]}>[{ref.number}]</Text>
                  <Text style={[styles.refText, { color: colors.mutedForeground }]}>{ref.apa}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(ref.url)}>
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={[styles.noRefs, { color: colors.mutedForeground }]}>
                {result.output.referenceNote || "No applicable references for this output."}
              </Text>
            )}
          </View>
        )}
      </View>

      {result.output.safety.limitations.length > 0 && (
        <View style={[styles.limitationsCard, { backgroundColor: colors.muted }]}>
          <View style={styles.limitationsHeader}>
            <Ionicons name="information-circle" size={16} color={colors.mutedForeground} />
            <Text style={[styles.limitationsTitle, { color: colors.mutedForeground }]}>
              Limitations & Uncertainty
            </Text>
          </View>
          {result.output.safety.limitations.map((lim, idx) => (
            <Text key={idx} style={[styles.limitationText, { color: colors.mutedForeground }]}>
              {"\u2022"} {lim}
            </Text>
          ))}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="chatbubble" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ask a follow-up</Text>
          </View>
          {followUpHistory.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setFollowUpHistory([]);
                setFollowUpQuestion("");
              }}
            >
              <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardContent}>
          {followUpHistory.map((turn, idx) => (
            <View key={idx} style={styles.followUpTurn}>
              <View style={[styles.followUpQ, { backgroundColor: colors.muted }]}>
                <Text style={[styles.followUpLabel, { color: colors.mutedForeground }]}>You asked:</Text>
                <Text style={[styles.followUpText, { color: colors.foreground }]}>{turn.question}</Text>
              </View>
              <View style={[styles.followUpA, { backgroundColor: colors.primary + "08" }]}>
                <Text style={[styles.followUpLabel, { color: colors.primary }]}>Response:</Text>
                <Text style={[styles.followUpText, { color: colors.foreground }]}>{turn.answer}</Text>
              </View>
            </View>
          ))}

          <TextInput
            style={[styles.followUpInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.foreground }]}
            placeholder="Type your follow-up question here..."
            placeholderTextColor={colors.mutedForeground + "80"}
            value={followUpQuestion}
            onChangeText={setFollowUpQuestion}
            multiline
            editable={!followUpLoading}
          />

          <TouchableOpacity
            style={[
              styles.followUpSubmit,
              { backgroundColor: colors.primary },
              (!followUpQuestion.trim() || followUpLoading) && { opacity: 0.6 },
            ]}
            onPress={handleFollowUpSubmit}
            disabled={!followUpQuestion.trim() || followUpLoading}
            activeOpacity={0.8}
          >
            {followUpLoading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Ionicons name="send" size={16} color={colors.primaryForeground} />
            )}
            <Text style={[styles.followUpSubmitText, { color: colors.primaryForeground }]}>
              {followUpLoading ? "Processing..." : "Ask Follow-up"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.followUpNote, { color: colors.mutedForeground }]}>
            Follow-up questions count toward your query limit. Do not include patient identifiers.
          </Text>
        </View>
      </View>

      <View style={[styles.disclaimerCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          Verify with institutional protocols and current guidelines. This tool may be incomplete. Clinical judgment should always take precedence.
        </Text>
        <Text style={[styles.debugId, { color: colors.mutedForeground }]}>
          Debug ID: {result.requestId}
        </Text>
      </View>
    </View>
  );
}

function formatResultAsText(result: GenerateResponse): string {
  let text = `${result.mode === "clinical_support" ? "CLINICAL SUPPORT" : "PROCEDURE CHECKLIST"} RESULTS\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `SUMMARY:\n${result.output.summary}\n\n`;

  if (result.output.safety.redFlags.length > 0) {
    text += `RED FLAGS:\n`;
    result.output.safety.redFlags.forEach((flag) => { text += `  ${flag}\n`; });
    text += `\n`;
  }

  result.output.sections.forEach((section) => {
    text += `${section.title.toUpperCase()}:\n`;
    section.bullets.forEach((bullet) => {
      text += `  ${getBulletText(bullet)}\n`;
    });
    text += `\n`;
  });

  if (result.output.codes.icd10?.length) {
    text += `ICD-10-CM CODES:\n`;
    result.output.codes.icd10.forEach((code) => { text += `  ${code.code}: ${code.label}\n`; });
    text += `\n`;
  }

  if (result.output.codes.cpt?.length) {
    text += `CPT CODES:\n`;
    result.output.codes.cpt.forEach((code) => { text += `  ${code.code_family}: ${code.label}\n`; });
    text += `\n`;
  }

  text += `${"=".repeat(50)}\n`;
  text += `DISCLAIMER: Verify with institutional protocols. Debug ID: ${result.requestId}\n`;
  return text;
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  resultHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  resultHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultTitle: { fontSize: 18, fontWeight: "700" },
  resultActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  newQueryBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, height: 36, borderRadius: 10,
  },
  newQueryText: { fontSize: 13, fontWeight: "600" },
  summaryCard: { padding: 16, borderRadius: 12 },
  summaryText: { fontSize: 14, lineHeight: 22 },
  redFlagCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  redFlagHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  redFlagTitle: { fontSize: 13, fontWeight: "600" },
  redFlagItem: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingLeft: 2 },
  redFlagText: { fontSize: 13, flex: 1, lineHeight: 19 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  bulletItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletText: { fontSize: 13, flex: 1, lineHeight: 19 },
  codeSection: { gap: 6 },
  codeLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  codeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  codeBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  codeText: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  codeLabel2: { fontSize: 13, flex: 1 },
  refBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  refBadgeText: { fontSize: 10, fontWeight: "600" },
  refItem: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  refNumber: { fontSize: 12, fontWeight: "700" },
  refText: { fontSize: 11, flex: 1, lineHeight: 16 },
  noRefs: { fontSize: 12 },
  limitationsCard: { padding: 14, borderRadius: 12, gap: 6 },
  limitationsHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  limitationsTitle: { fontSize: 13, fontWeight: "600" },
  limitationText: { fontSize: 12, lineHeight: 17, paddingLeft: 4 },
  followUpTurn: { gap: 6, marginBottom: 8 },
  followUpQ: { padding: 10, borderRadius: 8 },
  followUpA: { padding: 10, borderRadius: 8 },
  followUpLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  followUpText: { fontSize: 13, lineHeight: 19 },
  followUpInput: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14,
    minHeight: 60, textAlignVertical: "top",
  },
  followUpSubmit: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 10,
  },
  followUpSubmitText: { fontSize: 14, fontWeight: "600" },
  followUpNote: { fontSize: 10, textAlign: "center" },
  clearText: { fontSize: 12, fontWeight: "500" },
  disclaimerCard: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  disclaimerText: { fontSize: 11, textAlign: "center", lineHeight: 16, fontWeight: "600" },
  debugId: { fontSize: 10, marginTop: 4 },
});
