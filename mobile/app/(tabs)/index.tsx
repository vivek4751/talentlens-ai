import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { mobileApi, type DashboardData } from "@/lib/api";
import { BrandMark, EmptyState, LoadingState, ScreenTitle, StatusPill, colors } from "@/components/talentlens-ui";

export default function OverviewScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!token) return;
    try { setError(null); setData(await mobileApi.dashboard(token)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load overview."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { if (!authLoading && !user) router.replace("/login"); if (token) load(); }, [authLoading, user, token, load]);
  if (authLoading || loading) return <LoadingState />;
  if (!user) return null;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.red} />}>
    <View style={styles.topline}><View style={styles.brand}><BrandMark /><View><Text style={styles.brandName}>TALENTLENS</Text><Text style={styles.brandSub}>{user.role.toUpperCase()} WORKSPACE</Text></View></View><Pressable onPress={() => router.push("/settings")}><Text style={styles.settings}>SETTINGS</Text></Pressable></View>
    <ScreenTitle index="01 / OVERVIEW" title="Recruitment, with a clearer signal." description="Live decisions, profile evidence, and role activity from your TalentLens workspace." />
    <View style={styles.metricGrid}><Metric label="ACTIVE JOBS" value={data?.stats.activeJobs ?? 0} /><Metric label="CANDIDATES" value={data?.stats.totalCandidates ?? 0} /><Metric label="SHORTLIST" value={data?.stats.shortlisted ?? 0} /><Metric label="AVG MATCH" value={(data?.stats.averageAIScore ?? 0).toFixed(1)} /></View>
    <View style={styles.sectionHead}><View><Text style={styles.micro}>PRIORITY QUEUE</Text><Text style={styles.sectionTitle}>Candidates to review</Text></View><Pressable onPress={() => router.push("/(tabs)/rankings")}><Text style={styles.link}>Open rankings</Text></Pressable></View>
    {error ? <EmptyState title="Backend connection needed" detail={error} /> : data?.candidates.length ? data.candidates.map((candidate) => <Pressable key={candidate.id} style={({ pressed }) => [styles.candidateRow, pressed && { opacity: 0.72 }]} onPress={() => router.push("/(tabs)/rankings")}><View style={styles.avatar}><Text style={styles.avatarText}>{candidate.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Text></View><View style={styles.candidateCopy}><Text style={styles.candidateName}>{candidate.name}</Text><Text style={styles.candidateRole}>{candidate.currentTitle || "Candidate profile"}</Text></View><View style={styles.scoreBlock}><Text style={styles.score}>{(candidate.overallScore <= 1 ? candidate.overallScore * 100 : candidate.overallScore).toFixed(1)}</Text><StatusPill status={candidate.recruiterStatus} /></View></Pressable>) : <EmptyState title="No matches yet" detail="Create a job and import a candidate resume from the TalentLens web workspace." />}
  </ScrollView>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <View style={styles.metric}><Text style={styles.micro}>{label}</Text><Text style={styles.metricValue}>{value}</Text><View style={styles.rule} /></View>; }
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper }, content: { padding: 18, paddingBottom: 36 }, topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 19, borderBottomWidth: 1, borderColor: colors.line }, brand: { flexDirection: "row", alignItems: "center", gap: 9 }, brandName: { color: colors.ink, fontWeight: "900", fontSize: 13, letterSpacing: -0.5 }, brandSub: { color: colors.muted, fontFamily: "SpaceMono", fontSize: 8, marginTop: 2 }, settings: { color: colors.muted, fontFamily: "SpaceMono", fontSize: 8 }, metricGrid: { flexDirection: "row", flexWrap: "wrap", borderBottomWidth: 1, borderColor: colors.line }, metric: { width: "50%", paddingVertical: 17, borderBottomWidth: 1, borderColor: colors.line }, metricValue: { color: colors.ink, fontSize: 30, fontWeight: "900", letterSpacing: -1.8, marginTop: 10 }, micro: { color: colors.muted, fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 0.8 }, rule: { backgroundColor: colors.red, width: 26, height: 4, marginTop: 12 }, sectionHead: { marginTop: 26, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.line }, sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: "900", letterSpacing: -1.2, marginTop: 5 }, link: { color: colors.ink, fontSize: 11, fontWeight: "800" }, candidateRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderColor: "#D7D7D0" }, avatar: { width: 33, height: 33, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", backgroundColor: colors.soft }, avatarText: { color: colors.ink, fontFamily: "SpaceMono", fontSize: 9 }, candidateCopy: { flex: 1 }, candidateName: { color: colors.ink, fontSize: 13, fontWeight: "800" }, candidateRole: { color: colors.muted, fontSize: 10, marginTop: 3 }, scoreBlock: { alignItems: "flex-end", gap: 4 }, score: { color: colors.ink, fontSize: 18, fontWeight: "900", letterSpacing: -0.8 }
});
