import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii, fonts, sportIcon } from "@/src/theme";

type Match = {
  id: string;
  sport: string;
  latitude: number;
  longitude: number;
  title: string;
};

type Props = {
  matches: Match[];
  selectedId?: string | null;
  onSelect: (m: Match) => void;
  centerLat?: number;
  centerLng?: number;
};

// A stylized "map" that places sport pins on a dark grid background.
// Coordinates are mapped relative to a center point.
const { width: SCREEN_W } = Dimensions.get("window");

export function FakeMap({ matches, selectedId, onSelect, centerLat = 40.6782, centerLng = -73.9442 }: Props) {
  // map a lat/lng around center to an x/y % within the viewport
  const lngRange = 0.05;
  const latRange = 0.05;
  const project = (lat: number, lng: number) => {
    const x = ((lng - centerLng) / lngRange + 1) / 2; // 0..1
    const y = ((centerLat - lat) / latRange + 1) / 2; // 0..1
    return { left: `${Math.max(4, Math.min(94, x * 100))}%`, top: `${Math.max(4, Math.min(94, y * 100))}%` };
  };

  return (
    <View style={styles.container}>
      {/* grid lines */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, { top: `${(i + 1) * 11}%`, width: "100%", height: 1 }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLine, { left: `${(i + 1) * 14}%`, height: "100%", width: 1 }]} />
        ))}
      </View>

      {/* faux roads */}
      <View style={[styles.road, { top: "38%", left: 0, right: 0, height: 4, transform: [{ rotate: "-6deg" }] }]} />
      <View style={[styles.road, { top: "62%", left: 0, right: 0, height: 4, transform: [{ rotate: "4deg" }] }]} />
      <View style={[styles.road, { top: 0, bottom: 0, left: "44%", width: 4 }]} />

      {/* current location dot */}
      <View style={[styles.youAreHerePulse, { left: "48%", top: "48%" }]} />
      <View style={[styles.youAreHere, { left: "48.5%", top: "48.5%" }]} />

      {/* match pins */}
      {matches.map((m) => {
        const pos = project(m.latitude, m.longitude);
        const isSelected = selectedId === m.id;
        const iconName = (sportIcon[m.sport] || "soccer") as any;
        return (
          <Pressable
            testID={`map-pin-${m.id}`}
            key={m.id}
            onPress={() => onSelect(m)}
            style={[styles.pinWrap, { left: pos.left as any, top: pos.top as any }]}
          >
            {isSelected && <View style={styles.pinRing} />}
            <View style={[styles.pin, isSelected && styles.pinSelected]}>
              <MaterialCommunityIcons name={iconName} size={16} color={colors.background} />
            </View>
          </Pressable>
        );
      })}

      <View style={styles.legend}>
        <View style={styles.legendDot} />
        <Text style={styles.legendText}>Your area · Brooklyn</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    overflow: "hidden",
  },
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLine: { position: "absolute", backgroundColor: "rgba(0, 255, 85, 0.04)" },
  road: { position: "absolute", backgroundColor: "#1A1A1A" },
  youAreHere: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#00AAFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginLeft: -7,
    marginTop: -7,
  },
  youAreHerePulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    marginLeft: -30,
    marginTop: -30,
  },
  pinWrap: {
    position: "absolute",
    marginLeft: -18,
    marginTop: -18,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  pinSelected: {
    transform: [{ scale: 1.15 }],
  },
  pinRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 255, 85, 0.18)",
  },
  legend: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(18,18,18,0.85)",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  legendText: { fontFamily: fonts.bodyMed, fontSize: 11, color: colors.textPrimary },
});
