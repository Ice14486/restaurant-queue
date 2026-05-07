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
import { loginStaff } from "../../api/auth";
import { useAuthContext } from "../../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "StaffLogin">;

export const StaffLoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuthContext();
  const [restaurantId, setRestaurantId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!restaurantId.trim() || !staffId.trim() || !pin) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await loginStaff(restaurantId.trim(), staffId.trim(), pin);
      await signIn(token, user);
    } catch (e: any) {
      setError(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Staff Login</Text>
          <Text style={styles.sub}>Use your restaurant credentials</Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Input
            label="Restaurant ID"
            value={restaurantId}
            onChangeText={setRestaurantId}
            autoCapitalize="none"
            placeholder="Provided by admin"
          />
          <Input
            label="Staff ID"
            value={staffId}
            onChangeText={setStaffId}
            autoCapitalize="none"
            placeholder="Your staff identifier"
          />
          <Input
            label="PIN / Password"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            placeholder="••••"
          />

          <Button label="Sign In" loading={loading} onPress={handleLogin} />
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.link}>← Customer login</Text>
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
