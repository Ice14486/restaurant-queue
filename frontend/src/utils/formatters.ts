export const formatWait = (minutes: number): string => {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const formatTime = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    waiting: "#F59E0B",
    called: "#10B981",
    seated: "#6366F1",
    cancelled: "#EF4444",
    expired: "#9CA3AF",
  };
  return map[status] ?? "#6B7280";
};
