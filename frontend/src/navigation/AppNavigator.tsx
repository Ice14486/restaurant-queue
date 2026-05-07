import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuthContext } from "../contexts/AuthContext";
import { CustomerNavigator } from "./CustomerNavigator";
import { StaffNavigator } from "./StaffNavigator";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { StaffLoginScreen } from "../screens/auth/StaffLoginScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  StaffLogin: undefined;
  CustomerApp: undefined;
  StaffApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
          </>
        ) : user.role === "customer" ? (
          <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
        ) : (
          <Stack.Screen name="StaffApp" component={StaffNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
