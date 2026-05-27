import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text, sportIcon } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.getMatch(id as string).then((m) => { setMatch(m); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const isJoined = user && match?.players?.includes(user.id);
  const isFull = match && match.players.length >= match.max_players;

  const join = async () => {
    if (!user || !match) return;
    setJoining(true);
    try {
      const updated = await api.joinMatch(match.id, user.id);
      setMatch(updated);
    } catch (e: any) {
      Alert.alert("Could not join", e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!match) return <View style={styles.center}><Text style={text.body}>Match not found</Text></View>;

  const iconName = (sportIcon[match.sport] || "soccer") as any;
  const dt = new Date(match.starts_at);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroBlock}>
          <View style={styles.sportBadge}>
            <MaterialCommunityIcons name={iconName} size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>{match.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.tag}><Text style={styles.tagText}>{match.team_size}v{match.team_size}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{match.skill}</Text></View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Info icon="calendar-outline" label={dt.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} sub={dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
          <View style={styles.divider} />
          <Info icon="location-outline" label={match.location_label} sub="Brooklyn · 1.2 mi away" />
          <View style={styles.divider} />
          <Info icon="people-outline" label={`${match.players.length} / ${match.max_players} joined`} sub={`${match.max_players - match.players.length} spots left`} />
        </View>

        <Text style={styles.section}>Players</Text>
        <View style={styles.playersRow}>
          {match.players.slice(0, 8).map((pid: string, i: number) => (
            <View key={pid} style={[styles.playerDot, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
              <Ionicons name="person" size={18} color={colors.background} />
            </View>
          ))}
          {match.players.length > 8 && (
            <View style={[styles.playerDot, { marginLeft: -10, backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.playerMore}>+{match.players.length - 8}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button
          testID="join-match-btn"
          label={isJoined ? "Joined ✓" : isFull ? "Match full" : "Join Match"}
          onPress={join}
          loading={joining}
          disabled={isJoined || isFull}
        />
      </View>
    </SafeAreaView>
  );
}

function Info({ icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.primaryDim, alignItems: "center", justifyContent: "center" },
  label: { ...text.bodyLg, fontFamily: fonts.bodyMed },
  sub: { ...text.caption, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: "row", justifyContent: "space-between" },
  iconBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  heroBlock: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.sm },
  sportBadge: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.primaryDim, alignItems: "center", justifyContent: "center" },
  title: { ...text.h1, fontSize: 32, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surfaceRaised, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textPrimary, letterSpacing: 0.5 },
  infoCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg, backgroundColor: colors.surfaceRaised, borderRadius: radii.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  section: { ...text.h4, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  playersRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg },
  playerDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.background },
  playerMore: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textPrimary },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
});
