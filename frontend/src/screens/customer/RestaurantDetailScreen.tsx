import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Restaurant } from "../../types";
import { getRestaurant } from "../../api/restaurants";
import { joinQueue } from "../../api/queues";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useQueueContext } from "../../contexts/QueueContext";
import { formatWait } from "../../utils/formatters";

type Props = NativeStackScreenProps<any, "RestaurantDetail">;

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export const RestaurantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { restaurantId } = route.params as { restaurantId: string };
  const { activeEntry, setActiveEntry } = useQueueContext();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [partySize, setPartySize] = useState(2);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurant(restaurantId)
      .then(({ restaurant: r }) => setRestaurant(r))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const handleJoin = async () => {
    if (!restaurant) return;
    setError("");
    setJoining(true);
    try {
      const { entry } = await joinQueue(restaurant.id, partySize);
      setActiveEntry(entry);
      navigation.getParent()?.navigate("QueueStatus");
    } catch (e: any) {
      setError(e.message ?? "Failed to join queue");
    } finally {
      setJoining(false);
    }
  };

  if (loading || !restaurant) return <LoadingSpinner />;

  const alreadyInQueue = !!activeEntry && activeEntry.status === "waiting";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        <Text style={styles.description}>{restaurant.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{restaurant.current_queue_length}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatWait(restaurant.estimated_wait_minutes)}</Text>
            <Text style={styles.statLabel}>Est. Wait</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{restaurant.table_count}</Text>
            <Text style={styles.statLabel}>Tables</Text>
          </View>
        </View>

        {restaurant.is_accepting_queue ? (
          <>
            <Text style={styles.sectionTitle}>Party size</Text>
            <View style={styles.sizeGrid}>
              {PARTY_SIZES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sizeBtn, partySize === s && styles.sizeBtnActive]}
                  onPress={() => setPartySize(s)}
                >
                  <Text style={[styles.sizeTxt, partySize === s && styles.sizeTxtActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {alreadyInQueue ? (
              <Text style={styles.alreadyIn}>
                You are already in a queue. Cancel it first to join another.
              </Text>
            ) : (
              <Button
                label={`Join Queue · Party of ${partySize}`}
                loading={joining}
                onPress={handleJoin}
              />
            )}
          </>
        ) : (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>
              This restaurant is not accepting queue entries right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 24 },
  back: { marginBottom: 16 },
  backText: { color: "#6366F1", fontSize: 16, fontWeight: "600" },
  name: { fontSize: 26, fontWeight: "800", color: "#111827" },
  cuisine: { fontSize: 15, color: "#6B7280", marginTop: 4, marginBottom: 8 },
  description: { fontSize: 15, color: "#374151", lineHeight: 22, marginBottom: 24 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statBox: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12,
    padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#6366F1" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 12 },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  sizeBtn: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  sizeBtnActive: { borderColor: "#6366F1", backgroundColor: "#EEF2FF" },
  sizeTxt: { fontSize: 16, color: "#374151", fontWeight: "600" },
  sizeTxtActive: { color: "#6366F1" },
  error: { color: "#EF4444", marginBottom: 12, fontSize: 14 },
  alreadyIn: {
    backgroundColor: "#FEF3C7", color: "#92400E",
    padding: 14, borderRadius: 10, fontSize: 14, textAlign: "center",
  },
  closedBox: { backgroundColor: "#FEE2E2", padding: 16, borderRadius: 10 },
  closedText: { color: "#B91C1C", fontSize: 15, textAlign: "center" },
});
