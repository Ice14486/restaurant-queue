import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/common/Button";

export const QRScanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // Expected QR format: restaurantId:<id>
    const match = data.match(/^restaurantId:(.+)$/);
    if (match) {
      navigation.navigate("RestaurantDetail", { restaurantId: match[1] });
    }
  };

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera access is required to scan QR codes</Text>
        <Button label="Grant Permission" onPress={requestPermission} style={styles.btn} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Scan Queue QR</Text>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleScan}
      />
      {scanned && (
        <View style={styles.scannedBanner}>
          <Text style={styles.scannedText}>QR scanned — redirecting…</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  title: {
    color: "#FFF", fontSize: 20, fontWeight: "700",
    textAlign: "center", paddingTop: 20, zIndex: 10,
  },
  text: { fontSize: 16, color: "#374151", textAlign: "center" },
  btn: { width: 200 },
  scannedBanner: {
    position: "absolute", bottom: 40, left: 20, right: 20,
    backgroundColor: "#6366F1", borderRadius: 12, padding: 16,
  },
  scannedText: { color: "#FFF", textAlign: "center", fontWeight: "600" },
});
