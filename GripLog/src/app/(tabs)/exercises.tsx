import { StyleSheet, Text, View } from "react-native";

export default function ExercisesScreen() {
    return (
        <View style={styles.container}>
            <Text>Exercises Screen</Text>
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