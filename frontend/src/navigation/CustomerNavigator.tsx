import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { HomeScreen } from "../screens/customer/HomeScreen";
import { RestaurantDetailScreen } from "../screens/customer/RestaurantDetailScreen";
import { QueueStatusScreen } from "../screens/customer/QueueStatusScreen";
import { BookingHistoryScreen } from "../screens/customer/BookingHistoryScreen";
import { QRScanScreen } from "../screens/customer/QRScanScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const icon = (label: string) =>
  ({ color }: { color: string }) =>
    <Text style={{ fontSize: 20, color }}>{label}</Text>;

const discoverIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 22, color }}>😋</Text>
);

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="RestaurantList" component={HomeScreen} />
    <HomeStack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
  </HomeStack.Navigator>
);

export const CustomerNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#6366F1",
      tabBarInactiveTintColor: "#9CA3AF",
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStackNavigator}
      options={{ tabBarIcon: discoverIcon, tabBarLabel: "Discover" }}
    />
    <Tab.Screen
      name="QueueStatus"
      component={QueueStatusScreen}
      options={{ tabBarIcon: icon("⏳"), tabBarLabel: "My Queue" }}
    />
    <Tab.Screen
      name="Scan"
      component={QRScanScreen}
      options={{ tabBarIcon: icon("▣"), tabBarLabel: "Scan QR" }}
    />
    <Tab.Screen
      name="History"
      component={BookingHistoryScreen}
      options={{ tabBarIcon: icon("📋"), tabBarLabel: "History" }}
    />
  </Tab.Navigator>
);
