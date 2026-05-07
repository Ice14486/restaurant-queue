import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { QueueDashboardScreen } from "../screens/staff/QueueDashboardScreen";
import { TableManagerScreen } from "../screens/staff/TableManagerScreen";
import { RestaurantSettingsScreen } from "../screens/staff/RestaurantSettingsScreen";

const Tab = createBottomTabNavigator();

const icon = (label: string) =>
  ({ color }: { color: string }) =>
    <Text style={{ fontSize: 20, color }}>{label}</Text>;

export const StaffNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#6366F1",
      tabBarInactiveTintColor: "#9CA3AF",
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={QueueDashboardScreen}
      options={{ tabBarIcon: icon("📊"), tabBarLabel: "Queue" }}
    />
    <Tab.Screen
      name="Tables"
      component={TableManagerScreen}
      options={{ tabBarIcon: icon("🪑"), tabBarLabel: "Tables" }}
    />
    <Tab.Screen
      name="Settings"
      component={RestaurantSettingsScreen}
      options={{ tabBarIcon: icon("⚙️"), tabBarLabel: "Settings" }}
    />
  </Tab.Navigator>
);
