import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    TextInput,
    FlatList,
    ActivityIndicator,
    RefreshControl
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

export default function AttendeeHome() {
    const [firstName, setFirstName] = useState("");
    const [events, setEvents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchVisible, setSearchVisible] = useState(false);

    const filters = ["All", "Upcoming", "Popular"];

    const loadData = useCallback(async () => {
        try {
            const storedName = await AsyncStorage.getItem("firstName");
            if (storedName) setFirstName(storedName);

            const res = await axios.get(`${BASE_URL}/events`);
            const data = res.data?.events || res.data || [];
            setEvents(data);
            setFiltered(data);
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

    useEffect(() => {
        let result = [...events];

        if (searchQuery.trim()) {
            result = result.filter(
                e =>
                    e.title
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    e.location
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
            );
        }

        if (activeFilter === "Upcoming") {
            result = result.filter(e => new Date(e.date) >= new Date());
        } else if (activeFilter === "Popular") {
            result = result.sort(
                (a, b) =>
                    (b.expectedAttendees || 0) - (a.expectedAttendees || 0)
            );
        }

        setFiltered(result);
    }, [searchQuery, activeFilter, events]);

    const formatDate = dateStr => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const renderEvent = ({ item }) => (
        <TouchableOpacity
            style={styles.eventCard}
            onPress={() =>
                router.push({
                    pathname: "/attendee/event-detail",
                    params: { eventId: item._id || item.id }
                })
            }
            activeOpacity={0.85}
        >
            <View style={styles.cardStrip} />

            <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {item.status && (
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        item.status === "published"
                                            ? "#D1FAE5"
                                            : "#F3F4F6"
                                }
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    {
                                        color:
                                            item.status === "published"
                                                ? "#059669"
                                                : GRAY
                                    }
                                ]}
                            >
                                {item.status}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color={GRAY} />
                    <Text style={styles.metaText}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color={GRAY} />
                    <Text style={styles.metaText} numberOfLines={1}>
                        {item.location || "Venue TBD"}
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.attendeeCount}>
                        <Ionicons
                            name="people-outline"
                            size={13}
                            color={PURPLE}
                        />
                        <Text style={styles.attendeeText}>
                            {item.expectedAttendees || 0} expected
                        </Text>
                    </View>
                    <View style={styles.viewBtn}>
                        <Text style={styles.viewBtnText}>View Details</Text>
                        <Ionicons
                            name="arrow-forward"
                            size={13}
                            color={PURPLE}
                        />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

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

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

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
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setSearchVisible(v => !v)}
                    >
                        <Ionicons
                            name="search-outline"
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
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

            <FlatList
                data={filtered}
                keyExtractor={item => item._id || item.id}
                renderItem={renderEvent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[PURPLE]}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.welcomeRow}>
                            <View>
                                <Text style={styles.greeting}>
                                    {getGreeting()}
                                </Text>
                                <Text style={styles.welcomeName}>
                                    {firstName || "there"}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.pageTitle}>Discover Events</Text>
                        <Text style={styles.pageSubtitle}>
                            Find and register for events happening around you.
                        </Text>

                        {searchVisible && (
                            <View style={styles.searchWrapper}>
                                <Ionicons
                                    name="search-outline"
                                    size={16}
                                    color={GRAY}
                                    style={{ marginRight: 8 }}
                                />
                                <TextInput
                                    placeholder="Search events, venues..."
                                    placeholderTextColor="#9CA3AF"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    style={styles.searchInput}
                                    autoFocus
                                />
                                {searchQuery ? (
                                    <TouchableOpacity
                                        onPress={() => setSearchQuery("")}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={GRAY}
                                        />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        )}

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterRow}
                        >
                            {filters.map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[
                                        styles.filterTab,
                                        activeFilter === f &&
                                            styles.filterTabActive
                                    ]}
                                    onPress={() => setActiveFilter(f)}
                                >
                                    <Text
                                        style={[
                                            styles.filterTabText,
                                            activeFilter === f &&
                                                styles.filterTabTextActive
                                        ]}
                                    >
                                        {f}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.resultsCount}>
                            {filtered.length} event
                            {filtered.length !== 1 ? "s" : ""} found
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="calendar-outline"
                                size={32}
                                color={PURPLE}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>No events found</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery
                                ? "Try a different search term"
                                : "Check back later for upcoming events"}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
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

    listContent: { paddingBottom: 32 },
    listHeader: { paddingHorizontal: 16 },

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

    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        marginBottom: 14
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: DARK
    },

    filterRow: { marginBottom: 16 },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#fff",
        marginRight: 8,
        borderWidth: 1.5,
        borderColor: "#E5E7EB"
    },
    filterTabActive: {
        backgroundColor: PURPLE,
        borderColor: PURPLE
    },
    filterTabText: { fontSize: 13, color: GRAY, fontWeight: "600" },
    filterTabTextActive: { color: "#fff" },

    resultsCount: {
        fontSize: 12,
        color: GRAY,
        marginBottom: 12
    },

    eventCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 12,
        flexDirection: "row",
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }
    },
    cardStrip: { width: 4, backgroundColor: PURPLE },
    cardContent: { flex: 1, padding: 14 },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    cardTitle: {
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

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4
    },
    metaText: { fontSize: 12, color: GRAY },

    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6"
    },
    attendeeCount: { flexDirection: "row", alignItems: "center", gap: 4 },
    attendeeText: { fontSize: 12, color: PURPLE, fontWeight: "600" },
    viewBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    viewBtnText: { fontSize: 12, color: PURPLE, fontWeight: "700" },

    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 40
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        color: GRAY,
        textAlign: "center",
        lineHeight: 20
    }
});
