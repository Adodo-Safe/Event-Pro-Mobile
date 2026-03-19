import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
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

export default function EventDetail() {
    const { eventId } = useLocalSearchParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phone, setPhone] = useState("");

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${eventId}`);
                const eventData = res.data?.event || res.data;
                setEvent(eventData);

                // Check if already registered from AsyncStorage
                const registered =
                    await AsyncStorage.getItem("registeredEvents");
                const registeredList = registered ? JSON.parse(registered) : [];
                if (registeredList.includes(eventId)) {
                    setIsRegistered(true);
                }
            } catch (error) {
                Alert.alert("Error", "Could not load event details.");
            } finally {
                setLoading(false);
            }
        };
        if (eventId) fetchEvent();
    }, [eventId]);

    const saveRegistration = async () => {
        const registered = await AsyncStorage.getItem("registeredEvents");
        const registeredList = registered ? JSON.parse(registered) : [];
        if (!registeredList.includes(eventId)) {
            registeredList.push(eventId);
            await AsyncStorage.setItem(
                "registeredEvents",
                JSON.stringify(registeredList)
            );
        }
        setIsRegistered(true);
    };

    const handleRegister = async () => {
        try {
            const res = await api.get("/auth/profile");
            const hasPhone = res.data?.phone;

            if (hasPhone) {
                setRegistering(true);
                await api.post(`/events/${eventId}/register`);
                await saveRegistration();
                Alert.alert(
                    "Registered!",
                    "You have successfully registered for this event.",
                    [{ text: "OK" }]
                );
                setRegistering(false);
            } else {
                setShowPhoneModal(true);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || "";
            if (errorMsg.includes("duplicate key")) {
                await saveRegistration();
            } else {
                const msg =
                    error.response?.data?.message || "Something went wrong.";
                Alert.alert("Error", msg);
            }
            setRegistering(false);
        }
    };

    const confirmRegister = async () => {
        if (!phone.trim()) {
            Alert.alert("Required", "Please enter your phone number.");
            return;
        }
        setShowPhoneModal(false);
        setRegistering(true);
        try {
            await api.put("/auth/profile", { phone });
            await api.post(`/events/${eventId}/register`);
            await saveRegistration();
            Alert.alert(
                "Registered!",
                "You have successfully registered for this event.",
                [{ text: "OK" }]
            );
        } catch (error) {
            const errorMsg = error.response?.data?.error || "";
            if (errorMsg.includes("duplicate key")) {
                await saveRegistration();
            } else {
                const msg =
                    error.response?.data?.message ||
                    "Registration failed. Please try again.";
                Alert.alert("Error", msg);
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isSaved) {
                await api.delete(`/events/${eventId}/save`);
                setIsSaved(false);
            } else {
                await api.post(`/events/${eventId}/save`);
                setIsSaved(true);
            }
        } catch (error) {
            Alert.alert("Error", "Could not save event. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = dateStr => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatTime = dateStr => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusColor = status => {
        switch (status?.toLowerCase()) {
            case "published":
                return { bg: "#D1FAE5", text: "#059669" };
            case "draft":
                return { bg: "#F3F4F6", text: GRAY };
            case "ended":
                return { bg: "#FEE2E2", text: "#EF4444" };
            default:
                return { bg: PURPLE_LIGHT, text: PURPLE };
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Event Details</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Event Details</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Event not found.</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.goBackBtn}
                    >
                        <Text style={styles.goBackText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusColor = getStatusColor(event.status);

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Event Details</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    style={styles.saveBtn}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={22}
                            color={isSaved ? PURPLE_LIGHT : "#fff"}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Event Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerInner}>
                        <Text style={styles.bannerInitial}>
                            {event.title?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Title + Status */}
                    <View style={styles.titleRow}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: statusColor.bg }
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: statusColor.text }
                                ]}
                            >
                                {event.status}
                            </Text>
                        </View>
                    </View>

                    {/* Info Cards */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color={PURPLE}
                                />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Date</Text>
                                <Text style={styles.infoValue}>
                                    {formatDate(event.date)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons
                                    name="time-outline"
                                    size={18}
                                    color={PURPLE}
                                />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Time</Text>
                                <Text style={styles.infoValue}>
                                    {formatTime(event.date)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons
                                    name="location-outline"
                                    size={18}
                                    color={PURPLE}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Location</Text>
                                <Text
                                    style={styles.infoValue}
                                    numberOfLines={2}
                                >
                                    {event.location || "Venue TBD"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons
                                    name="people-outline"
                                    size={18}
                                    color={PURPLE}
                                />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Expected</Text>
                                <Text style={styles.infoValue}>
                                    {event.expectedAttendees || 0} attendees
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Description */}
                    <Text style={styles.sectionTitle}>About this Event</Text>
                    <Text style={styles.description}>
                        {event.description ||
                            "No description provided for this event."}
                    </Text>

                    <View style={styles.divider} />

                    {/* Organizer */}
                    <Text style={styles.sectionTitle}>Organizer</Text>
                    <View style={styles.organizerRow}>
                        <View style={styles.organizerAvatar}>
                            <Text style={styles.organizerAvatarText}>
                                {event.organizer?.email
                                    ?.charAt(0)
                                    ?.toUpperCase() || "O"}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.organizerName}>
                                {event.organizer?.email || "Event Organizer"}
                            </Text>
                            <Text style={styles.organizerSub}>
                                Event Organizer
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom Register Button */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomBarInner}>
                    <View>
                        <Text style={styles.bottomLabel}>
                            Expected Attendees
                        </Text>
                        <Text style={styles.bottomCount}>
                            {event.expectedAttendees || 0} people
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.registerBtn,
                            isRegistered && styles.registeredBtn
                        ]}
                        onPress={handleRegister}
                        disabled={registering || isRegistered}
                    >
                        {registering ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.registerBtnText}>
                                {isRegistered ? "✓ Registered" : "Register Now"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Phone Modal */}
            <Modal
                visible={showPhoneModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPhoneModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>One more step</Text>
                        <Text style={styles.modalSubtitle}>
                            Enter your phone number to complete registration.
                            You'll receive your check-in code here.
                        </Text>

                        <View style={styles.modalInputWrapper}>
                            <Ionicons
                                name="call-outline"
                                size={18}
                                color={GRAY}
                                style={{ marginRight: 10 }}
                            />
                            <TextInput
                                placeholder="e.g. +234 801 234 5678"
                                placeholderTextColor="#9CA3AF"
                                value={phone}
                                onChangeText={setPhone}
                                style={styles.modalInput}
                                keyboardType="phone-pad"
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowPhoneModal(false)}
                            >
                                <Text style={styles.modalCancelText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmBtn}
                                onPress={confirmRegister}
                            >
                                <Text style={styles.modalConfirmText}>
                                    Register
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F9FAFB" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16
    },

    header: {
        backgroundColor: "#1A1A2E",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    backBtn: { padding: 4 },
    saveBtn: { padding: 4 },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5
    },

    banner: {
        backgroundColor: "#1A1A2E",
        height: 160,
        justifyContent: "center",
        alignItems: "center"
    },
    bannerInner: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: PURPLE,
        justifyContent: "center",
        alignItems: "center"
    },
    bannerInitial: {
        fontSize: 36,
        fontWeight: "800",
        color: "#fff"
    },

    body: { flex: 1 },
    content: {
        backgroundColor: "#F9FAFB",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        paddingHorizontal: 20,
        paddingTop: 24
    },

    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        gap: 12
    },
    eventTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: DARK,
        flex: 1,
        lineHeight: 28
    },
    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 4
    },
    statusText: { fontSize: 11, fontWeight: "700" },

    infoGrid: { gap: 12, marginBottom: 24 },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 }
    },
    infoIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: PURPLE_LIGHT,
        justifyContent: "center",
        alignItems: "center"
    },
    infoLabel: { fontSize: 11, color: GRAY, marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: "700", color: DARK },

    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginVertical: 20
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: DARK,
        marginBottom: 10
    },
    description: {
        fontSize: 14,
        color: GRAY,
        lineHeight: 22
    },

    organizerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6"
    },
    organizerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: PURPLE_LIGHT,
        justifyContent: "center",
        alignItems: "center"
    },
    organizerAvatarText: {
        fontSize: 18,
        fontWeight: "800",
        color: PURPLE
    },
    organizerName: {
        fontSize: 14,
        fontWeight: "700",
        color: DARK
    },
    organizerSub: {
        fontSize: 12,
        color: GRAY,
        marginTop: 2
    },

    errorText: {
        fontSize: 15,
        color: GRAY,
        marginBottom: 12
    },
    goBackBtn: {
        backgroundColor: PURPLE,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10
    },
    goBackText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingBottom: 24,
        paddingTop: 12,
        paddingHorizontal: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 }
    },
    bottomBarInner: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    bottomLabel: { fontSize: 11, color: GRAY },
    bottomCount: {
        fontSize: 16,
        fontWeight: "800",
        color: DARK,
        marginTop: 2
    },
    registerBtn: {
        backgroundColor: PURPLE,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        minWidth: 140,
        alignItems: "center"
    },
    registeredBtn: {
        backgroundColor: "#10B981"
    },
    registerBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end"
    },
    modalBox: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: DARK,
        marginBottom: 8
    },
    modalSubtitle: {
        fontSize: 13,
        color: GRAY,
        lineHeight: 20,
        marginBottom: 20
    },
    modalInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        backgroundColor: "#FAFAFA",
        marginBottom: 20
    },
    modalInput: {
        flex: 1,
        fontSize: 14,
        color: DARK
    },
    modalBtnRow: {
        flexDirection: "row",
        gap: 12
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E5E7EB"
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: "700",
        color: GRAY
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: PURPLE
    },
    modalConfirmText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff"
    }
});
