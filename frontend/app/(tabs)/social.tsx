import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Chip } from "@/src/components/Chip";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const KINDS = [
  { key: "all", label: "All" },
  { key: "team", label: "Teams" },
  { key: "match", label: "Matches" },
  { key: "friend", label: "Friends" },
];

export default function SocialTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [kind, setKind] = useState("all");
  const [chats, setChats] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    api.listChats(user.id, kind === "all" ? undefined : kind).then(setChats).catch(console.warn);
  }, [user, kind]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Inbox</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {KINDS.map((k) => (
          <Chip key={k.key} testID={`chat-tab-${k.key}`} label={k.label} active={kind === k.key} onPress={() => setKind(k.key)} compact />
        ))}
      </ScrollView>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.borderSoft }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`chat-${item.id}`}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } })}
            style={styles.row}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.time}>now</Text>
              </View>
              <View style={styles.topRow}>
                <Text style={styles.preview} numberOfLines={1}>{item.last_message}</Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ ...text.body, color: colors.textSecondary, textAlign: "center", marginTop: 60 }}>No conversations yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 0 },
  h1: { ...text.h2 },
  tabs: { paddingHorizontal: spacing.lg, paddingTop: 0, paddingBottom: spacing.md, gap: 6, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  name: { ...text.bodyLg, fontFamily: fonts.bodyMed, flex: 1 },
  time: { ...text.caption, color: colors.textMuted },
  preview: { ...text.body, color: colors.textSecondary, flex: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.background },
});
