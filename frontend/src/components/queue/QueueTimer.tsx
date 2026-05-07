import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatWait } from "../../utils/formatters";

interface Props {
  estimatedMinutes: number;
  joinedAt: string;
}

export const QueueTimer: React.FC<Props> = ({ estimatedMinutes, joinedAt }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = new Date(joinedAt).getTime();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 60_000));
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [joinedAt]);

  const remaining = Math.max(0, estimatedMinutes - elapsed);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Estimated wait</Text>
      <Text style={styles.time}>{formatWait(remaining)}</Text>
      <Text style={styles.sub}>Waited {formatWait(elapsed)} so far</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 20 },
  label: { fontSize: 14, color: "#6B7280" },
  time: { fontSize: 48, fontWeight: "700", color: "#6366F1", marginVertical: 4 },
  sub: { fontSize: 13, color: "#9CA3AF" },
});
