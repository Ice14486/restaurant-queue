import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Restaurant } from "../../types";
import { listRestaurants } from "../../api/restaurants";
import { RestaurantCard } from "../../components/restaurant/RestaurantCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useAuthContext } from "../../contexts/AuthContext";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signOut } = useAuthContext();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async (q?: string) => {
    try {
      const { restaurants: data } = await listRestaurants(q);
      setRestaurants(data);
    } catch {
      // Network required — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Restaurants</Text>
          <TouchableOpacity onPress={signOut} activeOpacity={0.75}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search by name or cuisine…"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => navigation.navigate("RestaurantDetail", { restaurantId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(search || undefined); }}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No restaurants found</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 20, paddingBottom: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#111827" },
  logout: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
  search: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  list: { padding: 20, paddingTop: 0 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60, fontSize: 16 },
});
