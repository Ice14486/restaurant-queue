import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { loginCustomer } from "../../api/auth";
import { useAuthContext } from "../../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await loginCustomer(email.trim(), password);
      await signIn(token, user);
    } catch (e: any) {
      setError(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to your account</Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Button label="Sign In" loading={loading} onPress={handleLogin} />

          <View style={styles.row}>
            <Text style={styles.hint}>New here?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}> Create an account</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.staffLink}
            onPress={() => navigation.navigate("StaffLogin")}
          >
            <Text style={styles.link}>Staff / Admin login →</Text>
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
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  hint: { fontSize: 15, color: "#6B7280" },
  link: { fontSize: 15, color: "#6366F1", fontWeight: "600" },
  staffLink: { alignItems: "center", marginTop: 16 },
});
