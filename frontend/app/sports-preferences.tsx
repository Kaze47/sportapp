import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text, SPORTS } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const SKILLS = ["Beginner", "Intermediate", "Advanced"] as const;

export default function SportsPreferences() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const copy = { ...prev };
      if (copy[key]) delete copy[key];
      else copy[key] = "Intermediate";
      return copy;
    });
  };

  const setSkill = (key: string, skill: string) => {
    setSelected((prev) => ({ ...prev, [key]: skill }));
  };

  const submit = async (skip = false) => {
    if (!user) return;
    const prefs = skip ? [] : Object.entries(selected).map(([sport, skill]) => ({ sport, skill }));
    if (!skip && prefs.length === 0) {
      Alert.alert("Pick at least one", "Or tap Skip to do this later.");
      return;
    }
    setLoading(true);
    try {
      const updated = await api.updateSports({ user_id: user.id, preferences: prefs });
      setUser({ ...user, ...updated });
      router.push("/find-friends");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.header}>
          <Text style={styles.step}>STEP 2 OF 3</Text>
          <Text style={styles.h1}>What do you play?</Text>
          <Text style={styles.sub}>Pick your sports and skill level.</Text>
        </View>

        <View style={styles.grid}>
          {SPORTS.map((s) => {
            const active = !!selected[s.key];
            return (
              <View key={s.key} style={{ width: "48%" }}>
                <TouchableOpacity
                  testID={`sport-${s.key}`}
                  onPress={() => toggle(s.key)}
                  style={[styles.tile, active && styles.tileActive]}
                >
                  <MaterialCommunityIcons
                    name={s.icon as any}
                    size={40}
                    color={active ? colors.background : colors.primary}
                  />
                  <Text style={[styles.tileLabel, active && { color: colors.background }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
                {active && (
                  <View style={styles.skillRow}>
                    {SKILLS.map((sk) => (
                      <TouchableOpacity
                        key={sk}
                        testID={`skill-${s.key}-${sk}`}
                        onPress={() => setSkill(s.key, sk)}
                        style={[styles.skillPill, selected[s.key] === sk && styles.skillPillActive]}
                      >
                        <Text
                          style={[styles.skillText, selected[s.key] === sk && { color: colors.background }]}
                        >
                          {sk[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button testID="sports-continue-btn" label="Continue" onPress={() => submit(false)} loading={loading} />
        <TouchableOpacity testID="sports-skip-btn" onPress={() => submit(true)} style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.md, gap: spacing.sm },
  step: { ...text.overline, color: colors.primary },
  h1: { ...text.h1, fontSize: 30, lineHeight: 34 },
  sub: { ...text.body, color: colors.textSecondary },
  grid: { marginTop: spacing.lg, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  tile: {
    aspectRatio: 1.1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  tileActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tileLabel: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.textPrimary },
  skillRow: { flexDirection: "row", gap: 6, marginTop: spacing.sm, justifyContent: "center" },
  skillPill: {
    flex: 1,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  skillPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  skillText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSecondary, letterSpacing: 1 },
  bottom: { paddingBottom: spacing.lg, gap: spacing.sm },
  skip: { alignItems: "center", paddingVertical: spacing.sm },
  skipText: { ...text.body, color: colors.textSecondary },
});
