import { Text, StyleSheet, Image, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function EmailVerification() {
    const { email } = useLocalSearchParams();
    const userEmail = email || "safe@yahoo.com";

    function maskEmail(email) {
        const [name, domain] = email.split("@");
        return name.substring(0, 3) + "****@" + domain;
    }

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    style={styles.logo}
                    source={require("../../assets/images/emailLogo.jpg")}
                />
            </View>
            <Text style={styles.boldText}>Check your inbox</Text>
            <Text style={styles.text}>
                We have sent a verification link to {""}{" "}
                <Text
                    style={{
                        fontWeight: "bold"
                    }}
                >
                    {maskEmail(userEmail)}
                </Text>{" "}
                Click on the link to activate your account and start managing
                your events.
            </Text>
            <TouchableOpacity style={styles.button}>
                <Text style={{ color: "white" }}>Resend Verification Code</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 10, textAlign: "center" }}>
                Wrong Email?{" "}
                <TouchableOpacity>
                    <Text
                        style={{
                            color: "purple",
                            textDecorationColor: "purple",
                            textDecorationLine: "underline"
                        }}
                    >
                        Change it
                    </Text>
                </TouchableOpacity>
            </Text>
            <TouchableOpacity style={{ marginTop: 20, marginBottom: 90 }}>
                <Text style={{ color: "#666666" }}>Back to login page</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        backgroundColor: "#fff",
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20
    },
    logoContainer: {
        marginBottom: 30
    },
    logo: {
        width: 200,
        height: 200
    },
    boldText: {
        fontWidth: "bold",
        fontSize: 20,
        marginBottom: 20
    },
    text: {
        paddingLeft: 10,
        paddingRight: 10,
        textAlign: "center"
    },
    button: {
        backgroundColor: "#6F00FF",
        marginTop: 30,
        paddingBottom: 10,
        paddingTop: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderColor: "#8c3a45",
        borderRadius: 5,
        borderWidth: 2
    }
});
