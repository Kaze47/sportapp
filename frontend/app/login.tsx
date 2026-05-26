import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    if (phone.replace(/\D/g, "").length < 6) {
      Alert.alert("Invalid number", "Enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      await api.requestOtp(phone);
      router.push({ pathname: "/otp", params: { phone } });
    } catch (e: any) {
      Alert.alert("Oops", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: "https://static.prod-images.emergentagent.com/jobs/c0055dd7-7fb5-4479-9737-2fe40424bef5/images/787b3741813d74781cbfab14284763c98a42cc8c132ef44e85cc5b7f0fc66278.png" }}
      style={styles.bg}
      imageStyle={{ opacity: 0.5 }}
    >
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.top}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={28} color={colors.background} />
            </View>
            <Text testID="app-title" style={styles.brand}>PLAYPAL</Text>
          </View>

          <View style={styles.middle}>
            <Text style={styles.h1}>Play sports.{"\n"}Meet people.</Text>
            <Text style={styles.sub}>Find pickup matches, join teams, and build your local sports community.</Text>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>+1</Text>
              <TextInput
                testID="login-phone-input"
                value={phone}
                onChangeText={setPhone}
                placeholder="555 000 1234"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
                autoFocus
              />
            </View>
            <Button testID="login-continue-btn" label="Continue" onPress={onContinue} loading={loading} />
            <TouchableOpacity style={styles.terms}>
              <Text style={styles.termsText}>
                By continuing you agree to PlayPal&apos;s Terms & Privacy.
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,5,0.65)" },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  top: { paddingTop: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary, letterSpacing: 2 },
  middle: { flex: 1, justifyContent: "center" },
  h1: { ...text.h1, fontSize: 42, lineHeight: 46 },
  sub: { ...text.bodyLg, color: colors.textSecondary, marginTop: spacing.md, maxWidth: 320 },
  bottom: { paddingBottom: spacing.lg, gap: spacing.md },
  label: { ...text.overline },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  prefix: { ...text.bodyLg, color: colors.textSecondary, marginRight: spacing.sm },
  input: { flex: 1, ...text.bodyLg, color: colors.textPrimary, paddingVertical: 0 },
  terms: { alignItems: "center", marginTop: spacing.xs },
  termsText: { ...text.caption, color: colors.textMuted, textAlign: "center" },
});
