import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface Props extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

const COLORS = {
  primary: { bg: "#6366F1", text: "#FFFFFF" },
  secondary: { bg: "#E5E7EB", text: "#111827" },
  danger: { bg: "#EF4444", text: "#FFFFFF" },
};

export const Button: React.FC<Props> = ({
  label,
  loading = false,
  variant = "primary",
  disabled,
  style,
  ...rest
}) => {
  const colors = COLORS[variant];
  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: colors.bg },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  label: { fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
