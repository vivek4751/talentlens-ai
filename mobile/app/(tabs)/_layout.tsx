import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { colors } from "@/components/talentlens-ui";

const icon = (label: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 13, fontWeight: "900" }}>{label}</Text>;
export default function TabLayout() { return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.red, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, height: 64, paddingTop: 7 }, tabBarLabelStyle: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 } }}><Tabs.Screen name="index" options={{ title: "Overview", tabBarIcon: icon("01") }} /><Tabs.Screen name="jobs" options={{ title: "Jobs", tabBarIcon: icon("02") }} /><Tabs.Screen name="rankings" options={{ title: "Rankings", tabBarIcon: icon("03") }} /><Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("04") }} /></Tabs>; }
