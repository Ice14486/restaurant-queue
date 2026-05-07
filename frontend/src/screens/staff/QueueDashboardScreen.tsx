import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueueEntry, Table } from "../../types";
import { restaurantQueue } from "../../api/queues";
import { callNext, seatParty } from "../../api/staff";
import { listTables } from "../../api/restaurants";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { formatWait, formatTime } from "../../utils/formatters";

export const QueueDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const { socket, subscribeRestaurant } = useSocket();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [seatingEntryId, setSeatingEntryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const restaurantId = user?.restaurant_id ?? "";

  const handleLogout = async () => {
    await signOut();
  };

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [{ queue: queueData }, { tables: tableData }] = await Promise.all([
        restaurantQueue(restaurantId),
        listTables(restaurantId),
      ]);
      setQueue(queueData);
      setTables(tableData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
    if (restaurantId) subscribeRestaurant(restaurantId);
  }, [load, restaurantId]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: { queue: QueueEntry[] }) => setQueue(data.queue);
    const tableHandler = (updated: Table) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    };
    socket.on("queue_update", handler);
    socket.on("table_update", tableHandler);
    return () => {
      socket.off("queue_update", handler);
      socket.off("table_update", tableHandler);
    };
  }, [socket]);

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const result = await callNext();
      if (!result.entry) {
        Alert.alert("Queue Empty", "No more parties waiting");
      }
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCalling(false);
    }
  };

  const handleSeat = async (entry: QueueEntry, tableId: string) => {
    setSeatingEntryId(entry.id);
    try {
      await seatParty(entry.id, tableId);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSeatingEntryId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const waitingCount = queue.filter((e) => e.status === "waiting").length;
  const calledCount = queue.filter((e) => e.status === "called").length;
  const availableTables = tables.filter((table) => table.status === "available");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Queue Dashboard</Text>
          <Text style={styles.sub}>{waitingCount} waiting · {calledCount} called</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <Button
          label="Call Next Party"
          loading={calling}
          onPress={handleCallNext}
          style={styles.callBtn}
        />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyText}>Queue is clear</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.status === "called" && styles.cardCalled]}>
            <View style={styles.cardTop}>
              <Text style={styles.qNum}>#{item.queue_number}</Text>
              <Text style={styles.pos}>Position {item.position}</Text>
            </View>
            <Text style={styles.detail}>
              Party of {item.party_size} · Waited {formatWait(
                (Date.now() - new Date(item.joined_at).getTime()) / 60_000
              )}
            </Text>
            <Text style={styles.detail}>Joined {formatTime(item.joined_at)}</Text>
            {item.status === "called" && (
              <View style={styles.tablePicker}>
                <Text style={styles.assignLabel}>Assign to table</Text>
                {availableTables.length > 0 ? (
                  <View style={styles.tableButtons}>
                    {availableTables.map((table) => (
                      <TouchableOpacity
                        key={table.id}
                        style={[
                          styles.tableButton,
                          seatingEntryId === item.id && styles.tableButtonDisabled,
                        ]}
                        onPress={() => handleSeat(item, table.id)}
                        disabled={seatingEntryId === item.id}
                      >
                        <Text style={styles.tableButtonText}>Table {table.table_number}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noTables}>No available tables</Text>
                )}
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: 20, paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  logout: { color: "#EF4444", fontWeight: "600", fontSize: 15 },
  actionBar: { paddingHorizontal: 20, paddingBottom: 12 },
  callBtn: { width: "100%" },
  list: { padding: 20, paddingTop: 0 },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 18, color: "#6B7280", fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: "#E5E7EB",
  },
  cardCalled: { borderLeftColor: "#10B981" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  qNum: { fontSize: 20, fontWeight: "700", color: "#111827" },
  pos: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  detail: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  tablePicker: { marginTop: 12 },
  assignLabel: { fontSize: 13, color: "#374151", fontWeight: "700", marginBottom: 8 },
  tableButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tableButton: {
    backgroundColor: "#EEF2FF", borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 8, borderWidth: 1, borderColor: "#C7D2FE",
  },
  tableButtonDisabled: { opacity: 0.55 },
  tableButtonText: { color: "#4338CA", fontWeight: "700", fontSize: 12 },
  noTables: { color: "#9CA3AF", fontSize: 13 },
});
