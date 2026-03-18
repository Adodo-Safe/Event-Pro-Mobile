import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";

const BASE_URL = "https://eventpro-fxfv.onrender.com/api";
const PURPLE = "#6F00FF";
const PURPLE_LIGHT = "#F0E6FF";

// Axios instance
const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default function OrganizerDashboard() {
    const [firstName, setFirstName] = useState("");
    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const storedName = await AsyncStorage.getItem("firstName");
            if (storedName) setFirstName(storedName);

            const [statsRes, eventsRes] = await Promise.all([
                api.get("/organizer/dashboard/stats"),
                api.get("/events/organizer/my-events")
            ]);

            setStats(statsRes.data);
            setEvents(eventsRes.data?.events || eventsRes.data || []);
        } catch (error) {
            // silently fail, show empty state
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const formatDate = dateStr => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getStatusColor = status => {
        switch (status?.toLowerCase()) {
            case "published":
                return "#10B981";
            case "draft":
                return "#F59E0B";
            case "ended":
                return "#6B7280";
            default:
                return PURPLE;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <View style={styles.hamburger}>
                        <View style={styles.bar} />
                        <View style={[styles.bar, { width: 16 }]} />
                        <View style={styles.bar} />
                    </View>
                    <Text style={styles.headerTitle}>EventPro</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            </SafeAreaView>
        );
    }

    const upcomingEvents = events.filter(
        e => e.status !== "ended" && new Date(e.date) >= new Date()
    );

    const hasEvents = events.length > 0;

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <View style={styles.hamburger}>
                        <View style={styles.bar} />
                        <View style={[styles.bar, { width: 16 }]} />
                        <View style={styles.bar} />
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>EventPro</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[PURPLE]}
                    />
                }
            >
                {/* Welcome Row */}
                <View style={styles.welcomeRow}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.welcomeName}>
                            {firstName || "Organizer"}
                        </Text>
                    </View>
                    <View style={styles.iconRow}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color="#374151"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <View style={styles.notifWrapper}>
                                <Ionicons
                                    name="notifications-outline"
                                    size={20}
                                    color={PURPLE}
                                />
                                <View style={styles.notifDot} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Page Title */}
                <Text style={styles.pageTitle}>Dashboard</Text>
                <Text style={styles.pageSubtitle}>
                    Overview of your events and attendee activity.
                </Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {stats?.totalEvents ?? events.length ?? 0}
                        </Text>
                        <Text style={styles.statLabel}>Total Events</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: PURPLE }]}>
                            {stats?.totalAttendees ?? 0}
                        </Text>
                        <Text style={styles.statLabel}>Total Attendees</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: "#10B981" }]}>
                            {stats?.checkedIn ?? 0}
                        </Text>
                        <Text style={styles.statLabel}>Checked In</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={() => router.push("/organizer/create-event")}
                    >
                        <Text style={styles.primaryActionText}>
                            + Create Event
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryAction}
                        onPress={() => router.push("/organizer/checkin")}
                    >
                        <Text style={styles.secondaryActionText}>
                            Scan Check-in
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Events Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {hasEvents ? "Upcoming Events" : "My Events"}
                    </Text>
                    {hasEvents && (
                        <TouchableOpacity>
                            onPress={() => Alert.alert("Coming soon")}
                        
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Empty State */}
                {!hasEvents ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>+</Text>
                        </View>
                        <Text style={styles.emptyTitle}>No events yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Create your first event to start managing attendees
                            and check-ins.
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() =>
                                Alert.alert("coming soon")
                            }
                        >
                            <Text style={styles.emptyBtnText}>
                                + Create your first event
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Events List */
                    (upcomingEvents.length > 0 ? upcomingEvents : events)
                        .slice(0, 5)
                        .map(event => (
                            <TouchableOpacity
                                key={event.id || event._id}
                                style={styles.eventCard}
                                onPress={() =>
                                    router.push(
                                        `/organizer/events/${event.id || event._id}`
                                    )
                                }
                                activeOpacity={0.85}
                            >
                                {/* Color strip */}
                                <View
                                    style={[
                                        styles.eventStrip,
                                        { backgroundColor: PURPLE }
                                    ]}
                                />

                                <View style={styles.eventContent}>
                                    <View style={styles.eventTopRow}>
                                        <Text
                                            style={styles.eventTitle}
                                            numberOfLines={1}
                                        >
                                            {event.title}
                                        </Text>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        getStatusColor(
                                                            event.status
                                                        ) + "20"
                                                }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    {
                                                        color: getStatusColor(
                                                            event.status
                                                        )
                                                    }
                                                ]}
                                            >
                                                {event.status || "Draft"}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.eventMeta}>
                                        {formatDate(
                                            event.date || event.startDate
                                        )}{" "}
                                        ·{" "}
                                        {event.venue ||
                                            event.location ||
                                            "Venue TBD"}
                                    </Text>

                                    {/* Attendee progress */}
                                    <View style={styles.progressRow}>
                                        <Text style={styles.progressLabel}>
                                            {event.attendeeCount ??
                                                event.registeredCount ??
                                                0}{" "}
                                            /{" "}
                                            {event.expectedCount ??
                                                event.capacity ??
                                                "—"}{" "}
                                            attendees
                                        </Text>
                                    </View>

                                    {event.expectedCount || event.capacity ? (
                                        <View style={styles.progressBarBg}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${Math.min(
                                                            ((event.attendeeCount ??
                                                                0) /
                                                                (event.expectedCount ??
                                                                    event.capacity ??
                                                                    1)) *
                                                                100,
                                                            100
                                                        )}%`
                                                    }
                                                ]}
                                            />
                                        </View>
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                        ))
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F9FAFB" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    // Header
    header: {
        backgroundColor: "#1A1A2E",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    hamburger: { gap: 4 },
    bar: { width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2 },
    headerTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5
    },

    // Body
    body: { flex: 1, paddingHorizontal: 16 },

    // Welcome
    welcomeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 4
    },
    greeting: { fontSize: 13, color: "#6B7280" },
    welcomeName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
        marginTop: 2
    },
    iconRow: { flexDirection: "row", gap: 8 },
    iconBtn: { padding: 6 },
    iconText: { fontSize: 18, color: "purple" },
    notifWrapper: { position: "relative" },
    notifDot: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "purple",
        borderWidth: 1.5,
        borderColor: "#F9FAFB"
    },

    // Page title
    pageTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginTop: 8
    },
    pageSubtitle: {
        fontSize: 13,
        color: "#9CA3AF",
        marginTop: 2,
        marginBottom: 16
    },

    // Stats
    statsRow: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }
    },
    statCard: { flex: 1, alignItems: "center" },
    statValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 4
    },
    statLabel: { fontSize: 11, color: "#9CA3AF", textAlign: "center" },
    statDivider: { width: 1, backgroundColor: "#F3F4F6", marginHorizontal: 8 },

    // Quick Actions
    actionsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24
    },
    primaryAction: {
        flex: 1,
        backgroundColor: PURPLE,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center"
    },
    primaryActionText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14
    },
    secondaryAction: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: PURPLE
    },
    secondaryActionText: {
        color: PURPLE,
        fontWeight: "700",
        fontSize: 14
    },

    // Section header
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827"
    },
    seeAll: {
        fontSize: 13,
        color: PURPLE,
        fontWeight: "600"
    },

    // Empty state
    emptyState: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#F3F4F6",
        borderStyle: "dashed"
    },
    emptyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: PURPLE_LIGHT,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16
    },
    emptyIconText: {
        fontSize: 28,
        color: PURPLE,
        fontWeight: "300",
        lineHeight: 32
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 6
    },
    emptySubtitle: {
        fontSize: 13,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20
    },
    emptyBtn: {
        backgroundColor: PURPLE,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24
    },
    emptyBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14
    },

    // Event Cards
    eventCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        flexDirection: "row",
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }
    },
    eventStrip: { width: 4 },
    eventContent: { flex: 1, padding: 14 },
    eventTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        flex: 1,
        marginRight: 8
    },
    statusBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3
    },
    statusText: { fontSize: 11, fontWeight: "700" },
    eventMeta: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 10
    },
    progressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6
    },
    progressLabel: { fontSize: 12, color: "#6B7280" },
    progressBarBg: {
        height: 4,
        backgroundColor: "#F3F4F6",
        borderRadius: 2,
        overflow: "hidden"
    },
    progressBarFill: {
        height: 4,
        backgroundColor: PURPLE,
        borderRadius: 2
    }
});
