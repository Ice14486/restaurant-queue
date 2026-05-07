import React, { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQueueContext } from "../../contexts/QueueContext";
import { useSocket } from "../../contexts/SocketContext";
import { cancelQueue } from "../../api/queues";
import { QueueTimer } from "../../components/queue/QueueTimer";
import { Button } from "../../components/common/Button";
import { statusColor } from "../../utils/formatters";

export const QueueStatusScreen: React.FC = () => {
  const { activeEntry, refreshEntry, setActiveEntry } = useQueueContext();
  const { subscribeRestaurant, unsubscribeRestaurant } = useSocket();

  useEffect(() => {
    if (activeEntry?.restaurant_id) {
      subscribeRestaurant(activeEntry.restaurant_id);
      return () => unsubscribeRestaurant(activeEntry.restaurant_id);
    }
  }, [activeEntry?.restaurant_id]);

  useEffect(() => {
    const id = setInterval(refreshEntry, 30_000);
    return () => clearInterval(id);
  }, [refreshEntry]);

  const handleCancel = async () => {
    if (!activeEntry) return;
    try {
      await cancelQueue(activeEntry.id);
      setActiveEntry(null);
    } catch {
      await refreshEntry();
    }
  };

  if (!activeEntry) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>No active queue</Text>
          <Text style={styles.emptySub}>Browse restaurants to join a queue</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCalled = activeEntry.status === "called";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(activeEntry.status) + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor(activeEntry.status) }]}>
            {activeEntry.status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.queueNumber}>#{activeEntry.queue_number}</Text>
        <Text style={styles.position}>
          {activeEntry.position === 1 ? "You're next!" : `Position ${activeEntry.position} in line`}
        </Text>

        {isCalled ? (
          <View style={styles.calledBox}>
            <Text style={styles.calledIcon}>🔔</Text>
            <Text style={styles.calledText}>
              Your table is ready! Please proceed to the host.
            </Text>
          </View>
        ) : (
          <QueueTimer
            estimatedMinutes={activeEntry.estimated_wait_minutes}
            joinedAt={activeEntry.joined_at}
          />
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{activeEntry.party_size}</Text>
            <Text style={styles.infoLabel}>Guests</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{activeEntry.estimated_wait_minutes}m</Text>
            <Text style={styles.infoLabel}>Est. Wait</Text>
          </View>
        </View>

        {(activeEntry.status === "waiting" || activeEntry.status === "called") && (
          <Button
            label="Leave Queue"
            variant="danger"
            onPress={handleCancel}
            style={styles.leaveBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 24, alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  emptySub: { fontSize: 15, color: "#6B7280" },
  statusBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20,
  },
  statusText: { fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  queueNumber: { fontSize: 72, fontWeight: "900", color: "#111827" },
  position: { fontSize: 18, color: "#6B7280", marginBottom: 24 },
  calledBox: {
    backgroundColor: "#D1FAE5", borderRadius: 14, padding: 20,
    alignItems: "center", marginBottom: 24, gap: 8,
  },
  calledIcon: { fontSize: 32 },
  calledText: { fontSize: 16, color: "#065F46", textAlign: "center", fontWeight: "600" },
  infoRow: { flexDirection: "row", gap: 20, marginVertical: 24 },
  infoItem: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20,
    alignItems: "center", minWidth: 100,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  infoValue: { fontSize: 22, fontWeight: "700", color: "#6366F1" },
  infoLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  leaveBtn: { width: "100%", marginTop: 8 },
});
