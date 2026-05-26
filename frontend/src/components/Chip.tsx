import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radii, spacing, fonts } from "@/src/theme";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  testID?: string;
};

export function Chip({ label, active, onPress, icon, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: colors.textPrimary,
  },
  labelActive: {
    color: colors.background,
    fontFamily: fonts.bodyBold,
  },
});
