import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Restaurant } from "../../types";
import { formatWait } from "../../utils/formatters";

interface Props {
  restaurant: Restaurant;
  onPress: () => void;
}

export const RestaurantCard: React.FC<Props> = ({ restaurant, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.header}>
      <Text style={styles.name}>{restaurant.name}</Text>
      <View style={[styles.badge, !restaurant.is_accepting_queue && styles.badgeClosed]}>
        <Text style={styles.badgeText}>
          {restaurant.is_accepting_queue ? "Open" : "Closed"}
        </Text>
      </View>
    </View>
    <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
    <View style={styles.row}>
      <Text style={styles.stat}>{restaurant.current_queue_length} in queue</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.stat}>~{formatWait(restaurant.estimated_wait_minutes)} wait</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 17, fontWeight: "700", color: "#111827", flex: 1 },
  badge: {
    backgroundColor: "#D1FAE5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeClosed: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#065F46" },
  cuisine: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  row: { flexDirection: "row", marginTop: 10, gap: 6 },
  stat: { fontSize: 14, color: "#374151", fontWeight: "500" },
  dot: { color: "#9CA3AF" },
});
