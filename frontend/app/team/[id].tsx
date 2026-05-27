import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Chip } from "@/src/components/Chip";
import { MatchCard } from "@/src/components/MatchCard";
import { colors, fonts, radii, spacing, text, sportIcon } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const TABS = ["Roster", "Upcoming", "Stats", "Admin"] as const;

export default function TeamDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [tab, setTab] = useState<typeof TABS[number]>("Roster");

  useEffect(() => {
    api.getTeam(id as string).then(setTeam).catch(console.warn);
  }, [id]);

  if (!team) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  const isCaptain = user?.id === team.captain_id;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.headerStack}>
          <Image source={{ uri: team.cover_url }} style={styles.cover} />
          <View style={styles.coverOverlay} />
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { position: "absolute", top: 10, left: 14 }]}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCard}>
          <Image source={{ uri: team.logo_url }} style={styles.logo} />
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <MaterialCommunityIcons name={(sportIcon[team.sport] || "soccer") as any} size={14} color={colors.primary} />
              <Text style={styles.sport}>{team.sport.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{team.name}</Text>
            <View style={styles.recordRow}>
              <Pill value={team.wins} label="W" color={colors.primary} />
              <Pill value={team.losses} label="L" color={colors.error} />
              <Pill value={team.draws} label="D" color={colors.warning} />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity testID="schedule-match-btn" style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="calendar" size={16} color={colors.background} />
            <Text style={[styles.actionText, { color: colors.background }]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="team-chat-btn" style={styles.actionBtn} onPress={() => router.push("/(tabs)/social")}>
            <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
            <Text style={styles.actionText}>Team chat</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.filter((t) => t !== "Admin" || isCaptain).map((t) => (
            <Chip key={t} testID={`team-tab-${t.toLowerCase()}`} label={t} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </ScrollView>

        {tab === "Roster" && (
          <View style={styles.tabContent}>
            {team.roster?.map((m: any) => (
              <View key={m.id} style={styles.memberRow} testID={`roster-${m.id}`}>
                <Image source={{ uri: m.avatar_url }} style={styles.memberAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberRole}>{m.id === team.captain_id ? "Captain" : "Player"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            ))}
            <TouchableOpacity style={styles.inviteBtn} testID="invite-member-btn">
              <Ionicons name="person-add" size={18} color={colors.primary} />
              <Text style={styles.inviteText}>Invite new member</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === "Upcoming" && (
          <View style={styles.tabContent}>
            {team.upcoming_matches?.length ? (
              team.upcoming_matches.map((m: any) => (
                <View key={m.id} style={{ marginBottom: spacing.md }}>
                  <MatchCard match={m} onPress={() => router.push({ pathname: "/match/[id]", params: { id: m.id } })} />
                </View>
              ))
            ) : (
              <Text style={styles.empty}>No upcoming matches.</Text>
            )}
          </View>
        )}

        {tab === "Stats" && (
          <View style={styles.tabContent}>
            <StatBlock label="REPUTATION" value={`${team.reputation} ★`} highlight />
            <StatBlock label="GOALS SCORED" value={team.goals_scored} />
            <StatBlock label="ATTENDANCE" value={`${team.attendance_rate}%`} />
            <StatBlock label="MATCHES" value={team.wins + team.losses + team.draws} />
          </View>
        )}

        {tab === "Admin" && isCaptain && (
          <View style={styles.tabContent}>
            <Text style={styles.empty}>{team.pending_requests?.length || 0} pending join requests.</Text>
            <Text style={[styles.empty, { color: colors.textMuted, fontSize: 12 }]}>No requests right now.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={pillStyles.row}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <View style={statStyles.block}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, highlight && { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  value: { fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5 },
  label: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textSecondary, letterSpacing: 1 },
});

const statStyles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceRaised, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  label: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textSecondary, letterSpacing: 1.5 },
  value: { fontFamily: fonts.heading, fontSize: 26, color: colors.textPrimary, marginTop: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  headerStack: { height: 180, position: "relative" },
  cover: { ...StyleSheet.absoluteFillObject },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,5,0.5)" },
  iconBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  headerCard: { marginHorizontal: spacing.lg, marginTop: -50, padding: spacing.md, backgroundColor: colors.surfaceRaised, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: spacing.md, alignItems: "center" },
  logo: { width: 72, height: 72, borderRadius: radii.sm, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  sport: { ...text.overline, color: colors.primary, fontSize: 10 },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5, marginTop: 2 },
  recordRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  actionBtn: { flex: 1, height: 44, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  actionText: { fontFamily: fonts.bodyBold, color: colors.textPrimary, letterSpacing: 0.5 },
  tabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  tabContent: { paddingHorizontal: spacing.lg },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.borderSoft },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface },
  memberName: { ...text.bodyLg, fontFamily: fonts.bodyMed },
  memberRole: { ...text.caption, color: colors.primary, marginTop: 2 },
  inviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.primary, borderStyle: "dashed" as const, marginTop: spacing.md },
  inviteText: { fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.5 },
  empty: { ...text.body, color: colors.textSecondary, paddingVertical: spacing.lg, textAlign: "center" },
});
