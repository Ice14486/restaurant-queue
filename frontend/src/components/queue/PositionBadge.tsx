import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  position: number;
}

export const PositionBadge: React.FC<Props> = ({ position }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Position</Text>
    <Text style={styles.number}>{position}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minWidth: 100,
  },
  label: { fontSize: 13, color: "#6366F1", fontWeight: "600" },
  number: { fontSize: 40, fontWeight: "900", color: "#4338CA" },
});
