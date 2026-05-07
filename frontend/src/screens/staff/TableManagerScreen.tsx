import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Table, TableStatus } from "../../types";
import { listTables } from "../../api/restaurants";
import { updateTableStatus } from "../../api/staff";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const STATUS_CYCLE: Record<TableStatus, TableStatus> = {
  available: "occupied",
  occupied: "cleaning",
  cleaning: "available",
  reserved: "available",
};

const STATUS_COLORS: Record<TableStatus, string> = {
  available: "#10B981",
  occupied: "#EF4444",
  cleaning: "#F59E0B",
  reserved: "#6366F1",
};

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  cleaning: "Checked",
  reserved: "Reserved",
};

export const TableManagerScreen: React.FC = () => {
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);

  const restaurantId = user?.restaurant_id ?? "";

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const { tables: data } = await listTables(restaurantId);
      setTables(data);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handler = (updated: Table) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    };
    socket.on("table_update", handler);
    return () => { socket.off("table_update", handler); };
  }, [socket]);

  const handleToggle = async (table: Table) => {
    const next = STATUS_CYCLE[table.status];
    const previous = table;

    setUpdatingTableId(table.id);
    setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: next } : t)));

    try {
      const { table: updated } = await updateTableStatus(table.id, next);
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setTables((prev) => prev.map((t) => (t.id === previous.id ? previous : t)));
    } finally {
      setUpdatingTableId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Table Manager</Text>
      <FlatList
        data={tables}
        keyExtractor={(t) => t.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, updatingTableId === item.id && styles.cardUpdating]}
            onPress={() => handleToggle(item)}
            disabled={updatingTableId === item.id}
            activeOpacity={0.75}
          >
            <View style={[styles.dot, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <Text style={styles.tableNum}>Table {item.table_number}</Text>
            <Text style={styles.capacity}>Seats {item.capacity}</Text>
            <Text style={[styles.status, { color: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
            <Text style={styles.nextStatus}>
              Tap for {STATUS_LABELS[STATUS_CYCLE[item.status]]}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", padding: 20, paddingBottom: 12 },
  grid: { padding: 12 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardUpdating: { opacity: 0.72 },
  dot: { width: 14, height: 14, borderRadius: 7, marginBottom: 10 },
  tableNum: { fontSize: 16, fontWeight: "700", color: "#111827" },
  capacity: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  status: { fontSize: 13, fontWeight: "600", marginTop: 6 },
  nextStatus: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
});
