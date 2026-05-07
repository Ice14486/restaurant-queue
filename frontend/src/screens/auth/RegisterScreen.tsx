import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { registerCustomer } from "../../api/auth";
import { useAuthContext } from "../../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await registerCustomer(email.trim(), password, name.trim());
      await signIn(token, user);
    } catch (e: any) {
      setError(e.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Join to start skipping the wait</Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Input label="Username" value={name} onChangeText={setName} placeholder="janedoe" autoCapitalize="none" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="8+ characters"
          />

          <Button label="Create Account" loading={loading} onPress={handleRegister} />

          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.link}>← Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "800", color: "#111827", marginBottom: 4 },
  sub: { fontSize: 16, color: "#6B7280", marginBottom: 32 },
  errorBanner: {
    backgroundColor: "#FEE2E2", color: "#B91C1C",
    padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14,
  },
  back: { alignItems: "center", marginTop: 20 },
  link: { fontSize: 15, color: "#6366F1", fontWeight: "600" },
});
