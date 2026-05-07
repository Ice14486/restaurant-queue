import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { QueueEntry } from "../../types";
import { bookingHistory } from "../../api/queues";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { formatTime, statusColor } from "../../utils/formatters";

export const BookingHistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { history: data } = await bookingHistory();
      setHistory(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Booking History</Text>
      <FlatList
        data={history}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.restaurantName}>{item.restaurant_name ?? "Restaurant"}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) + "22" }]}>
                <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.detail}>Party of {item.party_size} · Queue #{item.queue_number}</Text>
            <Text style={styles.detail}>Joined {formatTime(item.joined_at)}</Text>
            {item.seated_at && (
              <Text style={styles.detail}>Seated {formatTime(item.seated_at)}</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827", padding: 20, paddingBottom: 12 },
  list: { padding: 20, paddingTop: 0 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60, fontSize: 16 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  restaurantName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  detail: { fontSize: 14, color: "#6B7280", marginTop: 2 },
});
