import "expo-status-bar";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/contexts/AuthContext";
import { SocketProvider } from "./src/contexts/SocketContext";
import { QueueProvider } from "./src/contexts/QueueContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <QueueProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </QueueProvider>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
