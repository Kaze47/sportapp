import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Chip } from "@/src/components/Chip";
import { MatchCard } from "@/src/components/MatchCard";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "explore", label: "Explore" },
  { key: "competitions", label: "Competitions" },
];

export default function MatchesTab() {
  const router = useRouter();
  const [tab, setTab] = useState("upcoming");
  const [matches, setMatches] = useState<any[]>([]);
  const [tryNew, setTryNew] = useState<any[]>([]);
  const [comps, setComps] = useState<any[]>([]);

  useEffect(() => {
    api.listMatches().then(setMatches).catch(console.warn);
    api.discoveryTryNew().then(setTryNew).catch(console.warn);
    api.discoveryCompetitions().then(setComps).catch(console.warn);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Matches</Text>
        <TouchableOpacity testID="add-match-btn" style={styles.iconBtn}>
          <Ionicons name="add" size={22} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Chip key={t.key} testID={`matches-tab-${t.key}`} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </ScrollView>

      {tab === "upcoming" && (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <MatchCard testID={`match-${item.id}`} match={item} onPress={() => router.push({ pathname: "/match/[id]", params: { id: item.id } })} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No upcoming matches.</Text>}
        />
      )}

      {tab === "explore" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.section}>Try something new</Text>
          <FlatList
            data={tryNew}
            keyExtractor={(i) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity testID={`explore-${item.id}`} style={styles.discoveryCard}>
                <Image source={{ uri: item.image }} style={styles.discoveryImg} />
                <View style={styles.discoveryBody}>
                  <Text style={styles.discoveryTitle}>{item.title}</Text>
                  <Text style={styles.discoveryDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </ScrollView>
      )}

      {tab === "competitions" && (
        <FlatList
          data={comps}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity testID={`comp-${item.id}`} style={styles.compCard}>
              <Image source={{ uri: item.image }} style={styles.compImg} />
              <View style={styles.compOverlay}>
                <Text style={styles.compTitle}>{item.title}</Text>
                <View style={styles.compMeta}>
                  <View style={styles.compTag}>
                    <Text style={styles.compTagText}>{item.date}</Text>
                  </View>
                  <View style={[styles.compTag, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.compTagText, { color: colors.background }]}>{item.prize}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { ...text.h2 },
  iconBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  tabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  empty: { ...text.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
  section: { ...text.h4, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  discoveryCard: { width: 240, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  discoveryImg: { width: "100%", height: 140 },
  discoveryBody: { padding: spacing.md, gap: 4 },
  discoveryTitle: { ...text.h4 },
  discoveryDesc: { ...text.caption },
  compCard: { height: 160, borderRadius: radii.md, overflow: "hidden" },
  compImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  compOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,5,0.55)", padding: spacing.md, justifyContent: "flex-end", gap: spacing.sm },
  compTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5 },
  compMeta: { flexDirection: "row", gap: spacing.sm },
  compTag: { paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surface, borderRadius: radii.sm },
  compTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textPrimary, letterSpacing: 0.5 },
});
