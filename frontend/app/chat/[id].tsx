import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii, spacing, text } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const load = () => {
    api.getChat(id as string).then((c) => {
      setChat(c);
      setMessages(c.messages || []);
    }).catch(console.warn);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [id]);

  const send = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const msg = await api.sendMessage(id as string, { user_id: user.id, text });
      setMessages((m) => [...m, msg]);
    } catch (e: any) {
      Alert.alert("Send failed", e.message);
    } finally {
      setSending(false);
    }
  };

  const sendPoll = async () => {
    if (!user) return;
    try {
      const msg = await api.sendMessage(id as string, {
        user_id: user.id,
        text: "Who's coming on Thursday?",
        kind: "poll",
        poll_options: ["Yes I'll be there", "Maybe", "Can't make it"],
      });
      setMessages((m) => [...m, msg]);
    } catch (e: any) {
      Alert.alert("Poll failed", e.message);
    }
  };

  const sendLocation = async () => {
    if (!user) return;
    try {
      const msg = await api.sendMessage(id as string, {
        user_id: user.id,
        text: "📍 McCarren Park, Field 3",
        kind: "location",
      });
      setMessages((m) => [...m, msg]);
    } catch (e: any) {
      Alert.alert("Share failed", e.message);
    }
  };

  if (!chat) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Image source={{ uri: chat.avatar }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{chat.name}</Text>
            <Text style={styles.sub}>
              {chat.kind === "team" ? `Team chat · ${chat.member_ids.length} members` :
               chat.kind === "match" ? "Match chat" : "Direct message"}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.user_id === user?.id;
            if (item.kind === "poll") {
              return (
                <View style={styles.pollCard}>
                  <Text style={styles.pollQuestion}>📊 {item.text}</Text>
                  {item.poll_options.map((opt: string, i: number) => {
                    const votes = Object.values(item.poll_votes || {}).filter((v: any) => v === i).length;
                    return (
                      <View key={i} style={styles.pollOption}>
                        <Text style={styles.pollOptionText}>{opt}</Text>
                        <Text style={styles.pollCount}>{votes} votes</Text>
                      </View>
                    );
                  })}
                </View>
              );
            }
            return (
              <View style={[styles.bubble, mine ? styles.bubbleSent : styles.bubbleReceived]} testID={`message-${item.id}`}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextSent]}>{item.text}</Text>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity testID="share-location-btn" onPress={sendLocation} style={styles.attachBtn}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity testID="poll-btn" onPress={sendPoll} style={styles.attachBtn}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity testID="send-btn" onPress={send} disabled={sending || !input.trim()} style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}>
            <Ionicons name="send" size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  iconBtn: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface },
  name: { ...text.bodyLg, fontFamily: fonts.bodyMed },
  sub: { ...text.caption },
  bubble: { maxWidth: "78%", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md },
  bubbleSent: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  bubbleReceived: { alignSelf: "flex-start", backgroundColor: colors.surfaceRaised, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.borderSoft },
  bubbleText: { fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary },
  bubbleTextSent: { color: colors.background, fontFamily: fonts.bodyMed },
  pollCard: { alignSelf: "stretch", backgroundColor: colors.surfaceRaised, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.primary, gap: spacing.sm },
  pollQuestion: { ...text.h4, fontSize: 15 },
  pollOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border },
  pollOptionText: { ...text.body, color: colors.textPrimary },
  pollCount: { ...text.caption, color: colors.primary, fontFamily: fonts.bodyBold },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: spacing.sm, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  attachBtn: { width: 40, height: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, height: 44, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceRaised, borderRadius: radii.full, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
