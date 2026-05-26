import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, fonts, text, sportIcon } from "@/src/theme";

type Props = {
  match: any;
  onPress?: () => void;
  testID?: string;
  compact?: boolean;
};

function formatWhen(iso: string) {
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

export function MatchCard({ match, onPress, testID, compact }: Props) {
  const joined = match.players?.length || 0;
  const total = match.max_players || 10;
  const icon = (sportIcon[match.sport] || "soccer") as any;
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.left}>
        <View style={styles.sportTile}>
          <MaterialCommunityIcons name={icon} size={26} color={colors.primary} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.when}>{formatWhen(match.starts_at)}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {match.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.meta} numberOfLines={1}>
            {match.location_label}
          </Text>
        </View>
        {!compact && (
          <View style={styles.footerRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{match.team_size}v{match.team_size}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{match.skill}</Text>
            </View>
            <Text style={styles.playersText}>
              {joined}/{total} joined
            </Text>
          </View>
        )}
        {compact && (
          <Text style={styles.playersText}>{joined}/{total} joined · {match.skill}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  left: { justifyContent: "center" },
  sportTile: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  when: { ...text.overline, color: colors.primary, fontSize: 10 },
  title: { ...text.h4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { ...text.caption, flexShrink: 1 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textSecondary, letterSpacing: 0.5 },
  playersText: { ...text.caption, marginLeft: "auto", color: colors.textSecondary },
});
