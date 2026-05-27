import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";

export default function FindFriends() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.suggestedContacts().then((res) => {
      setContacts(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleAdd = (id: string) => setAdded((p) => ({ ...p, [id]: !p[id] }));
  const inviteAll = () => {
    const ids: Record<string, boolean> = {};
    contacts.forEach((c) => (ids[c.id] = true));
    setAdded(ids);
    Alert.alert("Invites sent!", "We&apos;ll let your friends know about PlayPal.");
  };

  const shareLink = async () => {
    try {
      await Share.share({ message: "Come play sports with me on PlayPal! https://playpal.app" });
    } catch (e) { console.log("share cancel", e); }
  };

  const finish = () => router.replace("/(tabs)");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.step}>STEP 3 OF 3</Text>
        <Text style={styles.h1}>Find friends</Text>
        <Text style={styles.sub}>Connect with people you already know.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity testID="invite-all-btn" onPress={inviteAll} style={styles.actionBtn}>
          <MaterialCommunityIcons name="account-multiple-plus" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Invite all</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="share-link-btn" onPress={shareLink} style={styles.actionBtn}>
          <Ionicons name="logo-whatsapp" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Share link</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ ...text.body, color: colors.textSecondary, textAlign: "center", marginTop: 40 }}>
            {loading ? "Loading suggestions…" : "No suggestions yet."}
          </Text>
        }
        contentContainerStyle={{ paddingVertical: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.row} testID={`contact-${item.id}`}>
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <TouchableOpacity
              testID={`add-contact-${item.id}`}
              onPress={() => toggleAdd(item.id)}
              style={[styles.addBtn, added[item.id] && styles.addBtnActive]}
            >
              <Text style={[styles.addText, added[item.id] && { color: colors.background }]}>
                {added[item.id] ? "Added" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <Button testID="finish-onboarding-btn" label="Continue to PlayPal" onPress={finish} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.md, gap: spacing.sm },
  step: { ...text.overline, color: colors.primary },
  h1: { ...text.h1, fontSize: 30, lineHeight: 34 },
  sub: { ...text.body, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { ...text.body, color: colors.textPrimary, fontFamily: fonts.bodyMed },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface },
  name: { ...text.bodyLg, fontFamily: fonts.bodyMed },
  phone: { ...text.caption },
  addBtn: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnActive: { backgroundColor: colors.primary },
  addText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary, letterSpacing: 0.5 },
  bottom: { paddingBottom: spacing.md },
});
