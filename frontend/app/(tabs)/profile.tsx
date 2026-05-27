import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { colors, fonts, radii, spacing, text, sportIcon } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

export default function ProfileTab() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    api.getUserHistory(user.id).then(setHistory).catch(console.warn);
  }, [user]));

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.name || "Player"}</Text>
            <View style={styles.locRow}>
              {user.age ? (
                <>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.loc}>{user.age}</Text>
                  <View style={styles.dotSep} />
                </>
              ) : null}
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.loc}>{user.location || "Brooklyn, NY"}</Text>
            </View>
          </View>
          <TouchableOpacity testID="signout-btn" onPress={signOut} style={styles.signoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="person" size={48} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {user.bio ? (
          <View style={styles.bioCard} testID="profile-bio">
            <Text style={styles.bioLabel}>BIO</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        <View style={styles.statsCard}>
          <Stat icon="star" value={user.reputation.toFixed(1)} label="REPUTATION" highlight />
          <View style={styles.statDivider} />
          <Stat icon="checkmark-done" value={`${user.attendance_rate}%`} label="ATTENDANCE" />
          <View style={styles.statDivider} />
          <Stat icon="trophy" value={String(user.matches_played)} label="MATCHES" />
        </View>

        {user.sports?.length > 0 && (
          <>
            <Text style={styles.section}>Your sports</Text>
            <View style={styles.sportsRow}>
              {user.sports.map((s: any) => (
                <View key={s.sport} style={styles.sportPill}>
                  <MaterialCommunityIcons name={(sportIcon[s.sport] || "soccer") as any} size={16} color={colors.primary} />
                  <Text style={styles.sportText}>{s.sport}</Text>
                  <Text style={styles.sportSkill}>· {s.skill}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.section}>Match history</Text>
        <View style={styles.timeline}>
          {history.length === 0 && (
            <Text style={{ ...text.body, color: colors.textSecondary, paddingHorizontal: spacing.lg }}>
              No past matches yet. Join one to start your timeline.
            </Text>
          )}
          {history.map((h, idx) => (
            <View key={h.id} style={styles.historyRow} testID={`history-${h.id}`}>
              <View style={styles.timelineCol}>
                <View style={styles.dot} />
                {idx < history.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.historyCard}>
                <View style={styles.historyHead}>
                  <MaterialCommunityIcons name={(sportIcon[h.sport] || "soccer") as any} size={18} color={colors.primary} />
                  <Text style={styles.historyTitle}>{h.title}</Text>
                  <View style={[styles.resultPill, h.result === "W" ? styles.resultW : h.result === "L" ? styles.resultL : styles.resultD]}>
                    <Text style={styles.resultText}>{h.result || "-"}</Text>
                  </View>
                </View>
                <Text style={styles.historyMeta}>
                  {new Date(h.starts_at).toLocaleDateString([], { month: "short", day: "numeric" })} · {h.location_label}
                </Text>
                {h.score_home !== undefined && (
                  <Text style={styles.score}>{h.score_home} - {h.score_away}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label, highlight }: { icon: any; value: string; label: string; highlight?: boolean }) {
  return (
    <View style={statStyles.stat}>
      <View style={statStyles.iconRow}>
        <Ionicons name={icon} size={14} color={highlight ? colors.primary : colors.textSecondary} />
        <Text style={[statStyles.value, highlight && { color: colors.primary }]}>{value}</Text>
      </View>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.md, gap: 4 },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  value: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
  label: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.textSecondary, letterSpacing: 1.5 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, flexDirection: "row", alignItems: "center" },
  name: { ...text.h2 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  loc: { ...text.caption },
  dotSep: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 4 },
  bioCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surfaceRaised, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  bioLabel: { ...text.overline, color: colors.primary, marginBottom: 6 },
  bioText: { ...text.body, color: colors.textPrimary, lineHeight: 20 },
  signoutBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatarSection: { alignItems: "center", marginTop: spacing.md },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: colors.primary },
  statsCard: { flexDirection: "row", backgroundColor: colors.surfaceRaised, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.lg, marginTop: spacing.lg },
  statDivider: { width: 1, backgroundColor: colors.border },
  section: { ...text.h4, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  sportsRow: { paddingHorizontal: spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  sportPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.surface, borderRadius: radii.full, borderWidth: 1, borderColor: colors.border },
  sportText: { fontFamily: fonts.bodyMed, fontSize: 12, color: colors.textPrimary, textTransform: "capitalize" as const },
  sportSkill: { ...text.caption, color: colors.textSecondary },
  timeline: { paddingHorizontal: spacing.lg, gap: spacing.md },
  historyRow: { flexDirection: "row", gap: spacing.md },
  timelineCol: { alignItems: "center", width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 16 },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  historyCard: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft },
  historyHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  historyTitle: { ...text.h4, flex: 1, fontSize: 15 },
  historyMeta: { ...text.caption, marginTop: 4 },
  score: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary, marginTop: 6 },
  resultPill: { width: 28, height: 22, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  resultW: { backgroundColor: colors.primary },
  resultL: { backgroundColor: colors.error },
  resultD: { backgroundColor: colors.warning },
  resultText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.background },
});
