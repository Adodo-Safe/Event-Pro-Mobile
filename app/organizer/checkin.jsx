import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";

const BASE_URL = "https://eventpro-fxfv.onrender.com/api";
const PURPLE = "#6F00FF";
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

export default function CheckIn() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const res = await api.get("/events/organizer/my-events");
                const data = res.data?.events || res.data || [];
                setEvents(data);
                if (data.length > 0) setSelectedEvent(data[0]);
            } catch {
                // silently fail
            } finally {
                setLoadingEvents(false);
            }
        };
        loadEvents();
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (scanned || scanning) return;
        setScanned(true);
        setScanning(true);

        try {
            let code = data;
            try {
                const parsed = JSON.parse(data);
                code = parsed.eventId || data;
            } catch {
                code = data;
            }

            const res = await api.post(
                `/events/${selectedEvent?._id || selectedEvent?.id}/checkin/scan`,
                { code }
            );

            const attendee = res.data?.attendee;
            setLastResult({
                success: true,
                name: `${attendee?.firstName || ""} ${attendee?.lastName || ""}`.trim(),
                ticketRef: attendee?.ticketId || code.slice(-8).toUpperCase(),
                message: res.data?.message || "Check-in successful!"
            });
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                "Invalid QR code. Please try again.";
            setLastResult({
                success: false,
                message: msg
            });
        } finally {
            setScanning(false);
        }
    };

    const handleScanAgain = () => {
        setScanned(false);
        setLastResult(null);
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>QR Check-in</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={PURPLE} />
                    <Text style={styles.permissionTitle}>
                        Camera Access Required
                    </Text>
                    <Text style={styles.permissionText}>
                        We need camera access to scan QR codes for check-in.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionBtn}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionBtnText}>
                            Grant Permission
                        </Text>
                    </TouchableOpacity>
                </View>
                <OrganizerBottomNav active="Check-in" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>QR Scan</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Welcome */}
            <View style={styles.welcomeRow}>
                <Text style={styles.welcomeText}>Welcome, Joy</Text>
                <View style={styles.headerIcons}>
                    <Ionicons name="search-outline" size={20} color={DARK} />
                    <Ionicons
                        name="notifications-outline"
                        size={20}
                        color={PURPLE}
                    />
                </View>
            </View>

            {/* Camera */}
            <View style={styles.cameraContainer}>
                {!scanned ? (
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        onBarcodeScanned={
                            scanned ? undefined : handleBarCodeScanned
                        }
                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    >
                        {/* Scanner overlay */}
                        <View style={styles.overlay}>
                            <View style={styles.scanFrame}>
                                <View
                                    style={[styles.corner, styles.cornerTL]}
                                />
                                <View
                                    style={[styles.corner, styles.cornerTR]}
                                />
                                <View
                                    style={[styles.corner, styles.cornerBL]}
                                />
                                <View
                                    style={[styles.corner, styles.cornerBR]}
                                />
                            </View>
                            <Text style={styles.scanHint}>
                                Point camera at attendee's QR code
                            </Text>
                        </View>
                    </CameraView>
                ) : (
                    <View style={styles.resultContainer}>
                        {scanning ? (
                            <ActivityIndicator size="large" color={PURPLE} />
                        ) : lastResult ? (
                            <View style={styles.resultCard}>
                                <Ionicons
                                    name={
                                        lastResult.success
                                            ? "checkmark-circle"
                                            : "close-circle"
                                    }
                                    size={64}
                                    color={
                                        lastResult.success
                                            ? "#10B981"
                                            : "#EF4444"
                                    }
                                />
                                {lastResult.success && (
                                    <>
                                        <Text style={styles.resultName}>
                                            {lastResult.name}
                                        </Text>
                                        <Text style={styles.resultRef}>
                                            Ticket Ref: {lastResult.ticketRef}
                                        </Text>
                                    </>
                                )}
                                <Text
                                    style={[
                                        styles.resultMessage,
                                        {
                                            color: lastResult.success
                                                ? "#059669"
                                                : "#EF4444"
                                        }
                                    ]}
                                >
                                    {lastResult.message}
                                </Text>

                                <TouchableOpacity
                                    style={styles.checkInConfirmBtn}
                                    onPress={handleScanAgain}
                                >
                                    <Ionicons
                                        name="qr-code-outline"
                                        size={18}
                                        color="#fff"
                                    />
                                    <Text style={styles.checkInConfirmText}>
                                        {lastResult.success
                                            ? "Scan Next"
                                            : "Try Again"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>

            {/* Ticket Ref */}
            {lastResult?.ticketRef && (
                <View style={styles.ticketRefRow}>
                    <Text style={styles.ticketRefLabel}>Ticket Ref:</Text>
                    <Text style={styles.ticketRefValue}>
                        {lastResult.ticketRef}
                    </Text>
                </View>
            )}

            {/* Mark as Checked In */}
            {scanned && lastResult?.success && (
                <TouchableOpacity
                    style={styles.markCheckedInBtn}
                    onPress={handleScanAgain}
                >
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.markCheckedInText}>
                        Mark as Checked In
                    </Text>
                </TouchableOpacity>
            )}

            <OrganizerBottomNav active="Check-in" />
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
    tabText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
    tabTextActive: { color: PURPLE },
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
    headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },

    welcomeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6"
    },
    welcomeText: { fontSize: 16, fontWeight: "700", color: DARK },
    headerIcons: { flexDirection: "row", gap: 12 },

    cameraContainer: {
        flex: 1,
        margin: 16,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: DARK
    },
    camera: { flex: 1 },

    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)"
    },
    scanFrame: {
        width: 220,
        height: 220,
        position: "relative",
        marginBottom: 24
    },
    corner: {
        position: "absolute",
        width: 30,
        height: 30,
        borderColor: "#fff"
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3
    },
    scanHint: { color: "#fff", fontSize: 14, textAlign: "center" },

    resultContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24
    },
    resultCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        width: "100%",
        gap: 8
    },
    resultName: { fontSize: 20, fontWeight: "800", color: DARK, marginTop: 8 },
    resultRef: { fontSize: 13, color: GRAY },
    resultMessage: { fontSize: 14, fontWeight: "600", textAlign: "center" },

    checkInConfirmBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: PURPLE,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
        marginTop: 16
    },
    checkInConfirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },

    ticketRefRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6"
    },
    ticketRefLabel: { fontSize: 13, color: GRAY },
    ticketRefValue: { fontSize: 13, fontWeight: "700", color: DARK },

    markCheckedInBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: PURPLE,
        marginHorizontal: 16,
        marginBottom: 80,
        borderRadius: 12,
        paddingVertical: 16
    },
    markCheckedInText: { color: "#fff", fontWeight: "700", fontSize: 16 },

    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        gap: 16
    },
    permissionTitle: { fontSize: 20, fontWeight: "800", color: DARK },
    permissionText: {
        fontSize: 14,
        color: GRAY,
        textAlign: "center",
        lineHeight: 20
    },
    permissionBtn: {
        backgroundColor: PURPLE,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginTop: 8
    },
    permissionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 }
});
