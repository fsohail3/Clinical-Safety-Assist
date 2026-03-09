import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>thehealthprovider</Text>
          <View style={[styles.badge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
              For Healthcare Professionals Only
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.foreground }]}>
            Clinical Decision Support at the Point of Care
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Generate structured clinical guidance, procedure checklists, and safety callouts in seconds.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <FeatureCard
            icon="medical"
            title="Clinical Support"
            description="Differential diagnoses, triage levels, workup recommendations, and ICD-10 codes"
            colors={colors}
          />
          <FeatureCard
            icon="clipboard"
            title="Procedure Checklist"
            description="Step-by-step procedural workflows with CPT coding guidance"
            colors={colors}
          />
        </View>

        <View style={styles.trustSection}>
          <TrustItem icon="checkmark-circle" text="5 free queries" colors={colors} />
          <TrustItem icon="checkmark-circle" text="No credit card required" colors={colors} />
          <TrustItem icon="checkmark-circle" text="HIPAA-conscious design" colors={colors} />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={onLogin}
          activeOpacity={0.8}
        >
          <Text style={[styles.loginButtonText, { color: colors.primaryForeground }]}>
            Get Started Free
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInLink]}
          onPress={onLogin}
          activeOpacity={0.7}
        >
          <Text style={[styles.signInText, { color: colors.primary }]}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>

        <View style={styles.pricingSection}>
          <Text style={[styles.pricingTitle, { color: colors.foreground }]}>Simple Pricing</Text>
          <View style={styles.pricingCards}>
            <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.pricingPlan, { color: colors.foreground }]}>Free Trial</Text>
              <Text style={[styles.pricingPrice, { color: colors.foreground }]}>$0</Text>
              <Text style={[styles.pricingDetail, { color: colors.mutedForeground }]}>5 queries total</Text>
            </View>
            <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
                <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: "600" }}>Recommended</Text>
              </View>
              <Text style={[styles.pricingPlan, { color: colors.foreground }]}>Pro</Text>
              <Text style={[styles.pricingPrice, { color: colors.foreground }]}>
                $10<Text style={[styles.pricingPeriod, { color: colors.mutedForeground }]}>/mo</Text>
              </Text>
              <Text style={[styles.pricingDetail, { color: colors.mutedForeground }]}>Unlimited queries</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Not medical advice. Do not enter patient identifiers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, description, colors }: any) {
  return (
    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary + "15" }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

function TrustItem({ icon, text, colors }: any) {
  return (
    <View style={styles.trustItem}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.trustText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  heroSection: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  iconContainer: {
    width: 72, height: 72, borderRadius: 18,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  subtitle: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  description: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  featuresSection: { gap: 12, marginBottom: 24 },
  featureCard: {
    padding: 16, borderRadius: 12, borderWidth: 1,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  featureTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  featureDesc: { fontSize: 13, lineHeight: 18 },
  trustSection: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 24 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustText: { fontSize: 13 },
  loginButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 12, gap: 8, marginBottom: 12,
  },
  loginButtonText: { fontSize: 17, fontWeight: "600" },
  signInLink: { alignItems: "center", marginBottom: 32 },
  signInText: { fontSize: 14, fontWeight: "500" },
  pricingSection: { alignItems: "center", marginBottom: 32 },
  pricingTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  pricingCards: { flexDirection: "row", gap: 12, width: "100%" },
  pricingCard: {
    flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center",
  },
  recommendedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 8 },
  pricingPlan: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  pricingPrice: { fontSize: 28, fontWeight: "700" },
  pricingPeriod: { fontSize: 14, fontWeight: "400" },
  pricingDetail: { fontSize: 12, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerText: { fontSize: 11 },
});
