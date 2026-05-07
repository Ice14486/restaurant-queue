import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { QueueEntry } from "../../types";
import { statusColor, formatTime, formatWait } from "../../utils/formatters";
import { Badge } from "../common/Badge";

interface Props {
  entry: QueueEntry;
}

export const QueueCard: React.FC<Props> = ({ entry }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.number}>#{entry.queue_number}</Text>
      <Badge label={entry.status} color={statusColor(entry.status)} />
    </View>
    <Text style={styles.detail}>Position {entry.position} · Party of {entry.party_size}</Text>
    <Text style={styles.detail}>
      Est. wait: {formatWait(entry.estimated_wait_minutes)}
    </Text>
    <Text style={styles.detail}>Joined {formatTime(entry.joined_at)}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  number: { fontSize: 20, fontWeight: "700", color: "#111827" },
  detail: { fontSize: 14, color: "#6B7280", marginTop: 2 },
});
