import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/theme";

/**
 * Premium ambient background — layered linear gradients + soft mesh orbs +
 * subtle vignette. Sits behind all screens. Energetic neon-green theme,
 * never disturbs readability.
 */
export function ScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base deep gradient: near-black with a hint of forest at top, pure black at bottom */}
      <LinearGradient
        colors={["#071a0E", "#050505", "#000000"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Diagonal accent gradient for depth */}
      <LinearGradient
        colors={["rgba(0,255,85,0.10)", "rgba(0,255,85,0)", "rgba(0,170,255,0.05)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Mesh orbs — large soft blobs for premium glow */}
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      <View style={[styles.orb, styles.orbC]} />
      <View style={[styles.orb, styles.orbD]} />
      <View style={[styles.orb, styles.orbE]} />

      {/* Fine grid lines */}
      <View style={[styles.gridLine, { left: "20%", width: 1, top: 0, bottom: 0 }]} />
      <View style={[styles.gridLine, { left: "55%", width: 1, top: 0, bottom: 0 }]} />
      <View style={[styles.gridLine, { left: "85%", width: 1, top: 0, bottom: 0 }]} />
      <View style={[styles.gridLine, { top: "22%", height: 1, left: 0, right: 0 }]} />
      <View style={[styles.gridLine, { top: "58%", height: 1, left: 0, right: 0 }]} />
      <View style={[styles.gridLine, { top: "82%", height: 1, left: 0, right: 0 }]} />

      {/* Vignette overlay — slight darkening at corners */}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const ORB_SHADOW = Platform.select({
  ios: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  default: {},
}) as object;

const styles = StyleSheet.create({
  orb: { position: "absolute", borderRadius: 9999 },
  orbA: {
    top: -160,
    right: -140,
    width: 380,
    height: 380,
    backgroundColor: "rgba(0, 255, 85, 0.10)",
    ...ORB_SHADOW,
  },
  orbB: {
    top: 200,
    left: -180,
    width: 340,
    height: 340,
    backgroundColor: "rgba(0, 170, 255, 0.07)",
  },
  orbC: {
    top: 480,
    right: -160,
    width: 320,
    height: 320,
    backgroundColor: "rgba(0, 255, 85, 0.06)",
  },
  orbD: {
    bottom: -160,
    left: -120,
    width: 360,
    height: 360,
    backgroundColor: "rgba(122, 0, 255, 0.05)",
  },
  orbE: {
    top: 380,
    left: "30%",
    width: 200,
    height: 200,
    backgroundColor: "rgba(0, 255, 170, 0.04)",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.018)",
  },
});

export const SCREEN_BG_COLOR = colors.background;
