import { StyleSheet, Text, View } from "react-native";

export default function RoutinesScreen() {
    return (
        <View style={styles.container}>
            <Text>Routines Screen</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})