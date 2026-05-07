import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { getRestaurant } from "../../api/restaurants";
import { updateRestaurantSettings } from "../../api/staff";
import { useAuthContext } from "../../contexts/AuthContext";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Restaurant } from "../../types";

export const RestaurantSettingsScreen: React.FC = () => {
  const { user } = useAuthContext();
  const restaurantId = user?.restaurant_id ?? "";

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capacity, setCapacity] = useState("50");
  const [turnTime, setTurnTime] = useState("30");
  const [openTime, setOpenTime] = useState("11:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [accepting, setAccepting] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    getRestaurant(restaurantId)
      .then(({ restaurant: r }) => {
        setRestaurant(r);
        setCapacity(String(r.max_queue_capacity));
        setTurnTime(String(r.avg_turn_time_minutes));
        const mondayHours = r.operating_hours?.monday;
        if (mondayHours) {
          setOpenTime(mondayHours.open);
          setCloseTime(mondayHours.close);
        }
        setAccepting(r.is_accepting_queue);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const handleSave = async () => {
    const cap = parseInt(capacity, 10);
    const turn = parseInt(turnTime, 10);
    if (isNaN(cap) || cap < 1 || isNaN(turn) || turn < 1) {
      Alert.alert("Validation", "Capacity and turn time must be positive numbers");
      return;
    }
    setSaving(true);
    try {
      await updateRestaurantSettings({
        max_queue_capacity: cap,
        avg_turn_time_minutes: turn,
        is_accepting_queue: accepting,
        operating_hours: {
          monday: { open: openTime, close: closeTime, closed: false },
          tuesday: { open: openTime, close: closeTime, closed: false },
          wednesday: { open: openTime, close: closeTime, closed: false },
          thursday: { open: openTime, close: closeTime, closed: false },
          friday: { open: openTime, close: closeTime, closed: false },
          saturday: { open: openTime, close: closeTime, closed: false },
          sunday: { open: openTime, close: closeTime, closed: false },
        },
      });
      Alert.alert("Saved", "Settings updated successfully");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Restaurant Settings</Text>
        {restaurant && <Text style={styles.name}>{restaurant.name}</Text>}

        <View style={styles.section}>
          <Text style={styles.label}>Max Queue Capacity</Text>
          <TextInput
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Avg. Turn Time (minutes)</Text>
          <TextInput
            style={styles.input}
            value={turnTime}
            onChangeText={setTurnTime}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.hoursRow}>
          <View style={styles.hoursField}>
            <Text style={styles.label}>Opening Time</Text>
            <TextInput
              style={styles.input}
              value={openTime}
              onChangeText={setOpenTime}
              placeholder="11:00"
            />
          </View>
          <View style={styles.hoursField}>
            <Text style={styles.label}>Closing Time</Text>
            <TextInput
              style={styles.input}
              value={closeTime}
              onChangeText={setCloseTime}
              placeholder="22:00"
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Accepting Queue Entries</Text>
          <Switch
            value={accepting}
            onValueChange={setAccepting}
            trackColor={{ true: "#6366F1", false: "#D1D5DB" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Button label="Save Settings" loading={saving} onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 4 },
  name: { fontSize: 15, color: "#6B7280", marginBottom: 28 },
  section: { marginBottom: 20 },
  hoursRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  hoursField: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", color: "#374151", marginBottom: 8, flex: 1 },
  input: {
    backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#D1D5DB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: "#111827",
  },
  toggleRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 28,
  },
});
