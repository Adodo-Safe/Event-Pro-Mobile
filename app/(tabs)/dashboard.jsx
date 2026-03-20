import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://eventpro-fxfv.onrender.com/api";
const PURPLE = "#6F00FF";
const PURPLE_LIGHT = "#F0E6FF";
const DARK = "#0F0F14";
const GRAY = "#6B7280";

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const OrganizerBottomNav = ({ active }) => {
    const tabs = [
        {
            name: "Home",
            icon: "home-outline",
            activeIcon: "home",
            route: "/(tabs)/dashboard"
        },
        {
            name: "Events",
            icon: "calendar-outline",
            activeIcon: "calendar",
            route: "/organizer/my-events"
        },
        {
            name: "Reports",
            icon: "bar-chart-outline",
            activeIcon: "bar-chart",
            route: "/organizer/reports"
        },
        {
            name: "Check-in",
            icon: "qr-code-outline",
            activeIcon: "qr-code",
            route: "/organizer/checkin"
        },
        {
            name: "Account",
            icon: "person-outline",
            activeIcon: "person",
            route: "/attendee/profile"
        }
    ];

    return (
        <View style={navStyles.container}>
            {tabs.map(tab => {
                const isActive = active === tab.name;
                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={navStyles.tab}
                        onPress={() => router.push(tab.route)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={22}
                            color={isActive ? PURPLE : "#9CA3AF"}
                        />
                        <Text
                            style={[
                                navStyles.tabText,
                                isActive && navStyles.tabTextActive
                            ]}
                        >
                            {tab.name}
                        </Text>
                        {isActive && <View style={navStyles.activeDot} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

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
            // silently fail
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
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <View style={styles.notifWrapper}>
                            <Ionicons
                                name="notifications-outline"
                                size={20}
                                color={PURPLE_LIGHT}
                            />
                            <View style={styles.notifDot} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
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
                        <Ionicons
                            name="add-circle-outline"
                            size={18}
                            color="#fff"
                        />
                        <Text style={styles.primaryActionText}>
                            Create Event
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryAction}
                        onPress={() => router.push("/organizer/checkin")}
                    >
                        <Ionicons
                            name="qr-code-outline"
                            size={18}
                            color={PURPLE}
                        />
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
                        <TouchableOpacity
                            onPress={() => router.push("/organizer/my-events")}
                        >
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Empty State */}
                {!hasEvents ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="calendar-outline"
                                size={32}
                                color={PURPLE}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>No events yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Create your first event to start managing attendees
                            and check-ins.
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() =>
                                router.push("/organizer/create-event")
                            }
                        >
                            <Text style={styles.emptyBtnText}>
                                + Create your first event
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    (upcomingEvents.length > 0 ? upcomingEvents : events)
                        .slice(0, 5)
                        .map(event => (
                            <TouchableOpacity
                                key={event.id || event._id}
                                style={styles.eventCard}
                                onPress={() =>
                                    router.push(`/organizer/my-events`)
                                }
                                activeOpacity={0.85}
                            >
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

                                    <View style={styles.eventMetaRow}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={12}
                                            color={GRAY}
                                        />
                                        <Text style={styles.eventMeta}>
                                            {formatDate(
                                                event.date || event.startDate
                                            )}
                                        </Text>
                                    </View>

                                    <View style={styles.eventMetaRow}>
                                        <Ionicons
                                            name="location-outline"
                                            size={12}
                                            color={GRAY}
                                        />
                                        <Text style={styles.eventMeta}>
                                            {event.location ||
                                                event.venue ||
                                                "Venue TBD"}
                                        </Text>
                                    </View>

                                    <View style={styles.progressRow}>
                                        <Ionicons
                                            name="people-outline"
                                            size={12}
                                            color={PURPLE}
                                        />
                                        <Text style={styles.progressLabel}>
                                            {event.attendeeCount ??
                                                event.registeredCount ??
                                                0}{" "}
                                            /{" "}
                                            {event.expectedAttendees ??
                                                event.capacity ??
                                                "—"}{" "}
                                            attendees
                                        </Text>
                                    </View>

                                    {event.expectedAttendees ||
                                    event.capacity ? (
                                        <View style={styles.progressBarBg}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${Math.min(
                                                            ((event.attendeeCount ??
                                                                0) /
                                                                (event.expectedAttendees ??
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
            </ScrollView>

            {/* Bottom Navigation */}
            <OrganizerBottomNav active="Home" />
        </SafeAreaView>
    );
}

const navStyles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingBottom: 20,
        paddingTop: 10,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 }
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        position: "relative"
    },
    tabText: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "600"
    },
    tabTextActive: {
        color: PURPLE
    },
    activeDot: {
        position: "absolute",
        bottom: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: PURPLE
    }
});

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F9FAFB" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

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
    headerIcons: { flexDirection: "row", gap: 4 },
    iconBtn: { padding: 6 },
    notifWrapper: { position: "relative" },
    notifDot: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: PURPLE,
        borderWidth: 1.5,
        borderColor: "#1A1A2E"
    },

    body: { flex: 1, paddingHorizontal: 16 },

    welcomeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 4
    },
    greeting: { fontSize: 13, color: GRAY },
    welcomeName: {
        fontSize: 20,
        fontWeight: "800",
        color: DARK,
        marginTop: 2
    },

    pageTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: DARK,
        marginTop: 8
    },
    pageSubtitle: {
        fontSize: 13,
        color: "#9CA3AF",
        marginTop: 2,
        marginBottom: 16
    },

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
        color: DARK,
        marginBottom: 4
    },
    statLabel: { fontSize: 11, color: "#9CA3AF", textAlign: "center" },
    statDivider: { width: 1, backgroundColor: "#F3F4F6", marginHorizontal: 8 },

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
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6
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
        borderColor: PURPLE,
        flexDirection: "row",
        justifyContent: "center",
        gap: 6
    },
    secondaryActionText: {
        color: PURPLE,
        fontWeight: "700",
        fontSize: 14
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: DARK
    },
    seeAll: {
        fontSize: 13,
        color: PURPLE,
        fontWeight: "600"
    },

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
    emptyTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: DARK,
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
        marginBottom: 6
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: DARK,
        flex: 1,
        marginRight: 8
    },
    statusBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3
    },
    statusText: { fontSize: 11, fontWeight: "700" },
    eventMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4
    },
    eventMeta: {
        fontSize: 12,
        color: GRAY
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        marginBottom: 6
    },
    progressLabel: { fontSize: 12, color: GRAY },
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
