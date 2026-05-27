import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const LEN = 6;

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const onChange = (val: string, idx: number) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < LEN - 1) inputs.current[idx + 1]?.focus();
  };

  const onKey = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const verify = async () => {
    const code = digits.join("");
    if (code.length !== LEN) {
      Alert.alert("Enter the code", `Enter all ${LEN} digits.`);
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone as string, code);
      setUser(res.user);
      if (res.is_new || !res.user.onboarded) {
        router.replace("/profile-setup");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      Alert.alert("Verification failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="otp-back-btn">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.h1}>Enter the code</Text>
          <Text style={styles.sub}>
            Sent to <Text style={{ color: colors.primary }}>{phone}</Text>. (Demo: use 123456 or any 6 digits)
          </Text>

          <View style={styles.boxRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                testID={`otp-input-${i}`}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                value={d}
                onChangeText={(v) => onChange(v, i)}
                onKeyPress={(e) => onKey(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.box, d && styles.boxFilled]}
              />
            ))}
          </View>

          <TouchableOpacity testID="otp-resend">
            <Text style={styles.resend}>Resend code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottom}>
          <Button testID="otp-verify-btn" label="Verify & Continue" onPress={verify} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent", paddingHorizontal: spacing.lg },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginTop: spacing.xs },
  body: { flex: 1, paddingTop: spacing.lg },
  h1: { ...text.h1, fontSize: 34, lineHeight: 38 },
  sub: { ...text.body, color: colors.textSecondary, marginTop: spacing.sm },
  boxRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  box: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  resend: { ...text.body, color: colors.primary, marginTop: spacing.lg, textAlign: "center" },
  bottom: { paddingBottom: spacing.lg },
});
