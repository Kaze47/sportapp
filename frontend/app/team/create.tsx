import { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text, SPORTS } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const SKILLS = ["Casual", "Amateur", "Competitive"] as const;

export default function CreateTeam() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [sport, setSport] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState<typeof SKILLS[number]>("Amateur");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !sport || !location.trim()) {
      Alert.alert("Almost there", "Fill name, sport and home location.");
      return;
    }
    setLoading(true);
    try {
      const team = await api.createTeam({ user_id: user.id, name: name.trim(), sport, location: location.trim(), skill });
      router.replace({ pathname: "/team/[id]", params: { id: team.id } });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.h1}>Start a new team</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={styles.crestSection}>
            <View style={styles.crestWrap}>
              <MaterialCommunityIcons name="shield-star-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.crestText}>Upload team crest{"\n"}<Text style={{ color: colors.textMuted }}>(optional)</Text></Text>
          </View>

          <Field label="TEAM NAME">
            <TextInput
              testID="team-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Brooklyn Strikers"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </Field>

          <View>
            <Text style={styles.label}>SPORT CATEGORY</Text>
            <View style={styles.sportRow}>
              {SPORTS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  testID={`team-sport-${s.key}`}
                  onPress={() => setSport(s.key)}
                  style={[styles.sportPill, sport === s.key && styles.sportPillActive]}
                >
                  <MaterialCommunityIcons name={s.icon as any} size={20} color={sport === s.key ? colors.background : colors.primary} />
                  <Text style={[styles.sportLabel, sport === s.key && { color: colors.background }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label="HOME LOCATION / PITCH">
            <TextInput
              testID="team-location-input"
              value={location}
              onChangeText={setLocation}
              placeholder="McCarren Park, Field 3"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </Field>

          <View>
            <Text style={styles.label}>SKILL LEVEL</Text>
            <View style={styles.skillRow}>
              {SKILLS.map((s) => (
                <TouchableOpacity
                  key={s}
                  testID={`team-skill-${s}`}
                  onPress={() => setSkill(s)}
                  style={[styles.skillPill, skill === s && styles.skillPillActive]}
                >
                  <Text style={[styles.skillText, skill === s && { color: colors.background }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <Button testID="create-team-submit" label="Invite Players →" onPress={submit} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  h1: { ...text.h4 },
  iconBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  crestSection: { alignItems: "center", gap: spacing.sm },
  crestWrap: { width: 100, height: 100, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.primary, borderStyle: "dashed" as const, alignItems: "center", justifyContent: "center" },
  crestText: { ...text.caption, textAlign: "center", color: colors.textPrimary },
  label: { ...text.overline, marginBottom: spacing.xs },
  input: { height: 52, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 16 },
  sportRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  sportPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  sportPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sportLabel: { fontFamily: fonts.bodyMed, fontSize: 13, color: colors.textPrimary },
  skillRow: { flexDirection: "row", gap: spacing.sm },
  skillPill: { flex: 1, height: 44, borderRadius: radii.sm, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  skillPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  skillText: { fontFamily: fonts.bodyBold, color: colors.textPrimary, letterSpacing: 0.5 },
  bottom: { padding: spacing.lg, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
});
