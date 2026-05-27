import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { colors, fonts, radii, spacing, text, sportIcon } from "@/src/theme";
import { api } from "@/src/api";

export default function TeamsTab() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    api.listTeams().then(setTeams).catch(console.warn);
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Teams</Text>
        <TouchableOpacity testID="create-team-btn" style={styles.iconBtn} onPress={() => router.push("/team/create")}>
          <Ionicons name="add" size={22} color={colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={teams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`team-${item.id}`}
            style={styles.card}
            onPress={() => router.push({ pathname: "/team/[id]", params: { id: item.id } })}
          >
            <Image source={{ uri: item.cover_url }} style={styles.cover} />
            <View style={styles.overlay} />
            <View style={styles.body}>
              <View style={styles.logoWrap}>
                <Image source={{ uri: item.logo_url }} style={styles.logo} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <MaterialCommunityIcons name={(sportIcon[item.sport] || "soccer") as any} size={16} color={colors.primary} />
                  <Text style={styles.tag}>{item.sport.toUpperCase()}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.tag}>{item.skill}</Text>
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.record}>
                  {item.wins}W · {item.losses}L · {item.draws}D
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.repValue}>{item.reputation}</Text>
                <View style={styles.starRow}>
                  <Ionicons name="star" size={10} color={colors.primary} />
                  <Text style={styles.repLabel}>Rep</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 80, gap: spacing.md }}>
            <Text style={{ ...text.h4, color: colors.textSecondary }}>No teams yet</Text>
            <TouchableOpacity onPress={() => router.push("/team/create")} style={styles.cta}>
              <Text style={styles.ctaText}>Start a new team</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { ...text.h2 },
  iconBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  card: { height: 160, borderRadius: radii.md, overflow: "hidden", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  cover: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,5,0.65)" },
  body: { flex: 1, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  logoWrap: { width: 60, height: 60, borderRadius: radii.sm, overflow: "hidden", borderWidth: 2, borderColor: colors.primary },
  logo: { width: "100%", height: "100%" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { ...text.overline, color: colors.primary, fontSize: 10 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5, marginTop: 2 },
  record: { ...text.caption, color: colors.textPrimary, marginTop: 4 },
  right: { alignItems: "center" },
  repValue: { fontFamily: fonts.heading, fontSize: 24, color: colors.primary },
  starRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  repLabel: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.textSecondary, letterSpacing: 1, textTransform: "uppercase" as const },
  cta: { paddingHorizontal: spacing.lg, height: 44, borderRadius: radii.sm, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: fonts.bodyBold, color: colors.background, letterSpacing: 1 },
});
