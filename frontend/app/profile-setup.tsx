import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1607286908165-b8b6a2874fc4?w=400",
  "https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?w=400",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
];

export default function ProfileSetup() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age ? String(user.age) : "");
  const [location, setLocation] = useState(user?.location || "Brooklyn, NY");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Tell us what to call you.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum < 13 || ageNum > 99) {
      Alert.alert("Invalid age", "Enter an age between 13 and 99.");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const updated = await api.updateProfile({
        user_id: user.id,
        name: name.trim(),
        age: ageNum,
        location: location.trim(),
        avatar_url: avatar,
        bio: bio.trim(),
      });
      setUser({ ...user, ...updated });
      router.push("/sports-preferences");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.step}>STEP 1 OF 3</Text>
            <Text style={styles.h1}>Set up your profile</Text>
            <Text style={styles.sub}>This is how teammates will see you.</Text>
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.avatarEdit} testID="avatar-edit-btn">
                <MaterialCommunityIcons name="camera-plus" size={18} color={colors.background} />
              </TouchableOpacity>
            </View>
            <View style={styles.presetRow}>
              {AVATAR_PRESETS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  testID={`avatar-preset-${i}`}
                  onPress={() => setAvatar(p)}
                  style={[styles.presetBtn, avatar === p && styles.presetBtnActive]}
                >
                  <Image source={{ uri: p }} style={styles.presetImg} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.form}>
            <Field label="NAME" icon="person-outline">
              <TextInput
                testID="profile-name-input"
                value={name}
                onChangeText={setName}
                placeholder="Alex Rivera"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </Field>
            <Field label="AGE" icon="calendar-outline">
              <TextInput
                testID="profile-age-input"
                value={age}
                onChangeText={setAge}
                placeholder="24"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.input}
              />
            </Field>
            <Field label="LOCATION" icon="location-outline">
              <TextInput
                testID="profile-location-input"
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </Field>

            <View style={{ gap: spacing.xs }}>
              <Text style={styles.fieldLabel}>BIO</Text>
              <View style={[styles.bioWrap]}>
                <TextInput
                  testID="profile-bio-input"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Center back, weekends warrior, loves a slide tackle."
                  placeholderTextColor={colors.textMuted}
                  style={styles.bioInput}
                  multiline
                  numberOfLines={3}
                  maxLength={160}
                />
                <Text style={styles.bioCount}>{bio.length}/160</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <Button testID="profile-next-btn" label="Next" onPress={onNext} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, children }: { label: string; icon: any; children: any }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputRow}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent", paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.lg, gap: spacing.sm },
  step: { ...text.overline, color: colors.primary },
  h1: { ...text.h1, fontSize: 30, lineHeight: 34 },
  sub: { ...text.body, color: colors.textSecondary },
  avatarSection: { alignItems: "center", marginTop: spacing.lg },
  avatarWrap: { position: "relative" },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.primary },
  avatarEdit: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  presetRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  presetBtn: { width: 48, height: 48, borderRadius: 24, padding: 2, borderWidth: 1, borderColor: colors.border },
  presetBtnActive: { borderColor: colors.primary, borderWidth: 2 },
  presetImg: { width: "100%", height: "100%", borderRadius: 24 },
  form: { marginTop: spacing.xl, gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { ...text.overline },
  fieldInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 16, paddingVertical: 0 },
  bioWrap: { backgroundColor: colors.surface, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.md, position: "relative" },
  bioInput: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 15, minHeight: 70, textAlignVertical: "top", paddingBottom: 18 },
  bioCount: { position: "absolute", bottom: 6, right: 12, fontFamily: fonts.body, fontSize: 10, color: colors.textMuted },
  bottom: { paddingBottom: spacing.md },
});
