import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, Modal, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Chip } from "@/src/components/Chip";
import { MatchCard } from "@/src/components/MatchCard";
import { FakeMap } from "@/src/components/FakeMap";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text, SPORTS, sportIcon } from "@/src/theme";
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

function formatStartsAt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const sameDay = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · ${time}`;
}

export default function HomeMap() {
  const router = useRouter();
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [sport, setSport] = useState("all");
  const [when, setWhen] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popupMatch, setPopupMatch] = useState<any | null>(null);
  const [joining, setJoining] = useState(false);

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

  const handlePinTap = (m: any) => {
    setSelectedId(m.id);
    setPopupMatch(m);
  };

  const closePopup = () => setPopupMatch(null);

  const joinPopupMatch = async () => {
    if (!popupMatch || !user) return;
    setJoining(true);
    try {
      const updated = await api.joinMatch(popupMatch.id, user.id);
      setPopupMatch(updated);
      setMatches((arr) => arr.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e: any) {
      Alert.alert("Could not join", e.message);
    } finally {
      setJoining(false);
    }
  };

  const viewDetails = () => {
    const id = popupMatch?.id;
    closePopup();
    if (id) router.push({ pathname: "/match/[id]", params: { id } });
  };

  const isJoined = popupMatch && user && popupMatch.players?.includes(user.id);
  const isFull = popupMatch && popupMatch.players?.length >= popupMatch.max_players;

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
        <FakeMap matches={matches} selectedId={selectedId} onSelect={handlePinTap} />
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

      <Modal
        visible={!!popupMatch}
        transparent
        animationType="fade"
        onRequestClose={closePopup}
      >
        <Pressable style={styles.backdrop} onPress={closePopup} testID="map-popup-backdrop">
          <Pressable style={styles.popup} onPress={() => {}}>
            {popupMatch && (
              <>
                <View style={styles.popupHead}>
                  <View style={styles.popupSportTile}>
                    <MaterialCommunityIcons
                      name={(sportIcon[popupMatch.sport] || "soccer") as any}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popupWhen}>{formatStartsAt(popupMatch.starts_at)}</Text>
                    <Text style={styles.popupTitle} numberOfLines={1}>{popupMatch.title}</Text>
                  </View>
                  <Pressable onPress={closePopup} style={styles.closeBtn} testID="map-popup-close">
                    <Ionicons name="close" size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.popupRow}>
                  <Ionicons name="location-outline" size={16} color={colors.primary} />
                  <Text style={styles.popupRowText}>{popupMatch.location_label}</Text>
                </View>
                <View style={styles.popupRow}>
                  <Ionicons name="people-outline" size={16} color={colors.primary} />
                  <Text style={styles.popupRowText}>
                    {popupMatch.players?.length || 0}/{popupMatch.max_players} joined · {popupMatch.team_size}v{popupMatch.team_size}
                  </Text>
                </View>
                <View style={styles.popupRow}>
                  <Ionicons name="trending-up-outline" size={16} color={colors.primary} />
                  <Text style={styles.popupRowText}>{popupMatch.skill}</Text>
                </View>

                <View style={styles.popupBtnRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      testID="map-popup-view-btn"
                      label="View"
                      variant="secondary"
                      onPress={viewDetails}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      testID="map-popup-join-btn"
                      label={isJoined ? "Joined ✓" : isFull ? "Full" : "Join"}
                      onPress={joinPopupMatch}
                      loading={joining}
                      disabled={!!isJoined || !!isFull}
                    />
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  popup: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  popupHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  popupSportTile: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  popupWhen: { ...text.overline, color: colors.primary, fontSize: 10 },
  popupTitle: { ...text.h4, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  popupRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 2 },
  popupRowText: { ...text.body, color: colors.textPrimary },
  popupBtnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
