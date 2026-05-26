import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Chip } from "@/src/components/Chip";
import { MatchCard } from "@/src/components/MatchCard";
import { FakeMap } from "@/src/components/FakeMap";
import { colors, fonts, radii, spacing, text, SPORTS } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const TIME_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
];

const SPORT_FILTERS = [{ key: "all", label: "All" }, ...SPORTS.map((s) => ({ key: s.key, label: s.label }))];

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - spacing.lg * 2;

export default function HomeMap() {
  const router = useRouter();
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [sport, setSport] = useState("all");
  const [when, setWhen] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.listMatches(sport === "all" ? undefined : sport, when === "all" ? undefined : when)
      .then((res) => {
        setMatches(res);
        if (res.length && !res.find((m) => m.id === selectedId)) setSelectedId(res[0].id);
      })
      .catch((e) => console.warn(e));
  }, [sport, when, selectedId]);

  useEffect(() => { load(); }, [sport, when]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { load(); }, [sport, when])); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hey {user?.name?.split(" ")[0] || "Player"} 👋</Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locText}>Brooklyn, NY</Text>
          </View>
        </View>
        <View style={styles.bell}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          <View style={styles.bellDot} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {TIME_FILTERS.map((f) => (
          <Chip key={f.key} testID={`time-${f.key}`} label={f.label} active={when === f.key} onPress={() => setWhen(f.key)} />
        ))}
        <View style={styles.divider} />
        {SPORT_FILTERS.map((f) => (
          <Chip key={f.key} testID={`sport-filter-${f.key}`} label={f.label} active={sport === f.key} onPress={() => setSport(f.key)} />
        ))}
      </ScrollView>

      <View style={styles.mapWrap}>
        <FakeMap matches={matches} selectedId={selectedId} onSelect={(m) => setSelectedId(m.id)} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{matches.length} matches near you</Text>
          <Text style={styles.sheetLink}>See all</Text>
        </View>
        <FlatList
          data={matches}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
          snapToInterval={CARD_W + spacing.md}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style={{ width: CARD_W }}>
              <MatchCard
                testID={`match-card-${item.id}`}
                match={item}
                onPress={() => router.push({ pathname: "/match/[id]", params: { id: item.id } })}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ width: CARD_W, padding: spacing.lg, alignItems: "center" }}>
              <Text style={{ ...text.body, color: colors.textSecondary }}>No matches for these filters.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { ...text.h3 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locText: { ...text.caption, color: colors.textPrimary, fontFamily: fonts.bodyMed },
  bell: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellDot: { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  chipsRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: "center" },
  divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 },
  mapWrap: { flex: 1, marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: radii.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sheetTitle: { ...text.h4 },
  sheetLink: { ...text.body, color: colors.primary, fontFamily: fonts.bodyMed },
});
