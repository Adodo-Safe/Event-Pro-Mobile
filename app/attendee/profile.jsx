import React, { useState, useEffect, useCallback } from "react";
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

const BottomNav = ({ active }) => {
    const tabs = [
        {
            name: "Home",
            icon: "home-outline",
            activeIcon: "home",
            route: "/(tabs)/home"
        },
        {
            name: "My Tickets",
            icon: "ticket-outline",
            activeIcon: "ticket",
            route: "/attendee/my-tickets"
        },
        {
            name: "Profile",
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
                            color={isActive ? PURPLE : GRAY}
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

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState("user");
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Edit form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    const loadProfile = useCallback(async () => {
        try {
            const storedRole = await AsyncStorage.getItem("role");
            if (storedRole) setRole(storedRole);

            const res = await api.get("/auth/profile");
            const data = res.data?.user || res.data;
            setProfile(data);
            setFirstName(data?.firstName || "");
            setLastName(data?.lastName || "");
            setPhone(data?.phone || "");
        } catch (error) {
            Alert.alert("Error", "Could not load profile.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleUpdateProfile = async () => {
        if (!firstName.trim()) {
            Alert.alert("Required", "First name is required.");
            return;
        }
        setUpdating(true);
        try {
            const res = await api.put("/auth/profile", {
                firstName,
                lastName,
                phone
            });
            const updated = res.data?.user || res.data;
            setProfile(updated);

            // Update AsyncStorage firstName
            await AsyncStorage.setItem("firstName", firstName);

            setShowEditModal(false);
            Alert.alert(
                "Updated!",
                "Your profile has been updated successfully."
            );
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                "Update failed. Please try again.";
            Alert.alert("Error", msg);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.multiRemove([
                        "token",
                        "role",
                        "firstName",
                        "registeredEvents"
                    ]);
                    router.replace("/auth/login");
                }
            }
        ]);
    };

    const getInitials = () => {
        const first = profile?.firstName?.charAt(0) || "";
        const last = profile?.lastName?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    };

    const menuSections = [
        {
            title: "Account",
            items: [
                {
                    icon: "person-outline",
                    label: "Edit Profile",
                    onPress: () => setShowEditModal(true),
                    arrow: true
                }
            ]
        },
        {
            title: "Preferences",
            items: [
                {
                    icon: "notifications-outline",
                    label: "Notification Settings",
                    onPress: () =>
                        Alert.alert(
                            "Coming Soon",
                            "Notification settings coming soon."
                        ),
                    arrow: true
                }
            ]
        },
        {
            title: "Support",
            items: [
                {
                    icon: "help-circle-outline",
                    label: "Help & Support",
                    onPress: () =>
                        Alert.alert(
                            "Coming Soon",
                            "Help & Support coming soon."
                        ),
                    arrow: true
                },
                {
                    icon: "document-text-outline",
                    label: "Terms of Service",
                    onPress: () =>
                        Alert.alert(
                            "Coming Soon",
                            "Terms of Service coming soon."
                        ),
                    arrow: true
                },
                {
                    icon: "shield-outline",
                    label: "Privacy Policy",
                    onPress: () =>
                        Alert.alert(
                            "Coming Soon",
                            "Privacy Policy coming soon."
                        ),
                    arrow: true
                }
            ]
        }
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

            {/* Header */}
            <View style={styles.header}>
                {role === "organizer" && (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: role === "user" ? 80 : 32
                }}
            >
                {/* Avatar + Info */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials()}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editAvatarBtn}
                            onPress={() => setShowEditModal(true)}
                        >
                            <Ionicons name="pencil" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.profileName}>
                        {profile?.firstName} {profile?.lastName}
                    </Text>
                    <Text style={styles.profileEmail}>{profile?.email}</Text>

                    <View style={styles.roleBadge}>
                        <Ionicons
                            name={
                                role === "organizer"
                                    ? "megaphone-outline"
                                    : "ticket-outline"
                            }
                            size={12}
                            color={PURPLE}
                        />
                        <Text style={styles.roleText}>
                            {role === "organizer"
                                ? "Event Organizer"
                                : "Attendee"}
                        </Text>
                    </View>
                </View>

                {/* Info Cards */}
                <View style={styles.infoCards}>
                    <View style={styles.infoCard}>
                        <Ionicons
                            name="mail-outline"
                            size={16}
                            color={PURPLE}
                        />
                        <View style={styles.infoCardText}>
                            <Text style={styles.infoCardLabel}>Email</Text>
                            <Text style={styles.infoCardValue}>
                                {profile?.email || "—"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoCard}>
                        <Ionicons
                            name="call-outline"
                            size={16}
                            color={PURPLE}
                        />
                        <View style={styles.infoCardText}>
                            <Text style={styles.infoCardLabel}>Phone</Text>
                            <Text style={styles.infoCardValue}>
                                {profile?.phone || "Not set"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoCard}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={16}
                            color={PURPLE}
                        />
                        <View style={styles.infoCardText}>
                            <Text style={styles.infoCardLabel}>
                                Account Status
                            </Text>
                            <Text
                                style={[
                                    styles.infoCardValue,
                                    {
                                        color: profile?.isVerified
                                            ? "#10B981"
                                            : "#F59E0B"
                                    }
                                ]}
                            >
                                {profile?.isVerified
                                    ? "Verified"
                                    : "Not Verified"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Menu Sections */}
                {menuSections.map(section => (
                    <View key={section.title} style={styles.menuSection}>
                        <Text style={styles.menuSectionTitle}>
                            {section.title}
                        </Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, index) => (
                                <TouchableOpacity
                                    key={item.label}
                                    style={[
                                        styles.menuItem,
                                        index < section.items.length - 1 &&
                                            styles.menuItemBorder
                                    ]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.menuIconWrapper}>
                                            <Ionicons
                                                name={item.icon}
                                                size={18}
                                                color={PURPLE}
                                            />
                                        </View>
                                        <Text style={styles.menuItemLabel}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    {item.arrow && (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={GRAY}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <View style={styles.menuSection}>
                    <View style={styles.menuCard}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleLogout}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuItemLeft}>
                                <View
                                    style={[
                                        styles.menuIconWrapper,
                                        { backgroundColor: "#FEE2E2" }
                                    ]}
                                >
                                    <Ionicons
                                        name="log-out-outline"
                                        size={18}
                                        color="#EF4444"
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.menuItemLabel,
                                        { color: "#EF4444" }
                                    ]}
                                >
                                    Logout
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Nav for Attendees only */}
            {role === "user" && <BottomNav active="Profile" />}

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
                >
                    <View style={styles.modalBox}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    Edit Profile
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowEditModal(false)}
                                >
                                    <Ionicons
                                        name="close"
                                        size={22}
                                        color={DARK}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>First Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    style={styles.input}
                                    placeholder="First name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Last Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={lastName}
                                    onChangeText={setLastName}
                                    style={styles.input}
                                    placeholder="Last name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    style={styles.input}
                                    placeholder="Phone number"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.updateBtn,
                                    updating && styles.updateBtnDisabled
                                ]}
                                onPress={handleUpdateProfile}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.updateBtnText}>
                                        Save Changes
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        color: GRAY,
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
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    backBtn: {
        position: "absolute",
        left: 16,
        padding: 4
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5
    },

    body: { flex: 1 },

    // Avatar Section
    avatarSection: {
        alignItems: "center",
        paddingVertical: 28,
        backgroundColor: "#fff",
        marginBottom: 16
    },
    avatarWrapper: {
        position: "relative",
        marginBottom: 12
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: PURPLE,
        justifyContent: "center",
        alignItems: "center"
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#fff"
    },
    editAvatarBtn: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: DARK,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff"
    },
    profileName: {
        fontSize: 20,
        fontWeight: "800",
        color: DARK,
        marginBottom: 4
    },
    profileEmail: {
        fontSize: 13,
        color: GRAY,
        marginBottom: 10
    },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: PURPLE_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    roleText: {
        fontSize: 12,
        fontWeight: "700",
        color: PURPLE
    },

    // Info Cards
    infoCards: {
        marginHorizontal: 16,
        marginBottom: 8,
        gap: 8
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6"
    },
    infoCardText: { flex: 1 },
    infoCardLabel: {
        fontSize: 11,
        color: GRAY,
        marginBottom: 2
    },
    infoCardValue: {
        fontSize: 14,
        fontWeight: "600",
        color: DARK
    },

    // Menu
    menuSection: {
        marginHorizontal: 16,
        marginBottom: 8
    },
    menuSectionTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: GRAY,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
        marginLeft: 4
    },
    menuCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        overflow: "hidden"
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6"
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    menuIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: PURPLE_LIGHT,
        justifyContent: "center",
        alignItems: "center"
    },
    menuItemLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: DARK
    },

    // Modal
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
        paddingBottom: 40,
        maxHeight: "98%"
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: DARK
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: DARK,
        marginBottom: 6,
        marginTop: 12
    },
    inputWrapper: {
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        backgroundColor: "#FAFAFA",
        justifyContent: "center"
    },
    input: {
        fontSize: 14,
        color: DARK
    },
    updateBtn: {
        backgroundColor: PURPLE,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 24
    },
    updateBtnDisabled: { backgroundColor: "#C4B5FD" },
    updateBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16
    }
});
